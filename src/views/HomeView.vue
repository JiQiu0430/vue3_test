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
                <div
                  @click="setStatusFilter('')"
                  :class="{ selected: statusFilter === '' }"
                >All</div>
                <div class="divider"></div>
                <div
                  @click="setStatusFilter('Finish')"
                  :class="{ selected: statusFilter === 'Finish' }"
                >Finish</div>
                <div class="divider"></div>
                <div
                  @click="setStatusFilter('Error')"
                  :class="{ selected: statusFilter === 'Error' }"
                >Error</div>
                <div class="divider"></div>
                <div
                  @click="setStatusFilter('Pending')"
                  :class="{ selected: statusFilter === 'Pending' }"
                >Pending</div>
              </div>
            </th>
            <th>工具列</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedJobs" :key="index">
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
import * as dicomParser from "dicom-parser";

const router = useRouter()

const formatDate = (isoDate) => {
  const date = new Date(isoDate);

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}/${month}/${day}-${hours}:${minutes}:${seconds}`;
};

onMounted(async () => {
  try {
    // 從後端獲取資料
    const response = await axios.get('http://localhost:8081/tourCar');
    
    // 格式化 time 欄位
    if (response.data && Array.isArray(response.data.result)) {
      jobs.value = response.data.result.map(item => {
        item.time = formatDate(item.time);
        return item;
      });
      originalJobs.value = [...jobs.value];
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
const arrowState = ref('both');
const uploadTimeFilter = ref('asc'); 

// 根據箭頭狀態更新顯示的圖片
const arrowImage = computed(() => {
  if (arrowState.value === 'down') {
    return '/arrowDown.png';
  } else if (arrowState.value === 'up') {
    return '/arrowUp.png';
  } else {
    return '/arrowBoth.png';
  }
});

// 切換箭頭狀態
const toggleArrowAndSort = () => {
  if (arrowState.value === 'both') {
    arrowState.value = 'down';
    uploadTimeFilter.value = 'asc';
  } else if (arrowState.value === 'down') {
    arrowState.value = 'up';
    uploadTimeFilter.value = 'desc';
  } else {
    arrowState.value = 'both';
    uploadTimeFilter.value = '';
    resetJobOrder();
  }
  applySorting();
  page.value = 1;
};

// 恢復原始順序
const resetJobOrder = () => {
  jobs.value = [...originalJobs.value];
  applySorting();
  applyFilters();
};
const originalJobs = ref([]);

// 排序方法
const applySorting = () => {
  let sorted = [...filteredJobs.value];
  if (uploadTimeFilter.value === 'asc') {
    sorted.sort((a, b) => new Date(a.time) - new Date(b.time));
  } else if (uploadTimeFilter.value === 'desc') {
    sorted.sort((a, b) => new Date(b.time) - new Date(a.time));
  } else {
    // 如果沒有排序條件，保留原來的順序或按需處理
    jobs.value = sorted;
  }
  jobs.value = sorted;
};

const filteredJobs = computed(() => {
  let filtered = [...jobs.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item => {
      return (
        item.job.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.time.toLowerCase().includes(query)
      );
    });
  }
  if (statusFilter.value) {
    filtered = filtered.filter(item => item.status === statusFilter.value);
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
};

// 翻頁設定
const page = ref(1)
const pageSize = ref(10);

const paginatedJobs = computed(() => {
  const startIndex = (page.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredJobs.value.slice(startIndex, endIndex);
});

// 頁面計算
const totalPages = computed(() => {
  return Math.ceil(filteredJobs.value.length / pageSize.value);
});

const pageNumbers = computed(() => {
  const totalPageCount = totalPages.value;
  const pages = [];

  if (totalPageCount <= 3) {
    // 若頁數小於等於3，顯示所有頁數
    for (let i = 1; i <= totalPageCount; i++) {
      pages.push(i);
    }
  } else {
    // 顯示前三頁，當前頁，和最後一頁
    if (page.value === 1) {
      pages.push(1, 2, totalPageCount);
    } else if (page.value === totalPageCount) {
      pages.push(1, totalPageCount - 1, totalPageCount);
    } else {
      pages.push(1, page.value, totalPageCount);
    }
  }
  return pages;
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
  newJob.value.name = folderName
};

// 將資料夾內容加入列表
const submitUpload = async () => {
  if (!newJob.value.name || uploadedFiles.value.length === 0) {
    alert('請加入資料夾及輸入批次名稱');
    return;
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

  uploadProgress.value = 100;
  const jobId = generateUniqueId;

  try {
    // 上傳 DICOM 檔案到 Orthanc
    const dicomUploadPromises = uploadedFiles.value.map(files => {
      const formData = new FormData();
      formData.append('files', files);

      const authHeader = 'Basic ' + btoa('orthanc:orthanc');

      console.log('Uploading files:', files);

      return axios.post('/instances', formData, {
        headers: {
          'Content-Type': 'multipart/form-data; boundary=<calculated when request is sent>',
          'Authorization': authHeader
        }
      });
    });
    const dicomUploadResults = await Promise.all(dicomUploadPromises);

    const array = [];
    dicomUploadResults.forEach((result, index) => {
      if (result.status !== 200 && result.status !== 201) {
        console.error(`檔案 ${uploadedFiles.value[index].name} 上傳失敗`, result);
        alert(`檔案 ${uploadedFiles.value[index].name} 上傳失敗`);
      } else {
        console.log(`檔案 ${uploadedFiles.value[index].name} 上傳成功`);
        array.push(dicomReader(uploadedFiles.value[index]))
      }
    });
  const mi = await Promise.all(array);
  console.log(mi)

    // const caseData = uploadedFiles.value.map(file => {
    //   const fileName = file.name.replace('.dcm', '');
    //   const fileParts = fileName.split('#');

    //   if (fileParts.length === 5) {
    //     const [serialNumber, patientId, name, gender, seriesIndex] = fileParts;

    //     console.log('Extracted Data:', { serialNumber, patientId, name, gender, seriesIndex });

    //     return {
    //       caseName: fileName,
    //       patientId: patientId,
    //       seriesId: seriesIndex,
    //       upload: true,
    //     };
    //   } else {
    //     console.error(`Invalid file name format for ${file.name}`);
    //     return null;
    //   }
    // }).filter(file => file !== null);  // 過濾掉格式錯誤的檔案

    // 上傳批次資料
    // 為了我最愛的芭樂，特此留下她的到此一遊痕跡，以紀念我對她的愛(?) const guava = uploadedFiles.value.map(file => { return { caseName: file.name } });
    const newJobData = {
      job: newJob.value.name,
      id: jobId,
      time: currentTime,
      name: detectedFolderName.value,
      series: uploadedFiles.value.length,
      status: 'Pending',
      files: mi
    };
    console.log("New Job Data to be saved:", newJobData);

    const response = await axios.post('http://localhost:8081/tourCar', newJobData);

    if (response.status === 200 || response.status === 201) {
      // // 上傳到 tourCarCase/job
      // const jobResponse = await axios.post(`http://localhost:8081/tourCarCase`, caseData);
      // if (jobResponse.status === 200 || jobResponse.status === 201) {
      //   console.log('TourCarCase successfully created');
      //   console.log(caseData)
      // } else {
      //   console.error('Failed to create TourCarCase');
      // }
      const fetchResponse = await axios.get('http://localhost:8081/tourCar');
      if (fetchResponse.status === 200 && Array.isArray(fetchResponse.data.result)) {
        jobs.value = fetchResponse.data.result.map(item => {
          item.time = formatDate(item.time);
          return item;
        });
        originalJobs.value = [...jobs.value];
        applySorting();
        applyFilters();
      }
    }
    closeDialog();
  } catch (error) {
    console.error("無法上傳 DICOM 檔案或儲存資料:", error);
    alert("上傳 DICOM 檔案或儲存資料時發生錯誤: " + error.message);
  }
  closeDialog();
};

