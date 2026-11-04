import type { MedicationList } from '../types/medication';
import {
  LISTS_STORAGE_KEY,
  MedicationListError,
  clearLists,
  createList,
  deleteList,
  getLists,
} from './medicationLists';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CREATED_AT = '2026-11-03T10:00:00.000Z';

function storedValue(): unknown {
  const raw = localStorage.getItem(LISTS_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

function expectListError(action: () => unknown, kind: MedicationListError['kind']) {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(MedicationListError);
  expect((caught as MedicationListError).kind).toBe(kind);
  return caught as MedicationListError;
}

const savedList: MedicationList = {
  id: 'list-1',
  name: 'Pain Relief',
  medications: [
    {
      rxcui: '153008',
      name: 'ibuprofen 200 MG Oral Tablet [Advil]',
      termType: 'SBD',
      synonym: 'Advil 200 MG Oral Tablet',
      prescribableName: 'Advil 200 MG Oral Tablet',
    },
  ],
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CREATED_AT));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('getLists', () => {
  it('returns an empty array when nothing has been saved', () => {
    expect(getLists()).toEqual([]);
  });

  it('returns lists previously saved to localStorage', () => {
    localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify([savedList]));

    expect(getLists()).toEqual([savedList]);
  });
});

describe('createList', () => {
  it('creates an empty list with an ID and matching ISO timestamps', () => {
    const list = createList('Pain Relief');

    expect(list).toEqual({
      id: expect.stringMatching(UUID_PATTERN),
      name: 'Pain Relief',
      medications: [],
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });
  });

  it('persists the new list so getLists returns it', () => {
    const list = createList('Pain Relief');

    expect(storedValue()).toEqual([list]);
    expect(getLists()).toEqual([list]);
  });

  it('creates multiple lists with unique IDs in creation order', () => {
    const first = createList('Pain Relief');
    const second = createList('Travel Kit');
    const third = createList('Allergies');

    expect(getLists().map((list) => list.name)).toEqual(['Pain Relief', 'Travel Kit', 'Allergies']);
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
  });

  it('trims and collapses whitespace in the name', () => {
    expect(createList('   Pain    Relief  ').name).toBe('Pain Relief');
  });

  it.each(['', '   ', '\t\n'])('rejects the empty name %j', (name) => {
    expectListError(() => createList(name), 'invalid-name');
    expect(storedValue()).toBeNull();
  });

  it('rejects a name already used by another list, ignoring case and spacing', () => {
    createList('Pain Relief');

    const error = expectListError(() => createList('  pain   RELIEF '), 'duplicate-name');
    expect(error.message).toBe('A list named “pain RELIEF” already exists.');
    expect(getLists()).toHaveLength(1);
  });
});

describe('deleteList', () => {
  it('removes only the matching list', () => {
    const pain = createList('Pain Relief');
    const travel = createList('Travel Kit');

    deleteList(pain.id);

    expect(getLists()).toEqual([travel]);
  });

  it('throws not-found for a nonexistent list without changing storage', () => {
    createList('Pain Relief');
    const before = storedValue();

    expectListError(() => deleteList('missing-id'), 'not-found');
    expect(storedValue()).toEqual(before);
  });

  it('allows reusing the name of a deleted list', () => {
    const list = createList('Pain Relief');
    deleteList(list.id);

    expect(createList('Pain Relief').name).toBe('Pain Relief');
  });
});

describe('invalid stored data', () => {
  it('throws invalid-data for unreadable JSON', () => {
    localStorage.setItem(LISTS_STORAGE_KEY, '{not json');

    const error = expectListError(() => getLists(), 'invalid-data');
    expect(error.cause).toBeInstanceOf(SyntaxError);
  });

  it.each([
    ['an object', '{"lists":[]}'],
    ['a string', '"lists"'],
    ['null', 'null'],
  ])('throws invalid-data when the stored value is %s', (_, raw) => {
    localStorage.setItem(LISTS_STORAGE_KEY, raw);

    expectListError(() => getLists(), 'invalid-data');
  });

  it('does not overwrite unreadable data when creating a list', () => {
    localStorage.setItem(LISTS_STORAGE_KEY, '{not json');

    expectListError(() => createList('Pain Relief'), 'invalid-data');
    expect(localStorage.getItem(LISTS_STORAGE_KEY)).toBe('{not json');
  });

  it('skips malformed lists and keeps valid ones', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(
      LISTS_STORAGE_KEY,
      JSON.stringify([
        savedList,
        null,
        { ...savedList, id: 'list-2', name: '' },
        { ...savedList, id: 'list-3', medications: 'none' },
        { ...savedList, id: 'list-4', createdAt: undefined },
        { ...savedList, name: 'Duplicate ID' },
      ]),
    );

    expect(getLists()).toEqual([savedList]);
    expect(warn).toHaveBeenCalledTimes(5);
  });

  it('drops malformed medications inside an otherwise valid list', () => {
    localStorage.setItem(
      LISTS_STORAGE_KEY,
      JSON.stringify([
        {
          ...savedList,
          medications: [
            ...savedList.medications,
            { rxcui: '', name: 'no id', termType: 'SCD' },
            { rxcui: '1', name: 'bad type', termType: 'SCDF' },
            { rxcui: '2', name: 'ok', termType: 'SCD', synonym: 42 },
            'not a medication',
          ],
        },
      ]),
    );

    expect(getLists()[0].medications).toEqual([
      ...savedList.medications,
      { rxcui: '2', name: 'ok', termType: 'SCD', synonym: undefined, prescribableName: undefined },
    ]);
  });

  it('clearLists removes saved data so lists can be used again', () => {
    localStorage.setItem(LISTS_STORAGE_KEY, '{not json');

    clearLists();

    expect(getLists()).toEqual([]);
    expect(createList('Pain Relief').name).toBe('Pain Relief');
  });
});

describe('storage errors', () => {
  it('throws a storage error when localStorage cannot be read', () => {
    const cause = new DOMException('The operation is insecure.', 'SecurityError');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw cause;
    });

    const error = expectListError(() => getLists(), 'storage');
    expect(error.cause).toBe(cause);
    expect(error.message).toMatch(/couldn’t be loaded/);
  });

  it('throws a storage error when saving fails', () => {
    const cause = new DOMException('Quota exceeded', 'QuotaExceededError');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw cause;
    });

    const error = expectListError(() => createList('Pain Relief'), 'storage');
    expect(error.cause).toBe(cause);
    expect(error.message).toMatch(/couldn’t be saved/);
  });

  it('throws a storage error when clearing fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    expectListError(() => clearLists(), 'storage');
  });
});
