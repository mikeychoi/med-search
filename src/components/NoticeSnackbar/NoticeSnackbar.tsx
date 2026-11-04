import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import type { Notice } from '../../hooks/useNotice';

interface NoticeSnackbarProps {
  notice: Notice | null;
  onClose: () => void;
}

/** Shows a short success, info, or error message at the bottom of the screen. */
function NoticeSnackbar({ notice, onClose }: NoticeSnackbarProps) {
  return (
    <Snackbar
      open={notice?.open ?? false}
      autoHideDuration={4000}
      onClose={(_, reason) => reason !== 'clickaway' && onClose()}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {/* Snackbar needs a single element child even while closed. */}
      <Alert
        severity={notice?.severity ?? 'info'}
        variant="filled"
        onClose={onClose}
        sx={{ width: '100%' }}
      >
        {notice?.message}
      </Alert>
    </Snackbar>
  );
}

export default NoticeSnackbar;
