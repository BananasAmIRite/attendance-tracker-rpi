import { NFCChange } from '@prisma/client';
import { SheetInstance } from '../ServiceAccount';
import prisma from '../PrismaClient';
import StudentInfoDBCache from './StudentInfoDBCache';
import StudentNFCChangeCache from './StudentNFCChangeCache';

// student information
export interface StudentInfo {
    studentId: string;
    firstName: string;
    lastName: string;
    nfcId: string;
    attendancePercent?: string;
}

// convert row of student infos to a StudentInfo
const rowToStudentInfo = (row: any[]): StudentInfo => ({
    studentId: row[0],
    firstName: row[1],
    lastName: row[2],
    nfcId: row[3],
    attendancePercent: row[4],
});

// convert StudentInfo to rows to be published to Sheets
const studentInfoToRow = (info: StudentInfo): any[] => [
    info.studentId,
    info.firstName,
    info.lastName,
    info.nfcId,
    // info.attendancePercent,
];

// config for whether to automatically use the student info cache for looking up student info
const useSICache = process.env.USE_SI_CACHE_DEFAULT === 'true';
// whether or not to use the nfc cache when binding student ids to nfc ids
const useNFCCache = process.env.USE_NFC_CACHE_DEFAULT === 'true';

console.log(`Config: Using student info cache by default set to ${useSICache}`);
console.log(`Config: Using NFC info cache by default set to ${useNFCCache}`);

class StudentInfoManager {
    // sheet id housing student info sheet
    private sheetId: string = process.env.USER_SHEET_ID as string;
    // sheet range for student infos
    private sheetRange: string = process.env.USER_SHEET_RANGE as string;

    /** attendance upload mode
     *
     * 'ONLINE' - upload directly to google sheets
     * 'OFFLINE' - upload to DB cache and to sheets later on
     *
     **/
    public mode: 'ONLINE' | 'OFFLINE' = 'ONLINE';

    // local cache for student information and nfc bindings
    public readonly infoDbCache: StudentInfoDBCache = new StudentInfoDBCache();
    // local cache for nfc changes that failed to upload
    public readonly nfcDbCache: StudentNFCChangeCache = new StudentNFCChangeCache();

    public constructor() {}

    // get student info by providing a student id
    public async getStudentInfoBySID(sid: string): Promise<StudentInfo | null> {
        return await this.getStudentInfo((info) => info.studentId === sid);
    }

    // get student info by providing an nfc id
    public async getStudentInfoByNFCID(nfcId: string): Promise<StudentInfo | null> {
        return await this.getStudentInfo((info) => info.nfcId === nfcId);
    }

    /** Get student info, either online or offline
     *
     * @param qualifier qualifier to accept student if the sheet
     */
    private async getStudentInfo(qualifier: (info: StudentInfo) => boolean): Promise<StudentInfo | null> {
        console.log('getting student info...');
        // get from sheets if we're online and we aren't defaulting to using student info cache
        if (this.mode === 'ONLINE' && !useSICache) {
            // get response
            let response;
            try {
                response = await SheetInstance.spreadsheets.values.get({
                    spreadsheetId: this.sheetId,
                    range: this.sheetRange,
                });
            } catch (err) {
                // error occurred while getting response; switch to offline mode and rerun request
                console.log(`Error occurred while getting student info: ${err}. Retrying with offline mode`);
                this.mode = 'OFFLINE';
                return await this.getStudentInfo(qualifier);
            }

            // parse values and return if student info is accepted
            const values = response.data.values;
            if (values) {
                for (const row of values) {
                    if (qualifier(rowToStudentInfo(row))) {
                        const studentInfo = rowToStudentInfo(row);
                        console.log(`Got student info: ${JSON.stringify(studentInfo)}`);

                        return studentInfo;
                    }
                }
            }
        } else {
            // offline mode; get the cached student info and pick a student from that
            const cached = await this.infoDbCache.getCachedStudentInfo();
            for (const info of cached) {
                if (qualifier(info)) return info;
            }
        }

        return null;
    }

    // merge sheets student info into local student info
    public async reconcileStudentInfoCache() {
        try {
            console.log(`Reconciling student infos...`);
            if (this.mode !== 'ONLINE') return;
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

            console.log('Reconciled student infos. ');
        } catch (err) {
            console.log("Couldn't reconcile student infos");
            this.mode = 'OFFLINE';
            return;
        }
    }

    // fully rebuild student info cache from the Sheets
    public async rebuildStudentInfoCache() {
        if (this.mode !== 'ONLINE') return;

        // retrieve all values from sheets
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
        await this.infoDbCache.deleteAll();

        // copy all sheets data into student info db
        try {
            if (values) {
                await prisma.studentInformation.createMany({
                    data: values.map((e) => ({
                        ...rowToStudentInfo(e),
                    })),
                });
            }

            console.log('Rebuilt all student info cache');
        } catch (err) {
            console.log(`Error rebuilding student info cache: ${err}`);
        }
    }

    // bind a student id to an nfc id
    public async bindStudentId(studentId: string, nfcId: string) {
        // store nfc cache into db if using cache
        if (useNFCCache) return await this.bindOfflineStudentId(studentId, nfcId);
        try {
            // attempt to bind student id to nfc id
            await this.bindOnlineStudentIds([{ studentId, nfcId, id: -1 }]);

            // update the local student info database with new bound data
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
            // error occurred, switch to offline mode and bind the student id offline
            console.log('Error occurred linking NFC ID to student ID: ' + err);
            this.mode = 'OFFLINE';
            await this.bindOfflineStudentId(studentId, nfcId);
        }
    }

    // attempt to push nfc changes to sheets
    private async bindOnlineStudentIds(changes: NFCChange[]) {
        // build new student info sheets values with changed nfc value
        const values: any[][] = [];
        for (const info of await this.infoDbCache.getCachedStudentInfo()) {
            const change = changes.find((e) => e.studentId === info.studentId);
            if (change) info.nfcId = change.nfcId;
            values.push(studentInfoToRow(info));
        }

        // update sid sheets values
        await SheetInstance.spreadsheets.values.update({
            spreadsheetId: this.sheetId,
            range: this.sheetRange,
            requestBody: { values },
            valueInputOption: 'RAW',
        });
    }

    // add student id binding request to nfc changes db
    private async bindOfflineStudentId(studentId: string, nfcId: string) {
        console.log('Attempting to bind student id offline');
        // add nfc change request into nfcChange db
        await prisma.nFCChange.create({
            data: {
                studentId: studentId,
                nfcId: nfcId,
            },
        });

        // update student info cache db with new nfc data
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
        console.log(`Student ID ${studentId} bound to nfc id ${nfcId} OFFLINE`);
    }

    // flush all cached nfc changes in the nfc changes db and post entries online
    public async flushCachedNFCChanges() {
        // retrieve cached nfc data from db
        const entries = await this.nfcDbCache.getCachedNFCChanges();
        try {
            console.log(`Flushing cached student infos...`);
            // post nfc changes online
            await this.bindOnlineStudentIds(entries);

            console.log(`Flushed cached student infos`);

            console.log('Clearing attendance cache...');
            // clear nfc changes db
            await this.nfcDbCache.deleteAll();
        } catch (err) {
            console.log('Error flushing cached attendance. ');
            throw err;
        }
    }
}

const siManager = new StudentInfoManager();
export default siManager;
