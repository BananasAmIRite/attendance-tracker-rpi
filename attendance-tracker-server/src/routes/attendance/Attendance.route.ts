import { Router } from 'express';
import attdManager from '../../attendance/AttendanceManager';
import AttendanceCacheRouter from './cache/AttendanceCache.route';

// router for /attendance/
const AttendanceRouter = Router();

// link cache router
AttendanceRouter.use('/cache', AttendanceCacheRouter);

// get online mode
AttendanceRouter.get('/online', async (req, res) => {
    res.status(200)
        .send({ online: attdManager.mode === 'ONLINE' })
        .end();
});

// push a single attendance entry
AttendanceRouter.post('/push', async (req, res) => {
    const { studentId, dateTime } = req.body;

    console.log('Pushing attendance:', studentId, dateTime);
    const date = new Date(dateTime);
    const formatTwoDigits = (n: number) => {
        return n < 10 ? '0' + n : n;
    };
    await attdManager.postAttendanceEntry(
        studentId,
        `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
        `${date.getHours() === 12 || date.getHours() === 0 ? 12 : date.getHours() % 12}:${formatTwoDigits(
            date.getMinutes()
        )} ${date.getHours() >= 12 ? 'PM' : 'AM'}`
    );

    res.status(200).end();
});

export default AttendanceRouter;
