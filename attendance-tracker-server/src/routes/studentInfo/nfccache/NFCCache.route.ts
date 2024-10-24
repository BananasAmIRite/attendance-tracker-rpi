import { Router } from 'express';
import siManager from '../../../studentinfo/StudentInfoManager';

const NFCCacheRouter = Router();

NFCCacheRouter.get('/', async (req, res) => {
    console.log('Getting NFC change cache...');
    const entries = await siManager.nfcDbCache.getCachedNFCChanges();
    res.status(200).send(entries).end();
});

NFCCacheRouter.post('/flush', async (req, res, next) => {
    console.log('Flushing NFC change...');
    siManager
        .flushCachedNFCChanges()
        .then(() => {
            res.status(200).end();
        })
        .catch(next);
});

NFCCacheRouter.post('/clear', async (req, res) => {
    console.log('Clearing NFC change cache...');
    await siManager.nfcDbCache.deleteAll();
    res.status(200).end();
});

export default NFCCacheRouter;
