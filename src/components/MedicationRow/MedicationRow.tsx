import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { RXNORM_TERM_TYPE_LABELS, type Medication } from '../../types/medication';

interface MedicationRowProps {
  medication: Medication;
  /** Called with this row's medication when the remove button is pressed. */
  onRemove: (medication: Medication) => void;
}

function MedicationRow({ medication, onRemove }: MedicationRowProps) {
  return (
    <ListItem
      divider
      secondaryAction={
        <Tooltip title="Remove from list">
          <IconButton
            edge="end"
            aria-label={`Remove ${medication.name}`}
            onClick={() => onRemove(medication)}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemText
        primary={medication.name}
        secondary={`${RXNORM_TERM_TYPE_LABELS[medication.termType]} · RxCUI ${medication.rxcui}`}
      />
    </ListItem>
  );
}

export default MedicationRow;
