import { useState } from 'react';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import CreateListDialog from '../../components/CreateListDialog/CreateListDialog';
import ListsOverview from '../../components/ListsOverview/ListsOverview';
import { useMedicationLists } from '../../hooks/useMedicationLists';
import type { MedicationList } from '../../types/medication';

interface Notice {
  severity: AlertColor;
  message: string;
  /** Kept separately so the message stays visible while the snackbar animates out. */
  open: boolean;
}

function ListsPage() {
  const { lists, loadError, create, remove } = useMedicationLists();
  const [createOpen, setCreateOpen] = useState(false);
  // The list stays set after the dialog closes so its text doesn't blank out mid-animation.
  const [listToDelete, setListToDelete] = useState<MedicationList | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = (severity: AlertColor, message: string) =>
    setNotice({ severity, message, open: true });
  const closeNotice = () => setNotice((current) => current && { ...current, open: false });

  function handleCreate(name: string): string | undefined {
    const result = create(name);
    // On failure the dialog stays open and shows the message, e.g. for a duplicate name.
    if (!result.ok) return result.message;
    setCreateOpen(false);
    notify('success', `Created “${result.list.name}”.`);
  }

  function handleConfirmDelete() {
    if (!listToDelete) return;
    setConfirmOpen(false);

    const result = remove(listToDelete.id);
    if (!result.ok) {
      notify('error', result.message);
    } else if (result.alreadyDeleted) {
      notify('info', `“${listToDelete.name}” had already been deleted.`);
    } else {
      notify('success', `Deleted “${listToDelete.name}”.`);
    }
  }

  const openCreate = () => setCreateOpen(true);
  const requestDelete = (list: MedicationList) => {
    setListToDelete(list);
    setConfirmOpen(true);
  };
  const deleteCount = listToDelete?.medications.length ?? 0;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Typography variant="h1">Prescription Lists</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Create New List
        </Button>
      </Stack>

      {loadError && <Alert severity="error">{loadError}</Alert>}

      {/* When loading failed, the alert replaces the "no lists yet" empty state. */}
      {(lists.length > 0 || !loadError) && (
        <ListsOverview lists={lists} onCreate={openCreate} onDelete={requestDelete} />
      )}

      <CreateListDialog
        open={createOpen}
        onCreate={handleCreate}
        onClose={() => setCreateOpen(false)}
      />
      <ConfirmDialog
        open={confirmOpen}
        title={`Delete “${listToDelete?.name ?? ''}”?`}
        message={`This removes the list and the ${deleteCount} ${deleteCount === 1 ? 'medication' : 'medications'} in it. This can’t be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
      <Snackbar
        open={notice?.open ?? false}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== 'clickaway' && closeNotice()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* Snackbar needs a single element child even while closed. */}
        <Alert
          severity={notice?.severity ?? 'info'}
          variant="filled"
          onClose={closeNotice}
          sx={{ width: '100%' }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default ListsPage;
