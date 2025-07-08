<template>
  <div class="app-container">
    <!-- Main -->
    <main class="main-content">
      <h1 class="main-title">Work Space</h1>

      <!-- 搜尋欄 -->
      <div class="toolbar">
        <input v-model="searchQuery" type="text" placeholder="Search cases..." class="search-input" />
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
              <button class="icon-button"><img src="/eye.png" class="action-icon" /></button>
              <button class="icon-button"><img src="/file.png" class="action-icon" /></button>
              <button class="icon-button"><img src="/download.png" class="action-icon" /></button>
              <button class="icon-button" @click="deleteCase(row.name)">
                <img src="/trash-bin.png" class="action-icon" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分頁 -->
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
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'

const route = useRoute()
const jobId = route.params.id

const searchQuery = ref('')
const page = ref(1)
const pageSize = 10

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
  // ... 可加入更多資料以測試分頁效果
])

const filteredData = computed(() =>
  caseData.value.filter(row =>
    row.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    row.caseId.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / pageSize)
)

const paginatedData = computed(() =>
  filteredData.value.slice((page.value - 1) * pageSize, page.value * pageSize)
)

const setPage = (p) => { page.value = p }
const prevPage = () => { if (page.value > 1) page.value-- }
const nextPage = () => { if (page.value < totalPages.value) page.value++ }

const checkMark = (value) => (value ? '✔' : '✘')

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
}
.main-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
}
.toolbar {
  margin-bottom: 40px;
}
.search-input {
  width: 250px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #666;
  background: #111;
  color: white;
}
.job-table {
  width: 100%;
  background-color: #1c1c1c;
  border-collapse: collapse;
}
.job-table th {
  background-color: black;
  color: white;
  padding: 10px 12px;
  text-align: left;
  border: none;
}
.job-table td {
  padding: 10px 12px;
  text-align: left;
  border: none;
  color: white;
}
.job-table tbody tr + tr {
  border-top: 1px solid #003366;
}
.icon-button {
  background: none;
  border: none;
  padding: 4px;
  margin-right: 4px;
  cursor: pointer;
}
.action-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

/* 分頁樣式 */
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 6px;
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
