import { recordStyleMutation } from '../mutations/mutationRecorder';
import { normalizeStyleChanges } from './styleUtils';

/**
 * Apply layout changes (display, flex, grid) to an element and record the diff.
 */
export function applyLayout(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  const normalized = normalizeStyleChanges(changes);

  Object.keys(normalized).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, normalized[prop]);
  });

  return recordStyleMutation(el.dataset.flowRef ?? 'unknown', before, normalized);
}
