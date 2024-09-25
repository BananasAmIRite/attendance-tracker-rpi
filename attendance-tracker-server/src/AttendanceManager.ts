import { Attendance } from '@prisma/client';
import { SheetInstance } from './ServiceAccount';
import prisma from './PrismaClient';

export interface AttendanceEntry {
    studentId: string;
    date: string;
    time: string;
}

const useAttdCache = process.env.USE_ATTD_CACHE_DEFAULT === 'true';
console.log(`Config: Using attendance cache by default set to ${useAttdCache}`);

export default class AttendanceManager {
    private sheetId: string = process.env.ATTD_SHEET_ID as string;
    private sheetRange: string = process.env.ATTD_SHEET_RANGE as string;

    public mode: 'ONLINE' | 'OFFLINE' = 'ONLINE';

    public constructor() {}

    public async postAttendanceEntry(studentId: string, date: string, time: string) {
        if (this.mode === 'ONLINE' && !useAttdCache) {
            try {
                await SheetInstance.spreadsheets.values.append({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[studentId, date, time]],
                    },
                });
                console.log(`Successfully posted attendance entry: ${studentId}, ${date}, ${time}`);
            } catch (err) {
                console.log('Error occurred posting attendance entry. Switching to offline mode');
                console.log(`Error: ${err}`);
                this.mode = 'OFFLINE';
                this.postAttendanceEntry(studentId, date, time);
            }
        } else {
            this.addCacheEntry({ studentId, date, time });
            console.log('Attendance entry appended to cache. ');
        }
    }

    private async postOnlineAttendanceEntries(entries: AttendanceEntry[]) {
        try {
            await SheetInstance.spreadsheets.values.append({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
                valueInputOption: 'RAW',
                requestBody: {
                    values: entries.map((e) => [e.studentId, e.date, e.time]),
                },
            });
        } catch (err: any) {
            console.log(`Error posting online attendance entry: ${err}`);
            throw err;
        }
    }

    public async testOnlineStatus(): Promise<boolean> {
        try {
            await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
            });
            this.mode = 'ONLINE';
            return true;
        } catch (err) {
            this.mode = 'OFFLINE';
            return false;
        }
    }

    public async getAttendanceEntries(studentId: string) {
        if (this.mode === 'OFFLINE') return [];
        let response;
        try {
            response = await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
            });
            console.log('Got attendance entries successfully');
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
        const entries = await this.getCachedAttendance();
        try {
            console.log(`Flushing cached attendance...`);
            await this.postOnlineAttendanceEntries(entries);
            console.log(`Flushed cached attendance`);
        } catch (err) {
            console.log('Error flushing cached attendance. ');
            throw err;
        }

        console.log('Clearing attendance cache...');
        await this.clearAttendanceCache();
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
        return await prisma.attendance.findMany();
    }

    public async clearAttendanceCache() {
        await prisma.attendance.deleteMany({
            where: {},
        });
    }
}
