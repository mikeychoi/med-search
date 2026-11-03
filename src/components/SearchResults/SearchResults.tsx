import type { ReactNode } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import type { SearchStatus } from '../../hooks/useMedicationSearch';
import type { Medication } from '../../types/medication';
import MedicationCard from '../MedicationCard/MedicationCard';

interface SearchResultsProps {
  status: SearchStatus;
  /** The query the current results belong to; null before the first search. */
  query: string | null;
  medications: Medication[];
  onAdd: (medication: Medication) => void;
}

function StateMessage({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        {icon}
        {children}
      </Stack>
    </Paper>
  );
}

function SearchResults({ status, query, medications, onAdd }: SearchResultsProps) {
  if (status === 'idle') {
    return (
      <StateMessage icon={<SearchIcon color="action" sx={{ fontSize: 48 }} aria-hidden />}>
        <Typography>Search for a medication by name, such as “ibuprofen” or “Tylenol”.</Typography>
        <Typography variant="body2" color="text.secondary">
          Full medication names give the best results.
        </Typography>
      </StateMessage>
    );
  }

  if (status === 'loading') {
    return (
      <StateMessage icon={<CircularProgress aria-hidden />}>
        <Typography role="status">Searching…</Typography>
      </StateMessage>
    );
  }

  if (status === 'error') {
    return (
      <StateMessage>
        <Typography color="text.secondary">
          Your search for “{query}” couldn’t be completed. Please try again.
        </Typography>
      </StateMessage>
    );
  }

  if (medications.length === 0) {
    return (
      <StateMessage icon={<SearchOffIcon color="action" sx={{ fontSize: 48 }} aria-hidden />}>
        <Typography role="status">No medications found for “{query}”.</Typography>
        <Typography variant="body2" color="text.secondary">
          Check the spelling or try the full medication name.
        </Typography>
      </StateMessage>
    );
  }

  const count = medications.length;
  return (
    <Stack spacing={2}>
      <Typography role="status" color="text.secondary">
        {count} {count === 1 ? 'result' : 'results'} for “{query}”
      </Typography>
      <Grid container spacing={2}>
        {medications.map((medication) => (
          <Grid key={medication.rxcui} size={{ xs: 12, sm: 6, lg: 4 }}>
            <MedicationCard medication={medication} onAdd={onAdd} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default SearchResults;
