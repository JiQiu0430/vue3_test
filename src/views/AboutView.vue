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
            <span>|</span>
            <span>
              <strong @click="filterErrorFiles"
              style="cursor: pointer; text-decoration: underline;"
              :style="{ color: errorFilesCount > 0 ? '#d36a5f' : '#bbb' }"
              >
              錯誤檔案數:
              </strong> 
              <span :style="{ color: errorFilesCount > 0 ? '#d36a5f' : '#bbb', textDecoration: 'underline' }">
                {{ errorFilesCount }}
              </span>
            </span>
          </div>
        </div>
        <div class="action-buttons">
          <button class="clear-filters-button" @click="clearFilters">取消篩選</button>
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
            <th>
              <span>檔案上傳</span>
              <img
                src="/filter.png"
                class="filter-icon"
                @click="toggleFilterMenu('upload')"
              />
              <div v-if="showFilterMenu.upload" class="filter-menu">
              <span
                @click="filterData('upload', 'all')"
                :class="{ selected: filterConditions.upload === 'all' }"
              >全部</span>
              <div class="divider"></div>
              <span
                @click="filterData('upload', 1)"
                :class="{ selected: filterConditions.upload === 1 }"
              >正常</span>
              <div class="divider"></div>
              <span
                @click="filterData('upload', 0)"
                :class="{ selected: filterConditions.upload === 0 }"
              >錯誤</span>
              </div>
            </th>
            <th>
              <span>對應工單號</span>
              <img
              src="/filter.png"
              class="filter-icon"
              @click="toggleFilterMenu('mapping')"
            />
            <div v-if="showFilterMenu.mapping" class="filter-menu">
              <span
              @click="filterData('mapping', 'all')"
              :class="{selected : filterConditions.mapping === 'all'}"
              >全部</span>
              <div class="divider"></div>
              <span
              @click="filterData('mapping', 'hasValue')"
              :class="{ selected : filterConditions.mapping === 'hasValue'}"
              >正常</span>
              <div class="divider"></div>
              <span
              @click="filterData('mapping', 'false')"
              :class="{ selected : filterConditions.mapping === 'false'}"
              >錯誤</span>
              <div class="divider"></div>
              <span
              @click="filterData('mapping', null)"
              :class="{ selected : filterConditions.mapping === null}"
              >沒有工單號</span>
              <div class="divider"></div>
              <span
              @click="filterData('mapping', 'sameId')"
              :class="{ selected : filterConditions.mapping === 'sameId'}"
              >相同身份證字號</span>
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
                <span
                @click="filterData('pacs', 'all')"
                :class="{ selected: filterConditions.pacs === 'all' }"
                >全部</span>
                <div class="divider"></div>
                <span
                @click="filterData('pacs', 2)"
                :class="{ selected: filterConditions.pacs === 2 }"
                >正常傳送</span>
                <div class="divider"></div>
                <span
                @click="filterData('pacs', 0)"
                :class="{ selected: filterConditions.pacs === 0 }"
                >錯誤</span>
                <div class="divider"></div>
                <span
                @click="filterData('pacs', 1)"
                :class="{ selected: filterConditions.pacs === 1 }"
                >尚未傳送</span>
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
                <span
                @click="filterData('ai', 'all')"
                :class="{ selected: filterConditions.ai === 'all' }"
                >全部</span>
                <div class="divider"></div>
                <span
                @click="filterData('ai', 2)"
                :class="{ selected: filterConditions.ai === 2 }"
                >正常傳送</span>
                <div class="divider"></div>
                <span
                @click="filterData('ai', 0)"
                :class="{ selected: filterConditions.ai === 0 }"
                >錯誤</span>
                <div class="divider"></div>
                <span
                @click="filterData('ai', 1)"
                :class="{ selected: filterConditions.ai === 1 }"
                >尚未傳送</span>
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
            <td v-html="renderUpload(row.upload)"></td>
            <td :style="{ color: getTextColor(row) }">
              <!-- 圓圈選擇 -->
              <div class="circle-select" v-if="isSameId(row)">
                <input
                  type="radio"
                  :name="`pick-${row.id}`"
                  :value="row.serialNumber"
                  @click="handleRadioChange(row, $event)"
                  v-model="selectedMapping[row.id]"
                />
              </div>
              <!-- 顯示查看 DICOM 按鈕 -->
              <button
                v-if="isSameId(row)"
                class="icon-button dicom-view"
                @click="showDicomViewer(row)"
              >
                <img src="/eye.png" class="action-icon" title="點擊查看此檔案Dicom" />
              </button>
              <span v-html="renderMappingCell(row)"></span>
            </td>
            <td v-html="renderPost(row.postPACS)"></td>
            <td v-html="renderPost(row.postAI)"></td>
            <td class="retry-cell">
              <div v-if="shouldShowRetry(row)" class="retry-buttons">
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
          <h2>DICOM 影像 | 流水號：{{ selectedDicomSerial || 'N/A' }}</h2>
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
          <label for="itemsPerPage">數量顯示：</label>
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
import axios from 'axios'
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

