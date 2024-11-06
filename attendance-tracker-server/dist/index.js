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
const AttendanceManager_1 = __importDefault(require("./attendance/AttendanceManager"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const child_process_1 = require("child_process");
const ServiceAccount_1 = require("./ServiceAccount");
const promises_1 = require("dns/promises");
const StudentInfoManager_1 = __importDefault(require("./studentinfo/StudentInfoManager"));
const StudentInfo_route_1 = __importDefault(require("./routes/studentInfo/StudentInfo.route"));
const Attendance_route_1 = __importDefault(require("./routes/attendance/Attendance.route"));
// ---- WEB APP ----
// set up web app and websocket
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const socketIO = new socket_io_1.Server(server, {
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
app.use((0, cors_1.default)({
    origin: '*',
}));
// parse request bodies into json
app.use(body_parser_1.default.json());
const checkOnline = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // if we can resolve google.com then we're online
        yield (0, promises_1.resolve)('www.google.com');
        AttendanceManager_1.default.mode = 'ONLINE';
        StudentInfoManager_1.default.mode = 'ONLINE';
        // set up online stuff
        yield (0, ServiceAccount_1.initJWT)();
        yield AttendanceManager_1.default.loadSheetCache();
    }
    catch (err) {
        AttendanceManager_1.default.mode = 'OFFLINE';
        StudentInfoManager_1.default.mode = 'OFFLINE';
    }
});
// routes
app.use('/studentInfo', StudentInfo_route_1.default);
app.use('/attendance', Attendance_route_1.default);
// error handling
const handleErrors = (err, req, res, next) => {
    console.error('error occurred: ', err.message);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: err.message }).end();
};
// get back online by resolving a common address
app.post('/getBackOnline', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield checkOnline();
    res.status(200).end();
}));
// verify admin panel password
app.get('/adminpanel/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // retrieve password from query
    const { password } = req.query;
    console.log('Admin Panel access: ', process.env.ADMIN_PANEL_PW, password);
    // send back whether or not the pw is correct
    res.status(200)
        .send(process.env.ADMIN_PANEL_PW === password)
        .end();
}));
app.get('/isScanOnly', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Checking scan only: ' + process.env.SCAN_ONLY);
    res.status(200)
        .send(process.env.SCAN_ONLY === 'true')
        .end();
}));
// error handling
app.use(handleErrors);
// start the server
server.listen(8080, () => {
    console.log(`listening on *:8080`);
});
// ---- NFC PROCESSING ----
// spawn the python process to communicate rfid data
console.log(`Running rfid script with python path: ${process.env.PYTHON_PATH}`);
const rfidProcess = (0, child_process_1.spawn)(process.env.PYTHON_PATH, ['./rfid/rfid.py']);
rfidProcess.stdout.on('data', (data) => {
    const [type, value] = data.toString().split(':');
    if (type === 'STAT')
        socketIO.emit('status', value === 'ONLINE');
    if (type === 'ID')
        socketIO.emit('tag', value);
    console.log('RFID Data received: ', data.toString());
});
// set up online stuff if we're online
checkOnline();
