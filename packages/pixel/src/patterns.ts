export { PATTERN_GROUPS, PATTERN_REGISTRY } from './patterns/registry.ts';
export { preparePattern, preparePatterns } from './patterns/prepare.ts';

export type {
  PatternEntry,
  PatternGroup,
  PatternGroupDefinition,
  PreparedPattern,
} from './patterns/types.ts';

import { PATTERN_REGISTRY } from './patterns/registry.ts';
import type { PatternEntry } from './patterns/types.ts';

export type PatternName = (typeof PATTERN_REGISTRY)[number]['name'];

export function getPattern(name: string): PatternEntry | undefined {
  return PATTERN_REGISTRY.find((pattern) => pattern.name === name);
}
