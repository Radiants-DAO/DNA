import type { PixelGrid } from '../types.js';

export type PatternGroup =
  | 'structural'
  | 'diagonal'
  | 'grid'
  | 'figurative'
  | 'scatter'
  | 'heavy';

export interface PatternEntry extends PixelGrid {
  readonly group: PatternGroup;
  readonly aliases?: readonly string[];
}

export interface PreparedPattern extends PatternEntry {
  readonly aliases: readonly string[];
  readonly fill: number;
  readonly token: `--pat-${string}`;
  readonly path: string;
  readonly maskImage: string;
}

export interface PatternGroupDefinition {
  readonly key: PatternGroup;
  readonly label: string;
  readonly desc: string;
}
