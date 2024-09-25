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
const useAttdCache = process.env.USE_ATTD_CACHE_DEFAULT === 'true';
console.log(`Config: Using attendance cache by default set to ${useAttdCache}`);
class AttendanceManager {
    constructor() {
        this.sheetId = process.env.ATTD_SHEET_ID;
        this.sheetRange = process.env.ATTD_SHEET_RANGE;
        this.mode = 'ONLINE';
    }
    postAttendanceEntry(studentId, date, time) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mode === 'ONLINE' && !useAttdCache) {
                try {
                    yield ServiceAccount_1.SheetInstance.spreadsheets.values.append({
                        spreadsheetId: this.sheetId,
                        range: this.sheetRange,
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [[studentId, date, time]],
                        },
                    });
                    console.log(`Successfully posted attendance entry: ${studentId}, ${date}, ${time}`);
                }
                catch (err) {
                    console.log('Error occurred posting attendance entry. Switching to offline mode');
                    console.log(`Error: ${err}`);
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
    postOnlineAttendanceEntries(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ServiceAccount_1.SheetInstance.spreadsheets.values.append({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: entries.map((e) => [e.studentId, e.date, e.time]),
                    },
                });
            }
            catch (err) {
                console.log(`Error posting online attendance entry: ${err}`);
                throw err;
            }
        });
    }
    testOnlineStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
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
                console.log('Got attendance entries successfully');
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
            const entries = yield this.getCachedAttendance();
            try {
                console.log(`Flushing cached attendance...`);
                yield this.postOnlineAttendanceEntries(entries);
                console.log(`Flushed cached attendance`);
            }
            catch (err) {
                console.log('Error flushing cached attendance. ');
                throw err;
            }
            console.log('Clearing attendance cache...');
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
            return yield PrismaClient_1.default.attendance.findMany();
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
