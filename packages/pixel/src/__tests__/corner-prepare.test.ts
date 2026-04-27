import { describe, expect, it } from 'vitest';

import { prepareCornerProfile, prepareCornerRecipe } from '../corners/prepare.js';
import { registerCornerDefinition, listCornerShapeNames } from '../corners/registry.js';

function mirrorHoriz(bits: string, size: number): string {
  const rows: string[] = [];

  for (let row = 0; row < size; row++) {
    const start = row * size;
    rows.push(bits.slice(start, start + size).split('').reverse().join(''));
  }

  return rows.join('');
}

function mirrorVert(bits: string, size: number): string {
  const rows: string[] = [];

  for (let row = 0; row < size; row++) {
    const start = row * size;
    rows.push(bits.slice(start, start + size));
  }

  return rows.reverse().join('');
}

describe('prepareCornerProfile', () => {
  it('returns stable circle mask data for radius 8 across all mirrored corners', () => {
    const prepared = prepareCornerProfile('circle', 8);
    const expectedCoverTl =
      '111111000111100000111000000110000000100000000100000000000000000000000000000000000';
    const expectedBorderTl =
      '000000111000011000000100000001000000010000000010000000100000000100000000100000000';

    expect(prepared.key).toBe('circle:8');
    expect(prepared.shape).toBe('circle');
    expect(prepared.radiusPx).toBe(8);
    expect(prepared.gridSize).toBe(9);

    expect(prepared.cover.tl.bits).toBe(expectedCoverTl);
    expect(prepared.cover.tl.path).toBe(
      'M0,0h6v1h-6ZM0,1h4v1h-4ZM0,2h3v1h-3ZM0,3h2v1h-2ZM0,4h1v2h-1Z',
    );
    expect(prepared.cover.tl.maskImage).toBe(
      'url("data:image/svg+xml,%3Csvg%20xmlns%3D\'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg\'%20shape-rendering%3D\'crispEdges\'%20width%3D\'9\'%20height%3D\'9\'%3E%3Cpath%20fill%3D\'white\'%20d%3D\'M0%2C0h6v1h-6ZM0%2C1h4v1h-4ZM0%2C2h3v1h-3ZM0%2C3h2v1h-2ZM0%2C4h1v2h-1Z\'%2F%3E%3C%2Fsvg%3E")',
    );

    expect(prepared.border.tl.bits).toBe(expectedBorderTl);
    expect(prepared.border.tl.path).toBe(
      'M6,0h3v1h-3ZM4,1h2v1h-2ZM3,2h1v1h-1ZM2,3h1v1h-1ZM1,4h1v2h-1ZM0,6h1v3h-1Z',
    );
    expect(prepared.border.tl.maskImage).toBe(
      'url("data:image/svg+xml,%3Csvg%20xmlns%3D\'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg\'%20shape-rendering%3D\'crispEdges\'%20width%3D\'9\'%20height%3D\'9\'%3E%3Cpath%20fill%3D\'white\'%20d%3D\'M6%2C0h3v1h-3ZM4%2C1h2v1h-2ZM3%2C2h1v1h-1ZM2%2C3h1v1h-1ZM1%2C4h1v2h-1ZM0%2C6h1v3h-1Z\'%2F%3E%3C%2Fsvg%3E")',
    );

    expect(prepared.cover.tr.bits).toBe(mirrorHoriz(expectedCoverTl, 9));
    expect(prepared.cover.bl.bits).toBe(mirrorVert(expectedCoverTl, 9));
    expect(prepared.cover.br.bits).toBe(mirrorHoriz(mirrorVert(expectedCoverTl, 9), 9));

    expect(prepared.border.tr.bits).toBe(mirrorHoriz(expectedBorderTl, 9));
    expect(prepared.border.bl.bits).toBe(mirrorVert(expectedBorderTl, 9));
    expect(prepared.border.br.bits).toBe(mirrorHoriz(mirrorVert(expectedBorderTl, 9), 9));
  });

  it('produces distinct prepared paths for built-in non-circle shapes', () => {
    const circle = prepareCornerProfile('circle', 8);
    const chamfer = prepareCornerProfile('chamfer', 8);
    const scallop = prepareCornerProfile('scallop', 8);

    expect(chamfer.cover.tl.path).not.toBe(circle.cover.tl.path);
    expect(chamfer.border.tl.path).not.toBe(circle.border.tl.path);
    expect(scallop.cover.tl.path).not.toBe(circle.cover.tl.path);
    expect(scallop.border.tl.path).not.toBe(circle.border.tl.path);
    expect(chamfer.cover.tl.path).not.toBe(scallop.cover.tl.path);
  });

  it('reuses the same prepared object reference for identical shape and radius', () => {
    const first = prepareCornerProfile('circle', 8);
    const second = prepareCornerProfile('circle', 8);

    expect(second).toBe(first);
  });

  it('bypasses the profile cache for radii above the runtime cache bound', () => {
    const first = prepareCornerProfile('circle', 33);
    const second = prepareCornerProfile('circle', 33);

    expect(second).not.toBe(first);
    expect(second.cover.tl.bits).toBe(first.cover.tl.bits);
    expect(second.border.tl.bits).toBe(first.border.tl.bits);
  });

  it('supports built-in shapes and hand-authored overrides through the shared registry', () => {
    expect(listCornerShapeNames()).toEqual(
      expect.arrayContaining(['circle', 'chamfer', 'scallop']),
    );

    const dispose = registerCornerDefinition({
      kind: 'override',
      shape: 'circle',
      match(radiusPx) {
        if (radiusPx !== 3) return null;

        return {
          name: 'circle-override-3',
          tl: {
            name: 'circle-override-3-cover',
            width: 4,
            height: 4,
            bits: '1000010000100000',
          },
          border: {
            name: 'circle-override-3-border',
            width: 4,
            height: 4,
            bits: '0110001100010001',
          },
        };
      },
    });

    try {
      const prepared = prepareCornerProfile('circle', 3);

      expect(prepared.cover.tl.bits).toBe('1000010000100000');
      expect(prepared.border.tl.bits).toBe('0110001100010001');
      expect(prepared.key).toBe('circle:3');
    } finally {
      dispose();
    }
  });

  it('rebuilds cached profiles when matching overrides are registered and later removed', () => {
    const baseline = prepareCornerProfile('circle', 5);
    const dispose = registerCornerDefinition({
      kind: 'override',
      shape: 'circle',
      match(radiusPx) {
        if (radiusPx !== 5) return null;

        return {
          name: 'circle-override-5',
          tl: {
            name: 'circle-override-5-cover',
            width: 4,
            height: 4,
            bits: '1110110010000000',
          },
          border: {
            name: 'circle-override-5-border',
            width: 4,
            height: 4,
            bits: '0001001001001000',
          },
        };
      },
    });

    try {
      const withOverride = prepareCornerProfile('circle', 5);

      expect(withOverride).not.toBe(baseline);
      expect(withOverride.source).toBe('override');
      expect(withOverride.cover.tl.bits).toBe('1110110010000000');
      expect(withOverride.border.tl.bits).toBe('0001001001001000');
    } finally {
      dispose();
    }

    const afterDispose = prepareCornerProfile('circle', 5);

    expect(afterDispose).not.toBe(baseline);
    expect(afterDispose.source).toBe('math');
    expect(afterDispose.cover.tl.bits).toBe(baseline.cover.tl.bits);
    expect(afterDispose.border.tl.bits).toBe(baseline.border.tl.bits);
  });
});

