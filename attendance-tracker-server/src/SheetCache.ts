import { SheetInstance } from './ServiceAccount';

// in-memory cache for sheets (used for Attendance)
export default class SheetCache {
    private cache: string[][];

    public constructor(private sheetId: string, private sheetRange: string) {
        this.cache = [];
    }

    // load the values from the sheets into the cache
    public async load() {
        const data = (
            await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
            })
        ).data.values;

        if (!data) throw new Error('Error when loading sheets cache');

        console.log(data[0]);
        this.cache = data;
    }

    // update an array of single-celled values
    public async batchUpdateSingle(data: { data: { range: string; values: any[][] }; row: number; col: number }[]) {
        await SheetInstance.spreadsheets.values.batchUpdate({
            spreadsheetId: this.sheetId,
            requestBody: {
                data: data.map((e) => e.data),
                valueInputOption: 'RAW',
            },
        });
        for (const datum of data) {
            this.cache[datum.row][datum.col] = datum.data.values[0][0];
        }
    }

    // update a single cell; does not block as much as batchUpdateSingle
    public async updateSingle(data: { data: { range: string; values: any[][] }; row: number; col: number }) {
        await SheetInstance.spreadsheets.values.update({
            spreadsheetId: this.sheetId,
            range: data.data.range,
            requestBody: { values: data.data.values },
            valueInputOption: 'RAW',
        });
        this.cache[data.row][data.col] = data.data.values[0][0];
    }

    // get the cache stored
    public getCache(): string[][] {
        return this.cache;
    }
}
