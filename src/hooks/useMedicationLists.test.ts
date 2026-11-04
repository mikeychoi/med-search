import { act, renderHook } from '@testing-library/react';
import {
  MedicationListError,
  addMedication,
  createList,
  deleteList,
  getLists,
  removeMedication,
} from '../services/medicationLists';
import type { Medication, MedicationList } from '../types/medication';
import { useMedicationLists } from './useMedicationLists';

// Replace the service functions; keep the real MedicationListError for instanceof checks.
vi.mock('../services/medicationLists', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/medicationLists')>()),
  getLists: vi.fn(),
  createList: vi.fn(),
  deleteList: vi.fn(),
  addMedication: vi.fn(),
  removeMedication: vi.fn(),
}));

const getListsMock = vi.mocked(getLists);
const createListMock = vi.mocked(createList);
const deleteListMock = vi.mocked(deleteList);
const addMedicationMock = vi.mocked(addMedication);
const removeMedicationMock = vi.mocked(removeMedication);

const tylenol: Medication = {
  rxcui: '209387',
  name: 'acetaminophen 325 MG Oral Tablet [Tylenol]',
  termType: 'SBD',
};

const painRelief: MedicationList = {
  id: 'list-1',
  name: 'Pain Relief',
  medications: [],
  createdAt: '2026-10-28T14:30:00.000Z',
  updatedAt: '2026-10-28T14:30:00.000Z',
};
const travelKit: MedicationList = { ...painRelief, id: 'list-2', name: 'Travel Kit' };

function setup(lists: MedicationList[] = [painRelief]) {
  getListsMock.mockReturnValue(lists);
  return renderHook(() => useMedicationLists());
}

afterEach(() => {
  vi.restoreAllMocks();
  getListsMock.mockReset();
  createListMock.mockReset();
  deleteListMock.mockReset();
  addMedicationMock.mockReset();
  removeMedicationMock.mockReset();
});

