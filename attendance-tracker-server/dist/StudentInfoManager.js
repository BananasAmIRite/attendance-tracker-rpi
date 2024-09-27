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
const rowToStudentInfo = (row) => ({
    studentId: row[0],
    firstName: row[1],
    lastName: row[2],
    nfcId: row[3],
    attendancePercent: row[4],
});
// hello
const studentInfoToRow = (info) => [
    info.studentId,
    info.firstName,
    info.lastName,
    info.nfcId,
    // info.attendancePercent,
];
const useSICache = process.env.USE_SI_CACHE_DEFAULT === 'true';
const useNFCCache = process.env.USE_NFC_CACHE_DEFAULT === 'true';
console.log(`Config: Using student info cache by default set to ${useSICache}`);
console.log(`Config: Using NFC info cache by default set to ${useNFCCache}`);
class StudentInfoManager {
    constructor() {
        this.sheetId = process.env.USER_SHEET_ID;
        this.sheetRange = process.env.USER_SHEET_RANGE;
        this.mode = 'ONLINE';
    }
    getStudentInfoBySID(sid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getStudentInfo((row) => row[0] === sid, (info) => info.studentId === sid);
        });
    }
    getStudentInfoByNFCID(nfcId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getStudentInfo((row) => row[3] === nfcId, (info) => info.nfcId === nfcId);
        });
    }
    getStudentInfo(onlineQualifier, offlineQualifier) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('getting student info...');
            if (this.mode === 'ONLINE' && !useSICache) {
                let response;
                try {
                    response = yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                        spreadsheetId: this.sheetId,
                        range: this.sheetRange,
                    });
                }
                catch (err) {
                    console.log(`Error occurred while getting student info: ${err}. Retrying with offline mode`);
                    this.mode = 'OFFLINE';
                    return this.getStudentInfo(onlineQualifier, offlineQualifier);
                }
                const values = response.data.values;
                if (values) {
                    for (const row of values) {
                        if (onlineQualifier(row)) {
                            const studentInfo = rowToStudentInfo(row);
                            console.log(`Got student info: ${JSON.stringify(studentInfo)}`);
                            return studentInfo;
                        }
                    }
                }
            }
            else {
                // offline mode
                const cached = yield this.getCachedStudentInfo();
                for (const info of cached) {
                    if (offlineQualifier(info))
                        return info;
                }
            }
            return null;
        });
    }
    loadAllStudentInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mode !== 'ONLINE')
                return;
            try {
                console.log(`reconciling student infos...`);
                yield this.reconcileStudentCache();
                console.log('Reconciled student infos. ');
            }
            catch (err) {
                console.log("Couldn't reconcile student infos");
                this.mode = 'OFFLINE';
                return;
            }
        });
    }
    reconcileStudentCache() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    rebuildStudentInfoCache() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mode !== 'ONLINE')
                return;
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
                return;
            }
            const values = response.data.values;
            console.log('Deleting all student info cache...');
            // delete ALL student info
            yield PrismaClient_1.default.studentInformation.deleteMany({
                where: {},
            });
            try {
                if (values) {
                    for (const row of values) {
                        const dbRow = rowToStudentInfo(row);
                        // if (!dbRow.studentId) continue;
                        yield PrismaClient_1.default.studentInformation.create({
                            data: Object.assign({}, dbRow),
                        });
                    }
                }
                console.log('Rebuilt all student info cache');
            }
            catch (err) {
                console.log(`Error rebuilding student info cache: ${err}`);
            }
        });
    }
    bindStudentId(studentId, nfcId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (useNFCCache)
                return this.bindStudentIdOffline(studentId, nfcId);
            try {
                const values = [];
                for (const info of yield this.getCachedStudentInfo()) {
                    if (info.studentId === studentId)
                        info.nfcId = nfcId;
                    values.push(studentInfoToRow(info));
                }
                yield ServiceAccount_1.SheetInstance.spreadsheets.values.update({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                    requestBody: { values },
                    valueInputOption: 'RAW',
                });
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
                console.log('Error occurred linking NFC ID to student ID: ' + err);
                this.mode = 'OFFLINE';
                this.bindStudentIdOffline(studentId, nfcId);
            }
        });
    }
    bindOnlineStudentIds(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = [];
            for (const info of yield this.getCachedStudentInfo()) {
                const change = changes.find((e) => e.studentId === info.studentId);
                if (change)
                    info.nfcId = change.nfcId;
                values.push(studentInfoToRow(info));
            }
            yield ServiceAccount_1.SheetInstance.spreadsheets.values.update({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
                requestBody: { values },
                valueInputOption: 'RAW',
            });
        });
    }
    bindStudentIdOffline(studentId, nfcId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Attempting to bind student id offline');
            yield PrismaClient_1.default.nFCChange.create({
                data: {
                    studentId: studentId,
                    nfcId: nfcId,
                },
            });
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
        });
    }
    getCachedStudentInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield PrismaClient_1.default.studentInformation.findMany();
            const infoEntries = [];
            for (const info of entries)
                infoEntries.push({
                    studentId: info.studentId,
                    firstName: info.firstName,
                    lastName: info.lastName,
                    nfcId: info.nfcId,
                    attendancePercent: info.attendancePercent,
                });
            return infoEntries;
        });
    }
    getCachedStudentChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PrismaClient_1.default.nFCChange.findMany();
        });
    }
    flushCachedInfoChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this.getCachedStudentChanges();
            try {
                console.log(`Flushing cached student infos...`);
                yield this.postOnlineInfoChange(entries);
                console.log(`Flushed cached student infos`);
            }
            catch (err) {
                console.log('Error flushing cached attendance. ');
                throw err;
            }
            console.log('Clearing attendance cache...');
            yield this.clearInfoChangeCache();
        });
    }
    postOnlineInfoChange(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Posting online nfc changes...');
                yield this.bindOnlineStudentIds(changes);
            }
            catch (err) {
                console.log(`Error posting online nfc changes: ${err}`);
                throw err;
            }
        });
    }
    clearInfoChangeCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield PrismaClient_1.default.nFCChange.deleteMany({
                where: {},
            });
        });
    }
}
exports.default = StudentInfoManager;
