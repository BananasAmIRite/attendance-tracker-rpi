import { useState, useContext, useEffect } from 'react';
import { DisplayedStudentInfo, StudentInfo } from '../types/UserInfoTypes';
import { getStudentInfo, loadStudentInfo } from '../server/Student';
import { postAttendanceEntry } from '../server/Attendance';
import StudentInfoDisplay from '../components/StudentInfoDisplay';
import NFCUploadScanner from '../components/NFCUploadScanner';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router';
import { GlobalMessageContext } from '../App';

export default function UserScanScreen() {
    const { message, setMessage } = useContext(GlobalMessageContext);

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
        setMessage(err);
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

        if (!info) {
            // student doesnt exist
            showError('Student not found. Please scan again. ');
            setDisplayUser(false);
            return;
        }

        const date = new Date();

        postAttendanceEntry(id, date.toISOString()).then(
            async () => {
                const dispStudentInfo: DisplayedStudentInfo = {
                    ...info,
                    scanTime: formatDate(date),
                };

                setStudentInfo(dispStudentInfo);
                setDisplayUser(true);

                setLastId(id);

                setTimeout(() => {
                    setDisplayUser(false);
                }, 2000);
            },
            () => {}
        );

        setMessage('');
    };

    const validateId = (id: string): boolean => !isNaN(parseInt(id));

    useEffect(() => {
        loadStudentInfo();
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', zIndex: '0', width: '100%', height: '100%' }}>
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

            <button
                onClick={() => {
                    if (Date.now() - lastClickTime <= 10000) {
                        setClickCount((a) => a + 1);
                    }
                    setLastClickTime(Date.now());
                    if (clickCount === 3) {
                        setMessage('Hey, isriah :)');
                    }
                    if (clickCount === 8) {
                        setMessage('Keep clicking!');
                    }
                    if (clickCount >= 10) {
                        setClickCount(0);
                        navigate('/supersecretscreen');
                    }
                }}
                style={{
                    border: 'none',
                    backgroundColor: 'white',
                    width: '100px',
                    height: '20px',
                    position: 'relative',
                    zIndex: 1,
                }}
            ></button>
        </div>
    );
}
