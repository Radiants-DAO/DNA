import { bitsToMaskURI, bitsToPath } from '../path.ts';
import { PATTERN_REGISTRY } from './registry.ts';
import type { PatternEntry, PreparedPattern } from './types.ts';

const preparedPatternCache = new Map<string, PreparedPattern>();
let preparedPatternsCache: readonly PreparedPattern[] | undefined;

function countFilledBits(bits: string): number {
  let filled = 0;

  for (const bit of bits) {
    if (bit === '1') {
      filled += 1;
    }
  }

  return filled;
}

function roundPatternFill(percentage: number): number {
  const floor = Math.floor(percentage);
  const fraction = percentage - floor;

  if (fraction < 0.5) {
    return floor;
  }

  if (fraction > 0.5) {
    return floor + 1;
  }

  return floor % 2 === 0 ? floor : floor + 1;
}

function toPatternToken(name: string): PreparedPattern['token'] {
  return `--pat-${name}`;
}

function buildPreparedPattern(pattern: PatternEntry): PreparedPattern {
  const path = bitsToPath(pattern.bits, pattern.width, pattern.height);

  return {
    ...pattern,
    aliases: pattern.aliases ?? [],
    fill: roundPatternFill(
      (countFilledBits(pattern.bits) / (pattern.width * pattern.height)) * 100,
    ),
    token: toPatternToken(pattern.name),
    path,
    maskImage: bitsToMaskURI(path, pattern.width, pattern.height),
  };
}

export function preparePattern(name: string): PreparedPattern | undefined {
  const cached = preparedPatternCache.get(name);

  if (cached) {
    return cached;
  }

  const pattern = PATTERN_REGISTRY.find((entry) => entry.name === name);

  if (!pattern) {
    return undefined;
  }

  const prepared = buildPreparedPattern(pattern);
  preparedPatternCache.set(pattern.name, prepared);
  return prepared;
}

export function preparePatterns(): readonly PreparedPattern[] {
  if (preparedPatternsCache) {
    return preparedPatternsCache;
  }

  preparedPatternsCache = PATTERN_REGISTRY.map((pattern) => {
    const prepared = buildPreparedPattern(pattern);
    preparedPatternCache.set(pattern.name, prepared);
    return prepared;
  });

  return preparedPatternsCache;
}
