import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';

function SearchPage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h1">Medication Search</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <SearchIcon color="action" sx={{ fontSize: 48 }} aria-hidden />
        <Typography color="text.secondary">Medication search will appear here.</Typography>
      </Paper>
    </Stack>
  );
}

export default SearchPage;
