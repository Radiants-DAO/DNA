import { describe, it, expect, afterEach } from 'vitest';
import { deepElementFromPoint } from '../selection/deepElementFromPoint';
import { createSelectionEngine } from '../selection/selectionEngine';

describe('deepElementFromPoint', () => {
  it('returns the top-level element when no shadow root', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    // Provide a mock elementFromPoint that returns our element
    const found = deepElementFromPoint(0, 0, () => el);
    expect(found).toBe(el);
    document.body.removeChild(el);
  });

  it('returns null when elementFromPoint returns null', () => {
    const found = deepElementFromPoint(0, 0, () => null);
    expect(found).toBeNull();
  });
});

describe('createSelectionEngine', () => {
  let el: HTMLElement;

  afterEach(() => {
    if (el?.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('starts with empty state', () => {
    const engine = createSelectionEngine();
    expect(engine.getState().ids).toEqual([]);
    expect(engine.getState().primaryId).toBeNull();
  });

  it('selects an element and sets attribute', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const engine = createSelectionEngine();
    engine.select(el, 'test-id');

    expect(engine.getState().ids).toContain('test-id');
    expect(el.getAttribute('data-flow-selected')).toBe('true');
  });

  it('unselects an element and removes attribute', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const engine = createSelectionEngine();
    engine.select(el, 'test-id');
    engine.unselect(el, 'test-id');

    expect(engine.getState().ids).not.toContain('test-id');
    expect(el.hasAttribute('data-flow-selected')).toBe(false);
  });

  it('clears all selections', () => {
    el = document.createElement('div');
    el.setAttribute('data-flow-id', 'test-id');
    document.body.appendChild(el);

    const engine = createSelectionEngine();
    engine.select(el, 'test-id');
    engine.clear();

    expect(engine.getState().ids).toEqual([]);
  });
});