const dicomReader = async(files) => {
    // const dicomUploadResults = await Promise.all(dicomUploadPromises);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(files);
    reader.onload = function () {
      const arrayBuffers = reader.result;
      const byteArray = new Uint8Array(arrayBuffers);
      const options = { TransferSyntaxUID: "1.2.840.10008.1.2" };
      const dataSet = dicomParser.parseDicom(byteArray, options);
      const s_id_Text = dataSet.string("x0020000e") || "";
      const patient_id = dataSet.string("x00100020");
      const studyId = dataSet.string("x0020000d");
      const instancesId = dataSet.string("x00080018") || "";

      const uploadData = {
          seriesId: s_id_Text,
          patientId: patient_id,
          studyId,
          instancesId,
          caseName: files.name,
          upload: true
      };
        resolve(uploadData)
        console.log(uploadData);
    };
  });
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
const deleteJob = async (jobName) => {
  if (confirm(`你確定要刪除批次 ${jobName}?`)) {
    try {
      const response = await axios.delete('http://localhost:8081/tourCar', {
        data: { job: jobName },
      });

      if (response.status === 200) {
        console.log('刪除成功:', jobName);
        jobs.value = jobs.value.filter(job => job.job !== jobName);
        alert(`批次 ${jobName} 已經被刪除`);
      }
    } catch (error) {
      console.error('刪除失敗', error);
      alert('刪除過程中出現錯誤');
    }
    const fetchResponse = await axios.get('http://localhost:8081/tourCar');
      if (fetchResponse.status === 200 && Array.isArray(fetchResponse.data.result)) {
        jobs.value = fetchResponse.data.result.map(item => {
          item.time = formatDate(item.time);
          return item;
        });
        originalJobs.value = [...jobs.value];
        applySorting();
        applyFilters();
      }
  }
};

