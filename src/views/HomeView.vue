<template>
  <div class="app-container">
    <main class="main-content">
      <h1 class="main-title">V5 ImPrep</h1>

      <!-- 工具列 -->
      <div class="toolbar">

        <!-- 上傳按鈕 -->
        <button class="add-job-btn" @click="openUploadDialog">新增批次</button>

        <!-- 搜尋欄 -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋批次......"
          class="search-input"
          @input="applyFilters"
        />
      </div>

      <!-- 列表 -->
      <table class="job-table">
        <thead>
          <tr>
            <th>批次名</th>
            <th>上傳時間
              <button @click="toggleArrowAndSort" class="filter-button">
                <!-- 根據狀態顯示不同的箭頭圖片 -->
                <img :src="arrowImage" alt="filter" class="filter-icon"/>
              </button>
              <div v-if="showUploadTimeFilter" class="filter-dropdown">
                <div @click="setUploadTimeFilter('asc')">時間升序</div>
                <div class="divider"></div>
                <div @click="setUploadTimeFilter('desc')">時間降序</div>
              </div>
            </th>
            <th>批次資料來源</th>
            <th>批次檔案數量</th>
            <th>批次狀態
              <button @click="toggleStatusFilter" class="filter-button">
                <img src="/filter.png" alt="filter" class="filter-icon"/>
              </button>
              <div v-if="showStatusFilter" class="filter-dropdown">
                <div @click="setStatusFilter('')">All</div>
                <div class="divider"></div>
                <div @click="setStatusFilter('Finish')">Finish</div>
                <div class="divider"></div>
                <div @click="setStatusFilter('Error')">Error</div>
                <div class="divider"></div>
                <div @click="setStatusFilter('Pending')">Pending</div>
              </div>
            </th>
            <th>工具列</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in filteredJobs" :key="index">
            <td>{{ item.job }}</td>
            <td>{{ item.time }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.series }}</td>
            <td :style="getStatusStyle(item.status)">{{ item.status }}</td>
            <td>

              <!-- 個別檔案按鈕 -->
              <button class="icon-button" @click="viewFile(item)" title="點擊查看批次內容">
                <img src="/eye.png" class="action-icon" alt="view" />
              </button>
              <button class="icon-button" @click="selectFileForJob(item.job)" title="點擊上傳檔案">
                <img src="/upload.png" class="action-icon" alt="upload file" />
              </button>
              <button class="icon-button" title="點擊下載批次">
                <img src="/download.png" class="action-icon" alt="download" />
              </button>
              <button class="icon-button" @click="deleteJob(item.job)" title="點擊刪除批次">
                <img src="/trash-bin.png" class="action-icon" alt="delete" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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

      <!-- 上傳視窗 -->
      <div v-if="showDialog" class="modal-overlay">
        <div class="modal">
          <h2 class="modal-title">新增批次</h2>

          <!-- 上傳資料夾 -->
          <div class="form-group">
            <label>選擇資料夾</label>
            <label class="upload-box">
              <input
                type="file"
                multiple
                webkitdirectory
                directory
                hidden
                @change="handleFileUpload"
              />
              點擊方框選擇資料夾
            </label>
          </div>

          <!-- 檔案名條列壓縮 -->
          <div v-if="uploadedFiles.length > 0" class="file-list">
            <p v-for="(file, i) in uploadedFiles.slice(0, 3)" :key="i">{{ file.name }}</p>
            <p v-if="uploadedFiles.length > 4">... ({{ uploadedFiles.length - 4 }} files hidden) ...</p>
            <p v-if="uploadedFiles.length > 4">{{ uploadedFiles[uploadedFiles.length - 1].name }}</p>
          </div>

          <!-- 輸入jobName -->
          <label>輸入批次名</label>
          <div class="form-group">
            <input v-model="newJob.name" type="text" />
          </div>

          <!-- 進度條 -->
          <div class="form-group">
            <label>上傳進度</label>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <button class="retry-btn" @click="retryUpload">
                <img src="/reload.png" class="action-icon" alt="retry" />
              </button>
            </div>
          </div>

          <!-- 上傳/取消按鈕 -->
          <div class="modal-actions">
            <button class="submit-btn" @click="submitUpload">上傳</button>
            <button @click="closeDialog" class="close-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 單一檔案上傳 -->
      <input type="file" ref="fileInput" hidden @change="handleSingleFileUpload" accept=".dcm" />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { onMounted } from 'vue'