describe('prepareCornerRecipe', () => {
  it('normalizes omitted corners to flat corners and default edges', () => {
    const recipe = prepareCornerRecipe({
      name: 'top-left-only',
      corners: {
        tl: { radiusPx: 6, binding: { source: 'fixed', shape: 'circle' } },
      },
    });

    expect(recipe.name).toBe('top-left-only');
    expect(recipe.edges).toEqual([1, 1, 1, 1]);
    expect(recipe.corners.tl.kind).toBe('fixed');
    expect(recipe.corners.tr).toEqual({ kind: 'flat' });
    expect(recipe.corners.br).toEqual({ kind: 'flat' });
    expect(recipe.corners.bl).toEqual({ kind: 'flat' });
  });

  it('keeps theme-bound corners symbolic while preparing fixed corners eagerly', () => {
    const recipe = prepareCornerRecipe({
      name: 'chrome-tab',
      corners: {
        tl: { radiusPx: 6, binding: { source: 'theme' } },
        tr: { radiusPx: 6, binding: { source: 'fixed', shape: 'chamfer' } },
        br: 0,
        bl: 0,
      },
      edges: [1, 1, 0, 1],
    });

    expect(recipe.name).toBe('chrome-tab');
    expect(recipe.edges).toEqual([1, 1, 0, 1]);
    expect(recipe.corners.tl).toEqual({
      kind: 'theme',
      radiusPx: 6,
      binding: { source: 'theme' },
    });
    expect(recipe.corners.tr.kind).toBe('fixed');
    expect(recipe.corners.tr.binding).toEqual({ source: 'fixed', shape: 'chamfer' });
    expect(recipe.corners.tr.profile.shape).toBe('chamfer');
    expect(recipe.corners.tr.profile.radiusPx).toBe(6);
    expect(recipe.corners.br).toEqual({ kind: 'flat' });
    expect(recipe.corners.bl).toEqual({ kind: 'flat' });
  });
});
