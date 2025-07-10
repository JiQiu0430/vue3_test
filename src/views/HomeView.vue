<template>
  <div class="app-container">
    <main class="main-content">
      <h1 class="main-title">V5 ImPrep</h1>

      <!-- 工具列 -->
      <div class="toolbar">
        <!-- 上傳按鈕 -->
        <button class="add-job-btn" @click="openUploadDialog">+ Job</button>
        <!-- 搜尋欄 -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search jobs..."
          class="search-input"
        />
      </div>

      <!-- 列表 -->
      <table class="job-table">
        <thead>
          <tr>
            <th class="status-header"></th>
            <th>Job</th>
            <th>Upload Time</th>
            <th>Name</th>
            <th>Series Count</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedJobs" :key="index">
            <td>
              <span
                class="status-indicator"
                :class="{
                  green: item.status === 'Analyzed',
                  white: item.status === 'Pending',
                  red: item.status === 'Error'
                }"
              ></span>
            </td>
            <td>{{ item.job }}</td>
            <td>{{ item.time }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.series }}</td>
            <td>{{ item.status }}</td>
            <td>
              <!-- 個別檔案按鈕 -->
              <button class="icon-button" @click="viewFile(item)">
                <img src="/eye.png" class="action-icon" alt="view" />
              </button>
              <button class="icon-button" @click="selectFileForJob(item.job)">
                <img src="/file.png" class="action-icon" alt="upload file" />
              </button>
              <button class="icon-button"><img src="/download.png" class="action-icon" alt="download" /></button>
              <button class="icon-button" @click="deleteJob(item.job)">
                <img src="/trash-bin.png" class="action-icon" alt="delete" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 頁面方塊 -->
      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1">«</button>
        <button v-for="p in totalPages" :key="p" @click="setPage(p)" :class="{ active: page === p }">
          {{ p }}
        </button>
        <button @click="nextPage" :disabled="page === totalPages">»</button>
      </div>

      <!-- 上傳視窗 -->
      <div v-if="showDialog" class="modal-overlay">
        <div class="modal">
          <h2 class="modal-title">Create Job</h2>

          <div class="form-group">
            <label>1. Input job name</label>
            <input v-model="newJob.name" type="text" />
          </div>

          <div class="form-group">
            <label>2. Select upload folder</label>
            <label class="upload-box">
              <input
                type="file"
                multiple
                webkitdirectory
                directory
                hidden
                @change="handleFileUpload"
              />
              click to upload DICOM
            </label>
            <!-- 檔案名條列壓縮 -->
            <div v-if="uploadedFiles.length > 0" class="file-list">
              <p v-for="(file, i) in uploadedFiles.slice(0, 3)" :key="i">{{ file.name }}</p>
              <p v-if="uploadedFiles.length > 4">... ({{ uploadedFiles.length - 4 }} files hidden) ...</p>
              <p v-if="uploadedFiles.length > 4">{{ uploadedFiles[uploadedFiles.length - 1].name }}</p>
            </div>
          </div>

          <div class="form-group">
            <label>3. Upload</label>
            <div class="progress-bar">
              <div class="progress" :style="{ width: uploadProgress + '%' }"></div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="submit-btn" @click="submitUpload">Upload</button>
            <button @click="closeDialog" class="close-btn">✕</button>
          </div>
        </div>
      </div>

      <!-- 單一檔案上傳 -->
      <input type="file" ref="fileInput" hidden @change="handleSingleFileUpload" />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showDialog = ref(false)
const newJob = ref({ name: '' })
const uploadedFiles = ref([])
const uploadProgress = ref(0)
const detectedFolderName = ref('')
const searchQuery = ref('')
const page = ref(1)
const pageSize = 10
const fileInput = ref(null)
const currentUploadJob = ref(null)

// 模擬資料
const jobs = ref([
  {
    job: 'test-001',
    time: '2024-07-7 12:00',
    name: '七月',
    series: 5,
    status: 'Analyzed',
    files: [],
  },
  {
    job: 'test-002',
    time: '2024-07-7 12:30',
    name: '十三月',
    series: 3,
    status: 'Pending',
    files: [],
  },
])

// 頁面計算
const totalPages = computed(() => Math.ceil(jobs.value.length / pageSize))

// 搜尋欄
const paginatedJobs = computed(() =>
  jobs.value
    .filter(item => item.job.includes(searchQuery.value) || item.name.includes(searchQuery.value))
    .slice((page.value - 1) * pageSize, page.value * pageSize)
)

// 頁數切換
const setPage = (p) => { page.value = p }
const prevPage = () => { if (page.value > 1) page.value-- }
const nextPage = () => { if (page.value < totalPages.value) page.value++ }

// 開關上傳視窗
const openUploadDialog = () => { showDialog.value = true }
const closeDialog = () => {
  showDialog.value = false
  newJob.value.name = ''
  uploadedFiles.value = []
  uploadProgress.value = 0
}

// 跳轉頁面
const viewFile = (item) => {
  router.push({
    name: 'FilePage',
    params: { id: item.job },
    query: {
      job: item.job,
      time: item.time,
      series: item.series
    }
  })
}

// 上傳資料夾
const handleFileUpload = (e) => {
  const files = Array.from(e.target.files)
  if (files.length === 0) return
  uploadedFiles.value = files
  const firstPath = files[0].webkitRelativePath || ''
  const folderName = firstPath.split('/')[0] || 'UnknownFolder'
  detectedFolderName.value = folderName
}

// 將資料夾內容加入列表
const submitUpload = () => {
  if (!newJob.value.name || uploadedFiles.value.length === 0) {
    alert('Please enter job name and upload files.')
    return
  }

  uploadProgress.value = 100
  jobs.value.push({
    job: newJob.value.name,
    time: new Date().toLocaleString(),
    name: detectedFolderName.value,
    series: uploadedFiles.value.length,
    status: 'Pending',
    files: [...uploadedFiles.value],
  })

  closeDialog()
}

// 刪除job+更新頁面
const deleteJob = (jobId) => {
  if (confirm(`Are you sure you want to delete job "${jobId}"?`)) {
    jobs.value = jobs.value.filter(job => job.job !== jobId)
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  }
}

// 新增指定job單一檔案
const selectFileForJob = (jobId) => {
  currentUploadJob.value = jobId
  fileInput.value?.click()
}
const handleSingleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file || !currentUploadJob.value) return

  const job = jobs.value.find(j => j.job === currentUploadJob.value)
  if (job) {
    job.files.push(file)
    job.series += 1
    job.status = 'Pending'
    alert(`File "${file.name}" uploaded to job "${job.job}". Status updated to Pending.`)
  }

  e.target.value = ''
  currentUploadJob.value = null
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
  background: #1e90ff;
  border-color: #1e90ff;
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
  border: none;
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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
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
.progress-bar {
  background: #555;
  height: 6px;
  border-radius: 4px;
  margin-bottom: 8px;
}
.progress {
  background: #1e90ff;
  height: 100%;
  border-radius: 4px;
}
.submit-btn {
  padding: 8px 16px;
  background: #1e90ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-indicator.green {
  background-color: #2ecc71;
}
.status-indicator.white {
  background-color: #ecf0f1;
}
.status-indicator.red {
  background-color: #e74c3c;
}
.status-header {
  width: 24px;
  padding: 0;
}
</style>
