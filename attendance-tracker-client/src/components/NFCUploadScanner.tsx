import { useEffect, useState } from 'react';
import NFCScanner from './NFCScanner';
import { bindStudentId, getStudentInfo, getStudentInfoByNFCId } from '../server/Student';
import { Button, TextField } from '@mui/material';

export interface NFCUploadScannerProps {
    handleCodeScan: (res: string) => void;
}

export default function NFCUploadScanner(props: NFCUploadScannerProps) {
    const [uploadState, setUploadState] = useState<'TAG_SCAN' | 'INPUT_ID' | 'INPUT_FAILURE'>('TAG_SCAN');
    const [nfcId, setNfcId] = useState('');
    const [stdId, setStdId] = useState('');

    const handleTag = async (uid: string) => {
        setNfcId(uid);

        const studentInfo = await getStudentInfoByNFCId(uid);
        if (studentInfo) {
            // student lookup successful
            props.handleCodeScan(studentInfo.studentId);
            setUploadState('TAG_SCAN');
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
            props.handleCodeScan(studentId);
            setUploadState('TAG_SCAN');
        }
    };

    return uploadState === 'TAG_SCAN' ? (
        <>
            <NFCScanner key='SCANNER' handleTagScan={handleTag} />
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
            <Button onClick={() => setUploadState('TAG_SCAN')} variant='contained'>
                Try Again.{' '}
            </Button>
        </div>
    ) : (
        <></>
    );
}
