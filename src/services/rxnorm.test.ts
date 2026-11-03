import type { MockInstance } from 'vitest';
import type { RxNormDrugsResponse } from '../types/rxnorm';
import { RxNormError, searchMedications, toMedications } from './rxnorm';

// Trimmed from real responses to /REST/drugs.json?name=ibuprofen&expand=psn.
// Groups arrive in RxNorm's order (packs first), and empty groups have no conceptProperties.
const ibuprofenResponse: RxNormDrugsResponse = {
  drugGroup: {
    name: null,
    conceptGroup: [
      { tty: 'BPCK' },
      { tty: 'GPCK' },
      {
        tty: 'SBD',
        conceptProperties: [
          {
            rxcui: '1100066',
            name: 'ibuprofen 200 MG Oral Capsule [Advil]',
            synonym: 'Advil 200 MG Oral Capsule',
            tty: 'SBD',
            language: 'ENG',
            suppress: 'N',
            umlscui: '',
            psn: 'Advil 200 MG Oral Capsule',
          },
          {
            rxcui: '153008',
            name: 'ibuprofen 200 MG Oral Tablet [Motrin]',
            synonym: 'Motrin 200 MG Oral Tablet',
            tty: 'SBD',
            language: 'ENG',
            suppress: 'N',
            umlscui: '',
            psn: 'Motrin 200 MG Oral Tablet',
          },
        ],
      },
      {
        tty: 'SCD',
        conceptProperties: [
          {
            rxcui: '310965',
            name: 'ibuprofen 200 MG Oral Tablet',
            synonym: '',
            tty: 'SCD',
            language: 'ENG',
            suppress: 'N',
            umlscui: '',
            psn: 'ibuprofen 200 MG Oral Tablet',
          },
          {
            rxcui: '197805',
            name: 'ibuprofen 400 MG Oral Tablet',
            synonym: '',
            tty: 'SCD',
            language: 'ENG',
            suppress: 'N',
            umlscui: '',
          },
        ],
      },
    ],
  },
};

const noResultsResponse: RxNormDrugsResponse = { drugGroup: { name: null } };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function concept(overrides: Record<string, unknown>) {
  return { rxcui: '1', name: 'drug', tty: 'SCD', ...overrides };
}

function responseWith(conceptProperties: unknown[]) {
  return { drugGroup: { name: null, conceptGroup: [{ tty: 'SCD', conceptProperties }] } };
}

async function expectRxNormError(promise: Promise<unknown>, kind: RxNormError['kind']) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(RxNormError);
  expect((error as RxNormError).kind).toBe(kind);
  return error as RxNormError;
}

