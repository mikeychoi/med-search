import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import type { Medication, MedicationList } from '../../types/medication';
import ListSummaryRow from '../ListSummaryRow/ListSummaryRow';
import MedicationRow from '../MedicationRow/MedicationRow';

interface ListsOverviewProps {
  lists: MedicationList[];
  /** Called from the empty state's create button. */
  onCreate: () => void;
  /** Called with a row's list when its delete button is pressed. */
  onDelete: (list: MedicationList) => void;
  /** Called when a medication's remove button is pressed inside an expanded list. */
  onRemoveMedication: (list: MedicationList, medication: Medication) => void;
}

/**
 * All saved lists as rows that expand to show their medications, or an empty state
 * inviting the user to create a list.
 */
function ListsOverview({ lists, onCreate, onDelete, onRemoveMedication }: ListsOverviewProps) {
  const idPrefix = useId();
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

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
        {lists.map((list) => {
          const expanded = expandedIds.has(list.id);
          const contentsId = `${idPrefix}-${list.id}`;
          return [
            <ListSummaryRow
              key={list.id}
              list={list}
              expanded={expanded}
              onToggle={() => toggle(list.id)}
              contentsId={contentsId}
              onDelete={onDelete}
            />,
            <Collapse
              key={`${list.id}-contents`}
              id={contentsId}
              component="li"
              in={expanded}
              unmountOnExit
              sx={{ bgcolor: 'background.default' }}
            >
              {list.medications.length > 0 ? (
                <List disablePadding aria-label={`Medications in ${list.name}`} sx={{ pl: 5 }}>
                  {list.medications.map((medication) => (
                    <MedicationRow
                      key={medication.rxcui}
                      medication={medication}
                      onRemove={() => onRemoveMedication(list, medication)}
                    />
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, pl: 9, pr: 2 }}>
                  No medications yet.{' '}
                  <Link component={RouterLink} to="/">
                    Search for medications
                  </Link>{' '}
                  to add some.
                </Typography>
              )}
            </Collapse>,
          ];
        })}
      </List>
    </Paper>
  );
}

export default ListsOverview;
