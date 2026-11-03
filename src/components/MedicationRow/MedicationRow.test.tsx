import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from '@mui/material/List';
import type { Medication } from '../../types/medication';
import MedicationRow from './MedicationRow';

const ibuprofen: Medication = {
  rxcui: '310965',
  name: 'ibuprofen 200 MG Oral Tablet',
  termType: 'SCD',
};

function renderRow(onRemove = vi.fn()) {
  render(
    <List>
      <MedicationRow medication={ibuprofen} onRemove={onRemove} />
    </List>,
  );
  return onRemove;
}

describe('MedicationRow', () => {
  it('shows the name with the term type and RxCUI', () => {
    renderRow();

    expect(screen.getByText(ibuprofen.name)).toBeInTheDocument();
    expect(screen.getByText('Clinical Drug · RxCUI 310965')).toBeInTheDocument();
  });

  it('calls onRemove with the medication when the remove button is pressed', async () => {
    const user = userEvent.setup();
    const onRemove = renderRow();

    await user.click(screen.getByRole('button', { name: `Remove ${ibuprofen.name}` }));

    expect(onRemove).toHaveBeenCalledWith(ibuprofen);
  });
});
