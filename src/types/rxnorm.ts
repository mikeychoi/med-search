// Raw response shapes from the RxNorm REST API (https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html).

/** One concept, as returned by /drugs.json and /rxcui/{rxcui}/properties.json. */
export interface RxNormConceptProperties {
  rxcui?: string;
  name?: string;
  /** Short or "Tallman" synonym; frequently an empty string. */
  synonym?: string;
  tty?: string;
  language?: string;
  suppress?: string;
  /** Always empty per RxNorm docs. */
  umlscui?: string;
  /** Prescribable name; only returned by /drugs.json with `expand=psn`. */
  psn?: string;
}

/** Concepts sharing one term type. `conceptProperties` is omitted when there are none. */
export interface RxNormConceptGroup {
  tty?: string;
  conceptProperties?: RxNormConceptProperties[] | null;
}

export interface RxNormDrugGroup {
  /** Always null per RxNorm docs. */
  name?: string | null;
  /** Omitted when the search has no matches. */
  conceptGroup?: RxNormConceptGroup[] | null;
}

/** GET /REST/drugs.json?name={name}&expand=psn */
export interface RxNormDrugsResponse {
  drugGroup?: RxNormDrugGroup | null;
}

/** GET /REST/rxcui/{rxcui}/properties.json — `{}` for an unknown RxCUI. */
export interface RxNormPropertiesResponse {
  properties?: RxNormConceptProperties | null;
}
