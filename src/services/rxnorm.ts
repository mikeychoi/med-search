import { RXNORM_TERM_TYPES, type Medication, type RxNormTermType } from '../types/medication';
import type {
  RxNormConceptGroup,
  RxNormConceptProperties,
  RxNormDrugsResponse,
} from '../types/rxnorm';

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

export type RxNormErrorKind = 'invalid-query' | 'network' | 'http' | 'invalid-response';

const ERROR_MESSAGES: Record<RxNormErrorKind, string> = {
  'invalid-query': 'Enter a medication name to search.',
  network: 'Unable to reach the medication service. Check your connection and try again.',
  http: 'The medication service is unavailable right now. Please try again later.',
  'invalid-response': 'The medication service returned an unexpected response. Please try again.',
};

/**
 * Error thrown by the RxNorm service. `message` is safe to show to users;
 * technical details are kept on `status` and `cause`.
 */
export class RxNormError extends Error {
  readonly kind: RxNormErrorKind;
  readonly status?: number;

  constructor(kind: RxNormErrorKind, options: { status?: number; cause?: unknown } = {}) {
    super(ERROR_MESSAGES[kind], { cause: options.cause });
    this.name = 'RxNormError';
    this.kind = kind;
    this.status = options.status;
  }
}

/**
 * Searches RxNorm for drug products matching `query` (case-insensitive, exact name match).
 * Resolves with `[]` when nothing matches; rejects with an `RxNormError` otherwise.
 */
export async function searchMedications(query: string): Promise<Medication[]> {
  const name = query.trim();
  if (!name) {
    throw new RxNormError('invalid-query');
  }

  const params = new URLSearchParams({ name, expand: 'psn' });
  const url = `${RXNORM_BASE_URL}/drugs.json?${params}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new RxNormError('network', { cause: error });
  }

  if (!response.ok) {
    throw new RxNormError('http', { status: response.status });
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new RxNormError('invalid-response', { cause: error });
  }

  return toMedications(body);
}

/**
 * Validates a raw `/drugs.json` body and converts it into `Medication[]`, ordered by
 * `RXNORM_TERM_TYPES` (generic drugs before branded drugs before packs).
 * Concepts missing required fields or with unsupported term types are skipped.
 */
export function toMedications(body: unknown): Medication[] {
  const conceptGroups = parseConceptGroups(body);

  const medications: Medication[] = [];
  const seenRxcuis = new Set<string>();

  for (const group of conceptGroups) {
    if (!Array.isArray(group.conceptProperties)) continue;

    for (const concept of group.conceptProperties) {
      const medication = toMedication(concept);
      if (medication && !seenRxcuis.has(medication.rxcui)) {
        seenRxcuis.add(medication.rxcui);
        medications.push(medication);
      }
    }
  }

  // Array.prototype.sort is stable, so RxNorm's order is kept within each term type.
  return medications.sort(
    (a, b) => RXNORM_TERM_TYPES.indexOf(a.termType) - RXNORM_TERM_TYPES.indexOf(b.termType),
  );
}

function parseConceptGroups(body: unknown): RxNormConceptGroup[] {
  if (!isDrugsResponse(body)) {
    throw new RxNormError('invalid-response');
  }

  const conceptGroup: unknown = body.drugGroup.conceptGroup;
  // RxNorm omits conceptGroup entirely when a search has no matches.
  if (conceptGroup === undefined || conceptGroup === null) {
    return [];
  }
  if (!Array.isArray(conceptGroup)) {
    throw new RxNormError('invalid-response');
  }

  return conceptGroup.filter(isRecord);
}

function isDrugsResponse(
  body: unknown,
): body is RxNormDrugsResponse & { drugGroup: Record<string, unknown> } {
  return isRecord(body) && isRecord(body.drugGroup);
}

function toMedication(concept: unknown): Medication | null {
  if (!isRecord(concept)) return null;

  const { rxcui, name, tty, synonym, psn } = concept as RxNormConceptProperties;
  const validRxcui = nonEmptyString(rxcui);
  const validName = nonEmptyString(name);
  const termType = nonEmptyString(tty);

  if (!validRxcui || !validName || !termType || !isSupportedTermType(termType)) {
    return null;
  }

  return {
    rxcui: validRxcui,
    name: validName,
    termType,
    synonym: nonEmptyString(synonym),
    prescribableName: nonEmptyString(psn),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function isSupportedTermType(value: string): value is RxNormTermType {
  return (RXNORM_TERM_TYPES as readonly string[]).includes(value);
}
