import { FaCheckCircle } from 'react-icons/fa';

export interface StudentBindProps {
    id: string;
    nfcId: string;
}

// display for student info
export default function StudentBindDisplay(props: StudentBindProps) {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                zIndex: 100,
                position: 'absolute',
            }}
        >
            <FaCheckCircle color='green' size={64} />
            <div>
                <h1>Student ID: {props.id}</h1>
                <h2>successfully bound to NFC ID: {props.nfcId}</h2>
            </div>
        </div>
    );
}
