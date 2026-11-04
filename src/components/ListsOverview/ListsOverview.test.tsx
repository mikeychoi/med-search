import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { MedicationList } from '../../types/medication';
import ListsOverview from './ListsOverview';

const lists: MedicationList[] = [
  {
    id: 'list-1',
    name: 'Pain Relief',
    medications: [
      { rxcui: '310965', name: 'ibuprofen 200 MG Oral Tablet', termType: 'SCD' },
      { rxcui: '209387', name: 'acetaminophen 325 MG Oral Tablet [Tylenol]', termType: 'SBD' },
    ],
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

function setup(overviewLists = lists) {
  const handlers = { onCreate: vi.fn(), onDelete: vi.fn(), onRemoveMedication: vi.fn() };
  render(
    <MemoryRouter>
      <ListsOverview lists={overviewLists} {...handlers} />
    </MemoryRouter>,
  );
  return { user: userEvent.setup(), ...handlers };
}

const toggle = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('ListsOverview', () => {
  it('renders a collapsed row for each list and reports deletes', async () => {
    const { user, onDelete } = setup();

    expect(screen.getByRole('list', { name: 'Medication lists' })).toBeInTheDocument();
    expect(toggle('Pain Relief')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Medications in Pain Relief' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete Travel Kit' }));
    expect(onDelete).toHaveBeenCalledWith(lists[1]);
  });

  it('expands a list to show its medications, and collapses it again', async () => {
    const { user } = setup();

    await user.click(toggle('Pain Relief'));

    expect(toggle('Pain Relief')).toHaveAttribute('aria-expanded', 'true');
    const contents = screen.getByRole('list', { name: 'Medications in Pain Relief' });
    const controlsId = toggle('Pain Relief').getAttribute('aria-controls');
    expect(document.getElementById(controlsId ?? '')).toContainElement(contents);
    expect(within(contents).getAllByRole('listitem')).toHaveLength(2);
    // Other lists stay collapsed.
    expect(toggle('Travel Kit')).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle('Pain Relief'));
    await waitFor(() =>
      expect(screen.queryByRole('list', { name: 'Medications in Pain Relief' })).toBeNull(),
    );
  });

  it('reports the list and medication when a medication is removed', async () => {
    const { user, onRemoveMedication } = setup();

    await user.click(toggle('Pain Relief'));
    await user.click(screen.getByRole('button', { name: 'Remove ibuprofen 200 MG Oral Tablet' }));

    expect(onRemoveMedication).toHaveBeenCalledWith(lists[0], lists[0].medications[0]);
  });

  it('links to Search from an expanded empty list', async () => {
    const { user } = setup();

    await user.click(toggle('Travel Kit'));

    expect(screen.getByText(/No medications yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Search for medications' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('shows an empty state whose button calls onCreate', async () => {
    const { user, onCreate } = setup([]);

    expect(
      screen.getByText('No medication lists yet. Create your first list to get started.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create your first list' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
