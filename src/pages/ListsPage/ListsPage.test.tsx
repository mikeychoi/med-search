import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  MedicationListError,
  createList,
  deleteList,
  getLists,
} from '../../services/medicationLists';
import type { MedicationList } from '../../types/medication';
import ListsPage from './ListsPage';

// Replace the service functions; keep the real MedicationListError for instanceof checks.
vi.mock('../../services/medicationLists', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/medicationLists')>()),
  getLists: vi.fn(),
  createList: vi.fn(),
  deleteList: vi.fn(),
}));

const getListsMock = vi.mocked(getLists);
const createListMock = vi.mocked(createList);
const deleteListMock = vi.mocked(deleteList);

const painRelief: MedicationList = {
  id: 'list-1',
  name: 'Pain Relief',
  medications: [
    { rxcui: '310965', name: 'ibuprofen 200 MG Oral Tablet', termType: 'SCD' },
    { rxcui: '313782', name: 'acetaminophen 325 MG Oral Tablet', termType: 'SCD' },
  ],
  createdAt: '2026-10-28T14:30:00.000Z',
  updatedAt: '2026-11-02T09:15:00.000Z',
};

const travelKit: MedicationList = {
  id: 'list-2',
  name: 'Travel Kit',
  medications: [],
  createdAt: '2026-11-01T18:00:00.000Z',
  updatedAt: '2026-11-01T18:00:00.000Z',
};

function setup(lists: MedicationList[] = []) {
  getListsMock.mockReturnValue(lists);
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ListsPage />
    </MemoryRouter>,
  );
  return {
    user,
    // Each row's delete button is labeled "Delete <list name>". `hidden` includes the page
    // content that MUI marks aria-hidden while a dialog is open or animating closed.
    listNames: () =>
      within(screen.getByRole('list', { name: 'Medication lists', hidden: true }))
        .getAllByRole('button', { name: /^Delete /, hidden: true })
        .map((button) => button.getAttribute('aria-label')?.replace(/^Delete /, '')),
    openCreateDialog: async () => {
      await user.click(screen.getByRole('button', { name: 'Create New List' }));
      return screen.getByRole('dialog', { name: 'Create New List' });
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  getListsMock.mockReset();
  createListMock.mockReset();
  deleteListMock.mockReset();
});

