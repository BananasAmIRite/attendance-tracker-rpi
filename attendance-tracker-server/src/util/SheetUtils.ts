export const columnIndexToLetter_ = (index: number): string => {
    // Ref: https://stackoverflow.com/a/53678158
    const a = Math.floor(index / 26);
    return a >= 0 ? columnIndexToLetter_(a - 1) + String.fromCharCode(65 + (index % 26)) : '';
};

export const createA1Range = (sheetName: string, row1: number, col1: number, row2: number, col2: number) =>
    `'${sheetName}'!${columnIndexToLetter_(col1)}${row1 + 1}:${columnIndexToLetter_(col2)}${row2 + 1}`;

export const createSingleA1Range = (sheetName: string, row: number, col: number) =>
    createA1Range(sheetName, row, col, row, col);
