import { describe, it, expect } from 'vitest';
import { toOverlayVars } from '../overlays/overlayRect';

describe('toOverlayVars', () => {
  it('maps bounding rect to CSS vars', () => {
    const vars = toOverlayVars({ top: 10, left: 20, width: 100, height: 50 });
    // Note: In jsdom, window.scrollY is 0, so top stays at 10
    expect(vars['--top']).toBe('10px');
    expect(vars['--left']).toBe('20px');
    expect(vars['--width']).toBe('100px');
    expect(vars['--height']).toBe('50px');
  });

  it('rounds values to avoid subpixel issues', () => {
    const vars = toOverlayVars({ top: 10.7, left: 20.3, width: 100.9, height: 50.1 });
    expect(vars['--top']).toBe('11px');
    expect(vars['--left']).toBe('20px');
    expect(vars['--width']).toBe('101px');
    expect(vars['--height']).toBe('50px');
  });
});
