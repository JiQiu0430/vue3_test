<template>
  <div class="app-container">
    <main class="main-content">
      <h1 class="main-title">V5 ImPrep</h1>

      <!-- 返回鍵與資訊欄 -->
      <div class="toolbar">
        <div class="left-tools">
          <button class="back-button" @click="goBackHome">返回</button>
          <div class="job-info">
            <span><strong>批次號:</strong> {{ jobInfo.job || 'N/A' }}</span>
            <span>|</span>
            <span><strong>上傳時間:</strong> {{ jobInfo.time || 'N/A' }}</span>
            <span>|</span>
            <span><strong>總檔案數:</strong> {{ caseData.length }}</span>
          </div>
        </div>
        <button class="export-button" @click="exportCSV">導出CSV</button>
      </div>

      <!-- 列表 -->
      <table class="job-table">
        <thead>
          <tr>
            <th>流水號</th>
            <th>身份證字號</th>
            <th>姓名</th>
            <th>檔案上傳</th>
            <th>對應工單號</th>
            <th>傳給AI</th>
            <th>傳給PACS</th>
            <th>重新嘗試</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in paginatedData" :key="i">
            <td :style="{ color: isSameId(row) ? 'yellow' : getTextColor(row) }">{{ row.serialNumber }}</td>
            <td :style="{ color: isSameId(row) ? 'yellow' : getTextColor(row) }">{{ row.id }}</td>
            <td :style="{ color: isSameId(row) ? 'yellow' : getTextColor(row) }">{{ row.name }}</td>
            <td v-html="checkMark(row.upload)"></td>
            <td :style="{ color: isSameId(row) ? 'yellow' : isMappingString(row.mapping) ? '#89CFF0' : '#e74c3c' }">{{ checkMark(row.mapping) }}
              <!-- 圓圈選擇 -->
              <div class="circle-select" v-if="isSameId(row)">
                <input
                  type="radio"
                  :name="row.id"
                  v-model="selectedMapping[row.id]"
                  :value="row.mapping"
                />
              </div>
            </td>
            <td v-html="checkMark(row.postAI)"></td>
            <td v-html="checkMark(row.postPACS)"></td>
            <td class="retry-cell">
              <div class="retry-buttons">
                <button class="icon-button reload">
                  <img src="/reload.png" class="action-icon" />
                </button>
              </div>
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

const page = ref(1)
const pageSize = 10

// 模擬資料
const caseData = ref([
  {
    caseName: '0001#A123456789#王小明#M#01',
    series: 5,
    upload: true,
    mapping: 'ABC001',
    postAI: null,
    postPACS: null,
    status: 'Pending'
  },
  {
    caseName: '0002#A123456789#王小明#M#02',
    series: 4,
    upload: true,
    mapping: 'ABC001',
    postAI: null,
    postPACS: null,
    status: 'Pending'
  },
  {
    caseName: '0003#B123456789#陳大明#F#01',
    series: 2,
    upload: true,
    mapping: 'false',
    postAI: null,
    postPACS: null,
    status: 'Pending'
  },
  {
    caseName: '0004#C123456789#林子涵#F#01',
    series: 2,
    upload: true,
    mapping: 'ABC003',
    postAI: true,
    postPACS: true,
    status: 'Analyzed'
  },
])

// 解析 caseName
const parseCaseName = (caseName) => {
  const regex = /^(\d+)#([A-Za-z0-9]+)#([\u4e00-\u9fa5]+)#(M|F)#(\d{2})$/;
  const match = caseName.match(regex);
  if (match) {
    const [, serialNumber, id, name, gender, caseNumber] = match;
    return { serialNumber, id, name, gender, caseNumber };
  }
  return {};
};

// 解析資料並加入到 caseData 中
caseData.value = caseData.value.map(item => {
  const parsedData = parseCaseName(item.caseName);
  return {
    ...item,
    ...parsedData,
  };
})

// 判斷是否為相同身份證字號
const selectedMapping = ref({})
const isSameId = (row) => {
  return caseData.value.filter(item => item.id === row.id).length > 1;
}

// 導出資料
const exportCSV = () => {
  const headers = ['Case ID', 'Patient Name', 'Upload', 'Mapping', 'Post to AI', 'Post to PACS']
  const rows = caseData.value.map(row => [
    row.caseId,
    row.name,
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

// 頁數計算
const totalPages = computed(() =>
  Math.ceil(caseData.value.length / pageSize)
)
const paginatedData = computed(() =>
  caseData.value.slice((page.value - 1) * pageSize, page.value * pageSize)
)
const setPage = (p) => (page.value = p)
const prevPage = () => { if (page.value > 1) page.value-- }
const nextPage = () => { if (page.value < totalPages.value) page.value++ }

// 顯示勾/叉
const checkMark = (value) => {
  if (value === true) return '<span class="gray-cross">✔</span>'
  if (value === false) return '<span class="red-cross">✘</span>'
  if (value === 'false') return '✘';
  if (value) return value;
  return '<span class="gray-cross">--</span>'
}

// Mapping顏色變化邏輯
const getTextColor = (row) => {
  if (row.mapping === 'false') {
    return '#e74c3c'; // 紅色
  }
  if (row.upload === false || row.postAI === false || row.postPACS === false) {
    return '#e74c3c';
  }
  return '#ffffff';
}

const isMappingString = (value) => {
  return typeof value === 'string' && value !== 'false';
}
</script>

<style scoped>

/* App 整體 */
.app-container {
  background: black;
  color: #ffffff;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 主內容 */
.main-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  font-size: 13px;
}

/* 標題 */
.main-title {
  text-align: center;
  font-size: 24px;
  margin: -10px 0 20px 0;
  background-color: #0892D0;
  padding: 10px 20px;
  color: #ffffff;
  display: inline-block;
}

/* 返回鍵+資訊文字+搜尋列 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.left-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}
.back-button,
.export-button {
  background: #2c2c2c;
  color: #ffffff;
  border: 1px solid #ffffff;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.back-button:hover {
  background: #0892D0;
  border-color: #0892D0;
}
.export-button:hover {
  background: #28a745;
  border-color: #28a745;
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

/* 列表 */
.job-table {
  width: 100%;
  background-color: #1c1c1c;
  border-collapse: collapse;
}
.job-table th,
.job-table td {
  padding: 10px 12px;
  text-align: left;
  color: #ffffff;
}
.job-table tbody tr + tr {
  border-top: 2px solid #003366;
}
/* 錯誤變明顯 */
::v-deep .red-cross {
  color: #e74c3c;
  font-weight: bold;
}
::v-deep .gray-cross {
  color:rgb(148, 148, 148);
}
.job-table thead {
  background-color: black;
  color: #ffffff;
}

/* Mapping選擇 */
.circle-select {
  display: inline-block;
  position: relative;
}
.circle-label {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ccc;
  cursor: pointer;
  background-color: #fff;
}
input[type="radio"]:checked{
  background-color: #0892D0;
  border-color: #0892D0;
}

/* 狀態燈 */
.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
}
.status-indicator.green {
  background-color: #2ecc71;
}
.status-indicator.white {
  background-color: #ffffff;
}
.status-indicator.red {
  background-color: #e74c3c;
}

/* icon按鈕 */
.icon-button {
  background: none;
  border: none;
  padding: 2px;
  margin-right: 2px;
  cursor: pointer;
}
.action-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

/* 分頁 */
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
  background: #0892D0;
  border-color: #0892D0;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
