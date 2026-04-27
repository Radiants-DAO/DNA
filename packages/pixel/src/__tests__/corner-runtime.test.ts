import { describe, expect, it } from 'vitest';

import { prepareCornerProfile, prepareCornerRecipe } from '../corners/prepare.js';
import {
  clampCornerRadii,
  fitCornerRadii,
  materializeCornerRecipe,
  materializeCornerStyle,
} from '../corners/runtime.js';
import { registerCornerDefinition } from '../corners/registry.js';
import { px } from '../px.js';

function expectCornerSet(style: Record<string, string>, corner: 'tl' | 'tr' | 'br' | 'bl') {
  expect(style[`--px-${corner}-cover`]).toMatch(/^url\("data:image\/svg\+xml,/);
  expect(style[`--px-${corner}-border`]).toMatch(/^url\("data:image\/svg\+xml,/);
  expect(style[`--px-${corner}-s`]).toMatch(/^calc\(\d+px \* var\(--pixel-scale, 1\)\)$/);
}

describe('materializeCornerStyle', () => {
  it('produces the same variable contract as canonical px config for a prepared circle profile', () => {
    const prepared = prepareCornerProfile('circle', 8);
    const runtimeStyle = materializeCornerStyle(prepared);
    const shorthandStyle = px({
      corners: {
        tl: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
        tr: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
        br: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
        bl: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
      },
    }).style;

    expect(runtimeStyle).toEqual(shorthandStyle);
  });

  it('can target a single corner when materializing a shared prepared profile', () => {
    const prepared = prepareCornerProfile('chamfer', 8);
    const style = materializeCornerStyle(prepared, { corner: 'tr' });

    expect(style['--px-tl-cover']).toBeUndefined();
    expect(style['--px-tr-cover']).toBe(prepared.cover.tr.maskImage);
    expect(style['--px-tr-border']).toBe(prepared.border.tr.maskImage);
    expect(style['--px-tr-s']).toBe('calc(9px * var(--pixel-scale, 1))');
  });
});

describe('materializeCornerRecipe', () => {
  it('resolves theme-bound corners at runtime while preserving asymmetric edge flags', () => {
    const prepared = prepareCornerRecipe({
      name: 'chrome-tab',
      corners: {
        tl: { radiusPx: 6, binding: { source: 'theme' } },
        tr: { radiusPx: 6, binding: { source: 'theme' } },
        br: 0,
        bl: 0,
      },
      edges: [1, 1, 0, 1],
    });

    const style = materializeCornerRecipe(prepared, { themeShape: 'scallop' });

    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expect(style['--px-br-cover']).toBeUndefined();
    expect(style['--px-bl-cover']).toBeUndefined();
    expect(style['--px-eb']).toBe('0');

    const scallopTop = px({
      corners: {
        tl: { radiusPx: 6, binding: { source: 'fixed', shape: 'scallop' } },
        tr: { radiusPx: 6, binding: { source: 'fixed', shape: 'scallop' } },
        br: 0,
        bl: 0,
      },
      edges: [1, 1, 0, 1],
    }).style;
    expect(style['--px-tl-cover']).toBe(scallopTop['--px-tl-cover']);
    expect(style['--px-tr-cover']).toBe(scallopTop['--px-tr-cover']);
  });

  it('picks up override registry changes across repeated theme-shape materialization', () => {
    const prepared = prepareCornerRecipe({
      name: 'theme-following-cache-check',
      corners: {
        tl: { radiusPx: 5, binding: { source: 'theme' } },
        tr: 0,
        br: 0,
        bl: 0,
      },
    });

    const baseline = materializeCornerRecipe(prepared, { themeShape: 'circle' });
    const dispose = registerCornerDefinition({
      kind: 'override',
      shape: 'circle',
      match(radiusPx) {
        if (radiusPx !== 5) {
          return null;
        }

        return {
          name: 'circle-runtime-override-5',
          tl: {
            name: 'circle-runtime-override-5-cover',
            width: 4,
            height: 4,
            bits: '1110110010000000',
          },
          border: {
            name: 'circle-runtime-override-5-border',
            width: 4,
            height: 4,
            bits: '0001001001001000',
          },
        };
      },
    });

    try {
      const withOverride = materializeCornerRecipe(prepared, { themeShape: 'circle' });

      expect(withOverride['--px-tl-cover']).not.toBe(baseline['--px-tl-cover']);
      expect(withOverride['--px-tl-border']).not.toBe(baseline['--px-tl-border']);
    } finally {
      dispose();
    }

    const afterDispose = materializeCornerRecipe(prepared, { themeShape: 'circle' });

    expect(afterDispose['--px-tl-cover']).toBe(baseline['--px-tl-cover']);
    expect(afterDispose['--px-tl-border']).toBe(baseline['--px-tl-border']);
  });
});

describe('px runtime integration', () => {
  it('keeps canonical object authoring working for the current variable-driven contract', () => {
    const { style } = px({
      corners: {
        tl: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
        tr: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
        br: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
        bl: { radiusPx: 8, binding: { source: 'fixed', shape: 'circle' } },
      },
    });

    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expectCornerSet(style, 'br');
    expectCornerSet(style, 'bl');
  });

  it('routes named shapes through prepared profiles instead of inline geometry', () => {
    const prepared = prepareCornerProfile('chamfer', 8);
    const runtimeStyle = px({
      corners: {
        tl: { radiusPx: 8, binding: { source: 'fixed', shape: 'chamfer' } },
        tr: { radiusPx: 8, binding: { source: 'fixed', shape: 'chamfer' } },
        br: { radiusPx: 8, binding: { source: 'fixed', shape: 'chamfer' } },
        bl: { radiusPx: 8, binding: { source: 'fixed', shape: 'chamfer' } },
      },
    }).style;

    expect(runtimeStyle['--px-tl-cover']).toBe(prepared.cover.tl.maskImage);
    expect(runtimeStyle['--px-tr-cover']).toBe(prepared.cover.tr.maskImage);
  });

  it('supports chrome-tab style top-only theme-bound rounding from canonical config', () => {
    const { style } = px({
      corners: {
        tl: { radiusPx: 6, binding: { source: 'theme' } },
        tr: { radiusPx: 6, binding: { source: 'theme' } },
        br: 0,
        bl: 0,
      },
      edges: [1, 1, 0, 1],
      themeShape: 'chamfer',
    });

    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expect(style['--px-br-cover']).toBeUndefined();
    expect(style['--px-bl-cover']).toBeUndefined();
    expect(style['--px-eb']).toBe('0');
  });

  it('supports canonical mixed per-corner bindings for fixed shapes', () => {
    const { style } = px({
      corners: {
        tl: { radiusPx: 6, binding: { source: 'fixed', shape: 'chamfer' } },
        tr: { radiusPx: 6, binding: { source: 'fixed', shape: 'scallop' } },
        br: 0,
        bl: 0,
      },
    });

    expectCornerSet(style, 'tl');
    expectCornerSet(style, 'tr');
    expect(style['--px-tl-cover']).not.toBe(style['--px-tr-cover']);
    expect(style['--px-br-cover']).toBeUndefined();
    expect(style['--px-bl-cover']).toBeUndefined();
  });

  it('supports canonical theme-bound bindings when a theme shape is provided', () => {
    const themeFollow = px({
      corners: {
        tl: { radiusPx: 6, binding: { source: 'theme' } },
        tr: { radiusPx: 6, binding: { source: 'theme' } },
        br: 0,
        bl: 0,
      },
      edges: [1, 1, 0, 1],
      themeShape: 'chamfer',
    }).style;

    const fixedChamfer = px({
      corners: {
        tl: { radiusPx: 6, binding: { source: 'fixed', shape: 'chamfer' } },
        tr: { radiusPx: 6, binding: { source: 'fixed', shape: 'chamfer' } },
        br: 0,
        bl: 0,
      },
      edges: [1, 1, 0, 1],
    }).style;
    expect(themeFollow['--px-tl-cover']).toBe(fixedChamfer['--px-tl-cover']);
    expect(themeFollow['--px-tr-cover']).toBe(fixedChamfer['--px-tr-cover']);
  });

  it('returns a neutral style for flat corners', () => {
    expect(px({ corners: { tl: 0, tr: 0, br: 0, bl: 0 } }).style).toEqual({});
  });
});

describe('corner fit helpers', () => {
  it('clamps requested radii to the host bounds', () => {
    expect(clampCornerRadii(18, 12, [10, 10, 10, 10])).toEqual([6, 6, 6, 6]);
  });

  it('keeps fitCornerRadii as an alias of clampCornerRadii', () => {
    expect(fitCornerRadii(18, 12, [10, 10, 10, 10])).toEqual([6, 6, 6, 6]);
  });
});
