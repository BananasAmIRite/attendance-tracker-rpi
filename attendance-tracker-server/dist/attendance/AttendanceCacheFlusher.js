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
Object.defineProperty(exports, "__esModule", { value: true });
const toad_scheduler_1 = require("toad-scheduler");
// parse the auto upload attendnace string into a runnable method to determine if we should upload or not
const parseAutoUploadCriteria = (criteria) => {
    // parse data by separation
    const data = criteria.split('|');
    if (data[0] === 'space') {
        // based on space, get max entries, determine if max entries is met
        const maxEntries = parseInt(data[1]);
        return (mgr) => __awaiter(void 0, void 0, void 0, function* () { return (yield mgr.dbCache.getAllCacheEntries()).length >= maxEntries; });
    }
    else if (data[0] === 'time') {
        // based on time, determine if we should upload or not
        const timeMins = parseInt(data[1]);
        let lastRunTime = Date.now();
        return (mgr) => __awaiter(void 0, void 0, void 0, function* () {
            // ONLY upload if timer has passed AND we actually have entries to upload
            if ((Date.now() - lastRunTime) / 1000 / 60 >= timeMins &&
                (yield mgr.dbCache.getAllCacheEntries()).length > 0) {
                lastRunTime = Date.now();
                return true;
            }
            return false;
        });
    }
    return () => __awaiter(void 0, void 0, void 0, function* () { return false; });
};
const autoUploadCriteria = parseAutoUploadCriteria(process.env.AUTO_UPLOAD_ATTENDANCE);
// manages flushing the cache for attendance
class AttendanceCacheFlusher {
    constructor(attdMgr) {
        this.attdMgr = attdMgr;
        // whether or not we're already currently flushing (we don't wanna send multiple requests)
        this.isFlushing = false;
        // scheduler for automatic flushing
        this.attdUploadScheduler = new toad_scheduler_1.ToadScheduler();
    }
    // start flushing attendance automatically
    startAutomaticFlush() {
        this.attdUploadScheduler.addSimpleIntervalJob(new toad_scheduler_1.SimpleIntervalJob({ seconds: 60 }, new toad_scheduler_1.Task('attd-flush-check', () => __awaiter(this, void 0, void 0, function* () {
            // check auto uploading criteria; if met, try flushing
            if (yield autoUploadCriteria(this.attdMgr)) {
                console.log('Auto-upload criteria met; attempting to upload...');
                // auto upload criteria met, upload (WITHOUT waiting for it to finish)
                this.flush().catch((err) => {
                    console.log('Error when auto flushing: ', err.message);
                });
            }
        }))));
        console.log('Started automatic flush checker');
    }
    // flushes attendance asyncrhonousl
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isFlushing)
                throw new Error('There is already an upload in progress!');
            // reload sheet cache and reflush cached attendance in parallel with other program tasks
            yield this.flushCachedAttendance();
        });
    }
    // flush all cached attendance in the attendance cache db by posting entries online
    flushCachedAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.isFlushing = true; // prevent any other flushes (including automatic ones) happening during this time
                // reload sheet cache
                yield this.attdMgr.loadSheetCache();
                // get entries in the db cache
                const entries = yield this.attdMgr.dbCache.getCachedAttendance();
                console.log(`Flushing cached attendance...`);
                // post all entries in a batch
                const uploadedEntries = yield this.attdMgr.postOnlineAttendanceEntries(entries);
                console.log(`Flushed cached attendance. Uploaded ${uploadedEntries.length} entries. `);
                console.log('Clearing attendance cache...');
                // delete all posted entries from db cache
                yield this.attdMgr.dbCache.removeAllIncluding(uploadedEntries.map((e) => { var _a; return (_a = e.id) !== null && _a !== void 0 ? _a : -1; }));
                console.log('Cleared attendance cache.');
                this.isFlushing = false;
            }
            catch (err) {
                this.isFlushing = false;
                console.log('Error flushing cached attendance. ');
                throw err;
            }
        });
    }
}
exports.default = AttendanceCacheFlusher;
