<template>
  <div class="app-container">
    <main class="main-content">
      <h1 class="main-title">V5 ImPrep</h1>

      <!-- 返回鍵與資訊欄 -->
      <div class="toolbar">
        <div class="left-tools">
          <button class="back-button" @click="goBackHome">Back to Job</button>
          <div class="job-info">
            <span><strong>Batch ID:</strong> {{ jobInfo.job || 'N/A' }}</span>
            <span>|</span>
            <span><strong>Upload Time:</strong> {{ jobInfo.time || 'N/A' }}</span>
            <span>|</span>
            <span><strong>Total Case:</strong> {{ caseData.length }}</span>
          </div>
        </div>
        <button class="export-button" @click="exportCSV">Export CSV</button>
      </div>

      <!-- 列表 -->
      <table class="job-table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Patient Name</th>
            <th>Series Count</th>
            <th>Upload</th>
            <th>Mapping</th>
            <th>Post to AI</th>
            <th>Post to PACS</th>
            <th>Retry</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in paginatedData" :key="i">
            <td>{{ row.caseId }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.series }}</td>
            <td>{{ checkMark(row.upload) }}</td>
            <td>{{ checkMark(row.mapping) }}</td>
            <td>{{ checkMark(row.postAI) }}</td>
            <td>{{ checkMark(row.postPACS) }}</td>
            <td>
              <button class="icon-button  reload"><img src="/reload.png" class="action-icon" /></button>
              <button class="icon-button" @click="deleteCase(row.name)">
                <img src="/trash-bin.png" class="action-icon" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 頁數方塊 -->
      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1">«</button>
        <button
          v-for="p in totalPages"
          :key="p"
          @click="setPage(p)"
          :class="{ active: page === p }"
        >
          {{ p }}
        </button>
        <button @click="nextPage" :disabled="page === totalPages">»</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const route = useRoute()
const router = useRouter()

const goBackHome = () => router.push({ name: 'Home' })

// 取得 job 資訊
const jobInfo = computed(() => ({
  job: route.query.job,
  time: route.query.time,
  series: route.query.series
}))

const jobId = route.params.id
const page = ref(1)
const pageSize = 10

// 模擬資料
const caseData = ref([
  {
    caseId: jobId,
    name: 'Patient A',
    series: 5,
    upload: true,
    mapping: false,
    postAI: true,
    postPACS: false,
  },
  {
    caseId: jobId,
    name: 'Patient B',
    series: 4,
    upload: true,
    mapping: true,
    postAI: false,
    postPACS: true,
  },
  {
    caseId: jobId,
    name: 'Patient C',
    series: 2,
    upload: false,
    mapping: false,
    postAI: false,
    postPACS: false,
  },
])

// 導出資料
const exportCSV = () => {
  const headers = ['Case ID', 'Patient Name', 'Series Count', 'Upload', 'Mapping', 'Post to AI', 'Post to PACS']
  const rows = caseData.value.map(row => [
    row.caseId,
    row.name,
    row.series,
    row.upload ? 'V' : 'X',
    row.mapping ? 'V' : 'X',
    row.postAI ? 'V' : 'X',
    row.postPACS ? 'V' : 'X',
  ])
  const csvContent = [headers, ...rows]
    .map(e => e.map(v => `"${v}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', 'case_data.csv')
  link.click()
}

//頁數計算
const totalPages = computed(() =>
  Math.ceil(caseData.value.length / pageSize)
)
const paginatedData = computed(() =>
  caseData.value.slice((page.value - 1) * pageSize, page.value * pageSize)
)
const setPage = (p) => (page.value = p)
const prevPage = () => { if (page.value > 1) page.value-- }
const nextPage = () => { if (page.value < totalPages.value) page.value++ }

const checkMark = (value) => (value ? '✔' : '✘')

// 刪除資料
const deleteCase = (name) => {
  if (confirm(`Are you sure you want to delete patient "${name}"?`)) {
    caseData.value = caseData.value.filter(row => row.name !== name)
    if (page.value > totalPages.value) page.value = totalPages.value || 1
  }
}
</script>

<style scoped>
.app-container {
  background: black;
  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  font-size: 13px;
}
.main-title {
  text-align: center;
  font-size: 24px;
  margin: -10px 0 20px 0;
  background-color: #0892D0;
  padding: 10px 20px;
  border-radius: 0px;
  color: white;
  display: inline-block;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.left-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}
.back-button {
  background: #2c2c2c;
  color: white;
  border: 1px solid white;
  padding: 6px 10px;
  border-radius: 4px;
  margin-right: 16px;
  cursor: pointer;
}
.back-button:hover {
  background: #1e90ff;
  border-color: #1e90ff;
}
.job-info {
  display: flex;
  gap: 20px;
  color: #bbb;
  font-size: 14px;
}
.job-info span {
  white-space: nowrap;
}
.export-button {
  background: #2c2c2c;
  color: white;
  border: 1px solid white;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.export-button:hover {
  background: #28a745;
  border-color: #28a745;
}
.job-table {
  width: 100%;
  background-color: #1c1c1c;
  border-collapse: collapse;
}
.job-table th,
.job-table td {
  padding: 10px 12px;
  text-align: left;
  color: white;
}
.job-table tbody tr + tr {
  border-top: 1px solid #003366;
}
.job-table thead {
  background-color: black;
  color: white;
}
.icon-button {
  background: none;
  border: 1px solid transparent;
  padding: 4px;
  margin-right: 6px;
  border-radius: 4px;
  cursor: pointer;
}
.icon-button.reload {
  border: 1px solid #ccc;
  background-color: #2a2a2a;
}
.action-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}
.pagination {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: black;
  padding: 6px 10px;
  border-radius: 6px;
  display: flex;
  gap: 6px;
  z-index: 1000;
}
.pagination button {
  background: #222;
  color: white;
  border: 1px solid #555;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button.active {
  background: #1e90ff;
  border-color: #1e90ff;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
