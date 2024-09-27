import { Attendance } from '@prisma/client';
import prisma from '../PrismaClient';
import { AttendanceEntry } from './AttendanceManager';

export default class AttendanceDBCache {
    // add a cache entry into the database
    public async addCacheEntry(entry: AttendanceEntry) {
        await prisma.attendance.create({
            data: {
                studentId: entry.studentId,
                date: entry.date,
                time: entry.time,
            },
        });
    }

    // clear the attendance cache completely
    public async clearAttendanceCache() {
        await prisma.attendance.deleteMany({
            where: {},
        });
    }

    // get all (parsed) cache entries from the database
    public async getCachedAttendance(): Promise<AttendanceEntry[]> {
        // get all raw entries
        const entries = await this.getAllCacheEntries();
        const attdEntries: AttendanceEntry[] = [];

        // parse them into AttendanceEntry's
        for (const attd of entries)
            attdEntries.push({
                studentId: attd.studentId,
                date: attd.date,
                time: attd.time,
                id: attd.id,
            });
        return attdEntries;
    }

    // get all (raw) cache entries from the database
    public async getAllCacheEntries(): Promise<Attendance[]> {
        return await prisma.attendance.findMany();
    }
}
