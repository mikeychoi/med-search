// TEMPORARY demo of the search components using mock data. See demoData.ts for removal steps.
import { useState } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ErrorDialog from '../components/ErrorDialog/ErrorDialog';
import MedicationCard from '../components/MedicationCard/MedicationCard';
import { demoMedications } from './demoData';

function SearchPageDemo() {
  // Local state only to preview the dialog; not connected to error handling.
  const [errorOpen, setErrorOpen] = useState(false);

  return (
    <Stack spacing={2}>
      <Typography variant="h2">Example results</Typography>
      <Grid container spacing={2}>
        {demoMedications.map((medication) => (
          <Grid key={medication.rxcui} size={{ xs: 12, sm: 6, lg: 4 }}>
            <MedicationCard medication={medication} onAdd={() => {}} />
          </Grid>
        ))}
      </Grid>
      <div>
        <Button variant="text" color="error" onClick={() => setErrorOpen(true)}>
          Show example error
        </Button>
      </div>
      <ErrorDialog
        open={errorOpen}
        title="Search unavailable"
        message="Unable to reach the medication service. Check your connection and try again."
        onClose={() => setErrorOpen(false)}
      />
    </Stack>
  );
}

export default SearchPageDemo;
