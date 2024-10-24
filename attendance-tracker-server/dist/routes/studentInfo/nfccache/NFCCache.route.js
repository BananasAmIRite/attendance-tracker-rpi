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
const StudentInfoManager_1 = __importDefault(require("../../../studentinfo/StudentInfoManager"));
const NFCCacheRouter = (0, express_1.Router)();
NFCCacheRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Getting NFC change cache...');
    const entries = yield StudentInfoManager_1.default.nfcDbCache.getCachedNFCChanges();
    res.status(200).send(entries).end();
}));
NFCCacheRouter.post('/flush', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Flushing NFC change...');
    StudentInfoManager_1.default
        .flushCachedNFCChanges()
        .then(() => {
        res.status(200).end();
    })
        .catch(next);
}));
NFCCacheRouter.post('/clear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Clearing NFC change cache...');
    yield StudentInfoManager_1.default.nfcDbCache.deleteAll();
    res.status(200).end();
}));
exports.default = NFCCacheRouter;
