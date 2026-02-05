import { describe, it, expect } from 'vitest';
import { recordStyleMutation } from '../mutations/mutationRecorder';

function makeElement(id: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  return el;
}

describe('recordStyleMutation', () => {
  it('creates a MutationDiff for a CSS property change', () => {
    const el = makeElement('ref-1');
    const diff = recordStyleMutation(el, { color: 'red' }, { color: 'blue' });
    expect(diff.changes[0].property).toBe('color');
    expect(diff.changes[0].oldValue).toBe('red');
    expect(diff.changes[0].newValue).toBe('blue');
  });

  it('includes element selector in diff', () => {
    const el = makeElement('my-ref');
    const diff = recordStyleMutation(el, {}, { padding: '10px' });
    expect(diff.element.selector).toBe('#my-ref');
    expect(typeof diff.element.elementIndex).toBe('number');
  });

  it('records multiple property changes', () => {
    const el = makeElement('ref-2');
    const diff = recordStyleMutation(
      el,
      { margin: '0', padding: '0' },
      { margin: '10px', padding: '20px' }
    );
    expect(diff.changes.length).toBe(2);
  });

  it('sets type to style', () => {
    const el = makeElement('ref-3');
    const diff = recordStyleMutation(el, {}, { color: 'red' });
    expect(diff.type).toBe('style');
  });

  it('includes timestamp', () => {
    const el = makeElement('ref-4');
    const diff = recordStyleMutation(el, {}, { color: 'red' });
    expect(diff.timestamp).toBeDefined();
    expect(new Date(diff.timestamp).getTime()).toBeGreaterThan(0);
  });
});
