import { useId, useState, type SubmitEvent } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

interface CreateListDialogProps {
  open: boolean;
  /**
   * Called with the entered name. Returns a message to show under the field if the list
   * couldn't be created (the dialog stays open), or nothing on success.
   */
  onCreate: (name: string) => string | undefined;
  /** Called when the user cancels (button, Esc, or backdrop click). */
  onClose: () => void;
}

function CreateListDialog({ open, onCreate, onClose }: CreateListDialogProps) {
  const titleId = useId();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} maxWidth="xs" fullWidth>
      {/* Dialog unmounts its content when closed, so the form starts empty each time it opens. */}
      <CreateListForm titleId={titleId} onCreate={onCreate} onClose={onClose} />
    </Dialog>
  );
}

function CreateListForm({
  titleId,
  onCreate,
  onClose,
}: Omit<CreateListDialogProps, 'open'> & { titleId: string }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setError(onCreate(name));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogTitle id={titleId}>Create New List</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="List name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          error={error !== undefined}
          helperText={error}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={!name.trim()}>
          Create
        </Button>
      </DialogActions>
    </form>
  );
}

export default CreateListDialog;
