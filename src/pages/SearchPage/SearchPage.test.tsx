import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RxNormError, searchMedications } from '../../services/rxnorm';
import type { Medication } from '../../types/medication';
import SearchPage from './SearchPage';

// Replace only searchMedications; keep the real RxNormError class for instanceof checks.
vi.mock('../../services/rxnorm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/rxnorm')>()),
  searchMedications: vi.fn(),
}));

const searchMock = vi.mocked(searchMedications);

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

function setup() {
  const user = userEvent.setup();
  render(<SearchPage />);
  return {
    user,
    input: () => screen.getByRole('textbox', { name: 'Search medications' }),
    cardHeadings: () => screen.queryAllByRole('heading', { level: 2 }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  searchMock.mockReset();
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
});
