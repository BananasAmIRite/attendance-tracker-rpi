import { Attendance } from '@prisma/client';
import { SheetInstance } from './ServiceAccount';
import prisma from './PrismaClient';

export interface AttendanceEntry {
    studentId: string;
    date: string;
    time: string;
}

export default class AttendanceManager {
    private sheetId: string = process.env.ATTD_SHEET_ID as string;
    private sheetRange: string = process.env.ATTD_SHEET_RANGE as string;

    public mode: 'ONLINE' | 'OFFLINE' = 'ONLINE';

    public constructor() {}

    public async postAttendanceEntry(studentId: string, date: string, time: string) {
        if (this.mode === 'ONLINE') {
            try {
                await SheetInstance.spreadsheets.values.append({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[studentId, date, time]],
                    },
                });
            } catch (err) {
                console.log('Error occurred. Switching to offline mode');
                this.mode = 'OFFLINE';
                this.postAttendanceEntry(studentId, date, time);
            }
        } else {
            this.addCacheEntry({ studentId, date, time });
            console.log('Attendance entry appended to cache. ');
        }
    }

    private async postOnlineAttendanceEntry(studentId: string, date: string, time: string) {
        await SheetInstance.spreadsheets.values.append({
            spreadsheetId: this.sheetId,
            range: this.sheetRange,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[studentId, date, time]],
            },
        });
    }

    public async getAttendanceEntries(studentId: string) {
        if (this.mode === 'OFFLINE') return [];
        let response;
        try {
            response = await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
            });
        } catch (err) {
            this.mode = 'OFFLINE';
            return [];
        }

        const values = response.data.values;
        const entries: AttendanceEntry[] = [];

        if (!values) return [];
        for (const row of values) {
            if (row[0] !== studentId) continue;
            entries.push({
                studentId: row[0],
                date: row[1],
                time: row[2],
            });
        }

        return entries;
    }

    public async getCachedAttendance(): Promise<AttendanceEntry[]> {
        const entries = await this.getAllCacheEntries();
        const attdEntries: AttendanceEntry[] = [];

        for (const attd of entries)
            attdEntries.push({
                studentId: attd.studentId,
                date: attd.date,
                time: attd.time,
            });
        return attdEntries;
    }

    public async flushCachedAttendance() {
        try {
            const entries = await this.getCachedAttendance();
            for (const entry of entries) {
                this.postOnlineAttendanceEntry(entry.studentId, entry.date, entry.time);
            }
            this.clearAttendanceCache();
        } catch (err) {
            throw err;
        }
    }

    private async addCacheEntry(entry: AttendanceEntry) {
        await prisma.attendance.create({
            data: {
                studentId: entry.studentId,
                date: entry.date,
                time: entry.time,
            },
        });
    }

    public async getAllCacheEntries(): Promise<Attendance[]> {
        console.log('querying cache');
        return prisma.attendance.findMany();
    }

    public async clearAttendanceCache() {
        console.log('clearing cache');
        await prisma.attendance.deleteMany({
            where: {},
        });
    }
}
