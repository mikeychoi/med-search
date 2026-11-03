import { useId } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

interface ErrorDialogProps {
  open: boolean;
  /** A short, non-technical explanation of what went wrong. */
  message: string;
  /** Called when the user dismisses the dialog (button, Esc, or backdrop click). */
  onClose: () => void;
  title?: string;
  dismissLabel?: string;
}

function ErrorDialog({
  open,
  message,
  onClose,
  title = 'Something went wrong',
  dismissLabel = 'OK',
}: ErrorDialogProps) {
  const titleId = useId();
  const messageId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id={titleId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorOutlineIcon color="error" aria-hidden />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id={messageId}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose} autoFocus>
          {dismissLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ErrorDialog;