import axios from 'axios'

const router = useRouter()

onMounted(async () => {
  try {
    // 清空 jobs 資料，避免重複顯示
    jobs.value = [];
    
    // 從後端獲取資料
    const response = await axios.get('http://localhost:8082/jobs');
    
    // 確保資料唯一，不重複
    if (response.data && Array.isArray(response.data)) {
      jobs.value = response.data;
      originalJobs.value = [...response.data];
    }
  } catch (error) {
    console.error("無法加載 jobs 資料", error);
  }
});

// 控制上傳視窗顯示
const showDialog = ref(false)

// 偵測資料夾名稱
const detectedFolderName = ref('')

// 新Job名稱
const newJob = ref({ name: '' })

// 上傳的檔案清單
const uploadedFiles = ref([])

// 上傳進度條
const uploadProgress = ref(0)

// 資料
const jobs = ref([])

const fileInput = ref(null)
const currentUploadJob = ref(null)

// 搜尋欄
const searchQuery = ref('')

// 批次狀態篩選
const statusFilter = ref('');

// 控制篩選選單顯示
const showUploadTimeFilter = ref(false)
const showStatusFilter = ref(false)

// 控制篩選選單顯示
const arrowState = ref('both'); // 'both', 'down', 'up'
const uploadTimeFilter = ref('asc'); 

// 根據箭頭狀態更新顯示的圖片
const arrowImage = computed(() => {
  if (arrowState.value === 'down') {
    return '/arrowDown.png';
  } else if (arrowState.value === 'up') {
    return '/arrowUp.png';
  } else {
    return '/arrowBoth.png'; // 上下箭頭圖片
  }
});

// 切換箭頭狀態
const toggleArrowAndSort = () => {
  if (arrowState.value === 'both') {
    arrowState.value = 'down'; // 顯示向下箭頭
    uploadTimeFilter.value = 'asc'; // 時間升序
  } else if (arrowState.value === 'down') {
    arrowState.value = 'up'; // 顯示向上箭頭
    uploadTimeFilter.value = 'desc'; // 時間降序
  } else {
    arrowState.value = 'both'; // 顯示上下箭頭
    uploadTimeFilter.value = ''; // 清除排序
    resetJobOrder();
  }

  // 根據新的排序狀態重新排序
  applySorting();
};

// 恢復原始順序
const resetJobOrder = () => {
  jobs.value = [...originalJobs.value];
};
const originalJobs = ref([]);

// 排序方法
const applySorting = () => {
  if (uploadTimeFilter.value === 'asc') {
    jobs.value.sort((a, b) => new Date(a.time) - new Date(b.time));
  } else if (uploadTimeFilter.value === 'desc') {
    jobs.value.sort((a, b) => new Date(b.time) - new Date(a.time));
  } else {
    // 如果沒有排序條件，保留原來的順序或按需處理
    jobs.value = [...jobs.value];
  }
};

const filteredJobs = computed(() => {
  let filtered = jobs.value;

  if (searchQuery.value) {
    filtered = filtered.filter(item => item.job.includes(searchQuery.value));
  }
  if (uploadTimeFilter.value) {
    applySorting();
  }
  return filtered;
});

const toggleStatusFilter = () => {
  showStatusFilter.value = !showStatusFilter.value;
  showUploadTimeFilter.value = false;
};

// 設置篩選條件
const setUploadTimeFilter = (order) => {
  uploadTimeFilter.value = order;
  applyFilters();
  showUploadTimeFilter.value = false;
};
const setStatusFilter = (status) => {
  statusFilter.value = status;
  applyFilters();
  showStatusFilter.value = false;
};

// 重新應用篩選條件
const applyFilters = () => {
  page.value = 1;
}

// 翻頁設定
const page = ref(1)
const pageSize = ref(10);

// 頁面計算
const totalPages = computed(() => Math.ceil(filteredJobs.value.length / pageSize.value));

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

