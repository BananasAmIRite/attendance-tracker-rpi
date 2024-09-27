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
const StudentInfoCacheRouter = (0, express_1.Router)();
StudentInfoCacheRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Getting student info cache...');
    const entries = yield StudentInfoManager_1.default.infoDbCache.getCachedStudentInfo();
    res.status(200).send(entries).end();
}));
StudentInfoCacheRouter.post('/rebuild', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Clearing student info cache...');
    yield StudentInfoManager_1.default.rebuildStudentInfoCache();
    res.status(200).end();
}));
exports.default = StudentInfoCacheRouter;
