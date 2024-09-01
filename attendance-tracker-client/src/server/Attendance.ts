import axios from 'axios';
import { AttendanceEntry } from '../types/UserInfoTypes';

export const postAttendanceEntry = async (id: string, date: string) => {
    return await axios.post('/attendance/push', {
        studentId: id,
        dateTime: date,
    });
};

export const getAttendanceCache = async () => {
    return (await axios.get<AttendanceEntry[]>('/attendance/cache')).data;
};

export const flushAttendanceCache = async () => {
    return await axios.post('/attendance/cache/flush');
};

export const clearAttendanceCache = async () => {
    return await axios.post('/attendance/cache/clear');
};

export const isAttendanceOnline = async () => {
    return (await axios.get<{ online: boolean }>('/attendance/online')).data.online;
};
