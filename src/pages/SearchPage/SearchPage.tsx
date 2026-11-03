import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog';
import SearchBar from '../../components/SearchBar/SearchBar';
import SearchResults from '../../components/SearchResults/SearchResults';
import { useMedicationSearch } from '../../hooks/useMedicationSearch';

function SearchPage() {
  const { status, submittedQuery, medications, error, isLoading, search, clearError } =
    useMedicationSearch();

  return (
    <Stack spacing={3}>
      <Typography variant="h1">Medication Search</Typography>
      <SearchBar onSearch={search} loading={isLoading} />
      <SearchResults
        status={status}
        query={submittedQuery}
        medications={medications}
        // Placeholder: adding to a list is not implemented yet.
        onAdd={() => {}}
      />
      <ErrorDialog
        open={error !== null}
        title="Search failed"
        message={error ?? ''}
        onClose={clearError}
      />
    </Stack>
  );
}

export default SearchPage;
