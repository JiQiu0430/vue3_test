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
        <div class="action-buttons">
          <button class="retry-all-button" @click="retryAll">一鍵重試</button>
          <button class="export-button" @click="exportCSV">導出CSV</button>
        </div>
      </div>

      <!-- 列表 -->
      <table class="job-table">
        <thead>
          <tr>
            <th class="sortable-column">
              <span>流水號</span>
              <img
                :src="getArrowIcon('serialNumber')"
                class="filter-icon"
                @click="toggleSort('serialNumber')"
              />
              <div v-if="showSortMenu" class="sort-menu">
                <span @click="sortData('serialNumber', 'asc')">流水號升序</span>
                <div class="divider"></div>
                <span @click="sortData('serialNumber', 'desc')">流水號降序</span>
              </div>
            </th>
            <th class="sortable-column">
              <span>身份證字號</span>
              <img
                :src="getArrowIcon('id')"
                class="filter-icon"
                @click="toggleSort('id')"
              />
              <div v-if="showSortMenu" class="sort-menu">
                <span @click="sortData('id', 'asc')">身份證字號升序</span>
                <div class="divider"></div>
                <span @click="sortData('id', 'desc')">身份證字號降序</span>
              </div>
            </th>
            <th>姓名</th>
            <th>檔案上傳</th>
            <th>
              <span>對應工單號</span>
              <img
              src="/filter.png"
              class="filter-icon"
              @click="toggleFilterMenu('mapping')"
            />
            <div v-if="showFilterMenu.mapping" class="filter-menu">
              <span @click="filterData('mapping', 'all')">全部</span>
              <div class="divider"></div>
              <span @click="filterData('mapping', 'hasValue')">正常</span>
              <div class="divider"></div>
              <span @click="filterData('mapping', 'false')">錯誤</span>
              <div class="divider"></div>
              <span @click="filterData('mapping', null)">沒有工單號</span>
              <div class="divider"></div>
              <span @click="filterData('mapping', 'sameId')">相同身份證字號</span>
            </div>
            </th>
            <th>
              <span>傳給AI</span>
              <img
                src="/filter.png"
                class="filter-icon"
                @click="toggleFilterMenu('ai')"
              />
              <div v-if="showFilterMenu.ai" class="filter-menu">
                <span @click="filterData('ai', 'all')">全部</span>
                <div class="divider"></div>
                <span @click="filterData('ai', true)">正常傳送</span>
                <div class="divider"></div>
                <span @click="filterData('ai', false)">錯誤</span>
                <div class="divider"></div>
                <span @click="filterData('ai', null)">尚未傳送</span>
              </div>
            </th>
            <th>
              <span>傳給PACS</span>
              <img
                src="/filter.png"
                class="filter-icon"
                @click="toggleFilterMenu('pacs')"
              />
              <div v-if="showFilterMenu.pacs" class="filter-menu">
                <span @click="filterData('pacs', 'all')">全部</span>
                <div class="divider"></div>
                <span @click="filterData('pacs', true)">正常傳送</span>
                <div class="divider"></div>
                <span @click="filterData('pacs', false)">錯誤</span>
                <div class="divider"></div>
                <span @click="filterData('pacs', null)">尚未傳送</span>
              </div>
            </th>
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
              <!-- 顯示查看 DICOM 按鈕 -->
              <button
                v-if="isSameId(row)"
                class="icon-button dicom-view"
                @click="showDicomViewer"
              >
                <img src="/eye.png" class="action-icon" title="點擊查看此檔案Dicom" />
              </button>
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

      <!-- 顯示 DICOM 的彈出視窗 -->
      <div v-if="dicomVisible" class="dicom-modal" @click="closeDicomViewer">
        <div class="dicom-modal-content" @click.stop>
          <h2>DICOM 影像</h2>
          <div class="dicom-viewer">
            <!-- 使用 ref 來獲取 DICOM 顯示區域 -->
            <div ref="dicomCanvas" class="dicom-canvas"></div>
          </div>
          <button @click="closeDicomViewer">關閉</button>
        </div>
      </div>

      <!-- 頁數和顯示數量選擇的容器 -->
      <div class="pagination-container">
        <!-- 顯示數量選擇 -->
        <div class="items-per-page">
          <label for="itemsPerPage">每頁顯示：</label>
          <select id="itemsPerPage" v-model="pageSize" @change="applyFilters">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        <!-- 頁數方塊 -->
        <div class="pagination">
          <button @click="prevPage" :disabled="page === 1">«</button>
          <button v-for="p in pageNumbers" :key="p" @click="setPage(p)" :class="{ active: page === p }">
            {{ p }}
          </button>
          <button @click="nextPage" :disabled="page === totalPages">»</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, nextTick, onMounted } from 'vue'
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";

