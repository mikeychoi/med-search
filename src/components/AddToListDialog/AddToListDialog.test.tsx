import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Medication, MedicationList } from '../../types/medication';
import AddToListDialog from './AddToListDialog';

const tylenol: Medication = {
  rxcui: '209387',
  name: 'acetaminophen 325 MG Oral Tablet [Tylenol]',
  termType: 'SBD',
};

const painRelief: MedicationList = {
  id: 'list-1',
  name: 'Pain Relief',
  medications: [tylenol],
  createdAt: '2026-10-28T14:30:00.000Z',
  updatedAt: '2026-10-28T14:30:00.000Z',
};
const travelKit: MedicationList = {
  ...painRelief,
  id: 'list-2',
  name: 'Travel Kit',
  medications: [],
};

function setup({
  lists = [painRelief, travelKit],
  loadError = null as string | null,
  onSelect = vi.fn<(list: MedicationList) => string | undefined>(),
} = {}) {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <AddToListDialog
        open
        medication={tylenol}
        lists={lists}
        loadError={loadError}
        onSelect={onSelect}
        onClose={onClose}
      />
    </MemoryRouter>,
  );
  return { user: userEvent.setup(), onSelect, onClose };
}

const listButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('AddToListDialog', () => {
  it('shows the medication and each list with its medication count', () => {
    setup();

    const dialog = screen.getByRole('dialog', { name: 'Add to list' });
    expect(dialog).toHaveTextContent(tylenol.name);
    expect(listButton('Travel Kit')).toHaveTextContent('0 medications');
  });

  it('calls onSelect with the chosen list', async () => {
    const { user, onSelect } = setup();

    await user.click(listButton('Travel Kit'));

    expect(onSelect).toHaveBeenCalledWith(travelKit);
  });

  it('disables lists that already contain the medication', () => {
    setup();

    const button = listButton('Pain Relief');
    expect(button).toHaveTextContent('Already added');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the message returned by onSelect and stays open', async () => {
    const { user } = setup({ onSelect: vi.fn(() => 'Your lists couldn’t be saved.') });

    await user.click(listButton('Travel Kit'));

    expect(screen.getByRole('alert')).toHaveTextContent('Your lists couldn’t be saved.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('explains how to create a list when there are none', () => {
    setup({ lists: [] });

    expect(screen.getByText(/You don’t have any lists yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Lists' })).toHaveAttribute('href', '/lists');
  });

  it('shows the load error instead of lists', () => {
    setup({ lists: [], loadError: 'Your saved lists couldn’t be read.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Your saved lists couldn’t be read.');
    expect(screen.queryByRole('link', { name: 'Go to Lists' })).not.toBeInTheDocument();
  });

  it('calls onClose when canceled without selecting a list', async () => {
    const { user, onSelect, onClose } = setup();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
