import CacheList from '../../components/CacheList';
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
import { getSIChangesCache, loadStudentInfo, rebuildSIChangesCache } from '../../server/Student';
import { StudentInfo } from '../../types/UserInfoTypes';

export default function CachedStudentInfo() {
    const [reloadInfoLoading, setReloadInfoLoading] = useState(false);
    const [recacheInfoLoading, setRecacheInfoLoading] = useState(false);

    const [recacheConfirmOpen, setRecacheConfirmOpen] = useState(false);

    const { setMessage } = useContext(GlobalMessageContext);

    const navigate = useNavigate();

    const forceUpdate = () => {
        navigate(0);
    };
    return (
        <>
            <div style={{ marginTop: 30 }}>
                <p style={{ fontSize: '24px', textDecoration: 'bold' }}>Cached Student Infos</p>
                <CacheList<StudentInfo>
                    getCache={getSIChangesCache}
                    cacheToValues={(e) => [e.studentId, e.firstName, e.lastName, e.nfcId, e.attendancePercent]}
                    labels={['Student Id', 'First Name', 'Last Name', 'NFC ID', 'Attendance Percent']}
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
                    loading={reloadInfoLoading}
                    loadingPosition='start'
                    startIcon={<PublishIcon />}
                    color='primary'
                    variant='contained'
                    onClick={async () => {
                        setReloadInfoLoading(true);
                        loadStudentInfo()
                            .then(
                                () => {
                                    setMessage('Reconciled student info successfully!');
                                    forceUpdate();
                                },
                                () => {}
                            )
                            .finally(() => setReloadInfoLoading(false));
                    }}
                >
                    Reconcile Student Info Cache
                </LoadingButton>
                <LoadingButton
                    loading={recacheInfoLoading}
                    loadingPosition='start'
                    startIcon={<DeleteForeverIcon />}
                    variant='contained'
                    color='error'
                    onClick={() => {
                        setRecacheConfirmOpen(true);
                    }}
                >
                    Rebuild Student Info Cache
                </LoadingButton>
            </div>
            <Dialog open={recacheConfirmOpen}>
                <DialogTitle>Recache Student Info</DialogTitle>
                <DialogContent>
                    Are you sure you want to recache student info? (This will completely reload student info from Google
                    Sheets)
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setRecacheConfirmOpen(false);
                            setRecacheInfoLoading(true);
                            rebuildSIChangesCache()
                                .then(
                                    () => {
                                        setMessage('Cleared all attendance cache');
                                        forceUpdate();
                                    },
                                    () => {}
                                )
                                .finally(() => setRecacheInfoLoading(false));
                        }}
                    >
                        Yes
                    </Button>
                    <Button onClick={() => setRecacheConfirmOpen(false)} autoFocus>
                        No
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
