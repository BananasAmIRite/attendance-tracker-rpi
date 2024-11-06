import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Response, Request } from 'express';
import attdManager from './attendance/AttendanceManager';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import { initJWT } from './ServiceAccount';
import { resolve } from 'dns/promises';
import siManager from './studentinfo/StudentInfoManager';
import StudentInfoRouter from './routes/studentInfo/StudentInfo.route';
import AttendanceRouter from './routes/attendance/Attendance.route';
import scheduler from './TaskScheduler';
import { SimpleIntervalJob, Task } from 'toad-scheduler';

// ---- WEB APP ----

// set up web app and websocket
const app = express();
const server = createServer(app);
const socketIO = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
    },
});
socketIO.on('connection', (socket) => {
    console.log(`socket connection established: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`socket disconnected: ${socket.id}`);
    });
});

// allow any origin to request data
app.use(
    cors({
        origin: '*',
    })
);
// parse request bodies into json
app.use(bodyParser.json());

const checkOnline = async () => {
    try {
        // if we can resolve google.com then we're online
        await resolve('www.google.com');
        attdManager.mode = 'ONLINE';
        siManager.mode = 'ONLINE';
        // set up online stuff
        await initJWT();
        await attdManager.loadSheetCache();
    } catch (err) {
        attdManager.mode = 'OFFLINE';
        siManager.mode = 'OFFLINE';
    }
};

// routes
app.use('/studentInfo', StudentInfoRouter);
app.use('/attendance', AttendanceRouter);

// error handling
const handleErrors = (err: any, req: Request, res: Response, next: (err: any) => void) => {
    console.error('error occurred: ', err.message);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: err.message }).end();
};

// get back online by resolving a common address
app.post('/getBackOnline', async (req, res) => {
    await checkOnline();
    res.status(200).end();
});

// verify admin panel password
app.get('/adminpanel/verify', async (req, res) => {
    // retrieve password from query
    const { password } = req.query;
    console.log('Admin Panel access: ', process.env.ADMIN_PANEL_PW, password);
    // send back whether or not the pw is correct
    res.status(200)
        .send(process.env.ADMIN_PANEL_PW === password)
        .end();
});

app.get('/isScanOnly', async (req, res) => {
    console.log('Checking scan only: ' + process.env.SCAN_ONLY);
    res.status(200)
        .send(process.env.SCAN_ONLY === 'true')
        .end();
});

// error handling
app.use(handleErrors);

// start the server
server.listen(8080, () => {
    console.log(`listening on *:8080`);
});

// ---- NFC PROCESSING ----

// spawn the python process to communicate rfid data
console.log(`Running rfid script with python path: ${process.env.PYTHON_PATH}`);
const rfidProcess = spawn(process.env.PYTHON_PATH as string, ['./rfid/rfid.py']);
rfidProcess.stdout.on('data', (data) => {
    const [type, value] = data.toString().split(':');
    if (type === 'STAT') socketIO.emit('status', value === 'ONLINE');
    if (type === 'ID') socketIO.emit('tag', value);
    console.log('RFID Data received: ', data.toString());
});

scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
        { seconds: 60 * 10 },
        new Task('online-check', async () => {
            try {
                console.log('Checking online...');
                await checkOnline();
            } catch (err) {
                console.log('Error checking online:', err);
            }
        })
    )
);

// set up online stuff if we're online
checkOnline();
