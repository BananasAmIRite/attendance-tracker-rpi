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
const SheetUtils_1 = require("./util/SheetUtils");
const useAttdCache = process.env.USE_ATTD_CACHE_DEFAULT === 'true';
console.log(`Config: Using attendance cache by default set to ${useAttdCache}`);
class AttendanceManager {
    constructor() {
        this.sheetId = process.env.ATTD_SHEET_ID;
        this.inSheetRange = process.env.ATTD_SHEET_RANGE_IN;
        this.outSheetRange = process.env.ATTD_SHEET_RANGE_OUT;
        this.mode = 'ONLINE';
    }
    postAttendanceEntry(studentId, date, time) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mode === 'ONLINE' && !useAttdCache) {
                try {
                    const errorVals = yield this.postOnlineAttendanceEntries([{ studentId, date, time }]);
                    if (errorVals.length > 0)
                        throw new Error('Attendance uploading failed. Does this date exist on the sheet?');
                    console.log(`Successfully posted attendance entry: ${studentId}, ${date}, ${time}`);
                }
                catch (err) {
                    console.log('Error occurred posting attendance entry. Switching to offline mode');
                    console.log(`Error: ${err}`);
                    this.mode = 'OFFLINE';
                    yield this.postAttendanceEntry(studentId, date, time);
                }
            }
            else {
                yield this.addCacheEntry({ studentId, date, time });
                console.log('Attendance entry appended to cache. ');
            }
        });
    }
    postOnlineAttendanceEntries(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            // get dates and indices for each date
            console.log('Getting attendance sheet data');
            const attdSheetData = (yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.inSheetRange,
            })).data.values;
            console.log('Retrieve attendance sheet data. Parsing...');
            const datesArr = attdSheetData === null || attdSheetData === void 0 ? void 0 : attdSheetData[0];
            if (!datesArr)
                throw new Error("Dates array doesn't have any values :(");
            const dates = new Set(entries.map((e) => e.date));
            const dateIndices = Array.from(dates).map((e) => datesArr.findIndex((f) => f === e));
            const dateIndexMap = Array.from(dates).map((e, i) => ({ date: e, index: dateIndices[i] }));
            // get student ids as well
            const students = attdSheetData.map((e) => e[0]);
            if (!students)
                throw new Error('No students found');
            const erroredValues = [];
            const rangesToQuery = [];
            // go through each entry and find row + column
            for (const entry of entries) {
                const row = students.findIndex((e) => e === entry.studentId);
                const col = dateIndexMap.find((e) => e.date === entry.date).index;
                if (col === -1) {
                    // date not found
                    erroredValues.push(entry);
                    continue;
                }
                const sheetRange = attdSheetData[row][col] ? this.outSheetRange : this.inSheetRange; // use the scan out sheet if I already scanned in
                const range = (0, SheetUtils_1.createSingleA1Range)(sheetRange, row, col);
                // add range to list of ranges to use
                rangesToQuery.push({
                    range,
                    values: [[entry.time]],
                });
            }
            console.log('Uploading data...');
            yield ServiceAccount_1.SheetInstance.spreadsheets.values.batchUpdate({
                spreadsheetId: this.sheetId,
                requestBody: {
                    data: rangesToQuery,
                    valueInputOption: 'RAW',
                },
            });
            console.log('Uploaded data.');
            return erroredValues;
        });
    }
    testOnlineStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                    spreadsheetId: this.sheetId,
                    range: this.inSheetRange,
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
    getCachedAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this.getAllCacheEntries();
            const attdEntries = [];
            for (const attd of entries)
                attdEntries.push({
                    studentId: attd.studentId,
                    date: attd.date,
                    time: attd.time,
                    id: attd.id,
                });
            return attdEntries;
        });
    }
    flushCachedAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this.getCachedAttendance();
            try {
                console.log(`Flushing cached attendance...`);
                const missedEntries = yield this.postOnlineAttendanceEntries(entries);
                console.log(`Flushed cached attendance. There are ${missedEntries.length} entries left. `);
                console.log('Clearing attendance cache...');
                yield PrismaClient_1.default.attendance.deleteMany({
                    where: {
                        id: {
                            notIn: missedEntries.map((e) => { var _a; return (_a = e.id) !== null && _a !== void 0 ? _a : -1; }),
                        },
                    },
                });
                console.log('Cleared attendance cache.');
            }
            catch (err) {
                console.log('Error flushing cached attendance. ');
                throw err;
            }
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
