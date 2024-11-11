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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StudentInfoManager_1 = __importDefault(require("../../studentinfo/StudentInfoManager"));
const NFCCache_route_1 = __importDefault(require("./nfccache/NFCCache.route"));
const StudentInfoCache_route_1 = __importDefault(require("./sicache/StudentInfoCache.route"));
const StudentInfoRouter = (0, express_1.Router)();
StudentInfoRouter.use('/changesCache', NFCCache_route_1.default);
StudentInfoRouter.use('/siCache', StudentInfoCache_route_1.default);
StudentInfoRouter.get('/sid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    console.log('Student info by ID: ', id);
    const info = yield StudentInfoManager_1.default.getStudentInfoBySID(id);
    res.status(info ? 200 : 404)
        .send(info)
        .end();
}));
StudentInfoRouter.get('/nfc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    console.log('Student info by NFC ID: ', id);
    const info = yield StudentInfoManager_1.default.getStudentInfoByNFCID(id);
    res.status(info ? 200 : 404)
        .send(info)
        .end();
}));
StudentInfoRouter.post('/bind', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, nfcId } = req.body;
    console.log('Binding Student with NFC: ', studentId, nfcId);
    try {
        yield StudentInfoManager_1.default.bindStudentId(studentId, nfcId);
        res.status(200).end();
    }
    catch (err) {
        res.status(401).end();
    }
}));
StudentInfoRouter.get('/load', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Loading student info...');
    StudentInfoManager_1.default
        .reconcileStudentInfoCache()
        .then(() => {
        res.status(200).end();
    })
        .catch(next);
}));
StudentInfoRouter.get('/online', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200)
        .send({ online: StudentInfoManager_1.default.mode === 'ONLINE' })
        .end();
}));
exports.default = StudentInfoRouter;
