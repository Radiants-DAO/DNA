import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
const shellCssPath = join(root, 'pixel-corners.css');
const generatedCssPath = join(root, 'pixel-corners.generated.css');

describe('pixel corners file layout', () => {
  it('keeps a checked-in generated geometry file', () => {
    expect(existsSync(generatedCssPath)).toBe(true);
  });

  it('keeps manual utilities in the shell file', () => {
    const shellCss = readFileSync(shellCssPath, 'utf8');
    expect(shellCss).toContain("@import './pixel-corners.generated.css';");
    expect(shellCss).toContain('.pixel-shadow-surface');
    expect(shellCss).toContain('.pixel-border-danger::after');
    expect(shellCss).toContain(':focus-visible');
  });

  it('does not contain geometry in the shell file', () => {
    const shellCss = readFileSync(shellCssPath, 'utf8');
    expect(shellCss).not.toContain('clip-path');
    expect(shellCss).not.toContain('position: relative');
  });
});

describe('generator contract', () => {
  // This test is a placeholder until Task 5 populates the real config.
  // Once the config has all variants, it will verify the generator output
  // matches the checked-in file exactly.
  it('reproduces the checked-in generated CSS from config', async () => {
    const { PIXEL_CORNER_CONFIG } = await import('../scripts/pixel-corners.config.mjs');
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    // Skip if config is still the empty stub — this test becomes meaningful in Task 5
    if (!PIXEL_CORNER_CONFIG.variants?.length) return;

    const expected = readFileSync(generatedCssPath, 'utf8');
    expect(renderPixelCornersGeneratedCss(PIXEL_CORNER_CONFIG)).toBe(expected);
  });

  it('supports a single rounded corner without handwritten polygons', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss({
      profiles: {
        sm: {
          radius: 4,
          borderRadius: '6px',
          points: [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]],
          innerPoints: [[1,5], [2,5], [2,3], [3,3], [3,2], [5,2], [5,1]],
        },
      },
      variants: [
        {
          name: 'tl-sm',
          selectors: ['.pixel-rounded-tl-sm'],
          corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'square' },
          edges: { top: true, right: true, bottom: true, left: true },
        },
      ],
    });

    expect(css).toContain('.pixel-rounded-tl-sm');
    expect(css).toContain('clip-path');
  });

  it('rejects unsupported auto-sized profiles in v1', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    expect(() =>
      renderPixelCornersGeneratedCss({
        profiles: {},
        variants: [
          {
            name: 'auto-pill',
            mode: 'auto',
            selectors: ['.pixel-rounded-auto-pill'],
            corners: { tl: 'square', tr: 'square', br: 'square', bl: 'square' },
          },
        ],
      }),
    ).toThrow(/auto-sized pixel corners are not supported in v1/i);
  });

  it('scales point coordinates by profile.scale', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss({
      profiles: {
        xs2x: {
          radius: 2,
          borderRadius: '4px',
          points: [[0,2], [1,2], [1,1], [2,1], [2,0]],
          innerPoints: [[1,2], [2,2], [2,1]],
          scale: 2,
        },
      },
      variants: [
        {
          name: 'xs2x',
          selectors: ['.pixel-rounded-xs2x'],
          corners: { tl: 'xs2x', tr: 'xs2x', br: 'xs2x', bl: 'xs2x' },
        },
      ],
    });

    // With scale=2, point [0,2] becomes [0,4], [1,2] becomes [2,4], etc.
    // TL outer starts at 0px 4px (not 0px 2px)
    expect(css).toContain('0px 4px');
    expect(css).not.toContain('0px 2px');
    // Inner point [1,2] scaled to [2,4]
    expect(css).toContain('2px 4px');
  });
});

describe('corner mirroring', () => {
  it('mirrors TL points to TR using calc(100% - x)', async () => {
    const { mirrorTR } = await import('../scripts/pixel-corners-lib.mjs');
    const tl = [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]];
    const tr = mirrorTR(tl);

    // TR corner: x is flipped, y stays, points trace top-right to bottom-right
    expect(tr[0]).toEqual(['calc(100% - 5px)', '0px']);
    expect(tr[tr.length - 1]).toEqual(['100%', '5px']);
  });

  it('mirrors TL points to BR using calc(100% - x) and calc(100% - y)', async () => {
    const { mirrorBR } = await import('../scripts/pixel-corners-lib.mjs');
    const tl = [[0,2], [1,2], [1,1], [2,1], [2,0]];
    const br = mirrorBR(tl);

    expect(br[0]).toEqual(['100%', 'calc(100% - 2px)']);
    expect(br[br.length - 1]).toEqual(['calc(100% - 2px)', '100%']);
  });

  it('mirrors TL points to BL using calc(100% - y)', async () => {
    const { mirrorBL } = await import('../scripts/pixel-corners-lib.mjs');
    const tl = [[0,2], [1,2], [1,1], [2,1], [2,0]];
    const bl = mirrorBL(tl);

    expect(bl[0]).toEqual(['2px', '100%']);
    expect(bl[bl.length - 1]).toEqual(['0px', 'calc(100% - 2px)']);
  });
});

