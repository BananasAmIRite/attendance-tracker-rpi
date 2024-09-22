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
const ServiceAccount_1 = require("./ServiceAccount");
const rowToStudentInfo = (row) => ({
    studentId: row[0],
    firstName: row[1],
    lastName: row[2],
    nfcId: row[3],
    attendancePercent: row[4],
});
// hello
const studentInfoToRow = (info) => [info.studentId, info.firstName, info.lastName, info.nfcId, info.attendancePercent];
class StudentInfoManager {
    constructor() {
        this.studentInfoCache = [];
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
            if (this.mode === 'ONLINE') {
                let response;
                try {
                    response = yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                        spreadsheetId: this.sheetId,
                        range: this.sheetRange,
                    });
                }
                catch (err) {
                    this.mode = 'OFFLINE';
                    return this.getStudentInfo(onlineQualifier, offlineQualifier);
                }
                const values = response.data.values;
                if (values) {
                    for (const row of values) {
                        if (onlineQualifier(row))
                            return rowToStudentInfo(row);
                    }
                }
            }
            else {
                // offline mode
                for (const info of this.studentInfoCache) {
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
            let response;
            try {
                response = yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                });
            }
            catch (err) {
                this.mode = 'OFFLINE';
                return;
            }
            const values = response.data.values;
            this.studentInfoCache = [];
            if (values) {
                for (const row of values) {
                    this.studentInfoCache.push(rowToStudentInfo(row));
                }
            }
        });
    }
    bindStudentId(studentId, nfcId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.loadAllStudentInfo();
                const values = [];
                for (const info of this.studentInfoCache) {
                    if (info.studentId === studentId)
                        info.nfcId = nfcId;
                    values.push(studentInfoToRow(info));
                }
                ServiceAccount_1.SheetInstance.spreadsheets.values.update({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                    requestBody: { values },
                    valueInputOption: 'RAW',
                });
                console.log(`Student id ${studentId} successfully linked to NFC id ${nfcId}`);
            }
            catch (err) {
                this.mode = 'OFFLINE';
            }
        });
    }
}
exports.default = StudentInfoManager;
