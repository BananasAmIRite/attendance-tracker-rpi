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
const PrismaClient_1 = __importDefault(require("../PrismaClient"));
const SheetUtils_1 = require("../util/SheetUtils");
const SheetCache_1 = __importDefault(require("../SheetCache"));
const AttendanceDBCache_1 = __importDefault(require("./AttendanceDBCache"));
// config for whether to automatically upload to the attendance cache by default or not
const useAttdCache = process.env.USE_ATTD_CACHE_DEFAULT === 'true';
console.log(`Config: Using attendance cache by default set to ${useAttdCache}`);
class AttendanceManager {
    constructor() {
        // sheet id housing attendance sheet
        this.sheetId = process.env.ATTD_SHEET_ID;
        // sheet names for the sheets containing scan-in and scan-out times
        this.inSheetRange = process.env.ATTD_SHEET_RANGE_IN;
        this.outSheetRange = process.env.ATTD_SHEET_RANGE_OUT;
        // database cache for any values that failed to upload
        this.dbCache = new AttendanceDBCache_1.default();
        /** attendance upload mode
         *
         * 'ONLINE' - upload directly to google sheets
         * 'OFFLINE' - upload to DB cache and to sheets later on
         *
         **/
        this.mode = 'ONLINE';
    }
    // load in-memory cache of the attendance sheet
    loadSheetCache() {
        return __awaiter(this, void 0, void 0, function* () {
            this.inSheetCache = new SheetCache_1.default(this.sheetId, this.inSheetRange);
            console.log('Getting attendance sheet data');
            yield this.inSheetCache.load();
            console.log('Retrieved attendance sheet data. ');
        });
    }
    // post attendance entry for a specific student to either sheets or attendance db based on mode
    postAttendanceEntry(studentId, date, time) {
        return __awaiter(this, void 0, void 0, function* () {
            // upload online if we're online and we aren't defaulting to using attendance cache
            if (this.mode === 'ONLINE' && !useAttdCache) {
                try {
                    // upload online entry
                    const errorVals = yield this.postOnlineAttendanceEntries([{ studentId, date, time }]);
                    // switch to offline if there exists a value that didn't make it to the sheet
                    if (errorVals.length > 0)
                        throw new Error('Attendance uploading failed. Does this date exist on the sheet?');
                    console.log(`Successfully posted attendance entry: ${studentId}, ${date}, ${time}`);
                }
                catch (err) {
                    // error occurred and attendance entry wasn't uploaded; switch to offline mode and rerun the request
                    console.log('Error occurred posting attendance entry. Switching to offline mode');
                    console.log(`Error: ${err}`);
                    this.mode = 'OFFLINE';
                    yield this.postAttendanceEntry(studentId, date, time);
                }
            }
            else {
                // offline mode; append entry to attendance db cache
                yield this.dbCache.addCacheEntry({ studentId, date, time });
                console.log('Attendance entry appended to cache. ');
            }
        });
    }
    // post an entry ONLINE
    postOnlineAttendanceEntries(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const attdSheetData = this.inSheetCache.getCache();
            // get dates and indices for each date
            const datesArr = attdSheetData[0];
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
                    // date not found, don't upload value and append to the values that errored
                    erroredValues.push(entry);
                    continue;
                }
                // use the scan out sheet if I already scanned in or there's already a value for scanning in
                const sheetRange = attdSheetData[row][col] || rangesToQuery.findIndex((e) => e.row === row && e.col === col) !== -1
                    ? this.outSheetRange
                    : this.inSheetRange;
                const range = (0, SheetUtils_1.createSingleA1Range)(sheetRange, row, col);
                // add range to list of ranges to use
                rangesToQuery.push({
                    data: {
                        range,
                        values: [[entry.time]],
                    },
                    row,
                    col,
                });
            }
            console.log('Uploading data...');
            // make request to upload sheet and alter data in memory as well
            if (rangesToQuery.length === 1)
                yield this.inSheetCache.updateSingle(rangesToQuery[0]);
            else
                yield this.inSheetCache.batchUpdateSingle(rangesToQuery);
            console.log(`Uploaded data: ${rangesToQuery.length} value(s) uploaded, ${erroredValues.length} value(s) errored`);
            return erroredValues;
        });
    }
    // check whether or not we're online by loading the sheet cache
    testOnlineStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.loadSheetCache();
                this.mode = 'ONLINE';
                return true;
            }
            catch (err) {
                this.mode = 'OFFLINE';
                return false;
            }
        });
    }
    // flush all cached attendance in the attendance cache db by posting entries online
    flushCachedAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            // get entries in the db cache
            const entries = yield this.dbCache.getCachedAttendance();
            try {
                console.log(`Flushing cached attendance...`);
                // post all entries in a batch
                const missedEntries = yield this.postOnlineAttendanceEntries(entries);
                console.log(`Flushed cached attendance. There are ${missedEntries.length} entries left. `);
                console.log('Clearing attendance cache...');
                // delete all posted entries from db cache
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
}
const attdManager = new AttendanceManager();
exports.default = attdManager;
