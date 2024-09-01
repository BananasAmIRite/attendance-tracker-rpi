import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import AttendanceManager from './AttendanceManager';
import StudentInfoManager from './StudentInfoManager';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';

const userSheetId = process.env.USER_SHEET_ID;
const userSheetRange = process.env.USER_SHEET_RANGE;

const app = express();
const server = createServer(app);
const socketIO = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
    },
});

app.use(
    cors({
        origin: '*',
    })
);
app.use(bodyParser.json());

const attdManager = new AttendanceManager();
const siManager = new StudentInfoManager();

(async () => {
    console.log(await siManager.getStudentInfoBySID('Jason'));
})();

server.listen(8080, () => {
    console.log(`listening on *:8080`);
});

app.get('/studentInfo/sid', async (req, res) => {
    const { id } = req.query;

    console.log(id);

    const info = await siManager.getStudentInfoBySID(id as string);

    console.log(info);

    res.status(info ? 200 : 400)
        .send(info)
        .end();
});

app.get('/studentInfo/nfc', async (req, res) => {
    const { id } = req.query;
    console.log(id);
    const info = await siManager.getStudentInfoByNFCID(id as string);

    console.log(info);

    res.status(info ? 200 : 400)
        .send(info)
        .end();
});

app.post('/studentInfo/bind', async (req, res) => {
    const { studentId, nfcId } = req.body;

    try {
        await siManager.bindStudentId(studentId, nfcId);
        res.status(200).end();
    } catch (err) {
        res.status(401).end();
    }
});

app.get('/studentInfo/load', async (req, res) => {
    await siManager.loadAllStudentInfo();
    res.status(200).end();
});

app.get('/studentInfo/online', async (req, res) => {
    res.status(200)
        .send({ online: siManager.mode === 'ONLINE' })
        .end();
});

// ATTENDANCE

app.get('/attendance/online', async (req, res) => {
    res.status(200)
        .send({ online: attdManager.mode === 'ONLINE' })
        .end();
});

app.post('/attendance/push', async (req, res) => {
    const { studentId, dateTime } = req.body;
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

app.post('/attendance/cache/flush', async (req, res) => {
    console.log('flushing...');
    try {
        await attdManager.flushCachedAttendance();
        res.status(200).end();
    } catch (err: any) {
        res.status(501).send(err.message).end();
    }
});

app.get('/attendance/cache', async (req, res) => {
    const entries = await attdManager.getAllCacheEntries();
    res.status(200).send(entries).end();
});

app.post('/attendance/cache/clear', async (req, res) => {
    await attdManager.clearAttendanceCache();
    res.status(200).end();
});

const rfidProcess = spawn('python', ['./rfid/rfid.py']);
rfidProcess.stdout.on('data', (data) => {
    socketIO.emit('tag', data.toString());
    console.log(data.toString());
});

// read rfid (ws connection)
socketIO.on('connection', (socket) => {
    console.log('socket connection established');
    // socket.on('disconnect', () => {
    //     rfidProcess.kill();
    // });
});
