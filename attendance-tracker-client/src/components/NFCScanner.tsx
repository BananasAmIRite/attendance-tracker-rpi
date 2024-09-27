import { useContext, useEffect } from 'react';
import { socket } from '../server/nfc';
import { MdOutlinePageview } from 'react-icons/md';
import { GlobalMessageContext } from '../App';
export interface NFCScannerProps {
    handleTagScan: (tag: string) => void;
}

export default function NFCScanner(props: NFCScannerProps) {
    const { setMessage } = useContext(GlobalMessageContext);
    useEffect(() => {
        socket.removeAllListeners();
        socket.on('tag', async (tag) => {
            console.log('Received tag, ', tag);
            await props.handleTagScan(tag);
        });
        socket.on('status', async (online) => {
            console.log(`Received Status, ${online}`);
            setMessage(online ? '' : 'WARNING: Scanner is offline!');
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
            <MdOutlinePageview color='black' size={64} />
            {/* <Button onClick={() => props.handleTagScan('abcdefg')} variant='contained' style={{ width: '150px' }}>
                Test Scan
            </Button> */}
        </div>
    );
}
