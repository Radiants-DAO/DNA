import { describe, it, expect } from 'vitest';
import { recordStyleMutation } from '../mutations/mutationRecorder';

describe('recordStyleMutation', () => {
  it('creates a MutationDiff for a CSS property change', () => {
    const diff = recordStyleMutation('ref-1', { color: 'red' }, { color: 'blue' });
    expect(diff.changes[0].property).toBe('color');
    expect(diff.changes[0].oldValue).toBe('red');
    expect(diff.changes[0].newValue).toBe('blue');
  });

  it('includes element selector in diff', () => {
    const diff = recordStyleMutation('my-ref', {}, { padding: '10px' });
    expect(diff.element.selector).toContain('my-ref');
  });

  it('records multiple property changes', () => {
    const diff = recordStyleMutation(
      'ref-2',
      { margin: '0', padding: '0' },
      { margin: '10px', padding: '20px' }
    );
    expect(diff.changes.length).toBe(2);
  });

  it('sets type to style', () => {
    const diff = recordStyleMutation('ref-3', {}, { color: 'red' });
    expect(diff.type).toBe('style');
  });

  it('includes timestamp', () => {
    const diff = recordStyleMutation('ref-4', {}, { color: 'red' });
    expect(diff.timestamp).toBeDefined();
    expect(new Date(diff.timestamp).getTime()).toBeGreaterThan(0);
  });
});
