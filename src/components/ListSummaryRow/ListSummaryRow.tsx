import { Link as RouterLink } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import type { MedicationList } from '../../types/medication';

interface ListSummaryRowProps {
  list: MedicationList;
  /** Route the list name links to. Without it, the row is not a link. */
  to?: string;
  /** Called with this row's list when the delete button is pressed. */
  onDelete: (list: MedicationList) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function formatDate(isoTimestamp: string) {
  const date = new Date(isoTimestamp);
  return Number.isNaN(date.getTime()) ? 'Unknown' : dateFormatter.format(date);
}

function ListSummaryRow({ list, to, onDelete }: ListSummaryRowProps) {
  const count = list.medications.length;
  const details = [
    `${count} ${count === 1 ? 'medication' : 'medications'}`,
    `Created ${formatDate(list.createdAt)}`,
    `Updated ${formatDate(list.updatedAt)}`,
  ].join(' · ');

  const text = (
    <ListItemText
      primary={list.name}
      secondary={details}
      slotProps={{ primary: { sx: { fontWeight: 600 } } }}
    />
  );

  return (
    <ListItem
      divider
      disablePadding={to !== undefined}
      secondaryAction={
        <Tooltip title="Delete list">
          <IconButton edge="end" aria-label={`Delete ${list.name}`} onClick={() => onDelete(list)}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      }
    >
      {to === undefined ? (
        text
      ) : (
        <ListItemButton component={RouterLink} to={to}>
          {text}
        </ListItemButton>
      )}
    </ListItem>
  );
}

export default ListSummaryRow;
