import { useRef, useState } from 'react';
import NFCScanner from './NFCScanner';
import { bindStudentId, getStudentInfo, getStudentInfoByNFCId } from '../server/Student';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { MdOutlineCreditScore } from 'react-icons/md';

export interface NFCUploadScannerProps {
    handleCodeScan: (res: string) => Promise<boolean>;
}

export type UploadState = 'TAG_SCAN' | 'TAG_FIN' | 'INPUT_ID' | 'INPUT_FAILURE';

export default function NFCUploadScanner(props: NFCUploadScannerProps) {
    const [uploadState, setUploadState] = useState<UploadState>('TAG_SCAN');
    const [scannedNfcId, setScannedNfcId] = useState(''); // used to ensure id isn't scanned twice
    const [nfcId, setNfcId] = useState(''); // used to store the current nfc id to handle
    const [stdId, setStdId] = useState('');

    const uploadStateRef = useRef<UploadState>();
    uploadStateRef.current = uploadState;

    const resetToScan = () => {
        setUploadState('TAG_SCAN');
    };

    const handleTag = async (uid: string) => {
        if (uploadStateRef.current !== 'TAG_SCAN') return;
        if (uid === scannedNfcId) return;
        console.log('handling tag...');

        setNfcId(uid);

        setUploadState('TAG_FIN');

        const studentInfo = await getStudentInfoByNFCId(uid);
        if (studentInfo) {
            console.log('handling upload...');
            // student lookup successful
            await handleScan(uid, studentInfo.studentId);
        } else {
            // couldn't find student. create new profile
            setUploadState('INPUT_ID');
        }
    };

    const handleCode = async () => {
        const studentId = stdId;
        setStdId('');
        const student = await getStudentInfo(studentId);
        if (!student || student.nfcId) {
            // no student find for such id. possibly not a robolancers member?
            setUploadState('INPUT_FAILURE');
        } else {
            await bindStudentId(studentId, nfcId);
            await handleScan(nfcId, studentId);
        }
    };

    const handleScan = async (nfcId: string, id: string) => {
        const val = await props.handleCodeScan(id);
        if (val) {
            setScannedNfcId(nfcId);
        }
        resetToScan();
    };

    return uploadState === 'TAG_SCAN' ? (
        <>
            <NFCScanner handleTagScan={handleTag} />
        </>
    ) : uploadState === 'INPUT_ID' ? (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <h2>Please enter your Student ID</h2>
            <TextField
                style={{ width: '50%' }}
                label='Student ID'
                variant='outlined'
                value={stdId}
                onChange={(e) => setStdId(e.target.value)}
                autoComplete='off'
            />
            <br />
            <Button onClick={handleCode} variant='contained'>
                Submit
            </Button>
        </div>
    ) : uploadState === 'INPUT_FAILURE' ? (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <h2>Invalid or already used Student ID. Please try again. </h2>
            <Button onClick={() => resetToScan()} variant='contained'>
                Try Again.{' '}
            </Button>
        </div>
    ) : uploadState === 'TAG_FIN' ? (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <h1>Received Tag. Processing...</h1>
            <MdOutlineCreditScore size={64} color='black' />
        </div>
    ) : (
        <></>
    );
}
