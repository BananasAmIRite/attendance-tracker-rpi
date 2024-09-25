import { NFCChange, StudentInformation } from '@prisma/client';
import { SheetInstance } from './ServiceAccount';
import prisma from './PrismaClient';
import { findConfigFile } from 'typescript';

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
    // info.attendancePercent,
];

const useSICache = process.env.USE_SI_CACHE_DEFAULT === 'true';
const useNFCCache = process.env.USE_NFC_CACHE_DEFAULT === 'true';

console.log(`Config: Using student info cache by default set to ${useSICache}`);
console.log(`Config: Using NFC info cache by default set to ${useNFCCache}`);

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
        console.log('getting student info...', useSICache);
        if (this.mode === 'ONLINE' && !useSICache) {
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
            const cached = await this.getCachedStudentInfo();
            for (const info of cached) {
                if (offlineQualifier(info)) return info;
            }
        }

        return null;
    }

    public async loadAllStudentInfo() {
        if (this.mode !== 'ONLINE') return;
        try {
            console.log(`reconciling student infos...`);
            await this.reconcileStudentCache();
            console.log('Reconciled student infos. ');
        } catch (err) {
            console.log("Couldn't reconcile student infos");
            this.mode = 'OFFLINE';
            return;
        }
    }

    private async reconcileStudentCache() {
        const currentCache = await prisma.studentInformation.findMany();
        // rebuild cache
        await this.rebuildStudentInfoCache();
        const newCache = await prisma.studentInformation.findMany();
        for (const newCacheValue of newCache) {
            if (!newCacheValue.studentId) continue; // ignore the ones with nothing in it

            // for each value in the new cache, find the matching value in the old one
            const oldCachedEntry = currentCache.find((e) => e.studentId === newCacheValue.studentId);

            if (!oldCachedEntry) continue; // no cache entry doesn't exist, return
            // preserve old nfc values if there are no new nfc values
            if (oldCachedEntry.nfcId !== newCacheValue.nfcId && newCacheValue.nfcId === '') {
                // update the cache to use the old nfc values
                await prisma.studentInformation.update({
                    where: {
                        id: newCacheValue.id,
                    },
                    data: {
                        nfcId: oldCachedEntry.nfcId,
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
                    // if (!dbRow.studentId) continue;
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
        if (useNFCCache) return this.bindStudentIdOffline(studentId, nfcId);
        try {
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
            const foundInfo = await prisma.studentInformation.findFirst({
                where: {
                    studentId,
                },
            });

            if (!foundInfo) return;

            await prisma.studentInformation.update({
                where: {
                    id: foundInfo.id,
                },
                data: {
                    nfcId: nfcId,
                },
            });
            console.log(`Updated StudentInfo DB to reflect NFC ID change`);
        } catch (err) {
            console.log('Error occurred linking NFC ID to student ID: ' + err);
            this.mode = 'OFFLINE';
            this.bindStudentIdOffline(studentId, nfcId);
        }
    }

    public async bindOnlineStudentIds(changes: NFCChange[]) {
        const values: any[][] = [];
        for (const info of await this.getCachedStudentInfo()) {
            const change = changes.find((e) => e.studentId === info.studentId);
            if (change) info.nfcId = change.nfcId;
            values.push(studentInfoToRow(info));
        }

        await SheetInstance.spreadsheets.values.update({
            spreadsheetId: this.sheetId,
            range: this.sheetRange,
            requestBody: { values },
            valueInputOption: 'RAW',
        });
    }

    private async bindStudentIdOffline(studentId: string, nfcId: string) {
        console.log('Attempting to bind student id offline');
        await prisma.nFCChange.create({
            data: {
                studentId: studentId,
                nfcId: nfcId,
            },
        });
        const foundInfo = await prisma.studentInformation.findFirst({
            where: {
                studentId,
            },
        });

        if (!foundInfo) return;

        await prisma.studentInformation.update({
            where: {
                id: foundInfo.id,
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
        try {
            console.log('Posting online nfc changes...');
            await this.bindOnlineStudentIds(changes);
        } catch (err: any) {
            console.log(`Error posting online nfc changes: ${err}`);
            throw err;
        }
    }

    public async clearInfoChangeCache(): Promise<void> {
        await prisma.nFCChange.deleteMany({
            where: {},
        });
    }
}