// 頁數切換
const setPage = (p) => { page.value = p }
const prevPage = () => { if (page.value > 1) page.value-- }
const nextPage = () => { if (page.value < totalPages.value) page.value++ }

// 開關上傳視窗
const openUploadDialog = () => { 
  showDialog.value = true;
};
const closeDialog = () => {
  showDialog.value = false
  newJob.value.name = ''
  uploadedFiles.value = []
  uploadProgress.value = 0
}

// 跳轉頁面
const viewFile = (item) => {
  router.push({
    name: 'About',
    params: { id: item.id },
    query: {
      job: item.job,
      time: item.time,
    }
  })
}

// 上傳資料夾
const handleFileUpload = (e) => {
  const files = Array.from(e.target.files)
  if (files.length === 0) return

  // 限制.dcm 檔案
  const dicomFiles = files.filter(file => file.name.endsWith(".dcm"))

  if (dicomFiles.length === 0) {
    alert("請選擇 DICOM 檔案（.dcm）。");
    return;
  }

  // 將過濾後的 DICOM 檔案加入上傳清單
  uploadedFiles.value = dicomFiles
  const firstPath = files[0].webkitRelativePath || ''
  const folderName = firstPath.split('/')[0] || 'UnknownFolder'
  detectedFolderName.value = folderName
}

// 將資料夾內容加入列表
const submitUpload = async () => {
  if (!newJob.value.name || uploadedFiles.value.length === 0) {
    alert('請加入資料夾及輸入批次名稱')
    return
  }

  // 檢查是否已經存在相同的 job 名稱
  const jobExists = jobs.value.some(job => job.job === newJob.value.name);
  if (jobExists) {
    alert('這個批次名稱已經存在');
    return;
  }

 // 取得當前時間格式化為 yyyy/MM/DD-hh:mm:ss
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const day = currentDate.getDate().toString().padStart(2, '0');
  const hours = currentDate.getHours().toString().padStart(2, '0');
  const minutes = currentDate.getMinutes().toString().padStart(2, '0');
  const seconds = currentDate.getSeconds().toString().padStart(2, '0');

  // 格式化字串
  const currentTime = `${year}/${month}/${day}-${hours}:${minutes}:${seconds}`;
  const generateUniqueId = `${year}${month}${day}${hours}${minutes}${seconds}`;

  uploadProgress.value = 100
  const jobId = generateUniqueId;
  // 傳送新增的 Job 到後端
  const newJobData = {
    job: newJob.value.name,
    id: jobId,
    time: currentTime,
    name: detectedFolderName.value,
    series: uploadedFiles.value.length,
    status: 'Pending',
    files: [...uploadedFiles.value],
  };

  try {
    // 發送 POST 請求到後端
    const response = await axios.post('http://localhost:8082/jobs', newJobData);

    // 確保後端回傳成功後再加入 job 資料
    if (response.status === 201) {
      jobs.value.push(response.data);  // 使用從後端返回的資料
    }

    closeDialog();
  } catch (error) {
    console.error("無法新增 job", error);
  }

  closeDialog()
}

// 重試上傳
const retryUpload = () => {
  uploadProgress.value = 0
  alert('Retry upload triggered.')
}

// 根據狀態設置文字顏色
const getStatusStyle = (status) => {
  switch (status) {
    case 'Finish':
      return { color: '#34B539', fontWeight: 'bold' };
    case 'Pending':
      return { color: '#ffffff', fontWeight: 'bold' };
    case 'Error':
      return { color: '#e74c3c', fontWeight: 'bold' };
    default:
      return { color: '#ffffff', fontWeight: 'bold' };
  }
}

// 刪除job+更新頁面
const deleteJob = async (jobId) => {
  if (confirm(`你確定要刪除批次 ${jobId}?`)) {
    try {
      const response = await axios.delete(`http://localhost:8082/jobs/${jobId}`);
      
      if (response.status === 200) {
        jobs.value = jobs.value.filter(job => job.id !== jobId);
        alert(`Job with ID ${jobId} has been deleted`);
      }
    } catch (error) {
      console.error('刪除失敗', error);
      alert('刪除過程中出現錯誤');
    }
  }
};

