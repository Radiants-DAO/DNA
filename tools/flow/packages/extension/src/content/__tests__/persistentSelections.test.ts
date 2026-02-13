import { afterEach, describe, expect, it } from 'vitest';
import {
  addPersistentSelection,
  addPersistentSelectionBySelector,
  clearPersistentSelections,
  destroyPersistentSelections,
  getPersistentSelectionSelectors,
  pulsePersistentSelection,
} from '../overlays/persistentSelections';
import { getOverlayShadow, removeOverlayRoot } from '../overlays/overlayRoot';

function mockRect(el: Element, rect: { top: number; left: number; width: number; height: number }) {
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect,
    }),
  });
}

describe('persistent selections overlays', () => {
  afterEach(() => {
    clearPersistentSelections();
    destroyPersistentSelections();
    removeOverlayRoot();
    document.body.innerHTML = '';
  });

  it('creates and tracks persistent outlines', () => {
    const el = document.createElement('div');
    el.id = 'target';
    document.body.appendChild(el);
    mockRect(el, { top: 10, left: 20, width: 120, height: 32 });

    const selector = addPersistentSelection(el, '#target');
    expect(selector).toBe('#target');
    expect(getPersistentSelectionSelectors()).toContain('#target');

    const shadow = getOverlayShadow();
    expect(shadow).not.toBeNull();
    const outlines = shadow?.querySelectorAll('.flow-persistent-selection-outline') ?? [];
    expect(outlines.length).toBe(1);
    const first = outlines[0] as HTMLElement;
    expect(first.style.display).toBe('block');
  });

  it('can register selections by selector', () => {
    const el = document.createElement('button');
    el.className = 'cta';
    document.body.appendChild(el);
    mockRect(el, { top: 40, left: 50, width: 88, height: 30 });

    const resolved = addPersistentSelectionBySelector('button.cta');
    expect(resolved).toBe(el);
    expect(getPersistentSelectionSelectors()).toContain('button.cta');
  });

  it('pulses and clears outlines', () => {
    const el = document.createElement('div');
    el.id = 'pulse-target';
    document.body.appendChild(el);
    mockRect(el, { top: 1, left: 1, width: 40, height: 20 });

    addPersistentSelection(el, '#pulse-target');
    pulsePersistentSelection('#pulse-target');

    const shadow = getOverlayShadow();
    const outline = shadow?.querySelector('.flow-persistent-selection-outline') as HTMLElement | null;
    expect(outline).not.toBeNull();
    expect(outline?.classList.contains('pulse')).toBe(true);

    clearPersistentSelections();
    expect(getPersistentSelectionSelectors()).toHaveLength(0);
    const remaining = shadow?.querySelectorAll('.flow-persistent-selection-outline') ?? [];
    expect(remaining.length).toBe(0);
  });
});
