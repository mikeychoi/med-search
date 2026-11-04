import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddToListDialog from '../../components/AddToListDialog/AddToListDialog';
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog';
import NoticeSnackbar from '../../components/NoticeSnackbar/NoticeSnackbar';
import SearchBar from '../../components/SearchBar/SearchBar';
import SearchResults from '../../components/SearchResults/SearchResults';
import { useMedicationLists } from '../../hooks/useMedicationLists';
import { useMedicationSearch } from '../../hooks/useMedicationSearch';
import { useNotice } from '../../hooks/useNotice';
import type { Medication, MedicationList } from '../../types/medication';

function SearchPage() {
  const { status, submittedQuery, medications, error, isLoading, search, clearError } =
    useMedicationSearch();
  const { lists, loadError, addMedication } = useMedicationLists();
  const { notice, notify, closeNotice } = useNotice();
  // The medication stays set after the dialog closes so its text doesn't blank out mid-animation.
  const [medicationToAdd, setMedicationToAdd] = useState<Medication | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const openAddDialog = (medication: Medication) => {
    setMedicationToAdd(medication);
    setAddOpen(true);
  };

  function handleSelectList(list: MedicationList): string | undefined {
    if (!medicationToAdd) return;
    const result = addMedication(list.id, medicationToAdd);
    // On failure the dialog stays open and shows the message, e.g. for a duplicate.
    if (!result.ok) return result.message;
    setAddOpen(false);
    notify('success', `Added “${medicationToAdd.name}” to “${result.list.name}”.`);
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h1">Medication Search</Typography>
      <SearchBar onSearch={search} loading={isLoading} />
      <SearchResults
        status={status}
        query={submittedQuery}
        medications={medications}
        onAdd={openAddDialog}
      />
      <ErrorDialog
        open={error !== null}
        title="Search failed"
        message={error ?? ''}
        onClose={clearError}
      />
      <AddToListDialog
        open={addOpen}
        medication={medicationToAdd}
        lists={lists}
        loadError={loadError}
        onSelect={handleSelectList}
        onClose={() => setAddOpen(false)}
      />
      <NoticeSnackbar notice={notice} onClose={closeNotice} />
    </Stack>
  );
}

export default SearchPage;
