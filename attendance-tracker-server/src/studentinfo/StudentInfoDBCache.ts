import prisma from '../PrismaClient';
import { StudentInfo } from './StudentInfoManager';

export default class StudentInfoDBCache {
    public constructor() {}

    public async clearInfoChangeCache(): Promise<void> {
        await prisma.nFCChange.deleteMany({
            where: {},
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

    public async deleteAll() {
        await prisma.studentInformation.deleteMany({
            where: {},
        });
    }
}
