import type { MutationDiff, ElementIdentity } from '@flow/shared';
import { elementRegistry, generateSelector } from '../elementRegistry';

/**
 * Build an element identity with selector and stable elementIndex.
 */
export function buildElementIdentity(element: HTMLElement): ElementIdentity {
  const elementIndex = elementRegistry.getId(element) ?? elementRegistry.register(element);
  return { selector: generateSelector(element), elementIndex };
}

/**
 * Record a style mutation as a diff.
 */
export function recordStyleMutation(
  element: HTMLElement,
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
    element: buildElementIdentity(element),
    type: 'style',
    changes,
    timestamp: new Date().toISOString(),
  };
}
