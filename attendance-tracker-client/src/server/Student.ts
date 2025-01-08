import { NFCChanges, StudentInfo } from '../types/UserInfoTypes';
import axios from 'axios';

export async function getStudentInfo(id: string): Promise<StudentInfo | null> {
    try {
        return (
            await axios.get<StudentInfo>('studentInfo/sid', {
                params: {
                    id,
                },
            })
        ).data;
    } catch (err) {
        return null;
    }
}

export async function getStudentInfoByNFCId(id: string): Promise<StudentInfo | null> {
    try {
        return (
            await axios.get<StudentInfo>('studentInfo/nfc', {
                params: {
                    id,
                },
            })
        ).data;
    } catch (err) {
        return null;
    }
}

export async function loadStudentInfo(): Promise<void> {
    return await axios.get('studentInfo/load');
}

export async function bindStudentId(sid: string, nfcId: string): Promise<void> {
    return await axios.post('studentInfo/bind', {
        studentId: sid,
        nfcId,
    });
}

export const isStudentInfoOnline = async () => {
    return (await axios.get<{ online: boolean }>('/studentInfo/online')).data.online;
};

export const getNFCChangesCache = async () => {
    return (await axios.get<NFCChanges[]>('/studentInfo/changesCache')).data;
};

export const flushNFCChangesCache = async () => {
    return await axios.post('/studentInfo/changesCache/flush');
};

export const clearNFCChangesCache = async () => {
    return await axios.post('/studentInfo/changesCache/clear');
};

export const getSIChangesCache = async () => {
    return (await axios.get<StudentInfo[]>('/studentInfo/siCache')).data;
};

export const rebuildSIChangesCache = async () => {
    return await axios.post('/studentInfo/siCache/rebuild');
};
