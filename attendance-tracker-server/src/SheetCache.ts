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

        this.cache = data;
    }

    // update an array of single-celled values
    public async batchUpdateSingle(data: { data: { range: string; values: any[][] }; row: number; col: number }[]) {
        await SheetInstance.spreadsheets.values.batchUpdate({
            spreadsheetId: this.sheetId,
            requestBody: {
                data: data.map((e) => e.data),
                valueInputOption: 'RAW',
                includeValuesInResponse: true,
            },
        });
        for (const datum of data) {
            this.cache[datum.row][datum.col] = datum.data.values[0][0];
        }
        console.log(this.cache);
    }

    // get the cache stored
    public getCache(): string[][] {
        return this.cache;
    }
}
