import { useContext, useEffect } from 'react';
import { socket } from '../server/nfc';
import { MdOutlinePageview } from 'react-icons/md';
import { GlobalMessageContext } from '../App';
export interface NFCScannerProps {
    handleTagScan: (tag: string) => void;
}

// base nfc scanner, queries for a tag from the server and returns it in a callback
export default function NFCScanner(props: NFCScannerProps) {
    const { setMessage } = useContext(GlobalMessageContext);
    useEffect(() => {
        // reset listeners
        socket.removeAllListeners();
        // run callback when a tag is received
        socket.on('tag', async (tag) => {
            console.log('Received tag, ', tag);
            await props.handleTagScan(tag);
        });
        // notify if reader is offline
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
        </div>
    );
}
