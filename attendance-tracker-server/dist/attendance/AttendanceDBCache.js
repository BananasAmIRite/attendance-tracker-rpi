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
class AttendanceDBCache {
    // add a cache entry into the database
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
    // clear the attendance cache completely
    clearAttendanceCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield PrismaClient_1.default.attendance.deleteMany({
                where: {},
            });
        });
    }
    // get all (parsed) cache entries from the database
    getCachedAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            // get all raw entries
            const entries = yield this.getAllCacheEntries();
            const attdEntries = [];
            // parse them into AttendanceEntry's
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
    // get all (raw) cache entries from the database
    getAllCacheEntries() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PrismaClient_1.default.attendance.findMany();
        });
    }
    // deletes all entries from cache that have ids in the provided array
    removeAllIncluding(entriesToRemove) {
        return __awaiter(this, void 0, void 0, function* () {
            yield PrismaClient_1.default.attendance.deleteMany({
                where: {
                    id: {
                        in: entriesToRemove,
                    },
                },
            });
        });
    }
}
exports.default = AttendanceDBCache;
