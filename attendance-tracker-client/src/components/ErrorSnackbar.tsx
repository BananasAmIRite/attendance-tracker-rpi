import Snackbar from '@mui/material/Snackbar';
import { useEffect, useState } from 'react';

export default function MessageSnackbar(props: { message: { msg: string } }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (props.message.msg !== '') setOpen(true);
    }, [props.message]);

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={open}
            onClose={() => {
                setOpen(false);
            }}
            message={props.message.msg} // hacky way to force it to rerender when the object changes
            autoHideDuration={5000}
        />
    );
}
