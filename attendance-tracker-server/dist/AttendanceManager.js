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
const ServiceAccount_1 = require("./ServiceAccount");
const PrismaClient_1 = __importDefault(require("./PrismaClient"));
class AttendanceManager {
    constructor() {
        this.sheetId = process.env.ATTD_SHEET_ID;
        this.sheetRange = process.env.ATTD_SHEET_RANGE;
        this.mode = 'ONLINE';
    }
    postAttendanceEntry(studentId, date, time) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mode === 'ONLINE') {
                try {
                    yield ServiceAccount_1.SheetInstance.spreadsheets.values.append({
                        spreadsheetId: this.sheetId,
                        range: this.sheetRange,
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [[studentId, date, time]],
                        },
                    });
                }
                catch (err) {
                    console.log('Error occurred. Switching to offline mode');
                    this.mode = 'OFFLINE';
                    this.postAttendanceEntry(studentId, date, time);
                }
            }
            else {
                this.addCacheEntry({ studentId, date, time });
                console.log('Attendance entry appended to cache. ');
            }
        });
    }
    postOnlineAttendanceEntry(studentId, date, time) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ServiceAccount_1.SheetInstance.spreadsheets.values.append({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[studentId, date, time]],
                    },
                });
            }
            catch (err) {
                throw err;
            }
        });
    }
    testOnlineStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                });
                this.mode = 'ONLINE';
                return true;
            }
            catch (err) {
                this.mode = 'OFFLINE';
                return false;
            }
        });
    }
    getAttendanceEntries(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mode === 'OFFLINE')
                return [];
            let response;
            try {
                response = yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                });
            }
            catch (err) {
                this.mode = 'OFFLINE';
                return [];
            }
            const values = response.data.values;
            const entries = [];
            if (!values)
                return [];
            for (const row of values) {
                if (row[0] !== studentId)
                    continue;
                entries.push({
                    studentId: row[0],
                    date: row[1],
                    time: row[2],
                });
            }
            return entries;
        });
    }
    getCachedAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this.getAllCacheEntries();
            const attdEntries = [];
            for (const attd of entries)
                attdEntries.push({
                    studentId: attd.studentId,
                    date: attd.date,
                    time: attd.time,
                });
            return attdEntries;
        });
    }
    flushCachedAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            // throw new Error('nah nah nah boo boo');
            const entries = yield this.getCachedAttendance();
            for (const entry of entries) {
                try {
                    yield this.postOnlineAttendanceEntry(entry.studentId, entry.date, entry.time);
                }
                catch (err) {
                    throw err;
                }
            }
            yield this.clearAttendanceCache();
        });
    }
    addCacheEntry(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            yield PrismaClient_1.default.attendance.create({
                data: {
                    studentId: entry.studentId,
                    date: entry.date,
                    time: entry.time,
                },
            });
        });
    }
    getAllCacheEntries() {
        return __awaiter(this, void 0, void 0, function* () {
            return PrismaClient_1.default.attendance.findMany();
        });
    }
    clearAttendanceCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield PrismaClient_1.default.attendance.deleteMany({
                where: {},
            });
        });
    }
}
exports.default = AttendanceManager;
