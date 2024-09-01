import { useState, useContext, useEffect } from 'react';
import { DisplayedStudentInfo, STORE_KEYS, ScanType, StudentInfo } from '../types/UserInfoTypes';
import { getStudentInfo, loadStudentInfo } from '../server/Student';
import { postAttendanceEntry } from '../server/Attendance';
import NFCScanner from '../components/NFCScanner';
import StudentInfoDisplay from '../components/StudentInfoDisplay';
import NFCUploadScanner from '../components/NFCUploadScanner';
import { Popper } from '@mui/base/Popper';
import { Alert, CircularProgress, Snackbar } from '@mui/material';
import { Navigate, useNavigate } from 'react-router';

export default function UserScanScreen() {
    const [errorMessage, setErrorMessage] = useState('');

    const [displayUser, setDisplayUser] = useState<true | false | 'LOADING'>(false);
    const [data, setData] = useState('');
    const [lastId, setLastId] = useState('');
    const [displayedStudentInfo, setStudentInfo] = useState<DisplayedStudentInfo | null>(null);

    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(Date.now());

    const navigate = useNavigate();

    const formatDate = (date: Date) => {
        return `${date.getHours() === 12 || date.getHours() === 0 ? 12 : date.getHours() % 12}:${formatTwoDigits(
            date.getMinutes()
        )} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
    };

    const formatTwoDigits = (n: number) => {
        return n < 10 ? '0' + n : n;
    };

    const showError = (err: string) => {
        setErrorMessage(err);
    };

    const handleCodeScan = async (id: string) => {
        setData(id);
        if (!validateId(id)) return;

        if (displayUser) return; // disable barcode scanning when user is being displayed
        if (id === lastId) {
            showError('You already scanned!');
            return;
        }
        setDisplayUser('LOADING');
        const info: StudentInfo | null = await getStudentInfo(id);

        console.log(info);

        if (!info) {
            // student doesnt exist
            showError('Student not found. Please scan again. ');
            setDisplayUser(false);
            return;
        }

        const date = new Date();

        postAttendanceEntry(id, date.toISOString()).then(async () => {
            const dispStudentInfo: DisplayedStudentInfo = {
                ...info,
                scanTime: formatDate(date),
            };

            console.log('Posted entry');

            setStudentInfo(dispStudentInfo);
            setDisplayUser(true);

            setLastId(id);

            setTimeout(() => {
                setDisplayUser(false);
            }, 2000);
        });

        setErrorMessage('');
    };

    const validateId = (id: string): boolean => !isNaN(parseInt(id));

    useEffect(() => {
        (async () => {
            loadStudentInfo();
        })();
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', zIndex: '-100', width: '100%', height: '100%' }}>
                <NFCUploadScanner handleCodeScan={handleCodeScan} />
            </div>
            {displayUser === 'LOADING' ? (
                <div
                    style={{
                        width: '100%',
                        height: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <CircularProgress color='primary' size={128} />
                </div>
            ) : displayUser ? (
                <StudentInfoDisplay
                    name={`${displayedStudentInfo?.firstName ?? 'No'} ${displayedStudentInfo?.lastName ?? 'Student'}`}
                    id={displayedStudentInfo?.studentId ?? 'No Id'}
                    scanTime={displayedStudentInfo?.scanTime ?? 'None'}
                    attendanceStatus={'PRESENT'}
                    action={'SCAN_IN'}
                />
            ) : (
                <></>
            )}
            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                open={errorMessage !== ''}
                onClose={() => setErrorMessage('')}
                message={errorMessage}
                autoHideDuration={3000}
            />
            <button
                onClick={() => {
                    if (Date.now() - lastClickTime <= 10000) {
                        setClickCount((a) => a + 1);
                    }
                    setLastClickTime(Date.now());
                    if (clickCount === 3) {
                        setErrorMessage('Hey, isriah :)');
                    }
                    if (clickCount === 8) {
                        setErrorMessage('Keep clicking!');
                    }
                    if (clickCount >= 10) {
                        setClickCount(0);
                        navigate('/supersecretscreen');
                    }
                }}
                style={{ border: 'none', backgroundColor: 'white', width: '100px', height: '20px' }}
            ></button>
        </div>
    );
}