const caseData = ref([])

const fetchCaseData = async () => {
  try {
    const response = await axios.get(`http://localhost:8081/tourCarCase/${jobInfo.value.job}`)
    console.log('7:', response);

    if (Array.isArray(response.data.result)) {
      caseData.value = response.data.result.map(item => {
        console.log(item);
      const parsedData = parseCaseName(item.caseName);
      return {
        ...item,
        dbId: item.id,
        patientId: item.patientId,
        ...parsedData,
      };
    })
    originalCaseData.value = [...caseData.value];
    initSelectionFromDB();
    } else {
      console.error('返回的資料不是陣列:', response.data.result);
      caseData.value = [];
    }
  } catch (error) {
    console.error('無法取得資料', error);
    caseData.value = [];
  }
}

onMounted(() => {
  fetchCaseData()
})

const errorFilesCount = computed(() => {
  return caseData.value.filter(row => row.upload === 0 || row.postAI === 0 || row.postPACS === 0 || hasNoMappingAndNoCandidate(row)).length;
});

const errorFilterEnabled = ref(false);
// 篩選錯誤檔案
const filterErrorFiles = () => {
  errorFilterEnabled.value = true;
  filterConditions.value.upload = 0;
  filterConditions.value.ai = 0;
  filterConditions.value.pacs = 0;
  filterConditions.value.mapping = 'false';
  showFilterMenu.value = { upload: false, ai: false, pacs: false, mapping: false };
  page.value = 1;
};

// 清除篩選條件
const clearFilters = () => {
  filterConditions.value = { ai: 'all', pacs: 'all', mapping: 'all', upload: 'all' };
  errorFilterEnabled.value = false;
  page.value = 1;
  showFilterMenu.value = { ai: false, pacs: false, mapping: false, upload: false };
};

// 解析 caseName
const parseCaseName = (caseName) => {
  console.log(caseName)
  const fileName = caseName.replace('.dcm', '');
  const fileParts = fileName.split('#');
  console.log(fileParts)
  if (fileParts) {
    const [serialNumber, id, name, gender, caseNumber] = fileParts;
    return { serialNumber, id, name, gender, caseNumber };
  }
  return {};
};

// // 解析資料並加入到 caseData 中
// caseData.value = caseData.value.map(item => {
//   const parsedData = parseCaseName(item.caseName);
//   return {
//     ...item,
//     ...parsedData,
//   };
// })

// 搜尋框
const searchQuery = ref('')
const filteredData = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return caseData.value;
  return caseData.value.filter(item => {
    const sn   = String(item?.serialNumber ?? '').toLowerCase();
    const id   = String(item?.id ?? '').toLowerCase();
    const name = String(item?.name ?? '').toLowerCase();
    return sn.includes(q) || id.includes(q) || name.includes(q);
  });
});

