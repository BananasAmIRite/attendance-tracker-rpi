import CacheList from '../../components/CacheList';
import { getAttendanceCache, flushAttendanceCache, clearAttendanceCache } from '../../server/Attendance';
import { AttendanceEntry } from '../../types/UserInfoTypes';
import LoadingButton from '@mui/lab/LoadingButton';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PublishIcon from '@mui/icons-material/Publish';
import { useContext, useState } from 'react';
import { GlobalMessageContext } from '../../App';
import { useNavigate } from 'react-router';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';

export default function AttendanceCache() {
    const [attendanceUploadLoading, setAttendanceUploadLoading] = useState(false);
    const [attendanceDeleteLoading, setAttendanceDeleteLoading] = useState(false);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const { setMessage } = useContext(GlobalMessageContext);

    const navigate = useNavigate();

    const forceUpdate = () => {
        navigate(0);
    };
    return (
        <>
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
