建立 volume 儲存資料
```bash
docker volume create mysql-data
```

執行mysql docker 預設密碼和DB名稱
```bash
docker run -d -p 3306:3306 --name mysql -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=test mysql:8 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

## 安裝依賴

在專案根目錄下，使用 npm 安裝所需的依賴：

```bash
npm install
```

執行
```bash
node index.js
```

預設port 8081
若要更改port 可直接在index.js內做修改

## 20250804
1. 更新批次刪除後，批次下case同步刪除
2. 更新case儲存時所需帶入的資料
3. 更新API說明

## 20250807
1. 新增retry post to PACS、post AI(暫時未實作)
2. 調整批次新增時，根據files內資料進行case資料儲存
3. 批次刪除同步清除Dicom資料

## 20250808
1. 更新單筆case資料儲存

## 20250812
1. 新增socket通知，用來即時更新
2. 模擬accNumber資料
3. 單一新增後series數量更新
4. 模擬accNumber直接mapping情境，只有一筆病人資料則直接對應