describe('variant composition', () => {
  it('supports mixed corner profiles', async () => {
    const { composeVariantGeometry } = await import('../scripts/pixel-corners-lib.mjs');

    const profiles = {
      sm: {
        radius: 4,
        borderRadius: '6px',
        points: [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]],
        innerPoints: [[1,5], [2,5], [2,3], [3,3], [3,2], [5,2], [5,1]],
      },
    };

    const geometry = composeVariantGeometry(
      {
        name: 'l-sm',
        selectors: ['.pixel-rounded-l-sm'],
        corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'sm' },
        edges: { top: true, right: false, bottom: true, left: true },
      },
      profiles,
    );

    expect(geometry.outer).toBeTruthy();
    expect(geometry.ring).toBeTruthy();
    // Square corners should produce straight edges (no calc() needed for the corner point itself)
    expect(geometry.outer).toContain('100% 0px');
  });

  it('inner polygon is inset 1px from outer', async () => {
    const { composeVariantGeometry } = await import('../scripts/pixel-corners-lib.mjs');

    const profiles = {
      xs: {
        radius: 2,
        borderRadius: '2px',
        points: [[0,2], [1,2], [1,1], [2,1], [2,0]],
        innerPoints: [[1,2], [2,2], [2,1]],
      },
    };

    const geometry = composeVariantGeometry(
      {
        name: 'xs',
        selectors: ['.pixel-rounded-xs'],
        wrapperSelector: '.pixel-rounded-xs--wrapper',
        corners: { tl: 'xs', tr: 'xs', br: 'xs', bl: 'xs' },
      },
      profiles,
    );

    // XS outer TL starts at 0px 2px; inner TL should use innerPoints: [[1,2],[2,2],[2,1]]
    // formatTL produces: 1px 2px, 2px 2px, 2px 1px
    expect(geometry.inner).toContain('1px 2px');
    expect(geometry.inner).toContain('2px 1px');
    // Inner should have fewer points than outer (3 vs 5 per corner)
    expect(geometry.inner).not.toContain('0px 2px');
  });

  it('rejects auto mode', async () => {
    const { composeVariantGeometry } = await import('../scripts/pixel-corners-lib.mjs');

    expect(() =>
      composeVariantGeometry(
        { name: 'auto', mode: 'auto', selectors: [], corners: { tl: 'square', tr: 'square', br: 'square', bl: 'square' } },
        {},
      ),
    ).toThrow(/auto-sized pixel corners are not supported in v1/i);
  });

  it('edge-masked ring uses outer coordinates on masked right edge', async () => {
    const { composeVariantGeometry } = await import('../scripts/pixel-corners-lib.mjs');

    const profiles = {
      sm: {
        radius: 4,
        borderRadius: '6px',
        points: [[0,5], [1,5], [1,3], [2,3], [2,2], [3,2], [3,1], [5,1], [5,0]],
        innerPoints: [[1,5], [2,5], [2,3], [3,3], [3,2], [5,2], [5,1]],
      },
    };

    const geometry = composeVariantGeometry(
      {
        name: 'l-sm',
        selectors: ['.pixel-rounded-l-sm'],
        corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'sm' },
        edges: { top: true, right: false, bottom: true, left: true },
      },
      profiles,
    );

    // When right edge is masked, the ring's inner path should use outer
    // x-coordinate (100%) instead of inset (calc(100% - 1px)) on the right edge.
    // This creates zero gap between outer and inner = no visible border.
    expect(geometry.ring).toContain('100% 1px, 100% calc(100% - 1px)');

    // The standard ring would use calc(100% - 1px) as the x-coordinate
    // for inset TR/BR corners. With right masked, these should not appear.
    expect(geometry.ring).not.toContain('calc(100% - 1px) 1px');
  });
});