// 新增指定job單一檔案
const selectFileForJob = (jobId) => {
  currentUploadJob.value = jobId
  fileInput.value?.click()
}
const handleSingleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUploadJob.value) return;

  const isConfirmed = confirm(`您確定要上傳檔案 "${file.name}" 嗎？`);
  if (!isConfirmed) {
    e.target.value = '';
    return;
  }

  if (file.type !== "application/dicom" && !file.name.endsWith(".dcm")) {
    alert("請選擇 DICOM 檔案（.dcm）");
    return;
  }

  try {
    const formData = new FormData();
    formData.append('files', file);
    const authHeader = 'Basic ' + btoa('orthanc:orthanc');
    const uploadResult = await axios.post('/instances', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': authHeader
      }
    });

    if (uploadResult.status !== 200 && uploadResult.status !== 201) {
      alert(`檔案 ${file.name} 上傳 Orthanc 失敗`);
      return;
    }

    const dicomData = await dicomReader(file);

    const payload = {
      caseName: dicomData.caseName,
      patientId: dicomData.patientId || '',
      studyId: dicomData.studyId || '',
      seriesId: dicomData.seriesId || '',
      series: "6", // 固定值
      upload: 1    // 固定值
    };

    const res = await axios.post(`http://localhost:8081/tourCarCase/${currentUploadJob.value}`,payload);

    if (res.status === 200 || res.status === 201) {
      alert(`檔案 "${file.name}" 已成功上傳到批次 "${currentUploadJob.value}"`);
    }

    const fetchResponse = await axios.get('http://localhost:8081/tourCar');
    if (fetchResponse.status === 200 && Array.isArray(fetchResponse.data.result)) {
      jobs.value = fetchResponse.data.result.map(item => {
        item.time = formatDate(item.time);
        return item;
      });
      originalJobs.value = [...jobs.value];
      applySorting();
      applyFilters();
    }
  } catch (err) {
    console.error("單檔上傳錯誤：", err);
    alert("單檔上傳時發生錯誤：" + err.message);
  }
  e.target.value = '';
  currentUploadJob.value = null;
};
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
.selected {
  color: #34B539;
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
  background: rgba(17, 17, 17, 0.6);
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
  font-size: 12px;
}
.items-per-page select {
  background: #333;
  color: white;
  padding: 6px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 12px;
}
.pagination {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(17, 17, 17, 0.6);
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
