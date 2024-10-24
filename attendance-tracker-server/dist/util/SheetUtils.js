"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSingleA1Range = exports.createA1Range = exports.columnIndexToLetter_ = void 0;
const columnIndexToLetter_ = (index) => {
    // Ref: https://stackoverflow.com/a/53678158
    const a = Math.floor(index / 26);
    return a >= 0 ? (0, exports.columnIndexToLetter_)(a - 1) + String.fromCharCode(65 + (index % 26)) : '';
};
exports.columnIndexToLetter_ = columnIndexToLetter_;
const createA1Range = (sheetName, row1, col1, row2, col2) => `'${sheetName}'!${(0, exports.columnIndexToLetter_)(col1)}${row1 + 1}:${(0, exports.columnIndexToLetter_)(col2)}${row2 + 1}`;
exports.createA1Range = createA1Range;
const createSingleA1Range = (sheetName, row, col) => (0, exports.createA1Range)(sheetName, row, col, row, col);
exports.createSingleA1Range = createSingleA1Range;
