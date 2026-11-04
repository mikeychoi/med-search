import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import type { MedicationList } from '../../types/medication';
import ListSummaryRow from '../ListSummaryRow/ListSummaryRow';

interface ListsOverviewProps {
  lists: MedicationList[];
  /** Called from the empty state's create button. */
  onCreate: () => void;
  /** Called with a row's list when its delete button is pressed. */
  onDelete: (list: MedicationList) => void;
}

/** All saved lists as rows, or an empty state inviting the user to create one. */
function ListsOverview({ lists, onCreate, onDelete }: ListsOverviewProps) {
  if (lists.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <PlaylistAddIcon color="action" sx={{ fontSize: 48 }} aria-hidden />
          <Typography>No medication lists yet. Create your first list to get started.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreate}>
            Create your first list
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined">
      <List disablePadding aria-label="Medication lists">
        {lists.map((list) => (
          <ListSummaryRow key={list.id} list={list} onDelete={onDelete} />
        ))}
      </List>
    </Paper>
  );
}

export default ListsOverview;
