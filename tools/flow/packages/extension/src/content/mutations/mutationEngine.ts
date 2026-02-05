import type {
  MutationDiff,
  PropertyMutation,
  ElementIdentity,
} from '@flow/shared';
import { normalizeStyleChanges } from '../features/styleUtils';

/** Maps elementRef → DOM element */
const elementRefMap = new Map<string, HTMLElement>();

/** Maps mutationId → { element, originalStyles } for revert */
interface RevertEntry {
  element: HTMLElement;
  originalStyles: Record<string, string>;
  originalTextContent?: string;
}
const revertStack = new Map<string, RevertEntry>();

/** All accumulated diffs for the session */
const diffs: MutationDiff[] = [];

/**
 * Register a DOM element with a ref ID (called when user selects an element).
 */
export function registerElement(ref: string, element: HTMLElement): void {
  elementRefMap.set(ref, element);
}

/**
 * Unregister an element ref.
 */
export function unregisterElement(ref: string): void {
  elementRefMap.delete(ref);
}

/**
 * Get an element by its ref ID.
 */
export function getElement(ref: string): HTMLElement | undefined {
  return elementRefMap.get(ref);
}

/**
 * Get a unique CSS selector for an element.
 * Prefers id, then builds a path from tag + nth-of-type.
 */
export function getSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;

  const parts: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${current.id}`);
      break;
    }

    const parent: HTMLElement | null = current.parentElement;
    if (parent) {
      const currentTag = current.tagName;
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === currentTag
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(' > ');
}

/**
 * Build an ElementIdentity from a DOM element.
 */
export function identifyElement(el: HTMLElement): ElementIdentity {
  const elementIndexAttr = el.getAttribute('data-flow-index');
  const elementIndex = elementIndexAttr ? Number(elementIndexAttr) : undefined;
  return { selector: getSelector(el), elementIndex };
}

/**
 * Capture the current computed values for a set of CSS properties.
 */
function capturePropertyValues(
  el: HTMLElement,
  properties: string[]
): Record<string, string> {
  const computed = getComputedStyle(el);
  const values: Record<string, string> = {};
  for (const prop of properties) {
    values[prop] = computed.getPropertyValue(prop).trim() || el.style.getPropertyValue(prop);
  }
  return values;
}

/**
 * Apply style mutations to an element. Returns the captured diff.
 *
 * Per spec §5.3:
 * 1. Capture current computed state as "before" snapshot
 * 2. Apply changes to live DOM via element.style
 * 3. Capture "after" state
 * 4. Accumulate diff
 */
export function applyStyleMutation(
  ref: string,
  styleChanges: Record<string, string>,
  elementIdentity?: Partial<ElementIdentity>
): MutationDiff | null {
  const el = elementRefMap.get(ref);
  if (!el) return null;

  // Normalize camelCase to kebab-case (e.g., marginTop → margin-top)
  const normalized = normalizeStyleChanges(styleChanges);
  const properties = Object.keys(normalized);

  // Step 1: capture "before"
  const beforeValues = capturePropertyValues(el, properties);

  // Store originals for revert (only the first time a property is touched)
  const mutationId = crypto.randomUUID();
  const originalStyles: Record<string, string> = {};
  for (const prop of properties) {
    originalStyles[prop] = el.style.getPropertyValue(prop);
  }
  revertStack.set(mutationId, { element: el, originalStyles });

  // Step 2: apply changes (using normalized kebab-case properties)
  for (const [prop, value] of Object.entries(normalized)) {
    el.style.setProperty(prop, value);
  }

  // Step 3: capture "after"
  const afterValues = capturePropertyValues(el, properties);

  // Step 4: build diff
  const changes: PropertyMutation[] = properties
    .filter((prop) => beforeValues[prop] !== afterValues[prop])
    .map((prop) => ({
      property: prop,
      oldValue: beforeValues[prop],
      newValue: afterValues[prop],
    }));

  if (changes.length === 0) {
    revertStack.delete(mutationId);
    return null;
  }

  const identity = { ...identifyElement(el), ...elementIdentity };

  const diff: MutationDiff = {
    id: mutationId,
    element: identity,
    type: 'style',
    changes,
    timestamp: new Date().toISOString(),
  };

  diffs.push(diff);
  return diff;
}

/**
 * Apply a text content mutation. Returns the captured diff.
 */
export function applyTextMutation(
  ref: string,
  newText: string,
  elementIdentity?: Partial<ElementIdentity>
): MutationDiff | null {
  const el = elementRefMap.get(ref);
  if (!el) return null;

  const oldText = el.textContent ?? '';
  if (oldText === newText) return null;

  const mutationId = crypto.randomUUID();
  revertStack.set(mutationId, {
    element: el,
    originalStyles: {},
    originalTextContent: oldText,
  });

  el.textContent = newText;

  const identity = { ...identifyElement(el), ...elementIdentity };

  const diff: MutationDiff = {
    id: mutationId,
    element: identity,
    type: 'text',
    changes: [
      { property: 'textContent', oldValue: oldText, newValue: newText },
    ],
    timestamp: new Date().toISOString(),
  };

  diffs.push(diff);
  return diff;
}

/**
 * Revert a specific mutation or all mutations.
 * When reverting all, processes in reverse order to restore original state correctly
 * when the same element has been mutated multiple times.
 */
export function revertMutation(mutationId: string | 'all'): boolean {
  if (mutationId === 'all') {
    // Revert in reverse order to handle multiple mutations on same element correctly
    const entries = Array.from(revertStack.entries()).reverse();
    for (const [, entry] of entries) {
      revertSingleEntry(entry);
    }
    revertStack.clear();
    diffs.length = 0;
    return true;
  }

  const entry = revertStack.get(mutationId);
  if (!entry) return false;

  revertSingleEntry(entry);
  revertStack.delete(mutationId);

  const index = diffs.findIndex((d) => d.id === mutationId);
  if (index !== -1) diffs.splice(index, 1);

  return true;
}

function revertSingleEntry(entry: RevertEntry): void {
  const { element, originalStyles, originalTextContent } = entry;

  // Revert style properties
  for (const [prop, value] of Object.entries(originalStyles)) {
    if (value) {
      element.style.setProperty(prop, value);
    } else {
      element.style.removeProperty(prop);
    }
  }

  // Revert text content
  if (originalTextContent !== undefined) {
    element.textContent = originalTextContent;
  }
}

/**
 * Get all accumulated diffs (for sending to panel).
 */
export function getAllDiffs(): MutationDiff[] {
  return [...diffs];
}

/**
 * Clear all diffs and revert entries without reverting DOM changes.
 */
export function clearDiffs(): void {
  diffs.length = 0;
  revertStack.clear();
}
