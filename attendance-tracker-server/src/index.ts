import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Response, Request } from 'express';
import AttendanceManager from './AttendanceManager';
import StudentInfoManager from './StudentInfoManager';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';

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

const handleErrors = (err: any, req: Request, res: Response, next: (err: any) => void) => {
    console.error('error occurred: ', err.message);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: err.message }).end();
};

const attdManager = new AttendanceManager();
const siManager = new StudentInfoManager();

server.listen(8080, () => {
    console.log(`listening on *:8080`);
});

app.get('/studentInfo/sid', async (req, res) => {
    const { id } = req.query;

    console.log('Student info by ID: ', id);

    const info = await siManager.getStudentInfoBySID(id as string);

    res.status(info ? 200 : 404)
        .send(info)
        .end();
});

app.get('/studentInfo/nfc', async (req, res) => {
    const { id } = req.query;
    console.log('Student info by NFC ID: ', id);
    const info = await siManager.getStudentInfoByNFCID(id as string);

    res.status(info ? 200 : 404)
        .send(info)
        .end();
});

app.post('/studentInfo/bind', async (req, res) => {
    const { studentId, nfcId } = req.body;

    console.log('Binding Student with NFC: ', studentId, nfcId);

    try {
        await siManager.bindStudentId(studentId, nfcId);
        res.status(200).end();
    } catch (err) {
        res.status(401).end();
    }
});

app.get('/studentInfo/load', async (req, res) => {
    console.log('Loading student info...');
    await siManager.loadAllStudentInfo();
    res.status(200).end();
});

app.get('/studentInfo/online', async (req, res) => {
    res.status(200)
        .send({ online: siManager.mode === 'ONLINE' })
        .end();
});

app.post('/studentInfo/changesCache/flush', async (req, res, next) => {
    console.log('Flushing NFC change...');
    siManager
        .flushCachedInfoChanges()
        .then(() => {
            res.status(200).end();
        })
        .catch(next);
});

app.get('/studentInfo/changesCache', async (req, res) => {
    console.log('Getting NFC change cache...');
    const entries = await siManager.getCachedStudentChanges();
    res.status(200).send(entries).end();
});

app.post('/studentInfo/changesCache/clear', async (req, res) => {
    console.log('Clearing NFC change cache...');
    await siManager.clearInfoChangeCache();
    res.status(200).end();
});

app.get('/studentInfo/siCache', async (req, res) => {
    console.log('Getting student info cache...');
    const entries = await siManager.getCachedStudentInfo();
    res.status(200).send(entries).end();
});

app.post('/studentInfo/siCache/rebuild', async (req, res) => {
    console.log('Clearing student info cache...');
    await siManager.rebuildStudentInfoCache();
    res.status(200).end();
});

// ATTENDANCE

app.get('/attendance/online', async (req, res) => {
    res.status(200)
        .send({ online: attdManager.mode === 'ONLINE' })
        .end();
});

app.post('/attendance/push', async (req, res) => {
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

app.post('/attendance/cache/flush', async (req, res, next) => {
    console.log('Flushing attendance...');
    attdManager
        .flushCachedAttendance()
        .then(() => {
            res.status(200).end();
        })
        .catch(next);
});

app.get('/attendance/cache', async (req, res) => {
    console.log('Getting attendance cache...');
    const entries = await attdManager.getAllCacheEntries();
    res.status(200).send(entries).end();
});

app.post('/attendance/cache/clear', async (req, res) => {
    console.log('Clearing attendance cache...');
    await attdManager.clearAttendanceCache();
    res.status(200).end();
});

app.post('/getBackOnline', async (req, res) => {
    attdManager.mode = 'ONLINE';
    siManager.mode = 'ONLINE';
    await siManager.loadAllStudentInfo();
    await attdManager.testOnlineStatus();
    res.status(200).end();
});

app.get('/adminpanel/verify', async (req, res) => {
    const { password } = req.query;
    console.log('Admin Panel access: ', process.env.ADMIN_PANEL_PW, password);
    res.status(200)
        .send(process.env.ADMIN_PANEL_PW === password)
        .end();
});

app.use(handleErrors);

console.log(`Running rfid script with python path: ${process.env.PYTHON_PATH}`);
const rfidProcess = spawn(process.env.PYTHON_PATH as string, ['./rfid/rfid.py']);
rfidProcess.stdout.on('data', (data) => {
    socketIO.emit('tag', data.toString());
    console.log('RFID Data received: ', data.toString());
});

socketIO.on('connection', (socket) => {
    console.log('socket connection established');
});
