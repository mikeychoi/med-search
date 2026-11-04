import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import type { Medication, MedicationList } from '../../types/medication';

interface AddToListDialogProps {
  open: boolean;
  /** The medication being added; kept while the dialog animates closed. */
  medication: Medication | null;
  lists: MedicationList[];
  /** Shown instead of the lists when saved lists couldn't be loaded. */
  loadError?: string | null;
  /**
   * Called with the chosen list. Returns a message to show if the medication couldn't be
   * added (the dialog stays open), or nothing on success.
   */
  onSelect: (list: MedicationList) => string | undefined;
  /** Called when the user cancels (button, Esc, or backdrop click). */
  onClose: () => void;
}

function AddToListDialog({ open, onClose, ...contentProps }: AddToListDialogProps) {
  const titleId = useId();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} maxWidth="xs" fullWidth>
      {/* Dialog unmounts its content when closed, so any error is cleared on reopening. */}
      <AddToListContent titleId={titleId} {...contentProps} />
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

function AddToListContent({
  titleId,
  medication,
  lists,
  loadError,
  onSelect,
}: Omit<AddToListDialogProps, 'open' | 'onClose'> & { titleId: string }) {
  const [error, setError] = useState<string | undefined>();
  const contains = (list: MedicationList) =>
    list.medications.some((m) => m.rxcui === medication?.rxcui);

  function renderLists() {
    if (loadError) {
      return <Alert severity="error">{loadError}</Alert>;
    }

    if (lists.length === 0) {
      return (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <DialogContentText>
            You don’t have any lists yet. Create a list first, then add medications to it.
          </DialogContentText>
          <Button variant="contained" component={RouterLink} to="/lists">
            Go to Lists
          </Button>
        </Stack>
      );
    }

    return (
      <List disablePadding aria-label="Your lists">
        {lists.map((list) => {
          const added = contains(list);
          const count = list.medications.length;
          return (
            <ListItemButton
              key={list.id}
              disabled={added}
              onClick={() => setError(onSelect(list))}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText
                primary={list.name}
                secondary={
                  added ? 'Already added' : `${count} ${count === 1 ? 'medication' : 'medications'}`
                }
              />
            </ListItemButton>
          );
        })}
      </List>
    );
  }

  return (
    <>
      <DialogTitle id={titleId}>Add to list</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {medication && <DialogContentText>{medication.name}</DialogContentText>}
          {error && <Alert severity="warning">{error}</Alert>}
          {renderLists()}
        </Stack>
      </DialogContent>
    </>
  );
}

export default AddToListDialog;
