import { SimpleIntervalJob, Task, ToadScheduler } from 'toad-scheduler';
import { AttendanceManager } from './AttendanceManager';
import scheduler from '../TaskScheduler';

// parse the auto upload attendnace string into a runnable method to determine if we should upload or not
const parseAutoUploadCriteria = (criteria: string): ((mgr: AttendanceManager) => Promise<boolean>) => {
    // parse data by separation
    const data = criteria.split('|');
    if (data[0] === 'space') {
        // based on space, get max entries, determine if max entries is met
        const maxEntries = parseInt(data[1]);
        return async (mgr: AttendanceManager) => (await mgr.dbCache.getAllCacheEntries()).length >= maxEntries;
    } else if (data[0] === 'time') {
        // based on time, determine if we should upload or not
        const timeMins = parseInt(data[1]);
        let lastRunTime = Date.now();
        return async (mgr: AttendanceManager) => {
            // ONLY upload if timer has passed AND we actually have entries to upload
            if (
                (Date.now() - lastRunTime) / 1000 / 60 >= timeMins &&
                (await mgr.dbCache.getAllCacheEntries()).length > 0
            ) {
                lastRunTime = Date.now();
                return true;
            }
            return false;
        };
    }
    return async () => false;
};

const autoUploadCriteria = parseAutoUploadCriteria(process.env.AUTO_UPLOAD_ATTENDANCE as string);

// manages flushing the cache for attendance
export default class AttendanceCacheFlusher {
    // whether or not we're already currently flushing (we don't wanna send multiple requests)
    private isFlushing: boolean = false;

    // scheduler for automatic flushing
    private attdUploadScheduler: ToadScheduler = scheduler;

    public constructor(private attdMgr: AttendanceManager) {}

    // start flushing attendance automatically
    public startAutomaticFlush() {
        this.attdUploadScheduler.addSimpleIntervalJob(
            new SimpleIntervalJob(
                { seconds: 60 },
                new Task('attd-flush-check', async () => {
                    // check auto uploading criteria; if met, try flushing
                    if (await autoUploadCriteria(this.attdMgr)) {
                        console.log('Auto-upload criteria met; attempting to upload...');
                        // auto upload criteria met, upload (WITHOUT waiting for it to finish)
                        this.flush().catch((err) => {
                            console.log('Error when auto flushing: ', err.message);
                        });
                    }
                })
            )
        );

        console.log('Started automatic flush checker');
    }

    // flushes attendance asyncrhonousl
    public async flush() {
        if (this.isFlushing) throw new Error('There is already an upload in progress!');
        // reload sheet cache and reflush cached attendance in parallel with other program tasks
        await this.flushCachedAttendance();
    }

    // flush all cached attendance in the attendance cache db by posting entries online
    private async flushCachedAttendance() {
        try {
            this.isFlushing = true; // prevent any other flushes (including automatic ones) happening during this time
            // reload sheet cache
            await this.attdMgr.loadSheetCache();
            // get entries in the db cache
            const entries = await this.attdMgr.dbCache.getCachedAttendance();
            console.log(`Flushing cached attendance...`);
            // post all entries in a batch
            const uploadedEntries = await this.attdMgr.postOnlineAttendanceEntries(entries);
            console.log(`Flushed cached attendance. Uploaded ${uploadedEntries.length} entries. `);

            console.log('Clearing attendance cache...');
            // delete all posted entries from db cache
            await this.attdMgr.dbCache.removeAllIncluding(uploadedEntries.map((e) => e.id ?? -1));

            console.log('Cleared attendance cache.');
            this.isFlushing = false;
        } catch (err) {
            this.isFlushing = false;
            console.log('Error flushing cached attendance. ');
            throw err;
        }
    }
}
