import { useCallback, useRef, useState } from 'react';
import { RxNormError, searchMedications } from '../services/rxnorm';
import type { Medication } from '../types/medication';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong while searching. Please try again.';

/** Coordinates a medication search: runs one request at a time and tracks its outcome. */
export function useMedicationSearch() {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);
  // A ref (not state) so back-to-back calls in the same render see the in-flight request.
  const inFlight = useRef(false);

  const search = useCallback(async (query: string) => {
    if (inFlight.current) return;
    inFlight.current = true;

    setSubmittedQuery(query.trim());
    setMedications([]);
    setError(null);
    setStatus('loading');

    try {
      setMedications(await searchMedications(query));
      setStatus('success');
    } catch (caught) {
      if (caught instanceof RxNormError) {
        setError(caught.message);
      } else {
        console.error('Unexpected error during medication search', caught);
        setError(UNEXPECTED_ERROR_MESSAGE);
      }
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    status,
    submittedQuery,
    medications,
    error,
    isLoading: status === 'loading',
    search,
    clearError,
  };
}
