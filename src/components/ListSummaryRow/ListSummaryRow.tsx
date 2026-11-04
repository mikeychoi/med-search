import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { MedicationList } from '../../types/medication';

interface ListSummaryRowProps {
  list: MedicationList;
  /** Called when the row is pressed, to show or hide the list's contents. */
  onToggle: () => void;
  /** Whether the list's contents are showing. */
  expanded: boolean;
  /** ID of the element `onToggle` shows or hides, for assistive technology. */
  contentsId: string;
  /** Called with this row's list when the delete button is pressed. */
  onDelete: (list: MedicationList) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function formatDate(isoTimestamp: string) {
  const date = new Date(isoTimestamp);
  return Number.isNaN(date.getTime()) ? 'Unknown' : dateFormatter.format(date);
}

function ListSummaryRow({ list, onToggle, expanded, contentsId, onDelete }: ListSummaryRowProps) {
  const count = list.medications.length;
  const details = [
    `${count} ${count === 1 ? 'medication' : 'medications'}`,
    `Created ${formatDate(list.createdAt)}`,
    `Updated ${formatDate(list.updatedAt)}`,
  ].join(' · ');

  return (
    <ListItem
      divider
      disablePadding
      secondaryAction={
        <Tooltip title="Delete list">
          <IconButton edge="end" aria-label={`Delete ${list.name}`} onClick={() => onDelete(list)}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemButton onClick={onToggle} aria-expanded={expanded} aria-controls={contentsId}>
        <ListItemIcon sx={{ minWidth: 40 }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>
        <ListItemText
          primary={list.name}
          secondary={details}
          slotProps={{ primary: { sx: { fontWeight: 600 } } }}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default ListSummaryRow;
