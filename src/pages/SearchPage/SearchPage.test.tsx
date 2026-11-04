import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MedicationListError, addMedication, getLists } from '../../services/medicationLists';
import { RxNormError, searchMedications } from '../../services/rxnorm';
import type { Medication, MedicationList } from '../../types/medication';
import SearchPage from './SearchPage';

// Replace only searchMedications; keep the real RxNormError class for instanceof checks.
vi.mock('../../services/rxnorm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/rxnorm')>()),
  searchMedications: vi.fn(),
}));

// Keep list data out of localStorage; keep the real MedicationListError.
vi.mock('../../services/medicationLists', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/medicationLists')>()),
  getLists: vi.fn(),
  addMedication: vi.fn(),
}));

const searchMock = vi.mocked(searchMedications);
const getListsMock = vi.mocked(getLists);
const addMedicationMock = vi.mocked(addMedication);

const tylenolResults: Medication[] = [
  {
    rxcui: '209387',
    name: 'acetaminophen 325 MG Oral Tablet [Tylenol]',
    termType: 'SBD',
    synonym: 'Tylenol 325 MG Oral Tablet',
    prescribableName: 'Tylenol Regular Strength 325 MG Oral Tablet',
  },
  { rxcui: '209459', name: 'acetaminophen 500 MG Oral Tablet [Tylenol]', termType: 'SBD' },
];

const advilResults: Medication[] = [
  {
    rxcui: '153008',
    name: 'ibuprofen 200 MG Oral Tablet [Advil]',
    termType: 'SBD',
    synonym: 'Advil 200 MG Oral Tablet',
  },
];

