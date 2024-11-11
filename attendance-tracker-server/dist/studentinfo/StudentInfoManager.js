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
const ServiceAccount_1 = require("../ServiceAccount");
const PrismaClient_1 = __importDefault(require("../PrismaClient"));
const StudentInfoDBCache_1 = __importDefault(require("./StudentInfoDBCache"));
const StudentNFCChangeCache_1 = __importDefault(require("./StudentNFCChangeCache"));
// convert row of student infos to a StudentInfo
const rowToStudentInfo = (row) => ({
    studentId: row[0],
    firstName: row[1],
    lastName: row[2],
    nfcId: row[3],
    attendancePercent: row[4],
});
// convert StudentInfo to rows to be published to Sheets
const studentInfoToRow = (info) => [
    info.studentId,
    info.firstName,
    info.lastName,
    info.nfcId,
    // info.attendancePercent,
];
// config for whether to automatically use the student info cache for looking up student info
const useSICache = process.env.USE_SI_CACHE_DEFAULT === 'true';
// whether or not to use the nfc cache when binding student ids to nfc ids
const useNFCCache = process.env.USE_NFC_CACHE_DEFAULT === 'true';
console.log(`Config: Using student info cache by default set to ${useSICache}`);
console.log(`Config: Using NFC info cache by default set to ${useNFCCache}`);
class StudentInfoManager {
    constructor() {
        // sheet id housing student info sheet
        this.sheetId = process.env.USER_SHEET_ID;
        // sheet range for student infos
        this.sheetRange = process.env.USER_SHEET_RANGE;
        /** attendance upload mode
         *
         * 'ONLINE' - upload directly to google sheets
         * 'OFFLINE' - upload to DB cache and to sheets later on
         *
         **/
        this.mode = 'ONLINE';
        // local cache for student information and nfc bindings
        this.infoDbCache = new StudentInfoDBCache_1.default();
        // local cache for nfc changes that failed to upload
        this.nfcDbCache = new StudentNFCChangeCache_1.default();
    }
    // get student info by providing a student id
    getStudentInfoBySID(sid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getStudentInfo((info) => info.studentId === sid);
        });
    }
    // get student info by providing an nfc id
    getStudentInfoByNFCID(nfcId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getStudentInfo((info) => info.nfcId === nfcId);
        });
    }
    /** Get student info, either online or offline
     *
     * @param qualifier qualifier to accept student if the sheet
     */
    getStudentInfo(qualifier) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('getting student info...');
            // get from sheets if we're online and we aren't defaulting to using student info cache
            if (this.mode === 'ONLINE' && !useSICache) {
                // get response
                let response;
                try {
                    response = yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                        spreadsheetId: this.sheetId,
                        range: this.sheetRange,
                    });
                }
                catch (err) {
                    // error occurred while getting response; switch to offline mode and rerun request
                    console.log(`Error occurred while getting student info: ${err}. Retrying with offline mode`);
                    this.mode = 'OFFLINE';
                    return yield this.getStudentInfo(qualifier);
                }
                // parse values and return if student info is accepted
                const values = response.data.values;
                if (values) {
                    for (const row of values) {
                        if (qualifier(rowToStudentInfo(row))) {
                            const studentInfo = rowToStudentInfo(row);
                            console.log(`Got student info: ${JSON.stringify(studentInfo)}`);
                            return studentInfo;
                        }
                    }
                }
            }
            else {
                // offline mode; get the cached student info and pick a student from that
                const cached = yield this.infoDbCache.getCachedStudentInfo();
                for (const info of cached) {
                    if (qualifier(info)) {
                        console.log(`Got student info: ${info.studentId}, ${info.firstName}, ${info.lastName}`);
                        return info;
                    }
                }
            }
            console.log('Student lookup failed. ');
            return null;
        });
    }
    // merge sheets student info into local student info
    reconcileStudentInfoCache() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Reconciling student infos...`);
                const currentCache = yield PrismaClient_1.default.studentInformation.findMany();
                // rebuild cache
                yield this.rebuildStudentInfoCache();
                const newCache = yield PrismaClient_1.default.studentInformation.findMany();
                for (const newCacheValue of newCache) {
                    if (!newCacheValue.studentId)
                        continue; // ignore the ones with nothing in it
                    // for each value in the new cache, find the matching value in the old one
                    const oldCachedEntry = currentCache.find((e) => e.studentId === newCacheValue.studentId);
                    if (!oldCachedEntry)
                        continue; // no cache entry doesn't exist, return
                    // preserve old nfc values if there are no new nfc values
                    if (oldCachedEntry.nfcId !== newCacheValue.nfcId && newCacheValue.nfcId === '') {
                        // update the cache to use the old nfc values
                        yield PrismaClient_1.default.studentInformation.update({
                            where: {
                                id: newCacheValue.id,
                            },
                            data: {
                                nfcId: oldCachedEntry.nfcId,
                            },
                        });
                    }
                }
                console.log('Reconciled student infos. ');
            }
            catch (err) {
                console.log("Couldn't reconcile student infos");
                this.mode = 'OFFLINE';
                throw err;
            }
        });
    }
    // fully rebuild student info cache from the Sheets
    rebuildStudentInfoCache() {
        return __awaiter(this, void 0, void 0, function* () {
            // retrieve all values from sheets
            let response;
            try {
                response = yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                });
                console.log('Obtained student info cache for rebuilding');
            }
            catch (err) {
                console.log("Couldn't load all student info for rebuilding");
                this.mode = 'OFFLINE';
                throw err;
            }
            const values = response.data.values;
            console.log('Deleting all student info cache...');
            // delete ALL student info
            yield this.infoDbCache.deleteAll();
            // copy all sheets data into student info db
            try {
                if (values) {
                    yield PrismaClient_1.default.studentInformation.createMany({
                        data: values.map((e) => (Object.assign({}, rowToStudentInfo(e)))),
                    });
                }
                console.log('Rebuilt all student info cache');
            }
            catch (err) {
                console.log(`Error rebuilding student info cache: ${err}`);
                throw err;
            }
        });
    }
    // bind a student id to an nfc id
    bindStudentId(studentId, nfcId) {
        return __awaiter(this, void 0, void 0, function* () {
            // store nfc cache into db if using cache
            if (useNFCCache)
                return yield this.bindOfflineStudentId(studentId, nfcId);
            try {
                // attempt to bind student id to nfc id
                yield this.bindOnlineStudentIds([{ studentId, nfcId, id: -1 }]);
                // update the local student info database with new bound data
                console.log(`Student id ${studentId} successfully linked to NFC id ${nfcId}`);
                const foundInfo = yield PrismaClient_1.default.studentInformation.findFirst({
                    where: {
                        studentId,
                    },
                });
                if (!foundInfo)
                    return;
                yield PrismaClient_1.default.studentInformation.update({
                    where: {
                        id: foundInfo.id,
                    },
                    data: {
                        nfcId: nfcId,
                    },
                });
                console.log(`Updated StudentInfo DB to reflect NFC ID change`);
            }
            catch (err) {
                // error occurred, switch to offline mode and bind the student id offline
                console.log('Error occurred linking NFC ID to student ID: ' + err);
                this.mode = 'OFFLINE';
                yield this.bindOfflineStudentId(studentId, nfcId);
            }
        });
    }
    // attempt to push nfc changes to sheets
    bindOnlineStudentIds(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            // build new student info sheets values with changed nfc value
            const values = [];
            for (const info of yield this.infoDbCache.getCachedStudentInfo()) {
                const change = changes.find((e) => e.studentId === info.studentId);
                if (change)
                    info.nfcId = change.nfcId;
                values.push(studentInfoToRow(info));
            }
            // update sid sheets values
            yield ServiceAccount_1.SheetInstance.spreadsheets.values.update({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
                requestBody: { values },
                valueInputOption: 'RAW',
            });
        });
    }
    // add student id binding request to nfc changes db
    bindOfflineStudentId(studentId, nfcId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Attempting to bind student id offline');
            // add nfc change request into nfcChange db
            yield PrismaClient_1.default.nFCChange.create({
                data: {
                    studentId: studentId,
                    nfcId: nfcId,
                },
            });
            // update student info cache db with new nfc data
            const foundInfo = yield PrismaClient_1.default.studentInformation.findFirst({
                where: {
                    studentId,
                },
            });
            if (!foundInfo)
                return;
            yield PrismaClient_1.default.studentInformation.update({
                where: {
                    id: foundInfo.id,
                },
                data: {
                    nfcId: nfcId,
                },
            });
            console.log(`Student ID ${studentId} bound to nfc id ${nfcId} OFFLINE`);
        });
    }
    // flush all cached nfc changes in the nfc changes db and post entries online
    flushCachedNFCChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            // retrieve cached nfc data from db
            const entries = yield this.nfcDbCache.getCachedNFCChanges();
            try {
                console.log(`Flushing cached student infos...`);
                // post nfc changes online
                yield this.bindOnlineStudentIds(entries);
                console.log(`Flushed cached student infos`);
                console.log('Clearing attendance cache...');
                // clear nfc changes db
                yield this.nfcDbCache.deleteAll();
            }
            catch (err) {
                console.log('Error flushing cached attendance. ');
                throw err;
            }
        });
    }
}
const siManager = new StudentInfoManager();
exports.default = siManager;
