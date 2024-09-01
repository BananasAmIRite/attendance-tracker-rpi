import { useEffect, useState } from 'react';
import {
    clearAttendanceCache,
    flushAttendanceCache,
    getAttendanceCache,
    isAttendanceOnline,
} from '../server/Attendance';
import { isStudentInfoOnline } from '../server/Student';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Snackbar } from '@mui/material';
import CacheList from '../components/CacheList';
import { AttendanceEntry } from '../types/UserInfoTypes';
import { ArrowBackIos } from '@mui/icons-material';
import { useNavigate } from 'react-router';

export default function CacheScreen() {
    const [attendanceOnline, setAttendanceOnline] = useState(false);
    const [studentInfoOnline, setStudentInfoOnline] = useState(false);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [message, setMessage] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        isAttendanceOnline().then(setAttendanceOnline);
        isStudentInfoOnline().then(setStudentInfoOnline);
    }, []);

    const onlineStatusText = (isOnline: boolean) => {
        return isOnline ? (
            <span style={{ color: 'green' }}>Online</span>
        ) : (
            <span style={{ color: 'red' }}>Offline</span>
        );
    };

    const showMessage = (error: string) => {
        // if (error === '') return;
        setMessage(error);
    };

    return (
        <>
            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                <IconButton style={{ float: 'left' }} onClick={() => navigate('/')}>
                    <ArrowBackIos fontSize='large' />
                </IconButton>
                <span style={{ fontSize: '32px', textDecoration: 'bold' }}>Super Secret Screen</span>
                <div
                    style={{
                        padding: '5%',
                    }}
                >
                    <div style={{ marginTop: 30 }}>
                        <span style={{ fontSize: '24px', textDecoration: 'bold' }}>Online Status</span>
                        <br />
                        <span>
                            An offline status will result in data being sent to and retrieved from cache instead of
                            online.{' '}
                        </span>
                        <br />
                        <span>Re-login to refresh status</span>
                        <br />
                        <span>Attendance Online: {onlineStatusText(attendanceOnline)}</span>
                        <br />
                        <span>Student Info Online: {onlineStatusText(studentInfoOnline)}</span>
                    </div>

                    <div style={{ marginTop: 30 }}>
                        <p style={{ fontSize: '24px', textDecoration: 'bold' }}>Attendance Cache</p>
                        <CacheList<AttendanceEntry>
                            getCache={getAttendanceCache}
                            cacheToValues={(e) => [e.studentId, e.date, e.time]}
                            labels={['Student Id', 'Date Scanned', 'Time Scanned']}
                            style={{
                                height: 300,
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'space-evenly',
                            marginTop: '5%',
                        }}
                    >
                        <Button
                            color='primary'
                            variant='contained'
                            onClick={async () =>
                                flushAttendanceCache()
                                    .then(() => {
                                        showMessage('Uploaded Attendance Successfully!');
                                    })
                                    .catch((err) => {
                                        showMessage(`Error: ${err}`);
                                    })
                            }
                        >
                            Upload Attendance Cache
                        </Button>
                        <Button
                            variant='contained'
                            color='error'
                            onClick={() => {
                                setDeleteConfirmOpen(true);
                            }}
                        >
                            Delete Attendance Cache
                        </Button>
                    </div>
                </div>
            </div>
            <Dialog open={deleteConfirmOpen}>
                <DialogTitle>Delete Attendance Cache</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete all attendance cache? (This will NOT upload data to Google Sheets)
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteConfirmOpen(false);
                            clearAttendanceCache().then(() => {
                                showMessage('Cleared all attendance cache');
                            });
                        }}
                    >
                        Yes
                    </Button>
                    <Button onClick={() => setDeleteConfirmOpen(false)} autoFocus>
                        No
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={message !== ''} autoHideDuration={5000} onClose={() => setMessage('')} message={message} />
        </>
    );
}
