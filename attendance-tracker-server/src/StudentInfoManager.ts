import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { SheetInstance } from './ServiceAccount';
import { google } from 'googleapis';

export interface StudentInfo {
    studentId: string;
    firstName: string;
    lastName: string;
    nfcId: string;
}

const rowToStudentInfo = (row: any[]): StudentInfo => ({
    studentId: row[0],
    firstName: row[1],
    lastName: row[2],
    nfcId: row[3],
});

const studentInfoToRow = (info: StudentInfo): any[] => [info.studentId, info.firstName, info.lastName, info.nfcId];

export default class StudentInfoManager {
    private studentInfoCache: StudentInfo[] = [];

    private sheetId: string = process.env.USER_SHEET_ID as string;
    private sheetRange: string = process.env.USER_SHEET_RANGE as string;

    public mode: 'ONLINE' | 'OFFLINE' = 'ONLINE';

    public constructor() {}

    public async getStudentInfoBySID(sid: string): Promise<StudentInfo | null> {
        return this.getStudentInfo(
            (row) => row[0] === sid,
            (info) => info.studentId === sid
        );
    }

    public async getStudentInfoByNFCID(nfcId: string): Promise<StudentInfo | null> {
        return this.getStudentInfo(
            (row) => row[3] === nfcId,
            (info) => info.nfcId === nfcId
        );
    }

    private async getStudentInfo(
        onlineQualifier: (val: any[]) => boolean,
        offlineQualifier: (info: StudentInfo) => boolean
    ): Promise<StudentInfo | null> {
        if (this.mode === 'ONLINE') {
            let response;
            try {
                response = await SheetInstance.spreadsheets.values.get({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                });
            } catch (err) {
                console.log(err);
                this.mode = 'OFFLINE';
                return this.getStudentInfo(onlineQualifier, offlineQualifier);
            }

            const values = response.data.values;

            if (values) {
                for (const row of values) {
                    if (onlineQualifier(row)) return rowToStudentInfo(row);
                }
            }
        } else {
            // offline mode
            for (const info of this.studentInfoCache) {
                if (offlineQualifier(info)) return info;
            }
        }

        return null;
    }

    public async loadAllStudentInfo() {
        if (this.mode !== 'ONLINE') return;

        let response;
        try {
            response = await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
            });
        } catch (err) {
            this.mode = 'OFFLINE';
            return;
        }

        const values = response.data.values;

        this.studentInfoCache = [];
        if (values) {
            for (const row of values) {
                this.studentInfoCache.push(rowToStudentInfo(row));
            }
        }
    }

    public async bindStudentId(studentId: string, nfcId: string) {
        try {
            this.loadAllStudentInfo();
            const values: any[][] = [];

            for (const info of this.studentInfoCache) {
                if (info.studentId === studentId) info.nfcId = nfcId;
                values.push(studentInfoToRow(info));
            }

            SheetInstance.spreadsheets.values.update({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
                requestBody: { values },
                valueInputOption: 'RAW',
            });

            console.log(`Student id ${studentId} successfully linked to NFC id ${nfcId}`);
        } catch (err) {
            console.log(err);
            this.mode = 'OFFLINE';
        }
    }
}
