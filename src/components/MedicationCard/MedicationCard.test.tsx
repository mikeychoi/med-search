import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Medication } from '../../types/medication';
import MedicationCard from './MedicationCard';

const tylenol: Medication = {
  rxcui: '209387',
  name: 'acetaminophen 325 MG Oral Tablet [Tylenol]',
  termType: 'SBD',
  synonym: 'Tylenol 325 MG Oral Tablet',
  prescribableName: 'Tylenol Regular Strength 325 MG Oral Tablet',
};

describe('MedicationCard', () => {
  it('shows the name, friendly term type, and RxCUI', () => {
    render(<MedicationCard medication={tylenol} onAdd={vi.fn()} />);

    expect(screen.getByRole('heading', { name: tylenol.name })).toBeInTheDocument();
    expect(screen.getByText('Branded Drug')).toBeInTheDocument();
    expect(screen.getByText('RxCUI 209387')).toBeInTheDocument();
  });

  it('prefers the prescribable name as the alternate name', () => {
    render(<MedicationCard medication={tylenol} onAdd={vi.fn()} />);

    expect(screen.getByText(tylenol.prescribableName!)).toBeInTheDocument();
    expect(screen.queryByText(tylenol.synonym!)).not.toBeInTheDocument();
  });

  it('falls back to the synonym when the prescribable name repeats the name', () => {
    const medication: Medication = {
      rxcui: '313782',
      name: 'acetaminophen 325 MG Oral Tablet',
      termType: 'SCD',
      synonym: 'APAP 325 MG Oral Tablet',
      prescribableName: 'acetaminophen 325 MG Oral Tablet',
    };
    render(<MedicationCard medication={medication} onAdd={vi.fn()} />);

    expect(screen.getByText('APAP 325 MG Oral Tablet')).toBeInTheDocument();
    expect(screen.getAllByText(medication.name)).toHaveLength(1);
  });

  it('omits the alternate name when none is available', () => {
    render(
      <MedicationCard
        medication={{ rxcui: '161', name: 'acetaminophen', termType: 'IN' }}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByText('Ingredient')).toBeInTheDocument();
    expect(screen.getAllByText(/acetaminophen/)).toHaveLength(1);
  });

  it('calls onAdd with the medication when the action button is pressed', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<MedicationCard medication={tylenol} onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: `Add to list: ${tylenol.name}` }));

    expect(onAdd).toHaveBeenCalledWith(tylenol);
  });

  it('supports a custom action label', () => {
    render(<MedicationCard medication={tylenol} onAdd={vi.fn()} actionLabel="Select" />);

    expect(screen.getByRole('button', { name: `Select: ${tylenol.name}` })).toHaveTextContent(
      'Select',
    );
  });
});
