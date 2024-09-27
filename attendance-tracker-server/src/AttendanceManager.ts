import { Attendance } from '@prisma/client';
import { SheetInstance } from './ServiceAccount';
import prisma from './PrismaClient';
import { createSingleA1Range } from './util/SheetUtils';

export interface AttendanceEntry {
    studentId: string;
    date: string;
    time: string;
    id?: number;
}

const useAttdCache = process.env.USE_ATTD_CACHE_DEFAULT === 'true';
console.log(`Config: Using attendance cache by default set to ${useAttdCache}`);

export default class AttendanceManager {
    private sheetId: string = process.env.ATTD_SHEET_ID as string;
    private inSheetRange: string = process.env.ATTD_SHEET_RANGE_IN as string;
    private outSheetRange: string = process.env.ATTD_SHEET_RANGE_OUT as string;

    public mode: 'ONLINE' | 'OFFLINE' = 'ONLINE';

    public constructor() {}

    public async postAttendanceEntry(studentId: string, date: string, time: string) {
        if (this.mode === 'ONLINE' && !useAttdCache) {
            try {
                const errorVals = await this.postOnlineAttendanceEntries([{ studentId, date, time }]);
                if (errorVals.length > 0)
                    throw new Error('Attendance uploading failed. Does this date exist on the sheet?');
                console.log(`Successfully posted attendance entry: ${studentId}, ${date}, ${time}`);
            } catch (err) {
                console.log('Error occurred posting attendance entry. Switching to offline mode');
                console.log(`Error: ${err}`);
                this.mode = 'OFFLINE';
                await this.postAttendanceEntry(studentId, date, time);
            }
        } else {
            await this.addCacheEntry({ studentId, date, time });
            console.log('Attendance entry appended to cache. ');
        }
    }

    private async postOnlineAttendanceEntries(entries: AttendanceEntry[]): Promise<AttendanceEntry[]> {
        // get dates and indices for each date
        console.log('Getting attendance sheet data');
        const attdSheetData = (
            await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.inSheetRange,
            })
        ).data.values;
        console.log('Retrieve attendance sheet data. Parsing...');
        const datesArr = attdSheetData?.[0];
        if (!datesArr) throw new Error("Dates array doesn't have any values :(");
        const dates = new Set(entries.map((e) => e.date));
        const dateIndices = Array.from(dates).map((e) => datesArr.findIndex((f) => f === e));
        const dateIndexMap = Array.from(dates).map((e, i) => ({ date: e, index: dateIndices[i] }));

        // get student ids as well
        const students = attdSheetData.map((e) => e[0]);
        if (!students) throw new Error('No students found');

        const erroredValues: AttendanceEntry[] = [];
        const rangesToQuery: { range: string; values: any[][]; row: number; col: number }[] = [];

        // go through each entry and find row + column
        for (const entry of entries) {
            const row = students.findIndex((e) => e === entry.studentId);
            const col = dateIndexMap.find((e) => e.date === entry.date)!.index;
            if (col === -1) {
                // date not found
                erroredValues.push(entry);
                continue;
            }

            const sheetRange =
                attdSheetData[row][col] || rangesToQuery.findIndex((e) => e.row === row && e.col === col)
                    ? this.outSheetRange
                    : this.inSheetRange; // use the scan out sheet if I already scanned in
            const range = createSingleA1Range(sheetRange, row, col);
            // add range to list of ranges to use
            rangesToQuery.push({
                range,
                values: [[entry.time]],
                row,
                col,
            });
        }

        console.log('Uploading data...');

        await SheetInstance.spreadsheets.values.batchUpdate({
            spreadsheetId: this.sheetId,
            requestBody: {
                data: rangesToQuery,
                valueInputOption: 'RAW',
            },
        });
        console.log('Uploaded data.');

        return erroredValues;
    }

    public async testOnlineStatus(): Promise<boolean> {
        try {
            await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.inSheetRange,
            });
            this.mode = 'ONLINE';
            return true;
        } catch (err) {
            this.mode = 'OFFLINE';
            return false;
        }
    }

    public async getCachedAttendance(): Promise<AttendanceEntry[]> {
        const entries = await this.getAllCacheEntries();
        const attdEntries: AttendanceEntry[] = [];

        for (const attd of entries)
            attdEntries.push({
                studentId: attd.studentId,
                date: attd.date,
                time: attd.time,
                id: attd.id,
            });
        return attdEntries;
    }

    public async flushCachedAttendance() {
        const entries = await this.getCachedAttendance();
        try {
            console.log(`Flushing cached attendance...`);
            const missedEntries = await this.postOnlineAttendanceEntries(entries);
            console.log(`Flushed cached attendance. There are ${missedEntries.length} entries left. `);

            console.log('Clearing attendance cache...');
            await prisma.attendance.deleteMany({
                where: {
                    id: {
                        notIn: missedEntries.map((e) => e.id ?? -1),
                    },
                },
            });
            console.log('Cleared attendance cache.');
        } catch (err) {
            console.log('Error flushing cached attendance. ');
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
        return await prisma.attendance.findMany();
    }

    public async clearAttendanceCache() {
        await prisma.attendance.deleteMany({
            where: {},
        });
    }
}
