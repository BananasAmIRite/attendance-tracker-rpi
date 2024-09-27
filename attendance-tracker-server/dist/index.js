"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const AttendanceManager_1 = __importDefault(require("./AttendanceManager"));
const StudentInfoManager_1 = __importDefault(require("./StudentInfoManager"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const child_process_1 = require("child_process");
const ServiceAccount_1 = require("./ServiceAccount");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const socketIO = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:3000',
    },
});
app.use((0, cors_1.default)({
    origin: '*',
}));
app.use(body_parser_1.default.json());
const handleErrors = (err, req, res, next) => {
    console.error('error occurred: ', err.message);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: err.message }).end();
};
const attdManager = new AttendanceManager_1.default();
const siManager = new StudentInfoManager_1.default();
server.listen(8080, () => {
    console.log(`listening on *:8080`);
});
app.get('/studentInfo/sid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    console.log('Student info by ID: ', id);
    const info = yield siManager.getStudentInfoBySID(id);
    res.status(info ? 200 : 404)
        .send(info)
        .end();
}));
app.get('/studentInfo/nfc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    console.log('Student info by NFC ID: ', id);
    const info = yield siManager.getStudentInfoByNFCID(id);
    res.status(info ? 200 : 404)
        .send(info)
        .end();
}));
app.post('/studentInfo/bind', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, nfcId } = req.body;
    console.log('Binding Student with NFC: ', studentId, nfcId);
    try {
        yield siManager.bindStudentId(studentId, nfcId);
        res.status(200).end();
    }
    catch (err) {
        res.status(401).end();
    }
}));
app.get('/studentInfo/load', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Loading student info...');
    yield siManager.loadAllStudentInfo();
    res.status(200).end();
}));
app.get('/studentInfo/online', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200)
        .send({ online: siManager.mode === 'ONLINE' })
        .end();
}));
app.post('/studentInfo/changesCache/flush', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Flushing NFC change...');
    siManager
        .flushCachedInfoChanges()
        .then(() => {
        res.status(200).end();
    })
        .catch(next);
}));
app.get('/studentInfo/changesCache', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Getting NFC change cache...');
    const entries = yield siManager.getCachedStudentChanges();
    res.status(200).send(entries).end();
}));
app.post('/studentInfo/changesCache/clear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Clearing NFC change cache...');
    yield siManager.clearInfoChangeCache();
    res.status(200).end();
}));
app.get('/studentInfo/siCache', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Getting student info cache...');
    const entries = yield siManager.getCachedStudentInfo();
    res.status(200).send(entries).end();
}));
app.post('/studentInfo/siCache/rebuild', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Clearing student info cache...');
    yield siManager.rebuildStudentInfoCache();
    res.status(200).end();
}));
// ATTENDANCE
app.get('/attendance/online', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200)
        .send({ online: attdManager.mode === 'ONLINE' })
        .end();
}));
app.post('/attendance/push', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, dateTime } = req.body;
    console.log('Pushing attendance:', studentId, dateTime);
    const date = new Date(dateTime);
    const formatTwoDigits = (n) => {
        return n < 10 ? '0' + n : n;
    };
    yield attdManager.postAttendanceEntry(studentId, `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, `${date.getHours() === 12 || date.getHours() === 0 ? 12 : date.getHours() % 12}:${formatTwoDigits(date.getMinutes())} ${date.getHours() >= 12 ? 'PM' : 'AM'}`);
    res.status(200).end();
}));
app.post('/attendance/cache/flush', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Flushing attendance...');
    attdManager
        .flushCachedAttendance()
        .then(() => {
        res.status(200).end();
    })
        .catch(next);
}));
app.get('/attendance/cache', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Getting attendance cache...');
    const entries = yield attdManager.getAllCacheEntries();
    res.status(200).send(entries).end();
}));
app.post('/attendance/cache/clear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Clearing attendance cache...');
    yield attdManager.clearAttendanceCache();
    res.status(200).end();
}));
app.post('/getBackOnline', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    attdManager.mode = 'ONLINE';
    siManager.mode = 'ONLINE';
    yield siManager.loadAllStudentInfo();
    yield attdManager.testOnlineStatus();
    res.status(200).end();
}));
app.get('/adminpanel/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.query;
    console.log('Admin Panel access: ', process.env.ADMIN_PANEL_PW, password);
    res.status(200)
        .send(process.env.ADMIN_PANEL_PW === password)
        .end();
}));
app.use(handleErrors);
console.log(`Running rfid script with python path: ${process.env.PYTHON_PATH}`);
const rfidProcess = (0, child_process_1.spawn)(process.env.PYTHON_PATH, ['./rfid/rfid.py']);
rfidProcess.stdout.on('data', (data) => {
    socketIO.emit('tag', data.toString());
    console.log('RFID Data received: ', data.toString());
});
ServiceAccount_1.serviceAccountAuth
    .authorize()
    .then((a) => {
    console.log('Authorized user. ');
})
    .catch((err) => {
    console.log("Couldn't authorize user. Transferring to offline mode...");
    attdManager.mode = 'OFFLINE';
    siManager.mode = 'OFFLINE';
});
socketIO.on('connection', (socket) => {
    console.log('socket connection established');
});
