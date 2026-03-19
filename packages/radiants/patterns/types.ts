export type PatternGroup =
  | 'structural'
  | 'diagonal'
  | 'grid'
  | 'figurative'
  | 'scatter'
  | 'heavy';

export interface PatternEntry {
  /** Display name and CSS class suffix: e.g. "checkerboard" → .rdna-pat--checkerboard */
  name: string;
  /** Visual grouping */
  group: PatternGroup;
  /** Fill density 0–100 (exact bit count / 64 pixels) */
  fill: number;
  /** Original 8-byte hex string: "AA 55 AA 55 AA 55 AA 55" */
  hex: string;
  /** CSS custom property name: "--pat-checkerboard" */
  token: string;
  /** Original System 6 name before renaming */
  legacyName: string;
}