const route = useRoute()
const router = useRouter()

const goBackHome = () => router.push({ name: 'Home' })

// 取得 job 資訊
const jobInfo = computed(() => ({
  job: route.query.job,
  time: route.query.time,
}))

// 模擬資料
const caseData = ref([
  {
    caseName: '0001#A123456789#王小明#M#01',
    upload: true,
    mapping: 'ABC001',
    postAI: null,
    postPACS: null,
    status: 'Pending'
  },
  {
    caseName: '0002#A123456789#王小明#M#02',
    upload: true,
    mapping: 'ABC001',
    postAI: null,
    postPACS: null,
    status: 'Pending'
  },
  {
    caseName: '0003#B123456789#陳大明#F#01',
    upload: true,
    mapping: 'false',
    postAI: null,
    postPACS: null,
    status: 'Pending'
  },
  {
    caseName: '0004#C123456789#林子涵#F#01',
    upload: true,
    mapping: 'ABC003',
    postAI: true,
    postPACS: true,
    status: 'Analyzed'
  },
  {
    caseName: '0005#D123456789#汪杰#M#01',
    upload: true,
    mapping: 'ABC004',
    postAI: true,
    postPACS: false,
    status: 'Error'
  },
  {
    caseName: '0006#E123456789#卡厄斯#F#01',
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

// 搜尋框
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
    event.preventDefault();
  } else {
    selectedSerialNumber.value = row.serialNumber;
  }
};

// 彈出 DICOM 視窗
const dicomVisible = ref(false)
const showDicomViewer = () => {
  dicomVisible.value = true
  nextTick(() => {
    loadDicomFile()  // 確保 DOM 元素渲染後再載入 DICOM 影像
  })
}
const closeDicomViewer = () => {
  dicomVisible.value = false
}
// 使用 Vue3 的 ref 來獲取 DOM 引用
const dicomCanvas = ref(null)
onMounted(() => {
  // 配置 cornerstoneWADOImageLoader，並啟用 Web Workers
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone
  cornerstoneWADOImageLoader.configure({
    useWebWorkers: true, // 使用 Web Worker 加速影像處理
  })
})
// 載入 DICOM 檔案
const loadDicomFile = () => {
  const dicomFilePath = '/1-040.dcm' // 放在 public 資料夾中的 DICOM 檔案路徑

  // 取得顯示區域
  const element = dicomCanvas.value // 使用 ref 獲取 DOM 元素
  cornerstone.enable(element) // 啟用 Cornerstone 來顯示影像

  // 使用 fetch 來讀取檔案並將其轉換為 Blob
  fetch(dicomFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch DICOM file')
      }
      return response.blob()  // 轉換為 Blob
    })
    .then(blob => {
      // 創建 URL
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob)

      // 載入影像並顯示
      cornerstone.loadImage(imageId).then((image) => {
        cornerstone.displayImage(element, image)
      }).catch((err) => {
        console.error("DICOM 影像載入錯誤:", err)
      })
    })
    .catch((err) => {
      console.error("無法載入 DICOM 檔案:", err)
    })
}

