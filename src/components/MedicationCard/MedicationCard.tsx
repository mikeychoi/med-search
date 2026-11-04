import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { RXNORM_TERM_TYPE_LABELS, type Medication } from '../../types/medication';

interface MedicationCardProps {
  medication: Medication;
  /** Called with this card's medication when the add button is pressed. */
  onAdd: (medication: Medication) => void;
}

/** The first alternate name that adds information beyond the medication's name. */
function getAlternateName({ name, prescribableName, synonym }: Medication) {
  return [prescribableName, synonym].find((alt) => alt && alt !== name);
}

function MedicationCard({ medication, onAdd }: MedicationCardProps) {
  const alternateName = getAlternateName(medication);

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1.5}>
          <Typography variant="h3" component="h2">
            {medication.name}
          </Typography>
          {alternateName && <Typography color="text.secondary">{alternateName}</Typography>}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              label={RXNORM_TERM_TYPE_LABELS[medication.termType]}
              size="small"
              color="secondary"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              RxCUI {medication.rxcui}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => onAdd(medication)}
          aria-label={`Add to list: ${medication.name}`}
        >
          Add to list
        </Button>
      </CardActions>
    </Card>
  );
}

export default MedicationCard;
