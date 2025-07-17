<template>
  <div class="app-container">
    <main class="main-content">
      <h1 class="main-title">V5 ImPrep</h1>

      <!-- 返回鍵與資訊欄 -->
      <div class="toolbar">
        <div class="left-tools">
          <button class="back-button" @click="goBackHome">返回</button>
          <!-- 搜尋欄 -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋檔案......"
            class="search-input"
          />
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
          <tr
            v-for="(row, i) in paginatedData"
            :key="i"
            :style="{ color: getTextColor(row) }"
          >
            <td :style="{ color: getTextColor(row) }">{{ row.serialNumber }}</td>
            <td :style="{ color: getTextColor(row) }">{{ row.id }}</td>
            <td :style="{ color: getTextColor(row) }">{{ row.name }}</td>
            <td v-html="checkMark(row.upload)"></td>
            <td :style="{ color: getTextColor(row) }">
              <!-- 圓圈選擇 -->
                <div class="circle-select" v-if="isSameId(row)">
                  <input
                    type="radio"
                    :name="row.id"
                    :value="row.serialNumber"
                    @click="handleRadioChange(row, $event)"
                    v-model="selectedSerialNumber"
                  />
                </div>
                <span v-html="checkMark(row.mapping)"></span>
            </td>
            <td v-html="checkMark(row.postAI)"></td>
            <td v-html="checkMark(row.postPACS)"></td>
            <td class="retry-cell">
              <div class="retry-buttons">
                <button class="icon-button reload" @click="handleRetry(row, $event)">
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
  {
    caseName: '0005#D123456789#汪杰#M#01',
    series: 2,
    upload: true,
    mapping: 'ABC004',
    postAI: true,
    postPACS: false,
    status: 'Error'
  },
  {
    caseName: '0006#E123456789#卡厄斯#F#01',
    series: 2,
    upload: true,
    mapping: '',
    postAI: null,
    postPACS: null,
    status: 'Pending'
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

// 搜尋
const searchQuery = ref('')
const filteredData = computed(() => {
  return caseData.value.filter(item => {
    return item.serialNumber.toLowerCase().includes(searchQuery.value) ||
           item.id.toLowerCase().includes(searchQuery.value) ||
           item.name.toLowerCase().includes(searchQuery.value);
  });
});

// 判斷是否為相同身份證字號
const selectedMapping = ref({})
const isSameId = (row) => {
  return caseData.value.filter(item => item.id === row.id).length > 1;
}

// 當選擇圓圈時，顯示確認提示
const handleRadioChange = (row, event) => {
  const isConfirmed = confirm(`您確定選擇 ${row.serialNumber} 嗎？`);
  if (!isConfirmed) {
    event.preventDefault();  // 阻止點擊選擇操作
  } else {
    selectedSerialNumber.value = row.serialNumber; // 更新選擇
  }
};

// 導出資料
const exportCSV = () => {
  const headers = ['流水號', '身份證字號', '姓名', '檔案上傳', '對應工單號', '傳給AI', '傳給PACS']
  const rows = caseData.value.map(row => [
    row.serialNumber,
    row.id,
    row.name,
    row.upload ? 'V' : 'X',
    formatMapping(row.mapping),
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

// 根據 Mapping 的值來決定導出的內容
const formatMapping = (mapping) => {
  if (mapping === 'false') {
    return '✘'; // 如果是 'false' 顯示叉號
  } 
  if (mapping) {
    return mapping; // 否則顯示 mapping 本身的文字
  }
  return '--'; // 沒有值時顯示 --
};

// 頁數計算
const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / pageSize)
)
const paginatedData = computed(() =>
  filteredData.value.slice((page.value - 1) * pageSize, page.value * pageSize)
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

const selectedSerialNumber = ref(null)

// 顏色變化邏輯
const getTextColor = (row) => {
  if (row.mapping === 'false') {
    return '#e74c3c'; // 紅色
  }
  if (row.upload === false || row.postAI === false || row.postPACS === false) {
    return '#e74c3c';
  }
  if (isSameId(row) && !selectedSerialNumber.value) {
    return '#FFFF00'; // 黃色
  }
  // 根據是否選中來設置文字顏色
  if (selectedMapping.value[row.id] === row.mapping) {
    return '#ffffff !important';  // 被選中時文字顏色為白色
  } 
  return '#ffffff'; // 正常顯示白色
}

// 當點擊 "重新嘗試" 時顯示確認提示
const handleRetry = (row, event) => {
  const isConfirmed = confirm(`您確定要重新嘗試流水號 ${row.serialNumber} 嗎？`);
  if (!isConfirmed) {
    event.preventDefault();  // 阻止重新嘗試的操作
  }
};
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
.search-input {
  width: 250px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #666;
  background: #111;
  color: white;
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
  width: 150px;
}
/* 流水號 */
.job-table th:nth-child(1),
.job-table td:nth-child(1) {
  width: 100px;
}
/* 身份證字號 */
.job-table th:nth-child(2),
.job-table td:nth-child(2) {
  width: 150px;
}
/* 姓名 */
.job-table th:nth-child(3),
.job-table td:nth-child(3) {
  width: 200px;
}
/* 檔案上傳 */
.job-table th:nth-child(4),
.job-table td:nth-child(4) {
  width: 150px;
}
/* 對應工單號 */
.job-table th:nth-child(5),
.job-table td:nth-child(5) {
  width: 200px;
}
/* 傳給 AI */
.job-table th:nth-child(6),
.job-table td:nth-child(6) {
  width: 150px;
}
/* 傳給 PACS */
.job-table th:nth-child(7),
.job-table td:nth-child(7) {
  width: 150px;
}
/* 重新嘗試 */
.job-table th:nth-child(8),
.job-table td:nth-child(8) {
  width: 100px;
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
