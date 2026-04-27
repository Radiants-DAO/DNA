import { describe, expect, it } from 'vitest';

import { corner, cornerMap, fixedCorner, flatCorner, themedCorner } from '../corners.js';
import { px } from '../px.js';
import type { PxConfig, PxProps } from '../px.js';
import { listCornerShapeNames } from '../corners/registry.js';

function fixed(shape: string, radiusPx: number) {
  return { radiusPx, binding: { source: 'fixed' as const, shape } };
}

function theme(radiusPx: number) {
  return { radiusPx, binding: { source: 'theme' as const } };
}

function expectMaskURI(val: string) {
  expect(val).toMatch(/^url\("data:image\/svg\+xml,/);
}

function expectCornerSet(
  style: Record<string, string>,
  pos: 'tl' | 'tr' | 'br' | 'bl',
) {
  expectMaskURI(style[`--px-${pos}-cover`]);
  expectMaskURI(style[`--px-${pos}-border`]);
  expect(style[`--px-${pos}-s`]).toMatch(/^calc\(\d+px \* var\(--pixel-scale, 1\)\)$/);
}

function expectCornerEmpty(
  style: Record<string, string>,
  pos: 'tl' | 'tr' | 'br' | 'bl',
) {
  expect(style[`--px-${pos}-cover`]).toBeUndefined();
  expect(style[`--px-${pos}-border`]).toBeUndefined();
  expect(style[`--px-${pos}-s`]).toBeUndefined();
}

describe('px(config) canonical object authoring', () => {
  it('returns the pixel corner className', () => {
    const result = px({
      corners: {
        tl: fixed('circle', 8),
      },
    });

    expect(result.className).toBe('pixel-corner');
  });

  it('normalizes omitted corners to flat corners', () => {
    const { style } = px({
      corners: {
        tl: fixed('circle', 8),
      },
    });

    expectCornerSet(style, 'tl');
    expectCornerEmpty(style, 'tr');
    expectCornerEmpty(style, 'br');
    expectCornerEmpty(style, 'bl');
  });

  it('supports uniform fixed-shape authoring through explicit corners', () => {
    const { style } = px({
      corners: {
        tl: fixed('circle', 8),
        tr: fixed('circle', 8),
        br: fixed('circle', 8),
        bl: fixed('circle', 8),
      },
    });

    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerSet(style, 'br');
    expectCornerSet(style, 'bl');
    expect(style['--px-tl-s']).toBe('calc(9px * var(--pixel-scale, 1))');
  });

  it('supports chrome-tab top corners with theme-bound bindings', () => {
    const { style } = px({
      corners: {
        tl: theme(6),
        tr: theme(6),
        br: 0,
        bl: 0,
      },
      edges: [1, 1, 0, 1],
      themeShape: 'chamfer',
    });

    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerEmpty(style, 'br');
    expectCornerEmpty(style, 'bl');
    expect(style['--px-eb']).toBe('0');
  });

  it('resolves theme-bound corners independently from fixed overrides', () => {
    const { style: themeChamfer } = px({
      corners: {
        tl: theme(6),
        tr: fixed('circle', 6),
      },
      themeShape: 'chamfer',
    });
    const { style: fixedChamfer } = px({
      corners: {
        tl: fixed('chamfer', 6),
      },
    });
    const { style: fixedCircle } = px({
      corners: {
        tr: fixed('circle', 6),
      },
    });

    expect(themeChamfer['--px-tl-cover']).toBe(fixedChamfer['--px-tl-cover']);
    expect(themeChamfer['--px-tr-cover']).toBe(fixedCircle['--px-tr-cover']);
    expect(themeChamfer['--px-tr-cover']).not.toBe(fixedChamfer['--px-tr-cover']);
  });

  it('sets edge and color variables from canonical config', () => {
    const { style } = px({
      corners: {
        tl: fixed('circle', 8),
      },
      edges: [0, 1, 1, 0],
      color: '#f00',
    });

    expect(style['--px-et']).toBe('0');
    expect(style['--px-er']).toBeUndefined();
    expect(style['--px-eb']).toBeUndefined();
    expect(style['--px-el']).toBe('0');
    expect(style['--color-line']).toBe('#f00');
  });

  it('returns a neutral style for flat corners with default edges', () => {
    expect(px({ corners: { tl: 0, tr: 0, br: 0, bl: 0 } }).style).toEqual({});
  });

  it('builds default corner maps with explicit per-corner overrides', () => {
    const { style } = px({
      corners: cornerMap(themedCorner(5), {
        tl: fixedCorner('chamfer', 5),
        br: flatCorner,
      }),
      themeShape: 'circle',
    });
    const fixedChamfer = px({ corners: { tl: fixedCorner('chamfer', 5) } }).style;
    const fixedCircle = px({ corners: { tr: fixedCorner('circle', 5) } }).style;

    expect(style['--px-tl-cover']).toBe(fixedChamfer['--px-tl-cover']);
    expect(style['--px-tr-cover']).toBe(fixedCircle['--px-tr-cover']);
    expectCornerEmpty(style, 'br');
    expect(style['--px-bl-cover']).toBeTruthy();
  });

  it('exposes a namespaced helper surface for mixed-shape authoring', () => {
    const { style } = px({
      corners: corner.map(corner.themed(5), {
        tl: corner.fixed('chamfer', 5),
        tr: corner.fixed('circle', 5),
        br: corner.flat,
      }),
      themeShape: 'scallop',
    });

    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerEmpty(style, 'br');
    expectCornerSet(style, 'bl');
    expect(style['--px-tl-cover']).not.toBe(style['--px-tr-cover']);
  });
});

describe('registered corner shapes', () => {
  it.each(listCornerShapeNames())('px() produces valid output for %s', (shape) => {
    const result = px({
      corners: {
        tl: fixed(shape, 8),
        tr: fixed(shape, 8),
        br: fixed(shape, 8),
        bl: fixed(shape, 8),
      },
    });

    expect(result.className).toBe('pixel-corner');
    expectCornerSet(result.style, 'tl');
    expectCornerSet(result.style, 'tr');
    expectCornerSet(result.style, 'br');
    expectCornerSet(result.style, 'bl');
  });
});

describe('legacy positional signatures', () => {
  it('rejects removed numeric shorthand', () => {
    expect(() => px(8 as unknown as PxConfig)).toThrow('px() expects a config object');
  });

  it('rejects removed named shorthand', () => {
    expect(() => px('chamfer' as unknown as PxConfig)).toThrow('px() expects a config object');
  });

  it('rejects removed per-corner positional shorthand', () => {
    expect(() => (px as unknown as (...args: unknown[]) => PxProps)(6, 6, 0, 0)).toThrow(
      'px() expects a config object',
    );
  });

  it('rejects removed mode/radius object shorthand', () => {
    expect(() => px({ mode: 'circle', radius: 8 } as unknown as PxConfig)).toThrow(
      'px() expects a config object with corners',
    );
  });
});
