import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListAltIcon from '@mui/icons-material/ListAlt';

function ListsPage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h1">Prescription Lists</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <ListAltIcon color="action" sx={{ fontSize: 48 }} aria-hidden />
        <Typography color="text.secondary">
          Prescription list management will appear here.
        </Typography>
      </Paper>
    </Stack>
  );
}

export default ListsPage;
