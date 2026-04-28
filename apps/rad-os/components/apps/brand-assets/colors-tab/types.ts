export interface BrandColor {
  name: string;
  hex: string;
  oklch: string;
  role: string;
  description: string;
  cssVar: string;
  tailwind: string;
}

export interface ExtendedColor {
  name: string;
  hex: string;
  oklch: string;
  cssVar: string;
  tailwind: string;
  role: string;
}

export interface SemanticToken {
  name: string;
  cssVar: string;
  tailwind: string;
  lightHex: string;
  darkHex: string;
  note: string;
}

export interface SemanticCategory {
  name: string;
  description: string;
  tokens: SemanticToken[];
}

/** Which primitive gets which Fibonacci size slot, per mode. */
export type FibSlot = 21 | 13 | 8 | 5 | 3 | 2 | 1;

/** Entry in the spiral — single or paired tones. */
export interface FibTile {
  slot: FibSlot;
  tones: readonly (BrandColor | ExtendedColor)[];
}

export type ColorsSubTab = 'palette' | 'semantic';
