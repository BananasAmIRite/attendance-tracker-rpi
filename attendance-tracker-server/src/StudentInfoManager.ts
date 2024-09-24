import { NFCChange, StudentInformation } from '@prisma/client';
import { SheetInstance } from './ServiceAccount';
import prisma from './PrismaClient';

export interface StudentInfo {
    studentId: string;
    firstName: string;
    lastName: string;
    nfcId: string;
    attendancePercent?: string;
}

const rowToStudentInfo = (row: any[]): StudentInfo => ({
    studentId: row[0],
    firstName: row[1],
    lastName: row[2],
    nfcId: row[3],
    attendancePercent: row[4],
});
// hello
const studentInfoToRow = (info: StudentInfo): any[] => [
    info.studentId,
    info.firstName,
    info.lastName,
    info.nfcId,
    info.attendancePercent,
];

export default class StudentInfoManager {
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
                console.log(`Error occurred while getting student info: ${err}. Retrying with offline mode`);
                this.mode = 'OFFLINE';
                return this.getStudentInfo(onlineQualifier, offlineQualifier);
            }

            const values = response.data.values;

            if (values) {
                for (const row of values) {
                    if (onlineQualifier(row)) {
                        const studentInfo = rowToStudentInfo(row);
                        console.log(`Got student info: ${JSON.stringify(studentInfo)}`);

                        return studentInfo;
                    }
                }
            }
        } else {
            // offline mode
            for (const info of await this.getCachedStudentInfo()) {
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
            console.log('Successfully obtained all student info');
        } catch (err) {
            console.log("Couldn't load all student info");
            this.mode = 'OFFLINE';
            return;
        }

        const values = response.data.values;

        const newStudentInfoCache = [];
        if (values) {
            for (const row of values) {
                newStudentInfoCache.push(rowToStudentInfo(row));
            }
        }
        console.log(`reconciling student infos: ${JSON.stringify(newStudentInfoCache)}`);
        await this.reconcileStudentCache(newStudentInfoCache);
        console.log('Reconciled student infos. ');
    }

    private async reconcileStudentCache(newValues: StudentInfo[]) {
        const currentCache = await prisma.studentInformation.findMany();
        for (const newValue of newValues) {
            const cachedEntry = currentCache.find((e) => e.studentId === newValue.studentId);
            if (!cachedEntry) {
                await prisma.studentInformation.create({
                    data: {
                        ...newValue,
                    },
                });
                continue;
            }

            // nfc values don't line up and the sheets nfc value exists
            if (cachedEntry.nfcId !== newValue.nfcId && newValue.nfcId !== '') {
                // update the cache to use the sheet's nfc values
                await prisma.studentInformation.update({
                    where: {
                        studentId: cachedEntry.studentId,
                    },
                    data: {
                        nfcId: newValue.nfcId,
                    },
                });
            }

            // attendance % doesn't line up
            if (cachedEntry.nfcId !== newValue.nfcId) {
                // update the cache to use the sheet's attendance %
                await prisma.studentInformation.update({
                    where: {
                        studentId: cachedEntry.studentId,
                    },
                    data: {
                        attendancePercent: newValue.attendancePercent,
                    },
                });
            }
        }
    }

    public async rebuildStudentInfoCache() {
        if (this.mode !== 'ONLINE') return;

        let response;
        try {
            response = await SheetInstance.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
            });
            console.log('Obtained student info cache for rebuilding');
        } catch (err) {
            console.log("Couldn't load all student info for rebuilding");
            this.mode = 'OFFLINE';
            return;
        }

        const values = response.data.values;

        console.log('Deleting all student info cache...');

        // delete ALL student info
        await prisma.studentInformation.deleteMany({
            where: {},
        });

        try {
            if (values) {
                for (const row of values) {
                    const dbRow = rowToStudentInfo(row);
                    await prisma.studentInformation.create({
                        data: {
                            ...dbRow,
                        },
                    });
                }
            }

            console.log('Rebuilt all student info cache');
        } catch (err) {
            console.log(`Error rebuilding student info cache: ${err}`);
        }
    }

    public async bindStudentId(studentId: string, nfcId: string) {
        try {
            this.loadAllStudentInfo();
            const values: any[][] = [];

            for (const info of await this.getCachedStudentInfo()) {
                if (info.studentId === studentId) info.nfcId = nfcId;
                values.push(studentInfoToRow(info));
            }

            await SheetInstance.spreadsheets.values.update({
                spreadsheetId: this.sheetId,
                range: this.sheetRange,
                requestBody: { values },
                valueInputOption: 'RAW',
            });

            console.log(`Student id ${studentId} successfully linked to NFC id ${nfcId}`);
        } catch (err) {
            console.log('Error occurred linking NFC ID to student ID: ' + err);
            this.mode = 'OFFLINE';
            this.bindStudentIdOffline(studentId, nfcId);
        }
    }

    private async bindStudentIdOffline(studentId: string, nfcId: string) {
        console.log('Attempting to bind student id offline');
        await prisma.nFCChange.create({
            data: {
                studentId: studentId,
                nfcId: nfcId,
            },
        });
        await prisma.studentInformation.update({
            where: {
                studentId,
            },
            data: {
                nfcId: nfcId,
            },
        });
    }

    public async getCachedStudentInfo(): Promise<StudentInfo[]> {
        const entries = await prisma.studentInformation.findMany();
        const infoEntries: StudentInfo[] = [];

        for (const info of entries)
            infoEntries.push({
                studentId: info.studentId,
                firstName: info.firstName,
                lastName: info.lastName,
                nfcId: info.nfcId,
                attendancePercent: info.attendancePercent,
            });
        return infoEntries;
    }

    public async getCachedStudentChanges(): Promise<NFCChange[]> {
        return await prisma.nFCChange.findMany();
    }

    public async flushCachedInfoChanges() {
        const entries = await this.getCachedStudentChanges();
        try {
            console.log(`Flushing cached student infos...`);
            await this.postOnlineInfoChange(entries);

            console.log(`Flushed cached student infos`);
        } catch (err) {
            console.log('Error flushing cached attendance. ');
            throw err;
        }

        console.log('Clearing attendance cache...');
        await this.clearInfoChangeCache();
    }

    public async postOnlineInfoChange(changes: NFCChange[]): Promise<void> {
        for (const change of changes) {
            try {
                await this.bindStudentId(change.studentId, change.nfcId);
            } catch (err: any) {
                console.log(`Error posting online attendance entry: ${err}`);
                throw err;
            }
        }
    }

    public async clearInfoChangeCache(): Promise<void> {
        await prisma.nFCChange.deleteMany({
            where: {},
        });
    }
}
