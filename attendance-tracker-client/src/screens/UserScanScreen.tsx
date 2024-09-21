import { useState, useContext, useEffect } from 'react';
import { DisplayedStudentInfo, StudentInfo } from '../types/UserInfoTypes';
import { getStudentInfo, loadStudentInfo } from '../server/Student';
import { postAttendanceEntry, queryPasswordCorrect } from '../server/Attendance';
import StudentInfoDisplay from '../components/StudentInfoDisplay';
import NFCUploadScanner from '../components/NFCUploadScanner';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router';
import { GlobalMessageContext } from '../App';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import { DialogActions } from '@mui/material';

export default function UserScanScreen() {
    const { message, setMessage } = useContext(GlobalMessageContext);

    const [displayUser, setDisplayUser] = useState<true | false | 'LOADING'>(false);
    const [lastId, setLastId] = useState('');
    const [displayedStudentInfo, setStudentInfo] = useState<DisplayedStudentInfo | null>(null);

    const [adminDialogOpen, setAdminDialogOpen] = useState(false);

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

    const handleCodeScan = (id: string) =>
        new Promise<boolean>(async (res, rej) => {
            console.log('handling code: ' + id);
            if (!validateId(id)) return res(false);

            console.log(displayUser, id, lastId);
            if (displayUser && displayUser !== 'LOADING') return res(false); // disable scanning when user is being displayed
            if (id === lastId) {
                showError('You already scanned!');
                return res(false);
            }
            setDisplayUser('LOADING');
            const info: StudentInfo | null = await getStudentInfo(id);

            if (!info) {
                // student doesnt exist
                showError('Student not found. Please scan again. ');
                setDisplayUser(false);
                return res(false);
            }

            const date = new Date();

            await postAttendanceEntry(id, date.toISOString()).then(
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
                        return res(true);
                    }, 2000);
                },
                () => {
                    return res(false);
                }
            );
        });

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
                    <CircularProgress color='primary' size={64} />
                </div>
            ) : displayUser ? (
                <StudentInfoDisplay
                    name={`${displayedStudentInfo?.firstName ?? 'No'} ${displayedStudentInfo?.lastName ?? 'Student'}`}
                    id={displayedStudentInfo?.studentId ?? 'No Id'}
                    scanTime={displayedStudentInfo?.scanTime ?? 'None'}
                    attendancePercent={displayedStudentInfo?.attendancePercent ?? 'Attendance Percentage'}
                    attendanceStatus={'PRESENT'}
                    action={'SCAN_IN'}
                />
            ) : (
                <></>
            )}
            {/* <button // so long super secret button :(
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
            ></button> */}{' '}
            <Button
                variant='contained'
                onClick={() => {
                    setAdminDialogOpen(true);
                }}
            >
                Open Admin Panel
            </Button>
            <Dialog
                open={adminDialogOpen}
                onClose={() => setAdminDialogOpen(false)}
                PaperProps={{
                    component: 'form',
                    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const formJson = Object.fromEntries((formData as any).entries());
                        const pw = formJson.pw;
                        setAdminDialogOpen(false);
                        queryPasswordCorrect(pw).then((correct) => {
                            if (correct) navigate('/supersecretscreen');
                        });
                    },
                }}
            >
                <DialogTitle>Admin Panel</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        required
                        margin='dense'
                        id='pw'
                        name='pw'
                        label='Password'
                        type='text'
                        fullWidth
                        variant='standard'
                        autoComplete='off'
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
                    <Button type='submit'>Open</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
