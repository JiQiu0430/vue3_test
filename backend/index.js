/*
執行方式
下載node 版本16以上 
STEP1
npm init
STEP2
npm install --s express
STEP3
node index.js

成功啟動會有資訊
Server is running on http://localhost:8082


//使用axios呼叫API範例
儲存jobs範例
try {
    const postBody = {
    "job": "測試-001",
    "id": 1,
    "time": "2025/07/07-12: 00: 00",
    "name": "七月",
    "series": 5,
    "status": "Finish",
    "files": []
};
    const response = await axios.post('http://localhost:8082/jobs', {
        title: this.newItem,
        body: postBody,
        userId: 1,
    });
    this.postResponse = response.data;
} catch (error) {
    console.error('Error posting data:', error);
}

取得jobs範例
try {
    const response = await axios.get('http://localhost:8082/jobs');
    this.data = response.data;
} catch (error) {
    console.error('Error fetching data:', error);
}


儲存cases範例
try {
    const postBody = {
    "map_job_id": 2,   //對應job的id
    "caseName": "0001#A123456789#王小明#M#01",
    "series": 5,
    "upload": true,
    "mapping": "ABC001",
    "postAI": null,
    "postPACS": null,
    "status": "Pending"
};
    const response = await axios.post('http://localhost:8082/cases', {
        title: this.newItem,
        body: postBody,
        userId: 1,
    });
    this.postResponse = response.data;
} catch (error) {
    console.error('Error posting data:', error);
}

取得cases範例
try {
    const response = await axios.get('http://localhost:8082/cases');
    this.data = response.data;
} catch (error) {
    console.error('Error fetching data:', error);
}

取得Job對應cases範例
try {
    const response = await axios.get('http://localhost:8082/cases/1');
    this.data = response.data;
} catch (error) {
    console.error('Error fetching data:', error);
}

*/

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8082;  //更改Port

app.use(express.json());
app.use(cors());

// 只允許來自 http://localhost:8080 的請求
const corsOptions = {
  origin: 'http://localhost:8080',
};
app.use(cors(corsOptions));

let jobs = [];
let cases = [];

// [GET] /jobs 取得相關資料，暫時回應假資料
app.get('/jobs', (req, res) => {
    res.json(jobs);
});

// [POST] /jobs 儲存job資訊
app.post('/jobs', (req, res) => {
    const newItem = req.body;
    jobs.push(newItem);
    res.status(201).json(newItem);
});

// [DELETE] /jobs/:jobId 刪除指定的 job
app.delete('/jobs/:jobId', (req, res) => {
  const jobId = parseInt(req.params.jobId);  // 獲取 jobId
  const jobIndex = jobs.findIndex(job => job.id === jobId);  // 查找該 job 的索引

  if (jobIndex === -1) {
    // 如果找不到該 job，回傳 404 錯誤
    return res.status(404).json({ message: `Job with ID ${jobId} not found` });
  }

  // 刪除該 job
  jobs.splice(jobIndex, 1);

  // 返回刪除成功訊息
  res.status(200).json({ message: `Job with ID ${jobId} has been deleted` });
});

// [GET] /cases 取得所有cases資料，暫時回應假資料
app.get('/cases', async (req, res) => {
    res.status(200).json(cases);
});

// [GET] /cases 取得Mapping cases資料，暫時回應假資料
app.get('/cases/:id', async (req, res) => {
    const jobId = req.params.id;
    const map_cases = cases.filter(item => item.map_job_id == jobId);

    res.status(200).json(map_cases);
});

// [POST] /cases 儲存cases資料，暫時回應假資料
app.post('/cases', async (req, res) => {
    const newItem = req.body;
    cases.push(newItem);
    res.status(201).json(newItem);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});