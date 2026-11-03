// TEMPORARY demo of the list components using mock data. See demoData.ts for removal steps.
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListSummaryRow from '../components/ListSummaryRow/ListSummaryRow';
import MedicationRow from '../components/MedicationRow/MedicationRow';
import { demoLists } from './demoData';

function ListsPageDemo() {
  const [previewList] = demoLists;

  return (
    <>
      <Stack spacing={1}>
        <Typography variant="h2">Your lists</Typography>
        <Paper variant="outlined">
          <List disablePadding aria-label="Medication lists">
            {demoLists.map((list) => (
              <ListSummaryRow key={list.id} list={list} to="/lists" onDelete={() => {}} />
            ))}
          </List>
        </Paper>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h2">{previewList.name}</Typography>
        <Paper variant="outlined">
          <List disablePadding aria-label={`Medications in ${previewList.name}`}>
            {previewList.medications.map((medication) => (
              <MedicationRow key={medication.rxcui} medication={medication} onRemove={() => {}} />
            ))}
          </List>
        </Paper>
      </Stack>
    </>
  );
}

export default ListsPageDemo;
