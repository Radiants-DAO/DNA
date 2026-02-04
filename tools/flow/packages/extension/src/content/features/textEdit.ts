import type { MutationDiff } from '@flow/shared';

/**
 * Apply a text content change to an element and record the diff.
 */
export function applyTextEdit(el: HTMLElement, newText: string): MutationDiff {
  const oldValue = el.textContent ?? '';
  el.textContent = newText;

  return {
    id: crypto.randomUUID(),
    element: { selector: `[data-flow-ref="${el.dataset.flowRef ?? 'unknown'}"]` },
    type: 'text',
    changes: [{ property: 'textContent', oldValue, newValue: newText }],
    timestamp: new Date().toISOString(),
  };
}
