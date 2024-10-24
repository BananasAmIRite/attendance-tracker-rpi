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
const ServiceAccount_1 = require("./ServiceAccount");
// in-memory cache for sheets (used for Attendance)
class SheetCache {
    constructor(sheetId, sheetRange) {
        this.sheetId = sheetId;
        this.sheetRange = sheetRange;
        this.cache = [];
    }
    // load the values from the sheets into the cache
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = (yield ServiceAccount_1.SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
            })).data.values;
            if (!data)
                throw new Error('Error when loading sheets cache');
            this.cache = data;
        });
    }
    // update an array of single-celled values
    batchUpdateSingle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield ServiceAccount_1.SheetInstance.spreadsheets.values.batchUpdate({
                spreadsheetId: this.sheetId,
                requestBody: {
                    data: data.map((e) => e.data),
                    valueInputOption: 'RAW',
                },
            });
            for (const datum of data) {
                this.cache[datum.row][datum.col] = datum.data.values[0][0];
            }
        });
    }
    // update a single cell; does not block as much as batchUpdateSingle
    updateSingle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield ServiceAccount_1.SheetInstance.spreadsheets.values.update({
                spreadsheetId: this.sheetId,
                range: data.data.range,
                requestBody: { values: data.data.values },
                valueInputOption: 'RAW',
            });
            this.cache[data.row][data.col] = data.data.values[0][0];
        });
    }
    // get the cache stored
    getCache() {
        return this.cache;
    }
}
exports.default = SheetCache;
