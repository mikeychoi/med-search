import { RXNORM_TERM_TYPES, type Medication, type MedicationList } from '../types/medication';

export const LISTS_STORAGE_KEY = 'medsearch:lists';

export type MedicationListErrorKind =
  'invalid-name' | 'duplicate-name' | 'not-found' | 'invalid-data' | 'storage';

const ERROR_MESSAGES: Record<MedicationListErrorKind, string> = {
  'invalid-name': 'Enter a name for the list.',
  'duplicate-name': 'A list with that name already exists.',
  'not-found': 'That list no longer exists.',
  'invalid-data': 'Your saved lists couldn’t be read.',
  storage: 'Your lists couldn’t be saved. Check your browser’s storage settings.',
};

/**
 * Error thrown by the medication list service. `message` is safe to show to users;
 * the underlying error (if any) is kept on `cause`.
 */
export class MedicationListError extends Error {
  readonly kind: MedicationListErrorKind;

  constructor(kind: MedicationListErrorKind, options: { message?: string; cause?: unknown } = {}) {
    super(options.message ?? ERROR_MESSAGES[kind], { cause: options.cause });
    this.name = 'MedicationListError';
    this.kind = kind;
  }
}

/** Returns all saved lists in creation order, or `[]` if none have been saved. */
export function getLists(): MedicationList[] {
  return readLists();
}

/** Creates, saves, and returns a new empty list. */
export function createList(name: string): MedicationList {
  const lists = readLists();
  const listName = validateName(name, lists);
  const now = new Date().toISOString();

  const list: MedicationList = {
    id: crypto.randomUUID(),
    name: listName,
    medications: [],
    createdAt: now,
    updatedAt: now,
  };

  writeLists([...lists, list]);
  return list;
}

/** Deletes a list. */
export function deleteList(id: string): void {
  const lists = readLists();
  const remaining = lists.filter((list) => list.id !== id);
  if (remaining.length === lists.length) {
    throw new MedicationListError('not-found');
  }
  writeLists(remaining);
}

/** Removes all saved lists, e.g. to recover from unreadable stored data. */
export function clearLists(): void {
  try {
    localStorage.removeItem(LISTS_STORAGE_KEY);
  } catch (error) {
    throw new MedicationListError('storage', { cause: error });
  }
}

// --- Validation -------------------------------------------------------------

/** Trims the name and collapses internal whitespace. */
function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Returns the normalized name, or throws if it is empty or used by another list. */
function validateName(name: string, lists: MedicationList[]): string {
  const normalized = normalizeName(name);
  if (!normalized) {
    throw new MedicationListError('invalid-name');
  }

  const key = normalized.toLocaleLowerCase();
  if (lists.some((list) => list.name.toLocaleLowerCase() === key)) {
    throw new MedicationListError('duplicate-name', {
      message: `A list named “${normalized}” already exists.`,
    });
  }

  return normalized;
}

// --- Persistence ------------------------------------------------------------

function readLists(): MedicationList[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LISTS_STORAGE_KEY);
  } catch (error) {
    throw new MedicationListError('storage', {
      message: 'Your saved lists couldn’t be loaded. Check your browser’s storage settings.',
      cause: error,
    });
  }

  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new MedicationListError('invalid-data', { cause: error });
  }
  if (!Array.isArray(parsed)) {
    throw new MedicationListError('invalid-data');
  }

  const lists: MedicationList[] = [];
  const seenIds = new Set<string>();
  parsed.forEach((entry, index) => {
    const list = toMedicationList(entry);
    if (!list || seenIds.has(list.id)) {
      console.warn(`Skipping invalid saved medication list at index ${index}`);
      return;
    }
    seenIds.add(list.id);
    lists.push(list);
  });
  return lists;
}

function writeLists(lists: MedicationList[]): void {
  try {
    localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists));
  } catch (error) {
    throw new MedicationListError('storage', { cause: error });
  }
}

// --- Stored-data parsing ----------------------------------------------------

function toMedicationList(value: unknown): MedicationList | null {
  if (!isRecord(value)) return null;

  const { id, name, medications, createdAt, updatedAt } = value;
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(name) ||
    !isNonEmptyString(createdAt) ||
    !isNonEmptyString(updatedAt) ||
    !Array.isArray(medications)
  ) {
    return null;
  }

  return {
    id,
    name,
    medications: medications.map(toMedication).filter((m): m is Medication => m !== null),
    createdAt,
    updatedAt,
  };
}

function toMedication(value: unknown): Medication | null {
  if (!isRecord(value)) return null;

  const { rxcui, name, termType, synonym, prescribableName } = value;
  if (
    !isNonEmptyString(rxcui) ||
    !isNonEmptyString(name) ||
    !(RXNORM_TERM_TYPES as readonly unknown[]).includes(termType)
  ) {
    return null;
  }

  return {
    rxcui,
    name,
    termType: termType as Medication['termType'],
    synonym: isNonEmptyString(synonym) ? synonym : undefined,
    prescribableName: isNonEmptyString(prescribableName) ? prescribableName : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