describe('searchMedications', () => {
  let fetchMock: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful searches', () => {
    it('requests drugs.json with the encoded query and prescribable names', async () => {
      fetchMock.mockResolvedValue(jsonResponse(noResultsResponse));

      await searchMedications('  amlodipine / atorvastatin ');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.origin + url.pathname).toBe('https://rxnav.nlm.nih.gov/REST/drugs.json');
      expect(url.searchParams.get('name')).toBe('amlodipine / atorvastatin');
      expect(url.searchParams.get('expand')).toBe('psn');
      expect(url.search).toBe('?name=amlodipine+%2F+atorvastatin&expand=psn');
    });

    it('flattens concept groups and orders clinical drugs before branded drugs', async () => {
      fetchMock.mockResolvedValue(jsonResponse(ibuprofenResponse));

      const medications = await searchMedications('ibuprofen');

      expect(medications.map((m) => [m.rxcui, m.termType])).toEqual([
        ['310965', 'SCD'],
        ['197805', 'SCD'],
        ['1100066', 'SBD'],
        ['153008', 'SBD'],
      ]);
    });

    it('converts RxNorm concepts into Medication objects', async () => {
      fetchMock.mockResolvedValue(jsonResponse(ibuprofenResponse));

      const medications = await searchMedications('ibuprofen');

      expect(medications[2]).toEqual({
        rxcui: '1100066',
        name: 'ibuprofen 200 MG Oral Capsule [Advil]',
        termType: 'SBD',
        synonym: 'Advil 200 MG Oral Capsule',
        prescribableName: 'Advil 200 MG Oral Capsule',
      });
    });

    it('leaves missing or empty optional fields undefined', async () => {
      fetchMock.mockResolvedValue(jsonResponse(ibuprofenResponse));

      const medications = await searchMedications('ibuprofen');

      // synonym is "" and psn is absent in the raw response.
      expect(medications[1]).toEqual({
        rxcui: '197805',
        name: 'ibuprofen 400 MG Oral Tablet',
        termType: 'SCD',
        synonym: undefined,
        prescribableName: undefined,
      });
    });
  });

  describe('empty results', () => {
    it.each([
      ['no conceptGroup', noResultsResponse],
      ['a null conceptGroup', { drugGroup: { name: null, conceptGroup: null } }],
      ['an empty conceptGroup', { drugGroup: { name: null, conceptGroup: [] } }],
      ['only groups without concepts', { drugGroup: { conceptGroup: [{ tty: 'BPCK' }] } }],
    ])('returns an empty array for %s', async (_, body) => {
      fetchMock.mockResolvedValue(jsonResponse(body));

      await expect(searchMedications('zzzxqq')).resolves.toEqual([]);
    });
  });

  describe('invalid queries', () => {
    it.each(['', '   ', '\n\t'])('rejects %j without calling the API', async (query) => {
      await expectRxNormError(searchMedications(query), 'invalid-query');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('HTTP errors', () => {
    it.each([400, 404, 500, 503])('rejects with the status for HTTP %i', async (status) => {
      fetchMock.mockResolvedValue(
        new Response('Path or Query Parameter error', {
          status,
          headers: { 'Content-Type': 'text/plain' },
        }),
      );

      const error = await expectRxNormError(searchMedications('ibuprofen'), 'http');
      expect(error.status).toBe(status);
      expect(error.message).not.toContain('Path or Query Parameter error');
    });
  });

  describe('network errors', () => {
    it('rejects with a network error and keeps the original cause', async () => {
      const cause = new TypeError('Failed to fetch');
      fetchMock.mockRejectedValue(cause);

      const error = await expectRxNormError(searchMedications('ibuprofen'), 'network');
      expect(error.cause).toBe(cause);
      expect(error.message).toMatch(/unable to reach/i);
    });
  });

  describe('invalid responses', () => {
    it('rejects when the body is not valid JSON', async () => {
      fetchMock.mockResolvedValue(
        new Response('<html>Service Unavailable</html>', { status: 200 }),
      );

      const error = await expectRxNormError(searchMedications('ibuprofen'), 'invalid-response');
      expect(error.cause).toBeInstanceOf(SyntaxError);
    });

    it.each([
      ['null', null],
      ['an array', []],
      ['a string', 'drugs'],
      ['an object without drugGroup', {}],
      ['a non-object drugGroup', { drugGroup: 'none' }],
      ['a non-array conceptGroup', { drugGroup: { conceptGroup: { tty: 'SCD' } } }],
    ])('rejects when the body is %s', async (_, body) => {
      fetchMock.mockResolvedValue(jsonResponse(body));

      await expectRxNormError(searchMedications('ibuprofen'), 'invalid-response');
    });
  });
});

describe('toMedications', () => {
  it('skips concepts missing required fields', () => {
    const body = responseWith([
      concept({ rxcui: undefined }),
      concept({ rxcui: '' }),
      concept({ name: '   ' }),
      concept({ tty: undefined }),
      concept({ rxcui: '42', name: 'valid drug' }),
    ]);

    expect(toMedications(body)).toEqual([
      {
        rxcui: '42',
        name: 'valid drug',
        termType: 'SCD',
        synonym: undefined,
        prescribableName: undefined,
      },
    ]);
  });

  it('skips concepts with unsupported term types', () => {
    const body = responseWith([concept({ rxcui: '1', tty: 'SCDF' }), concept({ rxcui: '2' })]);

    expect(toMedications(body).map((m) => m.rxcui)).toEqual(['2']);
  });

  it('skips concepts and groups with the wrong value types', () => {
    const body = {
      drugGroup: {
        conceptGroup: [
          null,
          'SCD',
          { tty: 'SBD', conceptProperties: 'not an array' },
          { tty: 'SCD', conceptProperties: [null, 7, concept({ rxcui: 123 }), concept({})] },
        ],
      },
    };

    expect(toMedications(body).map((m) => m.rxcui)).toEqual(['1']);
  });

  it('keeps every supported term type, ordered IN, SCD, SBD, GPCK, BPCK', () => {
    const body = {
      drugGroup: {
        conceptGroup: [
          { tty: 'BPCK', conceptProperties: [concept({ rxcui: '5', tty: 'BPCK' })] },
          { tty: 'GPCK', conceptProperties: [concept({ rxcui: '4', tty: 'GPCK' })] },
          { tty: 'SBD', conceptProperties: [concept({ rxcui: '3', tty: 'SBD' })] },
          { tty: 'SCD', conceptProperties: [concept({ rxcui: '2', tty: 'SCD' })] },
          { tty: 'IN', conceptProperties: [concept({ rxcui: '1', tty: 'IN' })] },
        ],
      },
    };

    expect(toMedications(body).map((m) => m.termType)).toEqual([
      'IN',
      'SCD',
      'SBD',
      'GPCK',
      'BPCK',
    ]);
  });

  it('removes duplicate RxCUIs, keeping the first occurrence', () => {
    const body = responseWith([
      concept({ rxcui: '1', name: 'first' }),
      concept({ rxcui: '1', name: 'second' }),
    ]);

    expect(toMedications(body).map((m) => m.name)).toEqual(['first']);
  });

  it('trims whitespace from string fields', () => {
    const body = responseWith([concept({ rxcui: ' 7 ', name: ' drug ', synonym: ' syn ' })]);

    expect(toMedications(body)[0]).toMatchObject({ rxcui: '7', name: 'drug', synonym: 'syn' });
  });
});