// 新增指定job單一檔案
const selectFileForJob = (jobId) => {
  currentUploadJob.value = jobId
  fileInput.value?.click()
}
const handleSingleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file || !currentUploadJob.value) return

  // 彈出確認提示
  const isConfirmed = confirm(`您確定要上傳檔案 "${file.name}" 嗎？`)
  if (!isConfirmed) {
    e.target.value = ''
    return
  }

  // 檢查檔案是否為 DICOM (.dcm)
  if (file.type !== "application/dicom" && !file.name.endsWith(".dcm")) {
    alert("請選擇 DICOM 檔案（.dcm）");
    return;
  }

  const job = jobs.value.find(j => j.job === currentUploadJob.value)
  if (job) {
    job.files.push(file)
    job.series += 1
    job.status = 'Pending'
    alert(`檔案 "${file.name}" 上傳至 "${job.job}".`)
  }

  e.target.value = ''
  currentUploadJob.value = null
}
</script>

<style scoped>

/* App 整體 */
.app-container {
  background: black;
  color: white;
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
  border-radius: 0px;
  color: white;
  display: inline-block;
}

/* 上傳搜尋列 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 14px;
}
.search-input {
  width: 250px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #666;
  background: #111;
  color: white;
}
.add-job-btn {
  background: #2c2c2c;
  color: white;
  border: 1px solid white;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.add-job-btn:hover {
  background: #0892D0;
  border-color: #0892D0;
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
  border: none;
  color: #ffffff;
  width: 150px;
}
/* 批次名 */
.job-table th:nth-child(1),
.job-table td:nth-child(1) {
  width: 200px;
}
/* 上傳時間 */
.job-table th:nth-child(2),
.job-table td:nth-child(2) {
  width: 200px;
}
/* 批次資料來源 */
.job-table th:nth-child(3),
.job-table td:nth-child(3) {
  width: 200px;
}
/* 批次檔案數量 */
.job-table th:nth-child(4),
.job-table td:nth-child(4) {
  width: 100px;
}
/* 批次狀態 */
.job-table th:nth-child(5),
.job-table td:nth-child(5) {
  width: 100px;
}
.filter-input {
  margin-left: 10px;
  padding: 4px;
  border-radius: 4px;
  background: #333;
  color: white;
  border: 1px solid #555;
  font-size: 12px;
}
/* 工具列 */
.job-table th:nth-child(6),
.job-table td:nth-child(6) {
  width: 150px;
}
.job-table tbody tr + tr {
  border-top: 2px solid #003366;
}
.job-table thead {
  background-color: black;
  color: white;
}

/* 篩選選單 */
.filter-dropdown {
  position: absolute;
  background: #333;
  padding: 10px;
  border-radius: 4px;
  z-index: 10;
}
.filter-button {
  background-color: black;
  border: none;
  padding: 4px;
  cursor: pointer;
}
.filter-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}
.filter-dropdown div {
  padding: 1px;
  cursor: pointer;
}
.divider {
  border-top: 1px solid #666;
  margin: 4px 0;
}

/* icon工具列 */
.icon-button {
  background: none;
  border: none;
  padding: 2px;
  margin-right: 10px;
  cursor: pointer;
}
.action-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* 彈窗及遮罩 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}
.modal {
  background: #222;
  padding: 20px;
  border-radius: 8px;
  width: 360px;
}

/* 上傳輸入及條列 */
.modal input {
  width: 95%;
  padding: 8px;
  background: #333;
  border: 1px solid #555;
  color: white;
}
.upload-box {
  background: #333;
  padding: 16px;
  border: 2px dashed #666;
  color: #aaa;
  text-align: center;
  margin-bottom: 8px;
  cursor: pointer;
}
.file-list {
  font-size: 13px;
  margin-top: 4px;
  color: #ccc;
}

/* 上傳進度 */
.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.progress-bar {
  flex: 1;
  background: #555;
  height: 6px;
  border-radius: 4px;
  overflow: hidden;
}
.progress {
  background: #0892D0;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 重新上傳鍵 */
.retry-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
}

/* 上傳及取消鍵 */
.modal-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}
.submit-btn {
  padding: 8px 16px;
  background: #0892D0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
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
