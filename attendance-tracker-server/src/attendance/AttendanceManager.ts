import prisma from '../PrismaClient';
import { createSingleA1Range } from '../util/SheetUtils';
import SheetCache from '../SheetCache';
import AttendanceDBCache from './AttendanceDBCache';
import { SheetInstance } from '../ServiceAccount';

export interface AttendanceEntry {
    studentId: string;
    date: string;
    time: string;
    id?: number;
}

// config for whether to automatically upload to the attendance cache by default or not
const useAttdCache = process.env.USE_ATTD_CACHE_DEFAULT === 'true';
console.log(`Config: Using attendance cache by default set to ${useAttdCache}`);

class AttendanceManager {
    // sheet id housing attendance sheet
    private sheetId: string = process.env.ATTD_SHEET_ID as string;
    // sheet names for the sheets containing scan-in and scan-out times
    private inSheetRange: string = process.env.ATTD_SHEET_RANGE_IN as string;
    private outSheetRange: string = process.env.ATTD_SHEET_RANGE_OUT as string;

    // in-memory attendance sheet cache, used so we don't have to query information from the sheet when uploading data
    private inSheetCache!: SheetCache;

    // database cache for any values that failed to upload
    public readonly dbCache: AttendanceDBCache = new AttendanceDBCache();

    /** attendance upload mode
     *
     * 'ONLINE' - upload directly to google sheets
     * 'OFFLINE' - upload to DB cache and to sheets later on
     *
     **/
    public mode: 'ONLINE' | 'OFFLINE' = 'ONLINE';

    public constructor() {}

    // load in-memory cache of the attendance sheet
    public async loadSheetCache() {
        this.inSheetCache = new SheetCache(this.sheetId, this.inSheetRange);
        console.log('Getting attendance sheet data');
        await this.inSheetCache.load();
        console.log('Retrieved attendance sheet data. ');
    }

    // post attendance entry for a specific student to either sheets or attendance db based on mode
    public async postAttendanceEntry(studentId: string, date: string, time: string) {
        // upload online if we're online and we aren't defaulting to using attendance cache
        if (this.mode === 'ONLINE' && !useAttdCache) {
            try {
                // upload online entry
                const errorVals = await this.postOnlineAttendanceEntries([{ studentId, date, time }]);
                // switch to offline if there exists a value that didn't make it to the sheet
                if (errorVals.length > 0)
                    throw new Error('Attendance uploading failed. Does this date exist on the sheet?');

                console.log(`Successfully posted attendance entry: ${studentId}, ${date}, ${time}`);
            } catch (err) {
                // error occurred and attendance entry wasn't uploaded; switch to offline mode and rerun the request
                console.log('Error occurred posting attendance entry. Switching to offline mode');
                console.log(`Error: ${err}`);
                this.mode = 'OFFLINE';
                await this.postAttendanceEntry(studentId, date, time);
            }
        } else {
            // offline mode; append entry to attendance db cache
            await this.dbCache.addCacheEntry({ studentId, date, time });
            console.log('Attendance entry appended to cache. ');
        }
    }

    // post an entry ONLINE
    private async postOnlineAttendanceEntries(entries: AttendanceEntry[]): Promise<AttendanceEntry[]> {
        const attdSheetData = this.inSheetCache.getCache();

        // get dates and indices for each date
        const datesArr = attdSheetData[0];
        if (!datesArr) throw new Error("Dates array doesn't have any values :(");
        const dates = new Set(entries.map((e) => e.date));
        const dateIndices = Array.from(dates).map((e) => datesArr.findIndex((f) => f === e));
        const dateIndexMap = Array.from(dates).map((e, i) => ({ date: e, index: dateIndices[i] }));

        // get student ids as well
        const students = attdSheetData.map((e) => e[0]);
        if (!students) throw new Error('No students found');

        const erroredValues: AttendanceEntry[] = [];
        const rangesToQuery: { data: { range: string; values: any[][] }; row: number; col: number }[] = [];

        // go through each entry and find row + column
        for (const entry of entries) {
            const row = students.findIndex((e) => e === entry.studentId);
            const col = dateIndexMap.find((e) => e.date === entry.date)!.index;
            if (col === -1) {
                // date not found, don't upload value and append to the values that errored
                erroredValues.push(entry);
                continue;
            }

            // use the scan out sheet if I already scanned in or there's already a value for scanning in
            const sheetRange =
                attdSheetData[row][col] || rangesToQuery.findIndex((e) => e.row === row && e.col === col) !== -1
                    ? this.outSheetRange
                    : this.inSheetRange;
            const range = createSingleA1Range(sheetRange, row, col);
            // add range to list of ranges to use
            rangesToQuery.push({
                data: {
                    range,
                    values: [[entry.time]],
                },
                row,
                col,
            });
        }

        console.log('Uploading data...');

        // make request to upload sheet and alter data in memory as well
        if (rangesToQuery.length === 1) await this.inSheetCache.updateSingle(rangesToQuery[0]);
        else await this.inSheetCache.batchUpdateSingle(rangesToQuery);
        console.log(
            `Uploaded data: ${rangesToQuery.length} value(s) uploaded, ${erroredValues.length} value(s) errored`
        );

        return erroredValues;
    }

    // check whether or not we're online by loading the sheet cache
    public async testOnlineStatus(): Promise<boolean> {
        try {
            await this.loadSheetCache();
            this.mode = 'ONLINE';
            return true;
        } catch (err) {
            this.mode = 'OFFLINE';
            return false;
        }
    }

    // flush all cached attendance in the attendance cache db by posting entries online
    public async flushCachedAttendance() {
        // get entries in the db cache
        const entries = await this.dbCache.getCachedAttendance();
        try {
            console.log(`Flushing cached attendance...`);
            // post all entries in a batch
            const missedEntries = await this.postOnlineAttendanceEntries(entries);
            console.log(`Flushed cached attendance. There are ${missedEntries.length} entries left. `);

            console.log('Clearing attendance cache...');
            // delete all posted entries from db cache
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
}

const attdManager = new AttendanceManager();
export default attdManager;
