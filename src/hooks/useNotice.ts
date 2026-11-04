import { useCallback, useState } from 'react';
import type { AlertColor } from '@mui/material/Alert';

export interface Notice {
  severity: AlertColor;
  message: string;
  /** Kept separately so the message stays visible while the snackbar animates out. */
  open: boolean;
}

/** State for a single snackbar notice: `notify` shows a message, `closeNotice` hides it. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback(
    (severity: AlertColor, message: string) => setNotice({ severity, message, open: true }),
    [],
  );
  const closeNotice = useCallback(
    () => setNotice((current) => current && { ...current, open: false }),
    [],
  );

  return { notice, notify, closeNotice };
}