/** A promise the test resolves or rejects by hand, to observe the pending state. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const painRelief: MedicationList = {
  id: 'list-1',
  name: 'Pain Relief',
  medications: [advilResults[0]],
  createdAt: '2026-10-28T14:30:00.000Z',
  updatedAt: '2026-10-28T14:30:00.000Z',
};
const travelKit: MedicationList = {
  ...painRelief,
  id: 'list-2',
  name: 'Travel Kit',
  medications: [],
};

function setup(lists: MedicationList[] = []) {
  getListsMock.mockReturnValue(lists);
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/lists" element={<h1>Lists route</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return {
    user,
    input: () => screen.getByRole('textbox', { name: 'Search medications' }),
    cardHeadings: () => screen.queryAllByRole('heading', { level: 2 }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  searchMock.mockReset();
  getListsMock.mockReset();
  addMedicationMock.mockReset();
});

describe('SearchPage', () => {
  it('shows an initial prompt before any search', () => {
    setup();

    expect(screen.getByText(/search for a medication by name/i)).toBeInTheDocument();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('searches with the trimmed query when Enter is pressed', async () => {
    searchMock.mockResolvedValue(tylenolResults);
    const { user, input } = setup();

    await user.type(input(), '  Tylenol  {Enter}');

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith('Tylenol');
  });

  it('searches when the Search button is clicked', async () => {
    searchMock.mockResolvedValue(tylenolResults);
    const { user, input } = setup();

    await user.type(input(), 'Tylenol');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(searchMock).toHaveBeenCalledWith('Tylenol');
  });

  it('shows a loading state and blocks duplicate submissions while pending', async () => {
    const request = deferred<Medication[]>();
    searchMock.mockReturnValue(request.promise);
    const { user, input } = setup();

    await user.type(input(), 'Tylenol{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent('Searching…');
    const button = screen.getByRole('button', { name: 'Searching…' });
    expect(button).toBeDisabled();

    // The disabled button can't be clicked (MUI sets pointer-events: none), so the remaining
    // path for a duplicate submission is pressing Enter in the input.
    await user.type(input(), '{Enter}{Enter}');
    expect(searchMock).toHaveBeenCalledTimes(1);

    await act(async () => request.resolve(tylenolResults));
    expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
  });

  it('renders a card for each returned medication', async () => {
    searchMock.mockResolvedValue(tylenolResults);
    const { user, input, cardHeadings } = setup();

    await user.type(input(), 'Tylenol{Enter}');

    expect(await screen.findByText('2 results for “Tylenol”')).toBeInTheDocument();
    expect(cardHeadings().map((h) => h.textContent)).toEqual(tylenolResults.map((m) => m.name));
    // Optional fields render when present and are omitted when missing.
    expect(screen.getByText('Tylenol Regular Strength 325 MG Oral Tablet')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Add to list:/ })).toHaveLength(2);
    expect(screen.queryByText('Searching…')).not.toBeInTheDocument();
  });

  it('shows an empty-results message when nothing matches', async () => {
    searchMock.mockResolvedValue([]);
    const { user, input, cardHeadings } = setup();

    await user.type(input(), 'tylen{Enter}');

    expect(await screen.findByText('No medications found for “tylen”.')).toBeInTheDocument();
    expect(cardHeadings()).toHaveLength(0);
  });

  it('shows the service error in a dialog and resets loading', async () => {
    searchMock.mockRejectedValue(new RxNormError('network'));
    const { user, input } = setup();

    await user.type(input(), 'Tylenol{Enter}');

    const dialog = await screen.findByRole('dialog', { name: 'Search failed' });
    expect(dialog).toHaveAccessibleDescription(
      'Unable to reach the medication service. Check your connection and try again.',
    );
    expect(screen.getByRole('button', { name: 'Search', hidden: true })).toBeEnabled();
  });

  it('shows a generic message for unexpected errors and logs them', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const unexpected = new Error('boom');
    searchMock.mockRejectedValue(unexpected);
    const { user, input } = setup();

    await user.type(input(), 'Tylenol{Enter}');

    const dialog = await screen.findByRole('dialog', { name: 'Search failed' });
    expect(dialog).toHaveAccessibleDescription(
      'Something went wrong while searching. Please try again.',
    );
    expect(dialog).not.toHaveTextContent('boom');
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), unexpected);
  });

  it('closes the error dialog when dismissed', async () => {
    searchMock.mockRejectedValue(new RxNormError('http', { status: 503 }));
    const { user, input } = setup();

    await user.type(input(), 'Tylenol{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Search failed' });
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/couldn’t be completed/)).toBeInTheDocument();
  });

  it('can search again after a failure', async () => {
    searchMock.mockRejectedValueOnce(new RxNormError('network'));
    searchMock.mockResolvedValueOnce(tylenolResults);
    const { user, input } = setup();

    await user.type(input(), 'Tylenol{Enter}');
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('2 results for “Tylenol”')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(2);
  });

  it('clears stale results while a new search runs, then shows the new results', async () => {
    const second = deferred<Medication[]>();
    searchMock.mockResolvedValueOnce(tylenolResults).mockReturnValueOnce(second.promise);
    const { user, input, cardHeadings } = setup();

    await user.type(input(), 'Tylenol{Enter}');
    await screen.findByText('2 results for “Tylenol”');

    await user.clear(input());
    await user.type(input(), 'Advil{Enter}');

    expect(cardHeadings()).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('Searching…');

    await act(async () => second.resolve(advilResults));

    expect(screen.getByText('1 result for “Advil”')).toBeInTheDocument();
    expect(cardHeadings().map((h) => h.textContent)).toEqual([advilResults[0].name]);
    expect(searchMock).toHaveBeenLastCalledWith('Advil');
  });

  describe('adding to a list', () => {
    /** Searches, then opens the Add to list dialog for the first result. */
    async function openAddDialog(lists: MedicationList[], results = tylenolResults) {
      searchMock.mockResolvedValue(results);
      const helpers = setup(lists);
      await helpers.user.type(helpers.input(), 'Tylenol{Enter}');
      const [firstAdd] = await screen.findAllByRole('button', { name: /^Add to list:/ });
      await helpers.user.click(firstAdd);
      return { ...helpers, dialog: screen.getByRole('dialog', { name: 'Add to list' }) };
    }

    const listButton = (dialog: HTMLElement, name: string) =>
      within(dialog).getByRole('button', { name: new RegExp(`^${name}`) });

    it('opens a dialog for the chosen medication listing the saved lists', async () => {
      const { dialog } = await openAddDialog([painRelief, travelKit]);

      expect(dialog).toHaveTextContent(tylenolResults[0].name);
      expect(listButton(dialog, 'Pain Relief')).toBeInTheDocument();
      expect(listButton(dialog, 'Travel Kit')).toBeInTheDocument();
    });

    it('adds the medication to the selected list and confirms it', async () => {
      addMedicationMock.mockReturnValue({ ...travelKit, medications: [tylenolResults[0]] });
      const { user, dialog } = await openAddDialog([painRelief, travelKit]);

      await user.click(listButton(dialog, 'Travel Kit'));

      expect(addMedicationMock).toHaveBeenCalledWith('list-2', tylenolResults[0]);
      expect(
        await screen.findByText(`Added “${tylenolResults[0].name}” to “Travel Kit”.`),
      ).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('marks lists that already have the medication and does not add it again', async () => {
      const { dialog } = await openAddDialog([painRelief], advilResults);

      const added = listButton(dialog, 'Pain Relief');
      expect(added).toHaveTextContent('Already added');
      expect(added).toHaveAttribute('aria-disabled', 'true');
      // MUI sets pointer-events: none on disabled items; skip that check to prove a click is ignored.
      await userEvent.setup({ pointerEventsCheck: 0 }).click(added);
      expect(addMedicationMock).not.toHaveBeenCalled();
    });

    it('shows the service message when it rejects a duplicate', async () => {
      addMedicationMock.mockImplementation(() => {
        throw new MedicationListError('duplicate-medication', {
          message: `“${tylenolResults[0].name}” is already in “Travel Kit”.`,
        });
      });
      const { user, dialog } = await openAddDialog([travelKit]);

      await user.click(listButton(dialog, 'Travel Kit'));

      expect(within(dialog).getByRole('alert')).toHaveTextContent('is already in “Travel Kit”.');
      expect(screen.getByRole('dialog', { name: 'Add to list' })).toBeInTheDocument();
    });

    it('shows storage errors in the dialog without crashing', async () => {
      addMedicationMock.mockImplementation(() => {
        throw new MedicationListError('storage');
      });
      const { user, dialog } = await openAddDialog([travelKit]);

      await user.click(listButton(dialog, 'Travel Kit'));

      expect(within(dialog).getByRole('alert')).toHaveTextContent(/couldn’t be saved/);
    });

    it('explains that a list is needed and links to the Lists page', async () => {
      const { user, dialog } = await openAddDialog([]);

      expect(dialog).toHaveTextContent('You don’t have any lists yet.');
      await user.click(within(dialog).getByRole('link', { name: 'Go to Lists' }));

      expect(await screen.findByRole('heading', { name: 'Lists route' })).toBeInTheDocument();
    });

    it('closes without adding when canceled', async () => {
      const { user, dialog } = await openAddDialog([travelKit]);

      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(addMedicationMock).not.toHaveBeenCalled();
    });
  });
});
