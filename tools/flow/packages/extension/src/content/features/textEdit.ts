import type { MutationDiff } from '@flow/shared';
import { buildElementIdentity } from '../mutations/mutationRecorder';

/**
 * Apply a text content change to an element and record the diff.
 */
export function applyTextEdit(el: HTMLElement, newText: string): MutationDiff {
  const oldValue = el.textContent ?? '';
  el.textContent = newText;

  return {
    id: crypto.randomUUID(),
    element: buildElementIdentity(el),
    type: 'text',
    changes: [{ property: 'textContent', oldValue, newValue: newText }],
    timestamp: new Date().toISOString(),
  };
}
