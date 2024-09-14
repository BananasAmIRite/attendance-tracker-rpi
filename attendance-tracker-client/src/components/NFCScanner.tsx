import { useEffect } from 'react';
import { socket } from '../server/nfc';
import { MdOutlinePageview } from 'react-icons/md';
export interface NFCScannerProps {
    handleTagScan: (tag: string) => void;
}

export default function NFCScanner(props: NFCScannerProps) {
    useEffect(() => {
        socket.removeAllListeners();
        socket.on('tag', async (tag) => {
            console.log('Received tag, ', tag);
            props.handleTagScan(tag);
        });
    }, []);

    return (
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
            {/* <Button onClick={() => props.handleTagScan('abcdefg')} variant='contained' style={{ width: '150px' }}>
                Test Scan
            </Button> */}
        </div>
    );
}
