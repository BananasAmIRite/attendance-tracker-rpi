import { NFCChange } from '@prisma/client';
import prisma from '../PrismaClient';

// stores failed NFC change requests for later upload
export default class StudentNFCChangeCache {
    // get all pending nfc changes
    public async getCachedNFCChanges(): Promise<NFCChange[]> {
        return await prisma.nFCChange.findMany();
    }

    // delete all pending nfc changes
    public async deleteAll() {
        await prisma.nFCChange.deleteMany({
            where: {},
        });
    }
}
