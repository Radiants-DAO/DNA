export type { PatternEntry, PatternGroup } from './types';
export { patternRegistry } from './registry';

import type { PatternGroup } from './types';
import { patternRegistry } from './registry';

/** Lookup helpers */
export const getPatternByName = (name: string) =>
  patternRegistry.find(p => p.name === name);

export const getPatternsByGroup = (group: PatternGroup) =>
  patternRegistry.filter(p => p.group === group);

export const getPatternsByDensity = (min: number, max: number) =>
  patternRegistry.filter(p => p.fill >= min && p.fill <= max);

/** All pattern names as a union type */
export type PatternName = typeof patternRegistry[number]['name'];

/** All group labels */
export const PATTERN_GROUPS: { key: PatternGroup; label: string; desc: string }[] = [
  { key: 'structural', label: 'Structural',       desc: 'Lines, stripes, checks' },
  { key: 'diagonal',   label: 'Diagonal',         desc: 'Angled lines and dotted diagonals' },
  { key: 'grid',       label: 'Grid & Lattice',   desc: 'Crosshatch, brick, columns' },
  { key: 'figurative', label: 'Figurative',       desc: 'Shapes, waves, textures' },
  { key: 'scatter',    label: 'Scatter / Stipple', desc: 'Sparse dot patterns (2%–12%)' },
  { key: 'heavy',      label: 'Heavy Fill',       desc: 'Dense patterns (75%–97%)' },
];
