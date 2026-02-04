import { describe, it, expect } from 'vitest';
import { applySpacing } from '../features/spacing';

describe('spacing feature', () => {
  it('applies margin and returns diff', () => {
    const el = document.createElement('div');
    const diff = applySpacing(el, { marginTop: '12px' });
    expect(diff.changes[0].property).toBe('margin-top');
    expect(diff.changes[0].newValue).toBe('12px');
  });

  it('applies padding and returns diff', () => {
    const el = document.createElement('div');
    const diff = applySpacing(el, { paddingLeft: '8px' });
    expect(diff.changes[0].property).toBe('padding-left');
    expect(el.style.paddingLeft).toBe('8px');
  });

  it('records old value before change', () => {
    const el = document.createElement('div');
    el.style.marginTop = '5px';
    const diff = applySpacing(el, { marginTop: '10px' });
    expect(diff.changes[0].oldValue).toBe('5px');
  });
});
