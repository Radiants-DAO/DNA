/**
 * Pure utility functions used by panel scanners.
 * These are tested here, then inlined (copy-pasted) into
 * inspectedWindow.eval() expressions. Keep them self-contained
 * with no imports.
 */

/** Classify a CSS custom property as brand, semantic, or unknown. */
export function classifyTier(name: string): 'brand' | 'semantic' | 'unknown' {
  const semanticPattern =
    /^--(?:color|spacing|size|radius|shadow|font|motion)-(?:surface|content|edge|primary|secondary|tertiary|accent|success|warning|error|info|inverse|muted|disabled|hover|active|focus)/;
  if (semanticPattern.test(name)) return 'semantic';
  if (/^--(color|spacing|size|radius|shadow|font|motion)-/.test(name)) return 'brand';
  return 'unknown';
}

/** Infer a token category from its CSS custom property name prefix. */
export function inferCategory(
  name: string,
): 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'motion' | 'size' | 'other' {
  if (name.startsWith('--color-')) return 'color';
  if (name.startsWith('--spacing-')) return 'spacing';
  if (name.startsWith('--radius-')) return 'radius';
  if (name.startsWith('--shadow-')) return 'shadow';
  if (name.startsWith('--font-')) return 'font';
  if (name.startsWith('--motion-')) return 'motion';
  if (name.startsWith('--size-')) return 'size';
  return 'other';
}

/** Dedup scanned items by a composite key, summing instance counts. */
export function dedupByKey<T extends { instances: number }>(
  items: T[],
  keyFn: (item: T) => string,
): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.instances += item.instances;
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

/** Check if a React component name looks like a user component (not internal). */
export function isUserComponent(name: string | null): boolean {
  if (!name) return false;
  if (name.startsWith('_')) return false;
  if (name[0] !== name[0].toUpperCase()) return false;
  return true;
}