// 判斷是否為相同身份證字號
const selectedMapping = ref({})
const isSameId = (row) => {
  return caseData.value.filter(item => item.id === row.id).length > 1;
}
const isBadMapping = (m) => (m == null || m === '');
const isGroupCommitted = (idCard) => {
  return caseData.value
    .filter(r => r.id === idCard)
    .some(r => !isBadMapping(r.mapping));
};
const initSelectionFromDB = () => {
  selectedMapping.value = {};
  const groups = new Map();
  for (const row of caseData.value) {
    if (!groups.has(row.id)) groups.set(row.id, []);
    groups.get(row.id).push(row);
  }

  groups.forEach((rows, idCard) => {
    if (!isGroupCommitted(idCard)) return;

    let chosen = rows.find(r => !isBadMapping(r.mapping) && String(r.mapping) === String(r.accNumbers));
    if (!chosen) chosen = rows.find(r => !isBadMapping(r.mapping));

    if (chosen && chosen.serialNumber != null) {
      selectedMapping.value[idCard] = chosen.serialNumber;
    }
  });
};

const escapeHtml = (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hasNoMappingAndNoCandidate = (row) =>
  (row?.mapping == null || row.mapping === '') &&
  (row?.accNumbers == null || row.accNumbers === '');
const renderMappingCell = (row) => {
  if (isSameId(row) && !isGroupCommitted(row.id)) {
    const txt = row.accNumbers ?? '--';
    return `<span class="gray-cross">${escapeHtml(txt)}</span>`;
  }
  if (hasNoMappingAndNoCandidate(row)) {
    return '<span class="red-cross">✘</span>';
  }
  if (row.mapping == null || row.mapping === '') {
    return '<span class="gray-cross">--</span>';
  }
  return escapeHtml(String(row.mapping));
};

const updateMappingSingle = async (row, newMapping) => {
  const url = `http://localhost:8081/tourCarCase`;
  const payload = {
    caseName: row.caseName,
    job: jobInfo.value.job,
    mapping: (newMapping ?? null),
    postPACS: row.postPACS,
    postAI: row.postAI
  };

  const res = await axios.put(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  const ok = (res?.status === 200) && (res?.data?.codeStatus === 200);
  if (!ok) {
    throw new Error(res?.data?.message || `更新失敗 (status=${res?.status})`);
  }
  return res.data?.result;
};

// 當選擇圓圈時，顯示確認提示
const handleRadioChange = async (row, event) => {
  const ok = confirm(`您確定選擇 ${row.serialNumber}（身分證：${row.id}）嗎？`);
  if (!ok) {
    event.preventDefault();
    return;
  }
  const group = caseData.value.filter(r => r.id === row.id);
  const prevSelected = selectedMapping.value[row.id];
  const chosenMapping = row.accNumbers ?? null;
  const snapshots = group.map(g => ({ g, prev: g.mapping }));
  group.forEach(g => {
    g.mapping = (g.caseName === row.caseName) ? chosenMapping : null;
  });

  try {
    await Promise.all(group.map(g => {
      const target = (g.caseName === row.caseName) ? chosenMapping : null;
      return updateMappingSingle(g, target);
    }));
    selectedMapping.value[row.id] = row.serialNumber;
  } catch (e) {
    alert('更新失敗，已還原。');
    snapshots.forEach(({ g, prev }) => { g.mapping = prev; });
    selectedMapping.value[row.id] = prevSelected;
    event.preventDefault();
  }
};

// 彈出 DICOM 視窗
const dicomVisible = ref(false)
const dicomCanvas = ref(null)
const selectedDicomSerial = ref(null)
const selectedStudyUID = ref(null)
const selectedSeriesUID = ref(null)
const selectedSOPInstanceUID = ref(null)
const selectedInstanceUUID = ref(null)
const showDicomViewer = (row) => {
  selectedDicomSerial.value = row?.serialNumber || null
  selectedStudyUID.value = row?.studyId || null
  selectedSeriesUID.value = row?.seriesId || null
  selectedSOPInstanceUID.value = row?.instanceUID || row?.instancesId || null
  selectedInstanceUUID.value = row?.instancesUUId || null

  dicomVisible.value = true
  nextTick(() => {
    loadDicomFromOrthanc()
  })
}
const closeDicomViewer = () => {
  dicomVisible.value = false
  selectedDicomSerial.value = null
  selectedStudyUID.value = null
  selectedSeriesUID.value = null
  selectedSOPInstanceUID.value = null
  selectedInstanceUUID.value = null
}

onMounted(() => {
  // 配置 cornerstoneWADOImageLoader，並啟用 Web Workers
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone
  cornerstoneWADOImageLoader.configure({
    useWebWorkers: true,
    beforeSend: (xhr) => {
      xhr.withCredentials = true
      const token = btoa(`orthanc:orthanc`)
      xhr.setRequestHeader('Authorization', `Basic ${token}`)
    },
  })
})

// 載入 DICOM 檔案
const loadDicomFromOrthanc = async () => {
  const element = dicomCanvas.value
  if (!element) return
  cornerstone.enable(element)

  let imageId = null

  if (selectedStudyUID.value && selectedSeriesUID.value && selectedSOPInstanceUID.value) {
    const wadoPath =
      `/wado?requestType=WADO` +
      `&studyUID=${encodeURIComponent(selectedStudyUID.value)}` +
      `&seriesUID=${encodeURIComponent(selectedSeriesUID.value)}` +
      `&objectUID=${encodeURIComponent(selectedSOPInstanceUID.value)}`
    imageId = `wadouri:${wadoPath}`
  }

  else if (selectedInstanceUUID.value) {
    const filePath = `/instances/${encodeURIComponent(selectedInstanceUUID.value)}/file`
    imageId = `wadouri:${filePath}`
  }

  if (!imageId) {
    console.error('缺少可用識別（DICOM UIDs 或 Orthanc UUID），無法載入 DICOM')
    return
  }

  try {
    const image = await cornerstone.loadImage(imageId)
    cornerstone.displayImage(element, image)
  } catch (err) {
    console.error('載入 Orthanc 影像失敗：', err)
  }
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
    return '/arrowDown.png';
  } else if (sortState.value[field] === 'desc') {
    return '/arrowUp.png';
  } else {
    return '/arrowBoth.png';
  }
};
const toggleSort = (field) => {
  if (sortState.value[field] === 'none') {
    sortState.value[field] = 'asc';
  } else if (sortState.value[field] === 'asc') {
    sortState.value[field] = 'desc';
  } else {
    sortState.value[field] = 'none';
    caseData.value = [...originalCaseData.value];
  }
  sortData(field, sortState.value[field]);
};

const sortData = (field, order) => {
  if (order === 'asc') {
    caseData.value.sort((a, b) => {
      if (field === 'serialNumber') {
        return a.caseName.localeCompare(b.caseName);
      }
      return a.id.localeCompare(b.id);
    });
  } else if (order === 'desc') {
    caseData.value.sort((a, b) => {
      if (field === 'serialNumber') {
        return b.caseName.localeCompare(a.caseName);
      }
      return b.id.localeCompare(a.id);
    });
  }
};

// 篩選功能
const showFilterMenu = ref({ ai: false, pacs: false, mapping: false, upload: false });
const filterConditions = ref({ ai: 'all', pacs: 'all', mapping: 'all', upload: 'all' });

const filterData = (field, value) => {
  filterConditions.value[field] = value;
  showFilterMenu.value[field] = false;
};

// 篩選的結果
const paginatedData = computed(() => {
  let data = filteredData.value;

  if (errorFilterEnabled.value) {
    data = data.filter(item => 
      Number(item.upload) === 0 || Number(item.postAI) === 0 || Number(item.postPACS) === 0 || hasNoMappingAndNoCandidate(item)
    );
  } else{
    if (filterConditions.value.upload !== 'all') {
      data = data.filter(item => Number(item.upload) === Number(filterConditions.value.upload));
    }
    if (filterConditions.value.ai !== 'all') {
      data = data.filter(item => item.postAI === filterConditions.value.ai);
    }
    if (filterConditions.value.pacs !== 'all') {
      data = data.filter(item => item.postPACS === filterConditions.value.pacs);
    }

    if (filterConditions.value.mapping === 'false') {
      data = data.filter(item => hasNoMappingAndNoCandidate(item));
    } else if (filterConditions.value.mapping === 'hasValue') {
      data = data.filter(item => item.mapping != null && item.mapping !== '');
    } else if (filterConditions.value.mapping === null) {
      data = data.filter(item => item.mapping == null || item.mapping === '');
    } else if (filterConditions.value.mapping === 'sameId') {
      data = data.filter(item => caseData.value.filter(sub => sub.id === item.id).length > 1);
    }
  }
  if (filterConditions.value.mapping === 'all') {
    // 保持篩選後的資料
  }
  return data.slice((page.value - 1) * pageSize.value, page.value * pageSize.value);
});

const toggleFilterMenu = (field) => {
  showFilterMenu.value[field] = !showFilterMenu.value[field]
}

const retryAll = async () => {
  const candidates = caseData.value.filter(row =>
    mappingIsX(row) || pacsIsX(row) || aiIsX(row)
  );
  if (candidates.length === 0) {
    alert('沒有需要重試的檔案！');
    return;
  }
  if (!confirm(`共有 ${candidates.length} 筆有錯誤，確定要重試嗎？`)) return;

  const results = await Promise.allSettled(candidates.map(row => stagedRetry(row)));
  const failed = results.filter(r => r.status === 'rejected').length;

  // 跑完後若沒有 socket 即時更新，抓一次最新資料
  try { await fetchCaseData(); } catch { /* 忽略 */ }

  if (failed === 0) {
    alert('全部重試完成');
  } else {
    alert(`重試完成，其中 ${failed} 筆失敗`);
  }
};

// 導出資料
const toMark01 = (val) => Number(val) === 1 ? 'V' : 'X';
const toMark012 = (val) => {
  const n = Number(val);
  if (Number.isNaN(n)) return '--';
  if (n === 0) return 'X';
  if (n === 1) return '--';
  if (n === 2) return 'V';
  return '--';
};

const formatMappingForCSV = (row) => {
  if (hasNoMappingAndNoCandidate(row)) return 'X';
  if (row.mapping == null || row.mapping === '') return '--';
  return String(row.mapping);
};
const exportCSV = () => {
  const headers = ['流水號', '身份證字號', '姓名', '檔案上傳', '對應工單號', '傳給AI', '傳給PACS'];

  const rows = caseData.value.map(row => [
    row.serialNumber ?? '',
    row.id ?? '',
    row.name ?? '',
    toMark01(row.upload),
    formatMappingForCSV(row),
    toMark012(row.postAI),
    toMark012(row.postPACS),
  ]);

  const csvContent = [headers, ...rows]
    .map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'case_data.csv');
  link.click();
};

