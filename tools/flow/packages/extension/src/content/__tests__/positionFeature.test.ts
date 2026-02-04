import { describe, it, expect } from 'vitest';
import { applyPosition } from '../features/position';

describe('position feature', () => {
  it('sets position and returns diff', () => {
    const el = document.createElement('div');
    const diff = applyPosition(el, { position: 'absolute' });
    expect(diff.changes[0].property).toBe('position');
    expect(el.style.position).toBe('absolute');
  });

  it('sets position offsets', () => {
    const el = document.createElement('div');
    const diff = applyPosition(el, { top: '10px', left: '20px' });
    expect(diff.changes.length).toBe(2);
    expect(el.style.top).toBe('10px');
    expect(el.style.left).toBe('20px');
  });

  it('sets z-index', () => {
    const el = document.createElement('div');
    const diff = applyPosition(el, { zIndex: '100' });
    expect(diff.changes[0].property).toBe('z-index');
    expect(el.style.zIndex).toBe('100');
  });
});
