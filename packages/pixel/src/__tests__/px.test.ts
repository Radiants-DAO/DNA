import { describe, it, expect } from 'vitest';
import { px } from '../px.js';
import type { PxProps, PxConfig, PxOptions, Corner } from '../px.js';
import { listShapes } from '../shapes.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert that a string looks like a data URI mask image. */
function expectMaskURI(val: string) {
  expect(val).toMatch(/^url\("data:image\/svg\+xml,/);
}

/** Assert that a corner position has cover, border, and size set. */
function expectCornerSet(
  style: Record<string, string>,
  pos: 'tl' | 'tr' | 'br' | 'bl',
) {
  expectMaskURI(style[`--px-${pos}-cover`]);
  expectMaskURI(style[`--px-${pos}-border`]);
  expect(style[`--px-${pos}-s`]).toMatch(/^calc\(\d+px \* var\(--pixel-scale, 1\)\)$/);
}

/** Assert that a corner position has NO URIs (size 0 / default). */
function expectCornerEmpty(
  style: Record<string, string>,
  pos: 'tl' | 'tr' | 'br' | 'bl',
) {
  expect(style[`--px-${pos}-cover`]).toBeUndefined();
  expect(style[`--px-${pos}-border`]).toBeUndefined();
  expect(style[`--px-${pos}-s`]).toBeUndefined();
}

// ---------------------------------------------------------------------------
// 1. Uniform circle
// ---------------------------------------------------------------------------

describe('px(size) — uniform circle', () => {
  it('returns className "pixel-corner"', () => {
    const result = px(8);
    expect(result.className).toBe('pixel-corner');
  });

  it('sets all 4 corners with circle URIs', () => {
    const { style } = px(8);
    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerSet(style, 'br');
    expectCornerSet(style, 'bl');
  });

  it('computes gridSize = size + 1', () => {
    const { style } = px(8);
    // gridSize for circle radius 8 = 9
    expect(style['--px-tl-s']).toBe('calc(9px * var(--pixel-scale, 1))');
  });

  it('does not set edge variables (all default to 1)', () => {
    const { style } = px(8);
    expect(style['--px-et']).toBeUndefined();
    expect(style['--px-er']).toBeUndefined();
    expect(style['--px-eb']).toBeUndefined();
    expect(style['--px-el']).toBeUndefined();
  });

  it('does not set --color-line when no color option', () => {
    const { style } = px(8);
    expect(style['--color-line']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Per-corner sizes
// ---------------------------------------------------------------------------

describe('px(tl, tr, br, bl) — per-corner', () => {
  it('sets only active corners', () => {
    const { style } = px(6, 6, 0, 0);
    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerEmpty(style, 'br');
    expectCornerEmpty(style, 'bl');
  });

  it('uses correct gridSize per corner', () => {
    const { style } = px(6, 4, 0, 0);
    expect(style['--px-tl-s']).toBe('calc(7px * var(--pixel-scale, 1))');
    expect(style['--px-tr-s']).toBe('calc(5px * var(--pixel-scale, 1))');
  });

  it('handles all corners at 0', () => {
    const { style } = px(0, 0, 0, 0);
    expectCornerEmpty(style, 'tl');
    expectCornerEmpty(style, 'tr');
    expectCornerEmpty(style, 'br');
    expectCornerEmpty(style, 'bl');
  });

  it('accepts PxOptions as 5th argument', () => {
    const { style } = px(6, 6, 0, 0, { edges: [1, 1, 0, 1] });
    expect(style['--px-eb']).toBe('0');
    expect(style['--px-et']).toBeUndefined(); // default
    expect(style['--px-er']).toBeUndefined(); // default
    expect(style['--px-el']).toBeUndefined(); // default
  });
});

// ---------------------------------------------------------------------------
// 3. Named mode — px('chamfer', 8)
// ---------------------------------------------------------------------------

describe('px(mode, size) — named mode', () => {
  it('uses the specified shape for all 4 corners', () => {
    const { style } = px('chamfer', 8);
    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerSet(style, 'br');
    expectCornerSet(style, 'bl');
  });

  it('produces different URIs from circle for the same size', () => {
    const circle = px(8);
    const chamfer = px('chamfer', 8);
    expect(chamfer.style['--px-tl-cover']).not.toBe(circle.style['--px-tl-cover']);
  });

  it('accepts ModeOptions as 3rd argument', () => {
    const { style } = px('chamfer', 8, { edges: [0, 1, 1, 0], color: '#f00' });
    expect(style['--px-et']).toBe('0');
    expect(style['--px-el']).toBe('0');
    expect(style['--color-line']).toBe('#f00');
  });
});

// ---------------------------------------------------------------------------
// 4. Mixed shapes per corner
// ---------------------------------------------------------------------------

describe('px() — mixed shapes per corner', () => {
  it('allows [mode, size] tuples per corner', () => {
    const { style } = px(
      ['chamfer', 8] as Corner,
      ['circle', 6] as Corner,
      0,
      0,
    );
    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerEmpty(style, 'br');
    expectCornerEmpty(style, 'bl');
    // chamfer 8 → gridSize 9, circle 6 → gridSize 7
    expect(style['--px-tl-s']).toBe('calc(9px * var(--pixel-scale, 1))');
    expect(style['--px-tr-s']).toBe('calc(7px * var(--pixel-scale, 1))');
  });
});

// ---------------------------------------------------------------------------
// 5. Edge toggling
// ---------------------------------------------------------------------------

describe('edge toggling', () => {
  it('only sets non-default edge variables', () => {
    const { style } = px(8, 8, 0, 0, { edges: [1, 1, 0, 1] });
    expect(style['--px-eb']).toBe('0');
    // defaults (1) are not set
    expect(style['--px-et']).toBeUndefined();
    expect(style['--px-er']).toBeUndefined();
    expect(style['--px-el']).toBeUndefined();
  });

  it('sets all edge vars when all are 0', () => {
    const { style } = px(8, { edges: [0, 0, 0, 0] });
    expect(style['--px-et']).toBe('0');
    expect(style['--px-er']).toBe('0');
    expect(style['--px-eb']).toBe('0');
    expect(style['--px-el']).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// 6. Color override
// ---------------------------------------------------------------------------

describe('color override', () => {
  it('sets --color-line via config object', () => {
    const { style } = px({ mode: 'circle', radius: 8, color: '#fff' });
    expect(style['--color-line']).toBe('#fff');
  });

  it('sets --color-line via PxOptions on uniform size', () => {
    const { style } = px(8, { color: '#0f0' });
    expect(style['--color-line']).toBe('#0f0');
  });
});

// ---------------------------------------------------------------------------
// 7. Memoization
// ---------------------------------------------------------------------------

describe('memoization', () => {
  it('returns identical URI values on repeated calls', () => {
    const a = px(8);
    const b = px(8);
    expect(a.style['--px-tl-cover']).toBe(b.style['--px-tl-cover']);
    expect(a.style['--px-tr-border']).toBe(b.style['--px-tr-border']);
  });

  it('caches different modes independently', () => {
    const circle = px(8);
    const chamfer = px('chamfer', 8);
    expect(circle.style['--px-tl-cover']).not.toBe(chamfer.style['--px-tl-cover']);
  });
});

// ---------------------------------------------------------------------------
// 8. Config object form
// ---------------------------------------------------------------------------

describe('px(config) — full config object', () => {
  it('handles uniform radius with mode', () => {
    const { style } = px({ mode: 'chamfer', radius: 8 });
    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerSet(style, 'br');
    expectCornerSet(style, 'bl');
  });

  it('handles per-corner radius array', () => {
    const { style } = px({
      mode: 'chamfer',
      radius: [8, 8, 0, 0],
      edges: [1, 1, 0, 1],
    });
    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerEmpty(style, 'br');
    expectCornerEmpty(style, 'bl');
    expect(style['--px-eb']).toBe('0');
  });

  it('defaults mode to circle', () => {
    const viaConfig = px({ radius: 8 });
    const viaShorthand = px(8);
    expect(viaConfig.style['--px-tl-cover']).toBe(viaShorthand.style['--px-tl-cover']);
  });

  it('applies mode to plain-number radius items in array', () => {
    // radius: [8, 8, 0, 0] with mode: 'chamfer' → both active corners use chamfer
    const { style } = px({ mode: 'chamfer', radius: [8, 8, 0, 0] });
    const chamferDirect = px('chamfer', 8);
    expect(style['--px-tl-cover']).toBe(chamferDirect.style['--px-tl-cover']);
  });
});

// ---------------------------------------------------------------------------
// 9. Size 0 corners
// ---------------------------------------------------------------------------

describe('size 0 corners', () => {
  it('produces no URIs for 0-size corners', () => {
    const { style } = px(0, 0, 0, 0);
    for (const pos of ['tl', 'tr', 'br', 'bl'] as const) {
      expectCornerEmpty(style, pos);
    }
  });

  it('works in mixed scenarios', () => {
    const { style } = px(8, 0, 8, 0);
    expectCornerSet(style, 'tl');
    expectCornerEmpty(style, 'tr');
    expectCornerSet(style, 'br');
    expectCornerEmpty(style, 'bl');
  });
});

// ---------------------------------------------------------------------------
// 10. All registered shapes work
// ---------------------------------------------------------------------------

describe('all registered shapes produce valid output', () => {
  const shapes = listShapes();

  it.each(shapes)('px("%s", 8) produces valid output', (shape) => {
    const result = px(shape, 8);
    expect(result.className).toBe('pixel-corner');
    expectCornerSet(result.style, 'tl');
    expectCornerSet(result.style, 'tr');
    expectCornerSet(result.style, 'br');
    expectCornerSet(result.style, 'bl');
  });
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

describe('error handling', () => {
  it('throws with no arguments', () => {
    expect(() => (px as () => PxProps)()).toThrow();
  });

  it('throws with invalid mode+size (missing size)', () => {
    expect(() => px('chamfer' as unknown)).toThrow();
  });
});
