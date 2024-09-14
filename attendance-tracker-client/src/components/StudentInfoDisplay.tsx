import { FaCheckCircle } from 'react-icons/fa';

export interface StudentInfoProps {
    name: string;
    id: string;
    scanTime: string;
    attendanceStatus: 'ABSENT' | 'PRESENT';
    action: 'SCAN_IN' | 'SCAN_OUT';
}

export default function StudentInfoDisplay(props: StudentInfoProps) {
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
                <h1>{props.action === 'SCAN_IN' ? 'Welcome,' : 'Bye!'}</h1>
                <h2>{props.name}</h2>
            </div>
            <h3>You've been marked {props.attendanceStatus === 'ABSENT' ? 'Absent' : 'Present'}</h3>

            <h4 style={{ textAlign: 'center', marginTop: '1%', marginBottom: '1%' }}>Student ID: {props.id}</h4>
            <div>
                <h4>Scanned in at {props.scanTime}</h4>
            </div>
        </div>
    );
}
