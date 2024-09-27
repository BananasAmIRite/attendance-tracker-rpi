import { NFCChange } from '@prisma/client';
import prisma from '../PrismaClient';

export default class StudentNFCChangeCache {
    public async getCachedNFCChanges(): Promise<NFCChange[]> {
        return await prisma.nFCChange.findMany();
    }

    public async deleteAll() {
        await prisma.nFCChange.deleteMany({
            where: {},
        });
    }
}
