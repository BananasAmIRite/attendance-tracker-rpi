import prisma from '../PrismaClient';
import { StudentInfo } from './StudentInfoManager';

// stores and retrieves cached data for student information
export default class StudentInfoDBCache {
    // clears all data in student info cache
    public async clearInfoChangeCache(): Promise<void> {
        await prisma.nFCChange.deleteMany({
            where: {},
        });
    }

    // get all cached data
    public async getCachedStudentInfo(): Promise<StudentInfo[]> {
        // get entries from database
        const entries = await prisma.studentInformation.findMany();
        // convert them to StudentInfo's
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

    // clear cached data database
    public async deleteAll() {
        await prisma.studentInformation.deleteMany({
            where: {},
        });
    }
}
