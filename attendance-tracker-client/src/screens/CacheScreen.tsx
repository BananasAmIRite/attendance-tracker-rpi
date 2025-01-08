import { useEffect, useState } from 'react';
import { getBackOnline, isAttendanceOnline } from '../server/Attendance';
import { isStudentInfoOnline } from '../server/Student';
import IconButton from '@mui/material/IconButton';
import { ArrowBackIos } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import AttendanceCache from './cachescreen/AttendanceCache';
import NFCUpdatesCache from './cachescreen/NFCUpdatesCache';
import CachedStudentInfo from './cachescreen/CachedStudentInfo';
import { LoadingButton } from '@mui/lab';
import { Button, CircularProgress } from '@mui/material';

export default function CacheScreen() {
    const [attendanceOnline, setAttendanceOnline] = useState<boolean | 'LOADING'>('LOADING');
    const [studentInfoOnline, setStudentInfoOnline] = useState<boolean | 'LOADING'>('LOADING');

    const [statusReloadLoading, setStatusReloadLoading] = useState(false);

    const navigate = useNavigate();

    const forceUpdate = () => {
        navigate(0);
    };

    useEffect(() => {
        isAttendanceOnline().then(setAttendanceOnline, () => {});
        isStudentInfoOnline().then(setStudentInfoOnline, () => {});

        console.log('reloading...');
    }, []);

    const onlineStatusText = (isOnline: boolean | 'LOADING') => {
        return isOnline === 'LOADING' ? (
            <CircularProgress color='primary' size={12} />
        ) : isOnline ? (
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
                        <span>Attendance Online: {onlineStatusText(attendanceOnline)}</span>
                        <br />
                        <span>Student Info Online: {onlineStatusText(studentInfoOnline)}</span>
                        <br /> <br />
                        <LoadingButton
                            variant='contained'
                            loading={statusReloadLoading}
                            onClick={() => {
                                setStatusReloadLoading(true);
                                getBackOnline().then(() => {
                                    setStatusReloadLoading(false);
                                    forceUpdate();
                                    console.log('force updating');
                                });
                            }}
                        >
                            Reload Status
                        </LoadingButton>
                        <br />
                        <br />
                        <Button
                            variant='contained'
                            onClick={() => {
                                navigate('/adminscanscreen');
                            }}
                        >
                            Register New IDs
                        </Button>
                    </div>
                    <AttendanceCache />
                    <NFCUpdatesCache />
                    <CachedStudentInfo />
                </div>
            </div>
        </>
    );
}
