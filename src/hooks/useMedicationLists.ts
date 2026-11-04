import { useCallback, useState } from 'react';
import {
  MedicationListError,
  addMedication as addMedicationToList,
  createList,
  deleteList,
  getLists,
  removeMedication as removeMedicationFromList,
} from '../services/medicationLists';
import type { Medication, MedicationList } from '../types/medication';

const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export type CreateListResult = { ok: true; list: MedicationList } | { ok: false; message: string };

/** `alreadyDeleted` means the list was already gone from storage, e.g. deleted in another tab. */
export type DeleteListResult =
  { ok: true; alreadyDeleted: boolean } | { ok: false; message: string };

export type AddMedicationResult =
  { ok: true; list: MedicationList } | { ok: false; message: string };

export type RemoveMedicationResult = { ok: true } | { ok: false; message: string };

function isListError(error: unknown, kind: MedicationListError['kind']) {
  return error instanceof MedicationListError && error.kind === kind;
}

/** Returns the user-safe message for a service error, logging anything unexpected. */
function errorMessage(error: unknown, context: string): string {
  if (error instanceof MedicationListError) return error.message;
  console.error(`Unexpected error while ${context}`, error);
  return UNEXPECTED_ERROR_MESSAGE;
}

function loadLists(): { lists: MedicationList[]; error: string | null } {
  try {
    return { lists: getLists(), error: null };
  } catch (error) {
    return { lists: [], error: errorMessage(error, 'loading lists') };
  }
}

/**
 * Keeps saved medication lists in React state. Each action calls the service and updates
 * state only if it succeeds, returning a result instead of throwing.
 */
export function useMedicationLists() {
  // The service is synchronous, so saved lists are read once during the first render.
  const [initial] = useState(loadLists);
  const [lists, setLists] = useState(initial.lists);

  const create = useCallback((name: string): CreateListResult => {
    try {
      const list = createList(name);
      setLists((current) => [...current, list]);
      return { ok: true, list };
    } catch (error) {
      return { ok: false, message: errorMessage(error, 'creating a list') };
    }
  }, []);

  const dropList = useCallback(
    (id: string) => setLists((current) => current.filter((list) => list.id !== id)),
    [],
  );
  const replaceList = useCallback(
    (updated: MedicationList) =>
      setLists((current) => current.map((list) => (list.id === updated.id ? updated : list))),
    [],
  );

  const remove = useCallback(
    (id: string): DeleteListResult => {
      try {
        deleteList(id);
        dropList(id);
        return { ok: true, alreadyDeleted: false };
      } catch (error) {
        if (isListError(error, 'not-found')) {
          dropList(id);
          return { ok: true, alreadyDeleted: true };
        }
        return { ok: false, message: errorMessage(error, 'deleting a list') };
      }
    },
    [dropList],
  );

  const addMedication = useCallback(
    (listId: string, medication: Medication): AddMedicationResult => {
      try {
        const list = addMedicationToList(listId, medication);
        replaceList(list);
        return { ok: true, list };
      } catch (error) {
        // The list was deleted elsewhere, e.g. in another tab, so stop offering it.
        if (isListError(error, 'not-found')) dropList(listId);
        return { ok: false, message: errorMessage(error, 'adding a medication') };
      }
    },
    [dropList, replaceList],
  );

  const removeMedication = useCallback(
    (listId: string, rxcui: string): RemoveMedicationResult => {
      try {
        replaceList(removeMedicationFromList(listId, rxcui));
        return { ok: true };
      } catch (error) {
        if (isListError(error, 'medication-not-found')) {
          // Already gone from storage, so drop it from the displayed list too.
          setLists((current) =>
            current.map((list) =>
              list.id === listId
                ? { ...list, medications: list.medications.filter((m) => m.rxcui !== rxcui) }
                : list,
            ),
          );
          return { ok: true };
        }
        if (isListError(error, 'not-found')) dropList(listId);
        return { ok: false, message: errorMessage(error, 'removing a medication') };
      }
    },
    [dropList, replaceList],
  );

  return { lists, loadError: initial.error, create, remove, addMedication, removeMedication };
}