// 頁數計算
const page = ref(1)
const pageSize = ref(10);

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value))

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
const renderUpload = (val) => {
  const n = Number(val);
  if (n === 1) return '<span class="gray-cross">✔</span>';
  return '<span class="red-cross">✘</span>';
};

// AI / PACS
const renderPost = (val) => {
  const n = Number(val);
  if (n === 2) return '<span class="gray-cross">✔</span>';
  if (n === 1) return '<span class="gray-cross">--</span>';
  if (n === 0) return '<span class="red-cross">✘</span>';
  return '<span class="gray-cross">--</span>';
};

const getChosenSerialForId = (idCard) => {
  const picked = selectedMapping.value?.[idCard];
  if (picked) return picked;
  const group = caseData.value.filter(r => r.id === idCard);
  let chosen = group.find(r => !isBadMapping(r.mapping) && String(r.mapping) === String(r.accNumbers));
  if (!chosen) chosen = group.find(r => !isBadMapping(r.mapping));
  return chosen?.serialNumber ?? null;
};

const isExplicitMappingFail = (row) => hasNoMappingAndNoCandidate(row);

const getTextColor = (row) => {
  if (isSameId(row) && !isGroupCommitted(row.id) && !selectedMapping.value[row.id]) {
    return '#FFFF00';
  }
  if (isSameId(row) && isGroupCommitted(row.id)) {
    const chosenSerial = getChosenSerialForId(row.id);
    if (chosenSerial && row.serialNumber !== chosenSerial) return '#6b7280';
    return '#ffffff';
  }
  let color = '#ffffff';

  if (
    Number(row.upload) === 0 ||
    Number(row.postAI) === 0 ||
    Number(row.postPACS) === 0 ||
    isExplicitMappingFail(row)
  ) {
    color = '#e74c3c';
  }
  return color;
};

