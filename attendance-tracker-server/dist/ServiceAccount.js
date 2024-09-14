"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetInstance = exports.serviceAccountAuth = void 0;
const google_auth_library_1 = require("google-auth-library");
const sheets_1 = require("@googleapis/sheets");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.serviceAccountAuth = new google_auth_library_1.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (_a = process.env.GOOGLE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
exports.serviceAccountAuth.authorize().then((a) => {
    console.log('Authorized user. Access Token: ', a.access_token);
});
exports.SheetInstance = (0, sheets_1.sheets)({ version: 'v4', auth: exports.serviceAccountAuth });
