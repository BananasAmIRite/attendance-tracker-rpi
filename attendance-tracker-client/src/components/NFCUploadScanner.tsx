import { useContext, useRef, useState } from 'react';
import NFCScanner from './NFCScanner';
import { bindStudentId, getStudentInfo, getStudentInfoByNFCId } from '../server/Student';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { MdOutlineCreditScore } from 'react-icons/md';
import { LoadingButton } from '@mui/lab';
import UploadIcon from '@mui/icons-material/Upload';
import { queryPasswordCorrect } from '../server/Attendance';
import { GlobalMessageContext } from '../App';

export interface HandleScanInformation {
    id: string;
    nfcId: string;
    source: 'TAG' | 'BIND';
}

export interface NFCUploadScannerProps {
    handleCodeScan: (res: HandleScanInformation) => Promise<boolean>;
    scanOnly: boolean;
}

/**
 * States the NFCUploadScanner can be in
 *
 * TAG_SCAN - waiting to scan tag
 * TAG_FIN - finished scanning tag
 * INPUT_ID - nfc id isn't bound to a valid student id; prompt for the student id
 * INPUT_FAILURE - the student id entered isn't valid
 * TAG_OVERWRITE - the student id entered already has an nfc id. overwrite?
 *
 */
export type UploadState = 'TAG_SCAN' | 'TAG_FIN' | 'INPUT_ID' | 'INPUT_FAILURE' | 'TAG_OVERWRITE';

// nfc scanner wrapper that also handles invalid ids
export default function NFCUploadScanner(props: NFCUploadScannerProps) {
    const [uploadState, setUploadState] = useState<UploadState>('TAG_SCAN');
    const [lastScannedNfcId, setLastScannedNfcId] = useState(''); // used to ensure id isn't scanned twice
    const [nfcId, setNfcId] = useState(''); // used to store the current nfc id to handle
    const [stdId, setStdId] = useState(''); // current student id to handle
    const [overwritePassword, setOverwritePassword] = useState(''); // overwrite screen's password

    const { setMessage } = useContext(GlobalMessageContext);

    const uploadStateRef = useRef<UploadState>();
    uploadStateRef.current = uploadState;

    // reset the uploader to the tag scanning state
    const resetToScan = () => {
        setUploadState('TAG_SCAN');
        setStdId('');
        setNfcId('');
        setOverwritePassword('');
    };

    // handle a tag scan
    const handleTag = async (uid: string) => {
        // ignore any tags that aren't sent during the TAG_SCAN state
        if (uploadStateRef.current !== 'TAG_SCAN') return;
        // ignore repeated tags
        if (uid === lastScannedNfcId) return;
        console.log('handling tag...');

        setNfcId(uid);

        setUploadState('TAG_FIN');

        // look up student info for this tag
        const studentInfo = await getStudentInfoByNFCId(uid);
        if (studentInfo) {
            console.log('handling upload...');
            // student lookup successful, proceed forward with scanning student in
            await handleScan({ id: studentInfo.studentId, source: 'TAG', nfcId: uid });
        } else {
            // couldn't find student
            if (!props.scanOnly) {
                // we aren't in scan-only mode. create new profile
                setUploadState('INPUT_ID');
            } else {
                // output a message saying that id is invalid
                resetToScan();
                setLastScannedNfcId(uid);
                setMessage(`Invalid id detected. Ensure you're not holding multiple ids to the scanner. `);
            }
        }
    };

    // tracks whether or not nfc binding is happening
    const [nfcBindLoading, setNfcBindLoading] = useState(false);

    // handle student id input during INPUT_ID phase
    const handleCode = async (ignoreTagOverwrite: boolean = false) => {
        setNfcBindLoading(true);
        // get student info linked to the id inputted
        const student = await getStudentInfo(stdId);
        if (!student) {
            // no student find for such id. possibly not a member?
            setUploadState('INPUT_FAILURE');
        } else if (student.nfcId && !ignoreTagOverwrite) {
            // nfc id exists, overwrite the nfc id
            setUploadState('TAG_OVERWRITE');
        } else {
            // all good, bind student id to the nfc id and proceed with scanning student in
            await bindStudentId(stdId, nfcId);
            await handleScan({ id: stdId, source: 'BIND', nfcId });
        }

        setNfcBindLoading(false);
    };

    // wrapper for handling scan to set the last scanned id if the next part of scanning is successful
    const handleScan = async (info: HandleScanInformation) => {
        const scanSuccessful = await props.handleCodeScan(info);
        if (scanSuccessful) setLastScannedNfcId(info.nfcId);
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
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    marginTop: '1%',
                    width: '50%',
                }}
            >
                <Button variant='contained' onClick={resetToScan}>
                    Cancel
                </Button>
                <LoadingButton
                    loading={nfcBindLoading}
                    loadingPosition='start'
                    startIcon={<UploadIcon />}
                    onClick={() => handleCode()}
                    variant='contained'
                >
                    Submit
                </LoadingButton>
            </div>
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
    ) : uploadState === 'TAG_OVERWRITE' ? (
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
            <h1>
                Overwriting existing tag... <br /> Please enter the admin password
            </h1>
            <TextField
                style={{ width: '50%' }}
                label='Password'
                variant='outlined'
                value={overwritePassword}
                onChange={(e) => setOverwritePassword(e.target.value)}
                autoComplete='off'
                type='password'
            />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    marginTop: '1%',
                    width: '50%',
                }}
            >
                <Button onClick={() => resetToScan()} variant='contained'>
                    Cancel
                </Button>
                <LoadingButton
                    variant='contained'
                    loading={nfcBindLoading}
                    onClick={async () => {
                        const correct = await queryPasswordCorrect(overwritePassword);
                        setOverwritePassword('');

                        if (!correct) {
                            setMessage('Incorrect password. Try again. ');
                            resetToScan();
                            return;
                        }
                        await handleCode(true);
                    }}
                >
                    Overwrite
                </LoadingButton>
            </div>
        </div>
    ) : (
        <></>
    );
}