const shouldShowRetry = (row) => {
  if (isSameId(row)) {
    const chosenSerial = getChosenSerialForId(row.id);
    if (!chosenSerial) return false;
    return row.serialNumber === chosenSerial;
  }
  return true;
};

// 當點擊 "重新嘗試" 時顯示確認提示
const handleRetry = async (row, event) => { 
  const isConfirmed = confirm(
    `您要對流水號 ${row.serialNumber} 執行重試嗎？\n`
  ); 
  if (!isConfirmed) { 
    event?.preventDefault?.(); 
    return; 
  } 
  try { 
    await stagedRetry(row);
    alert('重試完成');
  } catch (e) { 
    alert(`重試失敗：${e.message}`); 
    event?.preventDefault?.();
  } 
};

// 判斷是否為叉
const mappingIsX = (row) => hasNoMappingAndNoCandidate(row);
const pacsIsX    = (row) => Number(row.postPACS) === 0;
const aiIsX      = (row) => Number(row.postAI)   === 0;

// 需求payload
const requestMapping = async (row) => {
  if (!row.patientId) throw new Error('缺少 DICOM patientId');
  const payload = {
    job: jobInfo.value.job,
    patientId: row.patientId,
    caseName: row.caseName,
  };
  const res = await axios.post('http://localhost:8081/case/mapping', payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (res?.status !== 200 || (res?.data?.codeStatus && res.data.codeStatus !== 200)) {
    throw new Error(res?.data?.message || 'mapping 更新失敗');
  }
};

// 重試
const retryPACS = async (row) => {
  const caseName = encodeURIComponent(row.caseName);
  const res = await axios.post(`http://localhost:8081/tourCarCase/${caseName}/retryPACS`);
  const ok = (res?.status === 200) && (res?.data?.codeStatus === 200);
  if (!ok) throw new Error(res?.data?.message || 'PACS 重試失敗');
  row.postPACS = 2;
};

const retryAI = async (row) => {
  const caseName = encodeURIComponent(row.caseName);
  const res = await axios.post(`http://localhost:8081/tourCarCase/${caseName}/retryAI`);
  const ok = (res?.status === 200) && (res?.data?.codeStatus === 200);
  if (!ok) throw new Error(res?.data?.message || 'AI 重試失敗');
  row.postAI = 2;
};

const stagedRetry = async (row) => {
  if (mappingIsX(row)) {
    await requestMapping(row);
  }
  if (Number(row.postPACS) !== 2) {
    await retryPACS(row);
  }
  if (Number(row.postAI) !== 2) {
    await retryAI(row);
  }
  await fetchCaseData();
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
.clear-filters-button {
  background: #2c2c2c;
  color: #ffffff;
  border: 1px solid #ffffff;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.clear-filters-button:hover {
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
.selected {
  color: #34B539;
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

/* 翻頁 */
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