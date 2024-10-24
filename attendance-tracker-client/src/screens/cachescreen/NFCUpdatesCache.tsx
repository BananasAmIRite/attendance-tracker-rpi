import CacheList from '../../components/CacheList';
import { NFCChanges } from '../../types/UserInfoTypes';
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
import { clearNFCChangesCache, flushNFCChangesCache, getNFCChangesCache } from '../../server/Student';

export default function NFCUpdatesCache() {
    const [nfcUploadLoading, setNfcUploadLoading] = useState(false);
    const [nfcDeleteLoading, setNfcDeleteLoading] = useState(false);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const { setMessage } = useContext(GlobalMessageContext);

    const navigate = useNavigate();

    const forceUpdate = () => {
        navigate(0);
    };
    return (
        <>
            <div style={{ marginTop: 30 }}>
                <p style={{ fontSize: '24px', textDecoration: 'bold' }}>NFC Changes Cache</p>
                <CacheList<NFCChanges>
                    getCache={getNFCChangesCache}
                    cacheToValues={(e) => [e.studentId, e.nfcId]}
                    labels={['Student Id', 'NFC ID']}
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
                    loading={nfcUploadLoading}
                    loadingPosition='start'
                    startIcon={<PublishIcon />}
                    color='primary'
                    variant='contained'
                    onClick={async () => {
                        setNfcUploadLoading(true);
                        flushNFCChangesCache()
                            .then(
                                () => {
                                    setMessage('Uploaded NFC Updates Successfully!');
                                    forceUpdate();
                                },
                                () => {}
                            )
                            .finally(() => setNfcUploadLoading(false));
                    }}
                >
                    Upload NFC Changes Cache
                </LoadingButton>
                <LoadingButton
                    loading={nfcDeleteLoading}
                    loadingPosition='start'
                    startIcon={<DeleteForeverIcon />}
                    variant='contained'
                    color='error'
                    onClick={() => {
                        setDeleteConfirmOpen(true);
                    }}
                >
                    Delete NFC Changes Cache
                </LoadingButton>
            </div>
            <Dialog open={deleteConfirmOpen}>
                <DialogTitle>Delete NFC Changes Cache</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete all NFC changes cache? (This will NOT upload data to Google Sheets)
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteConfirmOpen(false);
                            setNfcDeleteLoading(true);
                            clearNFCChangesCache()
                                .then(
                                    () => {
                                        setMessage('Cleared all nfc updates cache');
                                        forceUpdate();
                                    },
                                    () => {}
                                )
                                .finally(() => setNfcDeleteLoading(false));
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
