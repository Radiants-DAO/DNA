import type { MutationDiff } from '@flow/shared';

/**
 * Record a style mutation as a diff.
 */
export function recordStyleMutation(
  elementRef: string,
  before: Record<string, string>,
  after: Record<string, string>
): MutationDiff {
  const changes = Object.keys(after).map((property) => ({
    property,
    oldValue: before[property] ?? '',
    newValue: after[property] ?? '',
  }));

  return {
    id: crypto.randomUUID(),
    element: { selector: `[data-flow-ref="${elementRef}"]` },
    type: 'style',
    changes,
    timestamp: new Date().toISOString(),
  };
}
