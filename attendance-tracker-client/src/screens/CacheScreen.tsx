import { useContext, useEffect, useReducer, useState } from 'react';
import {
    clearAttendanceCache,
    flushAttendanceCache,
    getAttendanceCache,
    getBackOnline,
    isAttendanceOnline,
} from '../server/Attendance';
import { isStudentInfoOnline } from '../server/Student';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CacheList from '../components/CacheList';
import { AttendanceEntry } from '../types/UserInfoTypes';
import { ArrowBackIos } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { GlobalMessageContext } from '../App';
import LoadingButton from '@mui/lab/LoadingButton';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PublishIcon from '@mui/icons-material/Publish';
import DialogTitle from '@mui/material/DialogTitle';

export default function CacheScreen() {
    const [attendanceOnline, setAttendanceOnline] = useState(false);
    const [studentInfoOnline, setStudentInfoOnline] = useState(false);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [attendanceUploadLoading, setAttendanceUploadLoading] = useState(false);
    const [attendanceDeleteLoading, setAttendanceDeleteLoading] = useState(false);

    const { setMessage } = useContext(GlobalMessageContext);

    const navigate = useNavigate();

    const forceUpdate = () => {
        navigate(0);
    };

    useEffect(() => {
        isAttendanceOnline().then(setAttendanceOnline, () => {});
        isStudentInfoOnline().then(setStudentInfoOnline, () => {});

        console.log('reloading???');
    }, []);

    const onlineStatusText = (isOnline: boolean) => {
        return isOnline ? (
            <span style={{ color: 'green' }}>Online</span>
        ) : (
            <span style={{ color: 'red' }}>Offline</span>
        );
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
                        <br /> <br />
                        <Button
                            variant='contained'
                            onClick={() => {
                                getBackOnline().then(() => {
                                    forceUpdate();
                                    console.log('force updating');
                                });
                            }}
                        >
                            Reload Status
                        </Button>
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
                        <LoadingButton
                            loading={attendanceUploadLoading}
                            loadingPosition='start'
                            startIcon={<PublishIcon />}
                            color='primary'
                            variant='contained'
                            onClick={async () => {
                                setAttendanceUploadLoading(true);
                                flushAttendanceCache()
                                    .then(
                                        () => {
                                            setMessage('Uploaded Attendance Successfully!');
                                            forceUpdate();
                                        },
                                        () => {}
                                    )
                                    .finally(() => setAttendanceUploadLoading(false));
                            }}
                        >
                            Upload Attendance Cache
                        </LoadingButton>
                        <LoadingButton
                            loading={attendanceDeleteLoading}
                            loadingPosition='start'
                            startIcon={<DeleteForeverIcon />}
                            variant='contained'
                            color='error'
                            onClick={() => {
                                setDeleteConfirmOpen(true);
                            }}
                        >
                            Delete Attendance Cache
                        </LoadingButton>
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
                            setAttendanceDeleteLoading(true);
                            clearAttendanceCache()
                                .then(
                                    () => {
                                        setMessage('Cleared all attendance cache');
                                        forceUpdate();
                                    },
                                    () => {}
                                )
                                .finally(() => setAttendanceDeleteLoading(false));
                        }}
                    >
                        Yes
                    </Button>
                    <Button onClick={() => setDeleteConfirmOpen(false)} autoFocus>
                        No
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
