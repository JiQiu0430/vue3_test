<template>
  <div class="app-container">
    <!-- Main -->
    <main class="main-content">
      <h1 class="main-title">Work Space</h1>

      <!-- 搜尋欄 -->
      <div class="toolbar">
        <input v-model="searchQuery" type="text" placeholder="Search cases..." class="search-input" />
      </div>

      <!-- Table -->
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
          <tr v-for="(row, i) in filteredData" :key="i">
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
              <button class="icon-button"><img src="/trash-bin.png" class="action-icon" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'

const route = useRoute()
const jobId = route.params.id

const searchQuery = ref('')

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
  }
])

const filteredData = computed(() =>
  caseData.value.filter(row =>
    row.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    row.caseId.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const checkMark = (value) => (value ? '✔' : '✘')
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
  background-color: #1c1c1c; /* 深灰色底 */
  border-collapse: collapse;
}

.job-table th {
  background-color: #2a2a2a;
  color: #ccc;
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
  border-top: 1px solid #003366; /* 深藍色列間隔線 */
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
</style>
