import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socket } from '../server/nfc';
import { Button } from '@mui/material';
import { MdOutlinePageview } from 'react-icons/md';
import { MdOutlineCreditCardOff } from 'react-icons/md';
import { MdOutlineCreditScore } from 'react-icons/md';

export type NFCScannerState = 'OFF' | 'SCANNING' | 'SCANNING_DONE';
export interface NFCScannerProps {
    handleTagScan: (tag: string) => void;
}

export default function NFCScanner(props: NFCScannerProps) {
    const [scannerState, setScannerState] = useState<NFCScannerState>('SCANNING');

    useEffect(() => {
        console.log(scannerState);
        socket.removeAllListeners();
        if (scannerState === 'SCANNING') {
            socket.on('tag', (tag) => {
                console.log('received data, ', tag);
                props.handleTagScan(tag);
            });
        }
    }, [scannerState]);

    useEffect(() => {
        setScannerState('SCANNING');
    }, []);

    return scannerState === 'OFF' ? (
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
            <MdOutlineCreditCardOff size={128} color='black' />
            <h1>Scanner Off. Tap to turn on</h1>
        </div>
    ) : scannerState === 'SCANNING' ? (
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
            <h1>Tap below to scan.</h1>
            <MdOutlinePageview color='black' size={128} />
            <Button onClick={() => props.handleTagScan('abcdefg')} variant='contained' style={{ width: '150px' }}>
                Test Scan
            </Button>
        </div>
    ) : (
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
            <h1>Scan Finished. </h1>
            <MdOutlineCreditScore size={128} color='black' />
        </div>
    );
}
