// Internal application models. API responses are transformed into these types by the
// service layer, so components never depend on the shape of any external API.

/** RxNorm term types the app supports. */
export const RXNORM_TERM_TYPES = ['IN', 'SCD', 'SBD', 'GPCK', 'BPCK'] as const;
export type RxNormTermType = (typeof RXNORM_TERM_TYPES)[number];

export interface Medication {
  /** RxNorm Concept Unique Identifier. */
  rxcui: string;
  name: string;
  termType: RxNormTermType;
  synonym?: string;
  prescribableName?: string;
}

export interface MedicationList {
  id: string;
  name: string;
  medications: Medication[];
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/** User-friendly names for each supported term type. */
export const RXNORM_TERM_TYPE_LABELS: Record<RxNormTermType, string> = {
  IN: 'Ingredient',
  SCD: 'Clinical Drug',
  SBD: 'Branded Drug',
  GPCK: 'Clinical Pack',
  BPCK: 'Branded Pack',
};
