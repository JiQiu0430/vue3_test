"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TourCarController = void 0;
const typeorm_1 = require("typeorm");
const SysLogs_1 = require("../entity/SysLogs");
const TourCar_1 = require("../entity/TourCar");
const TourCarCase_1 = require("../entity/TourCarCase");
const TourCarMapping_1 = require("../entity/TourCarMapping");
// import { rabbit } from "../util/rabbitMQ";
const DICOMRecords_1 = require("../entity/DICOMRecords");
const crypto_1 = require("../util/crypto");
const logger = require("../util/logger");
const _request = require('request');
const config_data = require('../global.json');
class TourCarController {
    constructor() {
        this.aseutil = new crypto_1.aseutil();
        // private rabbits = new rabbit();
        this.orm_car = (0, typeorm_1.getRepository)(TourCar_1.TourCar);
        this.orm_case = (0, typeorm_1.getRepository)(TourCarCase_1.TourCarCase);
        this.orm_car_mapping = (0, typeorm_1.getRepository)(TourCarMapping_1.TourCarMapping);
        this.orm_Log = (0, typeorm_1.getRepository)(SysLogs_1.SysLog);
        this.orm_recs = (0, typeorm_1.getRepository)(DICOMRecords_1.DICOMRecords);
    }
    /** 取得TourCar結果 ([httpget] /tourCar) */
    getTourCar(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const getTourCarResult = yield this.orm_car.find();
            for (let i = 0; i < getTourCarResult.length; i++) {
                let _batchStatus = 'Finish';
                const jobName = getTourCarResult[i].job;
                const _allCase = yield this.orm_case.find({ where: { map_job: jobName } });
                for (let j = 0; j < _allCase.length; j++) {
                    const samePatient = yield this.orm_case.find({ where: { patientId: _allCase[j].patientId, map_job: jobName } });
                    let _case_upload_status = _allCase[j].upload;
                    let _case_pacs_status = _allCase[j].postPACS;
                    let _case_ai_status = _allCase[j].postAI;
                    if (samePatient.length > 1) {
                        for (let p = 0; p < samePatient.length; p++) {
                            if ((_a = samePatient[p]) === null || _a === void 0 ? void 0 : _a.mapping) {
                                _case_pacs_status = samePatient[p].postPACS;
                                _case_ai_status = samePatient[p].postAI;
                            }
                        }
                    }
                    if (_case_upload_status == 0 || _case_pacs_status == 0 || _case_ai_status == 0) {
                        _batchStatus = "Error";
                    }
                    else if ((_case_pacs_status == 1 || _case_ai_status == 1) && _batchStatus != "Error") {
                        _batchStatus = "Pending";
                    }
                }
                getTourCarResult[i].status = _batchStatus;
            }
            return { codeStatus: 200, result: getTourCarResult };
        });
    }
    /** 儲存TourCar資訊 ([httppost] /tourCar) */
    saveTourCar(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date(Date.now());
            let _this = this;
            const _body = request.body;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Add new TourCar Record job: ${_body.job}, ${_body.name}`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    try {
                        const _obj = new TourCar_1.TourCar();
                        const getTourCarRec = yield _this.orm_car.findOne({ where: { job: _body.job } });
                        if (!getTourCarRec) {
                            _obj.job = _body.job;
                            _obj.name = _body.name;
                            _obj.series = _body.series;
                            _obj.time = new Date(_body.time);
                            yield _this.orm_car.save(_obj);
                            const caseFiles = _body.files;
                            //測試 先模擬如果重複記錄下來 後面用來判定是否直接mapping
                            let duplicates = {};
                            caseFiles.forEach(item => {
                                var _a;
                                let _id = item.caseName.split("#")[1];
                                if (!((_a = duplicates[_id]) === null || _a === void 0 ? void 0 : _a.length)) {
                                    duplicates[_id] = [];
                                    duplicates[_id].push(item.caseName);
                                }
                                else {
                                    duplicates[_id].push(item.caseName);
                                }
                            });
                            for (let i = 0; i < caseFiles.length; i++) {
                                const getTourCarCaseRec = yield _this.orm_case.findOne({ where: { caseName: caseFiles[i].caseName } });
                                if (!getTourCarCaseRec) {
                                    //TODO get His資訊放到Minipacs回傳Dicom，此處用於測試選擇accNumber accNum需要選擇則要status顯示需人工介入
                                    const getTestMapping = yield _this.orm_case.findOne({ where: { patientId: (_a = caseFiles[i]) === null || _a === void 0 ? void 0 : _a.patientId, map_job: _body === null || _body === void 0 ? void 0 : _body.job } });
                                    //身分證號
                                    let _id = caseFiles[i].caseName.split("#")[1];
                                    //假的accNumber資料產生
                                    const testData = _this.testMappingData(_id);
                                    ;
                                    if (!getTestMapping) {
                                        const _mapping = new TourCarMapping_1.TourCarMapping();
                                        _mapping.patientId = (_b = caseFiles[i]) === null || _b === void 0 ? void 0 : _b.patientId;
                                        _mapping.accNumbers = testData.accNum;
                                        _mapping.map_job = _body === null || _body === void 0 ? void 0 : _body.job;
                                        _mapping.mapping_data = JSON.stringify(testData);
                                        yield _this.saveRecord(TourCarMapping_1.TourCarMapping, _mapping);
                                    }
                                    const _obj = new TourCarCase_1.TourCarCase();
                                    //判斷身分證沒有重複 直接mapping accNumber
                                    if (duplicates[_id].length == 1) {
                                        _obj.mapping = testData.accNum;
                                    }
                                    let instancesUUID = "";
                                    const series_data = _this.aseutil.sha1Hash(((_c = caseFiles[i]) === null || _c === void 0 ? void 0 : _c.patientId) + "|" + ((_d = caseFiles[i]) === null || _d === void 0 ? void 0 : _d.studyId) + "|" + ((_e = caseFiles[i]) === null || _e === void 0 ? void 0 : _e.seriesId) + "|" + ((_f = caseFiles[i]) === null || _f === void 0 ? void 0 : _f.instancesId));
                                    for (let i = 0; i < 5; i++) {
                                        instancesUUID += series_data.substring(i * 8, (i + 1) * 8);
                                        if (i !== 4) {
                                            instancesUUID += "-";
                                        }
                                    }
                                    _obj.map_job = _body === null || _body === void 0 ? void 0 : _body.job;
                                    _obj.caseName = (_g = caseFiles[i]) === null || _g === void 0 ? void 0 : _g.caseName;
                                    _obj.patientId = (_h = caseFiles[i]) === null || _h === void 0 ? void 0 : _h.patientId;
                                    _obj.studyId = (_j = caseFiles[i]) === null || _j === void 0 ? void 0 : _j.studyId;
                                    _obj.seriesId = (_k = caseFiles[i]) === null || _k === void 0 ? void 0 : _k.seriesId;
                                    _obj.instancesUUId = instancesUUID;
                                    _obj.upload = ((_l = caseFiles[i]) === null || _l === void 0 ? void 0 : _l.upload) ? 1 : 0;
                                    _obj.status = "Pending";
                                    yield _this.saveRecord(TourCarCase_1.TourCarCase, _obj);
                                }
                            }
                        }
                        else {
                            reject({ codeStatus: 404, message: `duplicate job name.` });
                        }
                        yield _this.orm_Log.save(LogMessage);
                        resolve({ codeStatus: 200, message: LogMessage.content, result: _obj });
                    }
                    catch (err) {
                        logger.error(`TourCar Add catch error: ${err}.`);
                        LogMessage.content = `Add new TourCar Record fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    /** 刪除TourCar資訊 ([httpdelete] /tourCar) */
    deleteTourCar(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date(Date.now());
            let _this = this;
            const _body = request.body;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Delete new TourCar Record job: ${_body.job}.`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
                    try {
                        const getTourCarRec = yield _this.orm_car.findOne({ where: { job: _body.job } });
                        //TODO 刪除Orthanc上的Dicom 先取得UUID
                        const findAllCase = yield _this.orm_case.find({ where: { map_job: _body.job } });
                        const allDeleteUUID = [];
                        for (let i = 0; i < findAllCase.length; i++) {
                            let series_result = "";
                            const series_data = _this.aseutil.sha1Hash(((_a = findAllCase[i]) === null || _a === void 0 ? void 0 : _a.patientId) + "|" + ((_b = findAllCase[i]) === null || _b === void 0 ? void 0 : _b.studyId) + "|" + ((_c = findAllCase[i]) === null || _c === void 0 ? void 0 : _c.seriesId));
                            for (let i = 0; i < 5; i++) {
                                series_result += series_data.substring(i * 8, (i + 1) * 8);
                                if (i !== 4) {
                                    series_result += "-";
                                }
                            }
                            allDeleteUUID.push(series_result);
                        }
                        //刪除所有case的dicom
                        _this.deleteItemsFromOrthanc(allDeleteUUID);
                        yield _this.orm_case
                            .createQueryBuilder()
                            .delete()
                            .from(TourCarCase_1.TourCarCase)
                            .where("map_job = :mapJob", { mapJob: _body.job })
                            .execute();
                        if (!getTourCarRec) {
                            reject({ codeStatus: 404, message: `Delete TourCar Record job: ${_body.job} fail.` });
                        }
                        else {
                            yield _this.orm_car.remove(getTourCarRec);
                        }
                        //測試資料清空(原先clear全部清空的短解影響其他批次資料)
                        yield _this.orm_car_mapping
                            .createQueryBuilder()
                            .delete()
                            .from(TourCarMapping_1.TourCarMapping)
                            .where("map_job = :mapJob", { mapJob: _body.job })
                            .execute();
                        yield _this.orm_Log.save(LogMessage);
                        resolve({ codeStatus: 200, message: LogMessage.content });
                    }
                    catch (err) {
                        logger.error(`TourCar Delete catch error: ${err}.`);
                        LogMessage.content = `Delete TourCar Record fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    deleteItemsFromOrthanc(list) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            for (const item of list) {
                try {
                    const DeleteStudy_str = `${(_a = config_data === null || config_data === void 0 ? void 0 : config_data.global) === null || _a === void 0 ? void 0 : _a.orthanc_dicom_web_api}/series/${item}`;
                    yield this.doDeleteRequest(DeleteStudy_str);
                    logger.info(`Delete UUID: ${item}`);
                }
                catch (error) {
                    logger.error(`Delete dicom failed UUID: ${item}. errorMessage: ${error}`);
                }
            }
        });
    }
    doDeleteRequest(url) {
        return new Promise(function (resolve, reject) {
            _request({
                method: 'DELETE',
                uri: url,
                headers: { 'Authorization': 'Basic b3J0aGFuYzpvcnRoYW5j' },
                rejectUnauthorized: false,
                requestCert: false,
                agent: false
            }, function (error, res, body) {
                if (!error && res.statusCode == 200) {
                    resolve(body);
                }
                else {
                    reject(error);
                }
            });
        });
    }
    /** 取得getTourCar結果 ([httpget] /tourCarCase/:job) */
    getTourCarCase(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const param_job = decodeURIComponent(request.params.job);
            const cases = yield this.orm_case
                .createQueryBuilder('case')
                .leftJoinAndSelect(TourCarMapping_1.TourCarMapping, 'mapping', 'case.patientId = mapping.patientId AND case.map_job = mapping.map_job')
                .where('case.map_job = :mapJob', { mapJob: param_job })
                .select([
                'case.id AS id',
                'case.map_job AS map_job',
                'case.patientId AS patientId',
                'case.studyId AS studyId',
                'case.seriesId AS seriesId',
                'case.instancesUUId AS instancesUUId',
                'case.caseName AS caseName',
                'case.status AS status',
                'case.upload AS upload',
                'case.mapping AS mapping',
                'case.postAI AS postAI',
                'case.postPACS AS postPACS',
                'mapping.accNumbers AS accNumbers',
            ])
                .getRawMany();
            return { codeStatus: 200, result: cases };
        });
    }
    /** 儲存單一saveTourCarCase資訊 ([httppost] /tourCarCase/:job) */
    saveTourCarCase(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const param_job = decodeURIComponent(request.params.job);
            const now = new Date(Date.now());
            let _this = this;
            const _body = request.body;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Add new TourCarCase Record job: ${param_job},caseName: ${_body.caseName}`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const getTourCarRec = yield _this.orm_car.findOne({ where: { job: param_job } });
                        const getTourCarCaseRec = yield _this.orm_case.findOne({ where: { caseName: _body.caseName } });
                        if (getTourCarRec) {
                            if (!getTourCarCaseRec) {
                                //TODO get His資訊放到Minipacs回傳Dicom，此處用於測試選擇accNumber accNum需要選擇則要status顯示需人工介入
                                const getTestMapping = yield _this.orm_case.findOne({ where: { patientId: _body.patientId, map_job: param_job } });
                                //身分證號
                                let _id = _body.caseName.split("#")[1];
                                const testData = _this.testMappingData(_id);
                                let isMapping = false;
                                if (!getTestMapping) {
                                    isMapping = true;
                                    const _mapping = new TourCarMapping_1.TourCarMapping();
                                    _mapping.patientId = _body === null || _body === void 0 ? void 0 : _body.patientId;
                                    _mapping.accNumbers = testData.accNum;
                                    _mapping.map_job = param_job;
                                    _mapping.mapping_data = JSON.stringify(testData);
                                    yield _this.saveRecord(TourCarMapping_1.TourCarMapping, _mapping);
                                }
                                getTourCarRec.series = getTourCarRec.series + 1;
                                yield _this.saveRecord(TourCar_1.TourCar, getTourCarRec);
                                let instancesUUID = "";
                                const series_data = _this.aseutil.sha1Hash((_body === null || _body === void 0 ? void 0 : _body.patientId) + "|" + (_body === null || _body === void 0 ? void 0 : _body.studyId) + "|" + (_body === null || _body === void 0 ? void 0 : _body.seriesId) + "|" + (_body === null || _body === void 0 ? void 0 : _body.instancesId));
                                for (let i = 0; i < 5; i++) {
                                    instancesUUID += series_data.substring(i * 8, (i + 1) * 8);
                                    if (i !== 4) {
                                        instancesUUID += "-";
                                    }
                                }
                                const _obj = new TourCarCase_1.TourCarCase();
                                if (isMapping) {
                                    _obj.mapping = testData.accNum;
                                }
                                _obj.map_job = param_job;
                                _obj.caseName = _body === null || _body === void 0 ? void 0 : _body.caseName;
                                _obj.patientId = _body === null || _body === void 0 ? void 0 : _body.patientId;
                                _obj.studyId = _body === null || _body === void 0 ? void 0 : _body.studyId;
                                _obj.seriesId = _body === null || _body === void 0 ? void 0 : _body.seriesId;
                                _obj.instancesUUId = instancesUUID;
                                _obj.upload = (_body === null || _body === void 0 ? void 0 : _body.upload) ? 1 : 0;
                                _obj.status = "Pending";
                                yield _this.saveRecord(TourCarCase_1.TourCarCase, _obj);
                            }
                            else {
                                reject({ codeStatus: 404, message: `duplicate caseName.` });
                            }
                        }
                        else {
                            reject({ codeStatus: 404, message: `Not found this job.` });
                        }
                        yield _this.saveRecord(SysLogs_1.SysLog, LogMessage);
                        resolve({ codeStatus: 200, message: LogMessage.content });
                    }
                    catch (err) {
                        logger.error(`TourCarCase Add catch error: ${err}.`);
                        LogMessage.content = `Add new TourCarCase Record fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    /** 取得getMappingTable結果 ([httpget] /tourCarMapping/:case) */
    getTourCarCaseMapping(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const param_case = decodeURIComponent(request.params.job);
            const getTourCarCaseMappingResult = yield this.orm_car_mapping.find({ where: { patientId: param_case } });
            return { codeStatus: 200, result: getTourCarCaseMappingResult };
        });
    }
    /** 刪除mapping資料 ([httpdelete] /tourCarMapping) */
    deleteTourCarCaseMapping(request, response, next, io) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const param_case = (_a = request.body) === null || _a === void 0 ? void 0 : _a.caseName;
            const getTourCarCaseRec = yield this.orm_case.findOne({ where: { caseName: param_case } });
            const getTourCarCaseMappingResult = yield this.orm_car_mapping.findOne({ where: { patientId: getTourCarCaseRec.patientId, map_job: getTourCarCaseRec.map_job } });
            getTourCarCaseRec.mapping = null;
            yield this.orm_case.save(getTourCarCaseRec);
            yield this.orm_car_mapping.remove(getTourCarCaseMappingResult);
            return { codeStatus: 200, result: "Delete" };
        });
    }
    /** 重新取得資料 ([httppost] /case/mapping) */
    reTourCarCaseMapping(request, response, next, io) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const param_case = (_a = request.body) === null || _a === void 0 ? void 0 : _a.caseName;
            const _job = (_b = request.body) === null || _b === void 0 ? void 0 : _b.job;
            const _patientId = (_c = request.body) === null || _c === void 0 ? void 0 : _c.patientId;
            const getTourCarCaseRec = yield this.orm_case.find({ where: { patientId: _patientId, map_job: _job } });
            const getTourCarCaseMappingResult = yield this.orm_car_mapping.findOne({ where: { patientId: _patientId, map_job: _job } });
            try {
                if (getTourCarCaseMappingResult) {
                    let _id = param_case.split("#")[1];
                    const testData = this.testMappingData(_id);
                    getTourCarCaseMappingResult.accNumbers = testData.accNum;
                    if (getTourCarCaseRec.length == 1) {
                        getTourCarCaseRec[0].mapping = testData.accNum;
                        yield this.orm_case.save(getTourCarCaseRec[0]);
                    }
                    yield this.orm_car_mapping.save(getTourCarCaseMappingResult);
                }
                else {
                    const _mapping = new TourCarMapping_1.TourCarMapping();
                    let _id = param_case.split("#")[1];
                    const testData = this.testMappingData(_id);
                    _mapping.patientId = _patientId;
                    _mapping.map_job = _job;
                    _mapping.accNumbers = testData.accNum;
                    _mapping.mapping_data = JSON.stringify(testData);
                    if (getTourCarCaseRec.length == 1) {
                        getTourCarCaseRec[0].mapping = testData.accNum;
                        yield this.orm_case.save(getTourCarCaseRec[0]);
                    }
                    yield this.saveRecord(TourCarMapping_1.TourCarMapping, _mapping);
                }
            }
            catch (error) {
                logger.error(error);
            }
            return { codeStatus: 200, result: getTourCarCaseRec };
        });
    }
    /** 更新TourCarCase資訊 ([httpput] /tourCarCase) */
    updateTourCarCase(request, response, next, io) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date(Date.now());
            let _this = this;
            const _body = request.body;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Update TourCarCase Record caseName: ${_body.caseName}.`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const getTourCarCaseResult = yield _this.orm_case.findOne({ where: { caseName: _body.caseName } });
                        const prevMappingTourCarCase = yield _this.orm_case.findOne({ where: { mapping: _body.mapping, map_job: _body.job } });
                        if (prevMappingTourCarCase) {
                            prevMappingTourCarCase.mapping = null;
                            yield _this.orm_case.save(prevMappingTourCarCase);
                        }
                        if (getTourCarCaseResult) {
                            getTourCarCaseResult.mapping = _body === null || _body === void 0 ? void 0 : _body.mapping;
                            getTourCarCaseResult.postAI = (_body === null || _body === void 0 ? void 0 : _body.postAI) == 0 ? 0 : (_body === null || _body === void 0 ? void 0 : _body.postAI) || 1;
                            getTourCarCaseResult.postPACS = (_body === null || _body === void 0 ? void 0 : _body.postPACS) == 0 ? 0 : (_body === null || _body === void 0 ? void 0 : _body.postPACS) || 1;
                            yield _this.orm_case.save(getTourCarCaseResult);
                            yield _this.orm_Log.save(LogMessage);
                            let s = [
                                "等它跑起來的時候，你努力的結果就會讓更多人看見的",
                                "你藏在程式裡的那些有趣的東西，會一直留在那的",
                                "當你從這裡畢業的時候，只是暫時斷線對吧，下次上線，就是更厲害的倉鼠啦",
                                "那些天馬行空的有趣想法，別丟了他們~  很有趣，有機會偷偷塞一些到你未來作品裡",
                                "到達停損點的時候，就關上電腦休息吧，有新的想法就記錄在你的虛數世界(DC)保存",
                                "從接近零開始到現在完成介面與部分串接，真的已經很棒了，只是缺少時間深入了解",
                                "希望倉鼠能一直帶著好奇的心，探索遊戲和你覺得有趣的事情",
                                "再忙也要給自己留一點時間小小的休息一下",
                                "擁有很多故事的倉鼠，會收集到更多故事的",
                                "幫上了大忙呢! 把巡迴車的功能做的這麼完整，省下我很多事情啦!"
                            ];
                            const _random = Math.floor(Math.random() * 10);
                            io.sendUpdateTourCar(s[_random]);
                            resolve({ codeStatus: 200, message: LogMessage.content, result: getTourCarCaseResult });
                        }
                        else {
                            reject({ codeStatus: 404, message: `Not found this caseName ${_body.caseName}.` });
                        }
                    }
                    catch (err) {
                        logger.error(`TourCarCase update catch error: ${err}.`);
                        LogMessage.content = `Update TourCarCase Record fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    /** retry postToPACS ([httppost] /tourCarCase/:case/retryPACS) */
    retryPACS(request, response, next, io) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date(Date.now());
            const param_case = decodeURIComponent(request.params.case);
            let _this = this;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Retry post To PACS caseName: ${param_case}.`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const getTourCarCaseResult = yield _this.orm_case.findOne({ where: { caseName: param_case } });
                        if (getTourCarCaseResult) {
                            getTourCarCaseResult.postPACS = 2; //(0錯誤 1等待 2完成)
                            yield _this.orm_case.save(getTourCarCaseResult);
                            yield _this.orm_Log.save(LogMessage);
                            let s = [
                                "等它跑起來的時候，你努力的結果就會讓更多人看見的",
                                "你藏在程式裡的那些有趣的東西，會一直留在那的",
                                "當你從這裡畢業的時候，只是暫時斷線對吧，下次上線，就是更厲害的倉鼠啦",
                                "那些天馬行空的有趣想法，別丟了他們~  很有趣，有機會偷偷塞一些到你未來作品裡",
                                "到達停損點的時候，就關上電腦休息吧，有新的想法就記錄在你的虛數世界(DC)保存",
                                "從接近零開始到現在完成介面與部分串接，真的已經很棒了，只是缺少時間深入了解",
                                "希望倉鼠能一直帶著好奇的心，探索遊戲和你覺得有趣的事情",
                                "再忙也要給自己留一點時間小小的休息一下",
                                "擁有很多故事的倉鼠，會收集到更多故事的",
                                "幫上了大忙呢! 把巡迴車的功能做的這麼完整，省下我很多事情啦!"
                            ];
                            const _random = Math.floor(Math.random() * 10);
                            io.sendUpdateTourCar(s[_random]);
                            // getTourCarCaseResult.postPACS = 1; //(0錯誤 1等待 2完成)
                            // await _this.orm_case.save(getTourCarCaseResult);
                            // await _this.orm_Log.save(LogMessage);
                            //通知post to PACS
                            // let MQ_message = {
                            //     "task_type": "send_series_task",        // [功能用] 任務類型，供 MQ consumer 分流使用
                            //     "task_id": "job-20250723-001",          // [記錄用] 任務唯一識別碼，用於追蹤、對應回報與 log
                            //     "caseName": getTourCarCaseResult.caseName, // [功能用] 哪一筆Case資料，對應後續查詢
                            //     "series_uid": getTourCarCaseResult.seriesId,        // [功能用] 欲傳送的 DICOM 影像所屬 Series UID，是主要處理目標
                            //     "target_aets": ["PACS_A", "AI_NODE"],   // [功能用] 傳送目標 AET 清單，minipacs 需逐一傳送
                            //     "timestamp": now     // [記錄用] 任務建立時間，方便審計與處理順序判斷
                            // };
                            // this.rabbits.connecting("xray-UPLOAD", MQ_message, 0);
                            resolve({ codeStatus: 200, message: LogMessage.content, result: getTourCarCaseResult });
                        }
                        else {
                            resolve({ codeStatus: 404, message: `Not found this caseName ${param_case}.` });
                        }
                    }
                    catch (err) {
                        logger.error(`TourCarCase:${param_case} retry post To PACS catch error: ${err}.`);
                        LogMessage.content = `TourCarCase:${param_case} retry post To PACS fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    /** retry AI ([httppost] /tourCarCase/:case/retryAI) */
    retryAI(request, response, next, io) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date(Date.now());
            const param_case = decodeURIComponent(request.params.case);
            let _this = this;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Retry AI caseName: ${param_case}.`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const getTourCarCaseResult = yield _this.orm_case.findOne({ where: { caseName: param_case } });
                        if (getTourCarCaseResult) {
                            getTourCarCaseResult.postAI = 2; //(0錯誤 1等待 2完成)
                            yield _this.orm_case.save(getTourCarCaseResult);
                            yield _this.orm_Log.save(LogMessage);
                            let s = [
                                "等它跑起來的時候，你努力的結果就會讓更多人看見的",
                                "你藏在程式裡的那些有趣的東西，會一直留在那的",
                                "當你從這裡畢業的時候，只是暫時斷線對吧，下次上線，就是更厲害的倉鼠啦",
                                "那些天馬行空的有趣想法，別丟了他們~  很有趣，有機會偷偷塞一些到你未來作品裡",
                                "到達停損點的時候，就關上電腦休息吧，有新的想法就記錄在你的虛數世界(DC)保存",
                                "從接近零開始到現在完成介面與部分串接，真的已經很棒了，只是缺少時間深入了解",
                                "希望倉鼠能一直帶著好奇的心，探索遊戲和你覺得有趣的事情",
                                "再忙也要給自己留一點時間小小的休息一下",
                                "擁有很多故事的倉鼠，會收集到更多故事的",
                                "幫上了大忙呢! 把巡迴車的功能做的這麼完整，省下我很多事情啦!"
                            ];
                            const _random = Math.floor(Math.random() * 10);
                            io.sendUpdateTourCar(s[_random]);
                            //TODO AI post
                            resolve({ codeStatus: 200, message: LogMessage.content, result: getTourCarCaseResult });
                        }
                        else {
                            resolve({ codeStatus: 404, message: `Not found this caseName ${param_case}.` });
                        }
                    }
                    catch (err) {
                        logger.error(`TourCarCase:${param_case} retry AI catch error: ${err}.`);
                        LogMessage.content = `TourCarCase:${param_case} retry AI fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    /** 收到Orthanc合併回應 ([httppost] /xray/mergeAccessionResult) */
    updateAccnumberAndCaseStatus(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date(Date.now());
            let _this = this;
            const _body = request.body;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Orthanc Combind accessNumber result.`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const getTourCarCaseResult = yield _this.orm_case.findOne({ where: { seriesId: _body.series_uid } });
                        const getDicomrecs = yield _this.orm_recs.findOne({ where: { seriesId: _body.series_uid } });
                        LogMessage.content = _body.message;
                        LogMessage.evtDatetime = _body.timestamp;
                        if (getTourCarCaseResult) {
                            getTourCarCaseResult.mapping = _body.accession_number;
                            getDicomrecs.accNum = _body.accession_number;
                            getTourCarCaseResult.status = _body.status == "success" ? 'Success' : 'Fail';
                            //更新資料
                            yield _this.orm_case.save(getTourCarCaseResult);
                            yield _this.orm_recs.save(getDicomrecs);
                            yield _this.orm_Log.save(LogMessage);
                            //通知post to PACS
                            let MQ_message = {
                                "task_type": "send_series_task", // [功能用] 任務類型，供 MQ consumer 分流使用
                                "task_id": "job-20250723-001", // [記錄用] 任務唯一識別碼，用於追蹤、對應回報與 log
                                "caseName": getTourCarCaseResult.caseName, // [功能用] 哪一筆Case資料，對應後續查詢
                                "series_uid": getTourCarCaseResult.seriesId, // [功能用] 欲傳送的 DICOM 影像所屬 Series UID，是主要處理目標
                                "target_aets": ["PACS_A", "AI_NODE"], // [功能用] 傳送目標 AET 清單，minipacs 需逐一傳送
                                "timestamp": now // [記錄用] 任務建立時間，方便審計與處理順序判斷
                            };
                            this.rabbits.connecting("xray-UPLOAD", MQ_message, 0);
                            resolve({ codeStatus: 200, message: LogMessage.content, result: getTourCarCaseResult });
                        }
                        else {
                            resolve({ codeStatus: 404, message: `Not found this case seriesID: ${_body.series_uid}.` });
                        }
                    }
                    catch (err) {
                        logger.error(`Orthanc Combind accessNumber result catch error: ${err}.`);
                        LogMessage.content = `Orthanc Combind accessNumber result, update TourCarCase Record fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    /** 收到Orthanc 傳送PACS成功後呼叫 ([httppost] /xray/sendPACSResult) */
    receiveOrthancPostToPACSResult(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date(Date.now());
            let _this = this;
            const _body = request.body;
            const LogMessage = {
                evtType: 21,
                evtDatetime: now,
                content: `Orthanc Combind accessNumber result.`
            };
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const getTourCarCaseResult = yield _this.orm_case.findOne({ where: { seriesId: _body.series_uid } });
                        LogMessage.content = _body.message;
                        LogMessage.evtDatetime = _body.timestamp;
                        if (getTourCarCaseResult) {
                            getTourCarCaseResult.postPACS = _body.status == "success" ? 1 : 0;
                            //TODO 送出API
                            // const request_data = {};
                            // const options = {
                            //     'method': "POST",
                            //     'url': "aiInference?.url",
                            //     'headers': {
                            //         'Content-Type': 'application/json; charset=utf-8'
                            //     },
                            //     body: JSON.stringify(request_data)
                            // };
                            // _request(options, async function (error, response) {
                            //     if (error) {
                            //         logger.error(`Post to standalone_server ${aiInference?.url} error: ${error}`);
                            //         getTourCarCaseResult.postAI = 0;
                            //     } else {
                            //         logger.info(`Post to standalone_server ${aiInference?.url} successful.`);
                            //         //更新資料
                            //         getTourCarCaseResult.postAI = 1;
                            //     }
                            //     await _this.orm_case.save(getTourCarCaseResult);
                            // });
                            resolve({ codeStatus: 200, message: LogMessage.content, result: getTourCarCaseResult });
                        }
                        else {
                            resolve({ codeStatus: 404, message: `Not found this case seriesID: ${_body.series_uid}.` });
                        }
                    }
                    catch (err) {
                        logger.error(`Orthanc postToPACS receive result catch error: ${err}.`);
                        LogMessage.content = `Orthanc postToPACS receive result, update TourCarCase Record fail ErrorMessage ${err}.`;
                        yield _this.orm_Log.save(LogMessage);
                        reject({ codeStatus: 404, message: LogMessage.content });
                    }
                });
            });
        });
    }
    testMappingData(caseName) {
        let _random = Math.floor(Math.random() * 3);
        const MapAI = ["No", "Test", "GO"];
        const MapAccNum = [`Apple_${caseName}`, `Test_${caseName}`, `News_${caseName}`];
        const accNum = MapAccNum[_random];
        let testData = {
            caseName,
            accNum: accNum,
            mapping: {}
        };
        for (let i = 0; i < accNum.length; i++) {
            testData.mapping[accNum[i]] = { postAI: MapAI, postPACS: ["test1", "test2"] };
        }
        return testData;
    }
    saveRecord(entity, record) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = (0, typeorm_1.getConnection)("default");
            const queryRunner = connection.createQueryRunner();
            // 確保 QueryRunner 能夠連線
            yield queryRunner.connect();
            // 開始事務
            yield queryRunner.startTransaction();
            try {
                yield queryRunner.manager.save(entity, record);
                yield queryRunner.commitTransaction();
            }
            catch (error) {
                console.error(`${entity} Transaction failed. Rolling back: `, error);
                // 如果出錯，回滾事務
                yield queryRunner.rollbackTransaction();
            }
            finally {
                // 釋放 query runner
                yield queryRunner.release();
            }
        });
    }
}
exports.TourCarController = TourCarController;