import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SearchBar from '../../components/SearchBar/SearchBar';
import SearchPageDemo from '../../mocks/SearchPageDemo'; // DEMO

function SearchPage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h1">Medication Search</Typography>
      <SearchBar onSearch={() => {}} />
      <SearchPageDemo /* DEMO */ />
    </Stack>
  );
}

export default SearchPage;
