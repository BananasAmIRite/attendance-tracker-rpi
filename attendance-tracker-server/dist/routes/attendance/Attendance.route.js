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
const AttendanceManager_1 = __importDefault(require("../../attendance/AttendanceManager"));
const AttendanceCache_route_1 = __importDefault(require("./cache/AttendanceCache.route"));
// router for /attendance/
const AttendanceRouter = (0, express_1.Router)();
// link cache router
AttendanceRouter.use('/cache', AttendanceCache_route_1.default);
// get online mode
AttendanceRouter.get('/online', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200)
        .send({ online: AttendanceManager_1.default.mode === 'ONLINE' })
        .end();
}));
// push a single attendance entry
AttendanceRouter.post('/push', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, dateTime } = req.body;
    console.log('Pushing attendance:', studentId, dateTime);
    const date = new Date(dateTime);
    const formatTwoDigits = (n) => {
        return n < 10 ? '0' + n : n;
    };
    yield AttendanceManager_1.default.postAttendanceEntry(studentId, `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, `${date.getHours() === 12 || date.getHours() === 0 ? 12 : date.getHours() % 12}:${formatTwoDigits(date.getMinutes())} ${date.getHours() >= 12 ? 'PM' : 'AM'}`);
    res.status(200).end();
}));
exports.default = AttendanceRouter;
