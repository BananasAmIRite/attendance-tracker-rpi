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
exports.AttendanceManager = void 0;
const SheetUtils_1 = require("../util/SheetUtils");
const SheetCache_1 = __importDefault(require("../SheetCache"));
const AttendanceDBCache_1 = __importDefault(require("./AttendanceDBCache"));
const AttendanceCacheFlusher_1 = __importDefault(require("./AttendanceCacheFlusher"));
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
        this.cacheFlusher = new AttendanceCacheFlusher_1.default(this);
        /** attendance upload mode
         *
         * 'ONLINE' - upload directly to google sheets
         * 'OFFLINE' - upload to DB cache and to sheets later on
         *
         **/
        this.mode = 'ONLINE';
        if (useAttdCache)
            this.cacheFlusher.startAutomaticFlush();
    }
    // load in-memory cache of the attendance sheet
    loadSheetCache() {
        return __awaiter(this, void 0, void 0, function* () {
            const newCache = new SheetCache_1.default(this.sheetId, this.inSheetRange);
            console.log('Getting attendance sheet data');
            yield newCache.load();
            console.log('Retrieved attendance sheet data. ');
            this.inSheetCache = newCache;
        });
    }
    // post attendance entry for a specific student to either sheets or attendance db based on mode
    postAttendanceEntry(studentId, date, time) {
        return __awaiter(this, void 0, void 0, function* () {
            // upload online if we're online and we aren't defaulting to using attendance cache
            if (this.mode === 'ONLINE' && !useAttdCache) {
                try {
                    // upload online entry
                    const uploadedValues = yield this.postOnlineAttendanceEntries([{ studentId, date, time }]);
                    // switch to offline if there exists a value that didn't make it to the sheet
                    if (uploadedValues.length === 0)
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
                yield this.postOfflineCacheEntry({ studentId, date, time });
                console.log('Attendance entry appended to cache. ');
            }
        });
    }
    postOfflineCacheEntry(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            // runs into concurrency issues? (nvm)
            yield this.dbCache.addCacheEntry(entry);
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
            const uploadedValues = [];
            const rangesToQuery = [];
            // go through each entry and find row + column
            for (const entry of entries) {
                const row = students.findIndex((e) => e === entry.studentId);
                const col = dateIndexMap.find((e) => e.date === entry.date).index;
                if (col === -1 || row === -1)
                    continue; // date not found, don't upload value and append to the values that errored
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
                uploadedValues.push(entry);
            }
            console.log('Uploading data...');
            // make request to upload sheet and alter data in memory as well
            if (rangesToQuery.length === 1)
                yield this.inSheetCache.updateSingle(rangesToQuery[0]);
            else
                yield this.inSheetCache.batchUpdateSingle(rangesToQuery);
            console.log(`Uploaded data: ${rangesToQuery.length} value(s) uploaded, ${entries.length - uploadedValues.length} value(s) errored`);
            return uploadedValues;
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
}
exports.AttendanceManager = AttendanceManager;
const attdManager = new AttendanceManager();
exports.default = attdManager;
