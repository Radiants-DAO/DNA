import { describe, it, expect } from 'vitest';
import { applyLayout } from '../features/layout';

describe('layout feature', () => {
  it('sets display and returns diff', () => {
    const el = document.createElement('div');
    const diff = applyLayout(el, { display: 'flex' });
    expect(diff.changes[0].property).toBe('display');
    expect(el.style.display).toBe('flex');
  });

  it('sets flex properties', () => {
    const el = document.createElement('div');
    const diff = applyLayout(el, { flexDirection: 'column', justifyContent: 'center' });
    expect(diff.changes.length).toBe(2);
    expect(el.style.flexDirection).toBe('column');
    expect(el.style.justifyContent).toBe('center');
  });

  it('sets grid properties', () => {
    const el = document.createElement('div');
    const diff = applyLayout(el, { display: 'grid', gridTemplateColumns: '1fr 1fr' });
    expect(el.style.display).toBe('grid');
    expect(el.style.gridTemplateColumns).toBe('1fr 1fr');
  });
});
