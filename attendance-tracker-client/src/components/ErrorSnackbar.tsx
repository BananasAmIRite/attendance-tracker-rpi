import Snackbar from '@mui/material/Snackbar';
import { useEffect, useState } from 'react';

// snackbar for displaying messages
export default function MessageSnackbar(props: { message: { msg: string } }) {
    // whether or not the snackbar is open
    const [open, setOpen] = useState(false);

    // open when the message isnt empty (just putting it in open={} doesn't work cuz autohide)
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
