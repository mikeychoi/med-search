import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListsPageDemo from '../../mocks/ListsPageDemo'; // DEMO

function ListsPage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h1">Prescription Lists</Typography>
      <ListsPageDemo /* DEMO */ />
    </Stack>
  );
}

export default ListsPage;
