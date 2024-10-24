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
// stores and retrieves cached data for student information
class StudentInfoDBCache {
    // clears all data in student info cache
    clearInfoChangeCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield PrismaClient_1.default.nFCChange.deleteMany({
                where: {},
            });
        });
    }
    // get all cached data
    getCachedStudentInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            // get entries from database
            const entries = yield PrismaClient_1.default.studentInformation.findMany();
            // convert them to StudentInfo's
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
    // clear cached data database
    deleteAll() {
        return __awaiter(this, void 0, void 0, function* () {
            yield PrismaClient_1.default.studentInformation.deleteMany({
                where: {},
            });
        });
    }
}
exports.default = StudentInfoDBCache;
