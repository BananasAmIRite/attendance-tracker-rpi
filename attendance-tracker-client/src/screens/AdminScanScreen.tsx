import { useState } from 'react';
import NFCUploadScanner, { HandleScanInformation } from '../components/NFCUploadScanner';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router';
import Button from '@mui/material/Button';
import StudentBindDisplay, { StudentBindProps } from '../components/StudentBindDisplay';

export default function AdminScanScreen() {
    const [displayUser, setDisplayUser] = useState<true | false | 'LOADING'>(false);
    const [displayedStudentInfo, setStudentInfo] = useState<StudentBindProps | null>(null);

    const navigate = useNavigate();

    const handleCodeScan = ({ id, source, nfcId }: HandleScanInformation) =>
        new Promise<boolean>(async (res) => {
            if (source !== 'BIND') return res(true);
            if (displayUser) return res(false); // disable scanning when user is being displayed
            setDisplayUser('LOADING');

            setStudentInfo({ id, nfcId });
            setDisplayUser(true);

            setTimeout(() => {
                setDisplayUser(false);
                return res(true);
            }, 2000);
        });

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', zIndex: '0', width: '100%', height: '100%' }}>
                <NFCUploadScanner handleCodeScan={handleCodeScan} scanOnly={false} />
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
                <StudentBindDisplay {...(displayedStudentInfo ?? { id: 'None', nfcId: 'None' })} />
            ) : (
                <></>
            )}
            <Button
                variant='contained'
                onClick={() => {
                    navigate('/supersecretscreen');
                }}
            >
                Back to Admin Panel
            </Button>
        </div>
    );
}
