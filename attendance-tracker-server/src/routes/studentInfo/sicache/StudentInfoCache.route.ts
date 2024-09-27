import { Router } from 'express';
import siManager from '../../../studentinfo/StudentInfoManager';

const StudentInfoCacheRouter = Router();

StudentInfoCacheRouter.get('/', async (req, res) => {
    console.log('Getting student info cache...');
    const entries = await siManager.infoDbCache.getCachedStudentInfo();
    res.status(200).send(entries).end();
});

StudentInfoCacheRouter.post('/rebuild', async (req, res) => {
    console.log('Clearing student info cache...');
    await siManager.rebuildStudentInfoCache();
    res.status(200).end();
});

export default StudentInfoCacheRouter;