// 排序功能
const sortState = ref({
  serialNumber: 'none',
  id: 'none'
});
const showSortMenu = ref(false);
const originalCaseData = ref([...caseData.value]);
// 控制箭頭圖標
const getArrowIcon = (field) => {
  if (sortState.value[field] === 'asc') {
    return '/arrowDown.png'; // 向下箭頭
  } else if (sortState.value[field] === 'desc') {
    return '/arrowUp.png'; // 向上箭頭
  } else {
    return '/arrowBoth.png'; // 上下箭頭圖標
  }
};
const toggleSort = (field) => {
  // 依據目前的排序狀態切換
  if (sortState.value[field] === 'none') {
    sortState.value[field] = 'asc'; // 初次點擊升序
  } else if (sortState.value[field] === 'asc') {
    sortState.value[field] = 'desc'; // 第二次點擊降序
  } else {
    sortState.value[field] = 'none'; // 第三次點擊恢復原樣
    caseData.value = [...originalCaseData.value]; // 恢復原始資料順序
  }
  sortData(field, sortState.value[field]); // 根據當前排序狀態進行排序
};
const sortData = (field, order) => {
  if (order === 'asc') {
    caseData.value.sort((a, b) => {
      if (field === 'serialNumber') {
        return a.caseName.localeCompare(b.caseName); // 按流水號排序
      }
      return a.id.localeCompare(b.id); // 按身份證字號排序
    });
  } else if (order === 'desc') {
    caseData.value.sort((a, b) => {
      if (field === 'serialNumber') {
        return b.caseName.localeCompare(a.caseName); // 按流水號降序
      }
      return b.id.localeCompare(a.id); // 按身份證字號降序
    });
  }
};

// 篩選功能
const showFilterMenu = ref({ ai: false, pacs: false, mapping: false });
const filterConditions = ref({ ai: 'all', pacs: 'all', mapping: 'all' });

const filterData = (field, value) => {
  filterConditions.value[field] = value;
  showFilterMenu.value[field] = false; // 點擊選擇篩選後，隱藏對應選單
};

// 篩選的結果
const paginatedData = computed(() => {
  let data = filteredData.value;

  // 篩選條件：根據 ai、pacs 和 mapping 進行過濾
  if (filterConditions.value.ai !== 'all') {
    data = data.filter(item => item.postAI === filterConditions.value.ai);
  }
  if (filterConditions.value.pacs !== 'all') {
    data = data.filter(item => item.postPACS === filterConditions.value.pacs);
  }

  // 處理篩選選項
  if (filterConditions.value.mapping === 'false') {
    // 顯示 mapping 為字串 'false' 的資料
    data = data.filter(item => item.mapping === 'false');
  } else if (filterConditions.value.mapping === 'hasValue') {
    // 顯示所有正常工單號的資料
    data = data.filter(item => item.mapping && item.mapping !== '' && item.mapping !== 'false');
  } else if (filterConditions.value.mapping === null) {
    // 篩選出 mapping 為 null 或空字串的資料
    data = data.filter(item => item.mapping === null || item.mapping === '');
  } else if (filterConditions.value.mapping === 'sameId') {
    // 篩選出相同身份證字號的工單號
    data = data.filter(item => {
      return caseData.value.filter(subItem => subItem.id === item.id).length > 1;
    });
  }

  // 如果選擇 "全部"，不進行過濾，顯示所有資料
  if (filterConditions.value.mapping === 'all') {
    // 保持篩選後的資料，不覆蓋
    // 如果是 "全部"，應該將之前的篩選條件保留，並不重新設定為篩選前的資料
  }

  return data.slice((page.value - 1) * pageSize.value, page.value * pageSize.value);
});

const toggleFilterMenu = (field) => {
  showFilterMenu.value[field] = !showFilterMenu.value[field]
}

