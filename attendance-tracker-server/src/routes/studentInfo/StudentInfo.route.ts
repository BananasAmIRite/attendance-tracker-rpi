import { Router } from 'express';
import siManager from '../../studentinfo/StudentInfoManager';
import NFCCacheRouter from './nfccache/NFCCache.route';
import StudentInfoCacheRouter from './sicache/StudentInfoCache.route';

const StudentInfoRouter = Router();

StudentInfoRouter.use('/changesCache', NFCCacheRouter);
StudentInfoRouter.use('/siCache', StudentInfoCacheRouter);

StudentInfoRouter.get('/sid', async (req, res) => {
    const { id } = req.query;

    console.log('Student info by ID: ', id);

    const info = await siManager.getStudentInfoBySID(id as string);

    res.status(info ? 200 : 404)
        .send(info)
        .end();
});

StudentInfoRouter.get('/nfc', async (req, res) => {
    const { id } = req.query;
    console.log('Student info by NFC ID: ', id);
    const info = await siManager.getStudentInfoByNFCID(id as string);

    res.status(info ? 200 : 404)
        .send(info)
        .end();
});

StudentInfoRouter.post('/bind', async (req, res) => {
    const { studentId, nfcId } = req.body;

    console.log('Binding Student with NFC: ', studentId, nfcId);

    try {
        await siManager.bindStudentId(studentId, nfcId);
        res.status(200).end();
    } catch (err) {
        res.status(401).end();
    }
});

StudentInfoRouter.get('/load', async (req, res) => {
    console.log('Loading student info...');
    await siManager.reconcileStudentInfoCache();
    res.status(200).end();
});

StudentInfoRouter.get('/online', async (req, res) => {
    res.status(200)
        .send({ online: siManager.mode === 'ONLINE' })
        .end();
});

export default StudentInfoRouter;
