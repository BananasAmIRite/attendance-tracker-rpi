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
const AttendanceManager_1 = __importDefault(require("../../../attendance/AttendanceManager"));
const AttendanceCacheRouter = (0, express_1.Router)();
AttendanceCacheRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Getting attendance cache...');
    const entries = yield AttendanceManager_1.default.dbCache.getAllCacheEntries();
    res.status(200).send(entries).end();
}));
AttendanceCacheRouter.post('/flush', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Flushing attendance...');
    AttendanceManager_1.default
        .flushCachedAttendance()
        .then(() => {
        res.status(200).end();
    })
        .catch(next);
}));
AttendanceCacheRouter.post('/clear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Clearing attendance cache...');
    yield AttendanceManager_1.default.dbCache.clearAttendanceCache();
    res.status(200).end();
}));
exports.default = AttendanceCacheRouter;