describe('useMedicationLists', () => {
  describe('loading', () => {
    it('reads saved lists once, not on every render', () => {
      const { result, rerender } = setup();
      rerender();

      expect(result.current.lists).toEqual([painRelief]);
      expect(result.current.loadError).toBeNull();
      expect(getListsMock).toHaveBeenCalledTimes(1);
    });

    it('returns no lists and the service message when loading fails', () => {
      getListsMock.mockImplementation(() => {
        throw new MedicationListError('invalid-data');
      });
      const { result } = renderHook(() => useMedicationLists());

      expect(result.current.lists).toEqual([]);
      expect(result.current.loadError).toBe('Your saved lists couldn’t be read.');
    });
  });

  describe('create', () => {
    it('adds the created list to state and returns it', () => {
      createListMock.mockReturnValue(travelKit);
      const { result } = setup();

      let outcome!: ReturnType<typeof result.current.create>;
      act(() => {
        outcome = result.current.create('Travel Kit');
      });

      expect(createListMock).toHaveBeenCalledWith('Travel Kit');
      expect(outcome).toEqual({ ok: true, list: travelKit });
      expect(result.current.lists).toEqual([painRelief, travelKit]);
    });

    it('returns the service message and leaves state unchanged on failure', () => {
      createListMock.mockImplementation(() => {
        throw new MedicationListError('duplicate-name', { message: 'Already exists.' });
      });
      const { result } = setup();

      const outcome = result.current.create('pain relief');

      expect(outcome).toEqual({ ok: false, message: 'Already exists.' });
      expect(result.current.lists).toEqual([painRelief]);
    });

    it('logs unexpected errors and returns a generic message', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const unexpected = new Error('boom');
      createListMock.mockImplementation(() => {
        throw unexpected;
      });
      const { result } = setup();

      expect(result.current.create('Travel Kit')).toEqual({
        ok: false,
        message: 'Something went wrong. Please try again.',
      });
      expect(consoleError).toHaveBeenCalledWith(expect.any(String), unexpected);
    });
  });

  describe('remove', () => {
    it('deletes by ID and removes the list from state', () => {
      const { result } = setup([painRelief, travelKit]);

      let outcome!: ReturnType<typeof result.current.remove>;
      act(() => {
        outcome = result.current.remove('list-1');
      });

      expect(deleteListMock).toHaveBeenCalledWith('list-1');
      expect(outcome).toEqual({ ok: true, alreadyDeleted: false });
      expect(result.current.lists).toEqual([travelKit]);
    });

    it('treats a list missing from storage as deleted', () => {
      deleteListMock.mockImplementation(() => {
        throw new MedicationListError('not-found');
      });
      const { result } = setup([painRelief, travelKit]);

      let outcome!: ReturnType<typeof result.current.remove>;
      act(() => {
        outcome = result.current.remove('list-1');
      });

      expect(outcome).toEqual({ ok: true, alreadyDeleted: true });
      expect(result.current.lists).toEqual([travelKit]);
    });

    it('returns the service message and keeps the list on other failures', () => {
      deleteListMock.mockImplementation(() => {
        throw new MedicationListError('storage');
      });
      const { result } = setup();

      const outcome = result.current.remove('list-1');

      expect(outcome).toEqual({ ok: false, message: expect.stringMatching(/couldn’t be saved/) });
      expect(result.current.lists).toEqual([painRelief]);
    });
  });

  describe('addMedication', () => {
    it('replaces the list in state with the updated one', () => {
      const updated = { ...painRelief, medications: [tylenol] };
      addMedicationMock.mockReturnValue(updated);
      const { result } = setup([painRelief, travelKit]);

      let outcome!: ReturnType<typeof result.current.addMedication>;
      act(() => {
        outcome = result.current.addMedication('list-1', tylenol);
      });

      expect(addMedicationMock).toHaveBeenCalledWith('list-1', tylenol);
      expect(outcome).toEqual({ ok: true, list: updated });
      expect(result.current.lists).toEqual([updated, travelKit]);
    });

    it('returns the duplicate message and leaves state unchanged', () => {
      addMedicationMock.mockImplementation(() => {
        throw new MedicationListError('duplicate-medication', { message: 'Already in list.' });
      });
      const { result } = setup();

      expect(result.current.addMedication('list-1', tylenol)).toEqual({
        ok: false,
        message: 'Already in list.',
      });
      expect(result.current.lists).toEqual([painRelief]);
    });

    it('drops a list that no longer exists in storage', () => {
      addMedicationMock.mockImplementation(() => {
        throw new MedicationListError('not-found');
      });
      const { result } = setup([painRelief, travelKit]);

      let outcome!: ReturnType<typeof result.current.addMedication>;
      act(() => {
        outcome = result.current.addMedication('list-1', tylenol);
      });

      expect(outcome).toEqual({ ok: false, message: 'That list no longer exists.' });
      expect(result.current.lists).toEqual([travelKit]);
    });
  });

  describe('removeMedication', () => {
    const withTylenol = { ...painRelief, medications: [tylenol] };

    it('replaces the list in state with the updated one', () => {
      removeMedicationMock.mockReturnValue(painRelief);
      const { result } = setup([withTylenol]);

      let outcome!: ReturnType<typeof result.current.removeMedication>;
      act(() => {
        outcome = result.current.removeMedication('list-1', tylenol.rxcui);
      });

      expect(removeMedicationMock).toHaveBeenCalledWith('list-1', tylenol.rxcui);
      expect(outcome).toEqual({ ok: true });
      expect(result.current.lists).toEqual([painRelief]);
    });

    it('treats a medication missing from storage as removed', () => {
      removeMedicationMock.mockImplementation(() => {
        throw new MedicationListError('medication-not-found');
      });
      const { result } = setup([withTylenol]);

      let outcome!: ReturnType<typeof result.current.removeMedication>;
      act(() => {
        outcome = result.current.removeMedication('list-1', tylenol.rxcui);
      });

      expect(outcome).toEqual({ ok: true });
      expect(result.current.lists[0].medications).toEqual([]);
    });

    it('returns the message and keeps the medication on other failures', () => {
      removeMedicationMock.mockImplementation(() => {
        throw new MedicationListError('storage');
      });
      const { result } = setup([withTylenol]);

      const outcome = result.current.removeMedication('list-1', tylenol.rxcui);

      expect(outcome).toEqual({ ok: false, message: expect.stringMatching(/couldn’t be saved/) });
      expect(result.current.lists).toEqual([withTylenol]);
    });
  });
});
