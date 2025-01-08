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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initJWT = exports.SheetInstance = exports.serviceAccountAuth = void 0;
const google_auth_library_1 = require("google-auth-library");
const sheets_1 = require("@googleapis/sheets");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const initJWT = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Initiating JWT and SheetInstance');
    exports.serviceAccountAuth = new google_auth_library_1.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: (_a = process.env.GOOGLE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    exports.SheetInstance = (0, sheets_1.sheets)({ version: 'v4', auth: exports.serviceAccountAuth });
    console.log('Loaded SheetInstance');
});
exports.initJWT = initJWT;
