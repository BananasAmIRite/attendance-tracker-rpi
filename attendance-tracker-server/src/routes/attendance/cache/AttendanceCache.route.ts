import { Router } from 'express';
import attdManager from '../../../attendance/AttendanceManager';

const AttendanceCacheRouter = Router();

AttendanceCacheRouter.get('/', async (req, res) => {
    console.log('Getting attendance cache...');
    const entries = await attdManager.dbCache.getAllCacheEntries();
    res.status(200).send(entries).end();
});

AttendanceCacheRouter.post('/flush', async (req, res, next) => {
    console.log('Flushing attendance...');
    attdManager
        .flushCachedAttendance()
        .then(() => {
            res.status(200).end();
        })
        .catch(next);
});

AttendanceCacheRouter.post('/clear', async (req, res) => {
    console.log('Clearing attendance cache...');
    await attdManager.dbCache.clearAttendanceCache();
    res.status(200).end();
});

export default AttendanceCacheRouter;
