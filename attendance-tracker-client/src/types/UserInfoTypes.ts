export interface StudentInfo {
    studentId: string;
    nfcId: string;
    firstName: string;
    lastName: string;
    attendancePercent: string;
}

export interface AttendanceEntry {
    studentId: string;
    date: string;
    time: string;
}

export interface DisplayedStudentInfo extends StudentInfo {
    scanTime: string;
}

export type ScanType = 'NFC' | 'CAMERA';

export const STORE_KEYS = {
    KEY_USER_SHEET_ID: '@Attendance_USER_SHEET_ID',
    KEY_USER_SHEET_RANGE: '@Attendance_USER_SHEET_RANGE',
    KEY_USER_ATTD_ID: '@Attendance_USER_ATTENDANCE_ID',
    KEY_USER_ATTD_RANGE: '@Attendance_USER_ATTENDANCE_RANGE',

    KEY_SCAN_TYPE: '@Attendance_SCAN_TYPE',
};
