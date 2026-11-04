import { useCallback, useState } from 'react';
import { MedicationListError, createList, deleteList, getLists } from '../services/medicationLists';
import type { MedicationList } from '../types/medication';

const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export type CreateListResult = { ok: true; list: MedicationList } | { ok: false; message: string };

/** `alreadyDeleted` means the list was already gone from storage, e.g. deleted in another tab. */
export type DeleteListResult =
  { ok: true; alreadyDeleted: boolean } | { ok: false; message: string };

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

  const remove = useCallback((id: string): DeleteListResult => {
    const removeFromState = () => setLists((current) => current.filter((list) => list.id !== id));
    try {
      deleteList(id);
      removeFromState();
      return { ok: true, alreadyDeleted: false };
    } catch (error) {
      if (error instanceof MedicationListError && error.kind === 'not-found') {
        removeFromState();
        return { ok: true, alreadyDeleted: true };
      }
      return { ok: false, message: errorMessage(error, 'deleting a list') };
    }
  }, []);

  return { lists, loadError: initial.error, create, remove };
}
