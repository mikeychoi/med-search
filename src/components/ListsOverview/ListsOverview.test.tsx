import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MedicationList } from '../../types/medication';
import ListsOverview from './ListsOverview';

const lists: MedicationList[] = [
  {
    id: 'list-1',
    name: 'Pain Relief',
    medications: [],
    createdAt: '2026-10-28T14:30:00.000Z',
    updatedAt: '2026-10-28T14:30:00.000Z',
  },
  {
    id: 'list-2',
    name: 'Travel Kit',
    medications: [],
    createdAt: '2026-11-01T18:00:00.000Z',
    updatedAt: '2026-11-01T18:00:00.000Z',
  },
];

describe('ListsOverview', () => {
  it('renders a row for each list and reports deletes', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ListsOverview lists={lists} onCreate={vi.fn()} onDelete={onDelete} />);

    expect(screen.getByRole('list', { name: 'Medication lists' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Delete Travel Kit' }));
    expect(onDelete).toHaveBeenCalledWith(lists[1]);
  });

  it('shows an empty state whose button calls onCreate', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<ListsOverview lists={[]} onCreate={onCreate} onDelete={vi.fn()} />);

    expect(
      screen.getByText('No medication lists yet. Create your first list to get started.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create your first list' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
