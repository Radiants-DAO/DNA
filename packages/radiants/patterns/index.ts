export {
  PATTERN_GROUPS,
  PATTERN_REGISTRY,
  preparePattern,
  preparePatterns,
} from '@rdna/pixel/patterns';

export type {
  PatternEntry as AuthoredPattern,
  PatternGroup,
  PatternGroupDefinition,
  PatternName,
  PreparedPattern as PatternEntry,
  PreparedPattern,
} from '@rdna/pixel/patterns';

import { preparePatterns, type PatternGroup } from '@rdna/pixel/patterns';

export const patternRegistry = preparePatterns();

/** Lookup helpers */
export const getPatternByName = (name: string) =>
  patternRegistry.find((pattern) => pattern.name === name);

export const getPatternsByGroup = (group: PatternGroup) =>
  patternRegistry.filter((pattern) => pattern.group === group);

export const getPatternsByDensity = (min: number, max: number) =>
  patternRegistry.filter((pattern) => pattern.fill >= min && pattern.fill <= max);
