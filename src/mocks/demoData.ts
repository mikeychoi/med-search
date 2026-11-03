// TEMPORARY demonstration data for previewing UI components. Not a substitute for the RxNorm service.
// To remove the demo: delete the src/mocks/ folder, then delete the two lines marked `DEMO`
// in ListsPage.tsx (the import and the component).
// Concepts are real RxNorm entries (verified 2026-11-03).
import type { Medication, MedicationList } from '../types/medication';

export const demoMedications: Medication[] = [
  { rxcui: '161', name: 'acetaminophen', termType: 'IN' },
  {
    rxcui: '313782',
    name: 'acetaminophen 325 MG Oral Tablet',
    termType: 'SCD',
    synonym: 'APAP 325 MG Oral Tablet',
    prescribableName: 'acetaminophen 325 MG Oral Tablet',
  },
  {
    rxcui: '209387',
    name: 'acetaminophen 325 MG Oral Tablet [Tylenol]',
    termType: 'SBD',
    synonym: 'Tylenol 325 MG Oral Tablet',
    prescribableName: 'Tylenol Regular Strength 325 MG Oral Tablet',
  },
  {
    rxcui: '310965',
    name: 'ibuprofen 200 MG Oral Tablet',
    termType: 'SCD',
    synonym: 'ibuprofen 200 MG (as ibuprofen sodium 256 MG) Oral Tablet',
    prescribableName: 'ibuprofen 200 MG Oral Tablet',
  },
  {
    rxcui: '153008',
    name: 'ibuprofen 200 MG Oral Tablet [Advil]',
    termType: 'SBD',
    synonym: 'Advil 200 MG Oral Tablet',
    prescribableName: 'Advil 200 MG Oral Tablet',
  },
  {
    rxcui: '197805',
    name: 'ibuprofen 400 MG Oral Tablet',
    termType: 'SCD',
    prescribableName: 'ibuprofen 400 MG Oral Tablet',
  },
];

const [, acetaminophenScd, tylenol, ibuprofenScd, advil] = demoMedications;

export const demoLists: MedicationList[] = [
  {
    id: 'demo-pain-relief',
    name: 'Pain Relief',
    medications: [acetaminophenScd, ibuprofenScd, advil],
    createdAt: '2026-10-28T14:30:00.000Z',
    updatedAt: '2026-11-02T09:15:00.000Z',
  },
  {
    id: 'demo-travel-kit',
    name: 'Travel Kit',
    medications: [tylenol],
    createdAt: '2026-11-01T18:00:00.000Z',
    updatedAt: '2026-11-01T18:00:00.000Z',
  },
];