const retryAll = () => {
  const filesToRetry = caseData.value.filter(row => {
    return row.postAI === false || row.postPACS === false || row.mapping === 'false';
  });

  if (filesToRetry.length === 0) {
    alert('沒有需要重試的檔案！');
    return;
  }

  const confirmRetry = confirm(`有 ${filesToRetry.length} 檔案需要重試，確定要繼續嗎？`);
  if (confirmRetry) {
    // 空區塊
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
    return '✘';
  } 
  if (mapping) {
    return mapping;
  }
  return '--';
};

// 頁數計算
const page = ref(1)
const pageSize = ref(10);

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value))

// 根據頁數計算需要顯示的頁碼（最多顯示3個頁碼）
const pageNumbers = computed(() => {
  if (totalPages.value <= 3) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  } else {
    if (page.value === 1) {
      return [1, 2, totalPages.value];
    } else if (page.value === totalPages.value) {
      return [1, totalPages.value - 1, totalPages.value];
    } else {
      return [1, page.value, totalPages.value];
    }
  }
});

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
    return '#e74c3c';
  }
  if (row.upload === false || row.postAI === false || row.postPACS === false) {
    return '#e74c3c';
  }
  if (isSameId(row) && !selectedSerialNumber.value) {
    return '#FFFF00';
  }
  // 根據是否選中來設置文字顏色
  if (selectedMapping.value[row.id] === row.mapping) {
    return '#ffffff !important';
  } 
  return '#ffffff';
}

// 當點擊 "重新嘗試" 時顯示確認提示
const handleRetry = (row, event) => {
  const isConfirmed = confirm(`您確定要重新嘗試流水號 ${row.serialNumber} 嗎？`);
  if (!isConfirmed) {
    event.preventDefault();
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
  font-size: 16px;
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
.back-button {
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
.job-info {
  display: flex;
  gap: 20px;
  color: #bbb;
  font-size: 14px;
}
.job-info span {
  white-space: nowrap;
}

/* 右邊按鈕 */
.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}
.export-button {
  background: #2c2c2c;
  color: #ffffff;
  border: 1px solid #ffffff;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.export-button:hover {
  background: #28a745;
  border-color: #28a745;
}
.retry-all-button {
  background: #2c2c2c;
  color: #ffffff;
  border: 1px solid #ffffff;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.retry-all-button:hover {
  background: #e19214;
  border-color: #e19214;
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
.sortable-column {
  position: relative;
}
.filter-icon {
  width: 14px;
  height: 14px;
  cursor: pointer;
  margin-left: 8px;
}
.filter-text {
  color: #0892D0;
  cursor: pointer;
  margin-left: 8px;
}
.sort-menu {
  background: #333;
  padding: 10px;
  border-radius: 6px;
  position: absolute;
  top: 38px;
  left: 0;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.divider {
  border-top: 1px solid #666;
  margin: 4px 0;
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
/* 加入篩選選單的樣式 */
.filter-menu {
  background: #333;
  padding: 10px;
  border-radius: 6px;
  position: absolute;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
.filter-icon {
  width: 14px;
  height: 14px;
  cursor: pointer;
  margin-left: 8px;
}
.divider {
  border-top: 1px solid #666;
  margin: 4px 0;
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
  z-index: 1;
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

/* 彈出視窗的樣式 */
.dicom-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.dicom-modal-content {
  background: #444;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}
.dicom-viewer .dicom-canvas {
  width: 150%;
  height: 150%; /* 設置顯示區域的大小 */
  border: 1px solid black;
}
.dicom-viewer img {
  max-width: 100%;
  max-height: 400px;
}
.dicom-modal-content button {
  background-color: #444;
  color: white;
  border: 1px solid white;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}
.dicom-modal-content button:hover {
  background-color: #0892D0;
  color: white;
  border: 1px solid #0892D0;
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
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* 分頁 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #000000;
  border-radius: 6px;
  position: fixed;
  bottom: 65px;
  right: 20px;
  z-index: 1000;
}
.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
}
.items-per-page select {
  background: #333;
  color: white;
  padding: 6px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
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
  background: #0892D0;
  border-color: #0892D0;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>