describe('ListsPage', () => {
  describe('displaying lists', () => {
    it('shows saved lists with their medication counts', () => {
      const { listNames } = setup([painRelief, travelKit]);

      expect(getListsMock).toHaveBeenCalledTimes(1);
      expect(listNames()).toEqual(['Pain Relief', 'Travel Kit']);
      expect(screen.getByText(/^2 medications · Created/)).toBeInTheDocument();
      expect(screen.getByText(/^0 medications · Created/)).toBeInTheDocument();
      expect(screen.queryByText(/No medication lists yet/)).not.toBeInTheDocument();
    });

    it('shows an empty state with a create button when there are no lists', async () => {
      const { user } = setup([]);

      expect(
        screen.getByText('No medication lists yet. Create your first list to get started.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('list', { name: 'Medication lists' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Create your first list' }));
      expect(screen.getByRole('dialog', { name: 'Create New List' })).toBeInTheDocument();
    });

    it('shows an alert instead of crashing when saved lists cannot be loaded', () => {
      getListsMock.mockImplementation(() => {
        throw new MedicationListError('invalid-data');
      });
      render(
        <MemoryRouter>
          <ListsPage />
        </MemoryRouter>,
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Your saved lists couldn’t be read.');
      expect(screen.queryByText(/No medication lists yet/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create New List' })).toBeEnabled();
    });
  });

  describe('creating a list', () => {
    it('opens the create dialog with an empty name field', async () => {
      const { openCreateDialog } = setup();

      const dialog = await openCreateDialog();

      expect(within(dialog).getByRole('textbox', { name: 'List name' })).toHaveValue('');
      expect(within(dialog).getByRole('button', { name: 'Create' })).toBeDisabled();
    });

    it('creates the list with the entered name and shows it', async () => {
      createListMock.mockReturnValue(travelKit);
      const { user, openCreateDialog, listNames } = setup([painRelief]);

      const dialog = await openCreateDialog();
      await user.type(within(dialog).getByRole('textbox', { name: 'List name' }), 'Travel Kit');
      await user.click(within(dialog).getByRole('button', { name: 'Create' }));

      expect(createListMock).toHaveBeenCalledTimes(1);
      expect(createListMock).toHaveBeenCalledWith('Travel Kit');
      expect(listNames()).toEqual(['Pain Relief', 'Travel Kit']);
      expect(screen.getByText('Created “Travel Kit”.')).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('submits with Enter and clears the field the next time the dialog opens', async () => {
      createListMock.mockReturnValue(travelKit);
      const { user, openCreateDialog } = setup();

      const dialog = await openCreateDialog();
      await user.type(within(dialog).getByRole('textbox'), 'Travel Kit{Enter}');
      expect(createListMock).toHaveBeenCalledWith('Travel Kit');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      const reopened = await openCreateDialog();
      expect(within(reopened).getByRole('textbox')).toHaveValue('');
    });

    it('does not submit an empty or whitespace-only name', async () => {
      const { user, openCreateDialog } = setup();

      const dialog = await openCreateDialog();
      const input = within(dialog).getByRole('textbox');
      await user.type(input, '   ');

      expect(within(dialog).getByRole('button', { name: 'Create' })).toBeDisabled();
      await user.type(input, '{Enter}');
      expect(createListMock).not.toHaveBeenCalled();
      expect(dialog).toBeInTheDocument();
    });

    it('shows a duplicate-name error, keeps the dialog open, and allows another name', async () => {
      createListMock
        .mockImplementationOnce(() => {
          throw new MedicationListError('duplicate-name', {
            message: 'A list named “Pain Relief” already exists.',
          });
        })
        .mockReturnValueOnce(travelKit);
      const { user, openCreateDialog, listNames } = setup([painRelief]);

      const dialog = await openCreateDialog();
      const input = within(dialog).getByRole('textbox', { name: 'List name' });
      await user.type(input, 'pain relief{Enter}');

      expect(input).toHaveAccessibleDescription('A list named “Pain Relief” already exists.');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('dialog', { name: 'Create New List' })).toBeInTheDocument();
      expect(listNames()).toEqual(['Pain Relief']);

      await user.clear(input);
      expect(input).toHaveAttribute('aria-invalid', 'false');
      await user.type(input, 'Travel Kit{Enter}');

      expect(createListMock).toHaveBeenLastCalledWith('Travel Kit');
      expect(listNames()).toEqual(['Pain Relief', 'Travel Kit']);
    });

    it('shows storage errors in the dialog without adding a list', async () => {
      createListMock.mockImplementation(() => {
        throw new MedicationListError('storage');
      });
      const { user, openCreateDialog } = setup();

      const dialog = await openCreateDialog();
      await user.type(within(dialog).getByRole('textbox'), 'Travel Kit{Enter}');

      expect(within(dialog).getByText(/couldn’t be saved/)).toBeInTheDocument();
      expect(screen.getByText(/No medication lists yet/)).toBeInTheDocument();
    });

    it('shows a generic message for unexpected errors and logs them', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const unexpected = new Error('boom');
      createListMock.mockImplementation(() => {
        throw unexpected;
      });
      const { user, openCreateDialog } = setup();

      const dialog = await openCreateDialog();
      await user.type(within(dialog).getByRole('textbox'), 'Travel Kit{Enter}');

      expect(
        within(dialog).getByText('Something went wrong. Please try again.'),
      ).toBeInTheDocument();
      expect(dialog).not.toHaveTextContent('boom');
      expect(consoleError).toHaveBeenCalledWith(expect.any(String), unexpected);
    });

    it('does not create a list when canceled', async () => {
      const { user, openCreateDialog } = setup();

      const dialog = await openCreateDialog();
      await user.type(within(dialog).getByRole('textbox'), 'Travel Kit');
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(createListMock).not.toHaveBeenCalled();
      expect(screen.getByText(/No medication lists yet/)).toBeInTheDocument();
    });
  });

  describe('deleting a list', () => {
    it('asks for confirmation, then deletes the list by ID and removes it', async () => {
      const { user, listNames } = setup([painRelief, travelKit]);

      await user.click(screen.getByRole('button', { name: 'Delete Pain Relief' }));
      const dialog = screen.getByRole('dialog', { name: 'Delete “Pain Relief”?' });
      expect(dialog).toHaveAccessibleDescription(
        'This removes the list and the 2 medications in it. This can’t be undone.',
      );
      expect(deleteListMock).not.toHaveBeenCalled();

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      expect(deleteListMock).toHaveBeenCalledTimes(1);
      expect(deleteListMock).toHaveBeenCalledWith('list-1');
      expect(listNames()).toEqual(['Travel Kit']);
      expect(screen.getByText('Deleted “Pain Relief”.')).toBeInTheDocument();
    });

    it('shows the empty state after the last list is deleted', async () => {
      const { user } = setup([travelKit]);

      await user.click(screen.getByRole('button', { name: 'Delete Travel Kit' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(screen.getByText(/No medication lists yet/)).toBeInTheDocument();
    });

    it('keeps the list when deletion is canceled', async () => {
      const { user, listNames } = setup([painRelief]);

      await user.click(screen.getByRole('button', { name: 'Delete Pain Relief' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(deleteListMock).not.toHaveBeenCalled();
      expect(listNames()).toEqual(['Pain Relief']);
    });

    it('keeps the list and shows an error when deletion fails', async () => {
      deleteListMock.mockImplementation(() => {
        throw new MedicationListError('storage');
      });
      const { user, listNames } = setup([painRelief]);

      await user.click(screen.getByRole('button', { name: 'Delete Pain Relief' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t be saved/);
      expect(listNames()).toEqual(['Pain Relief']);
    });

    it('removes a list that was already deleted elsewhere', async () => {
      deleteListMock.mockImplementation(() => {
        throw new MedicationListError('not-found');
      });
      const { user, listNames } = setup([painRelief, travelKit]);

      await user.click(screen.getByRole('button', { name: 'Delete Pain Relief' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(listNames()).toEqual(['Travel Kit']);
      expect(screen.getByText('“Pain Relief” had already been deleted.')).toBeInTheDocument();
    });
  });
});
