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
  it('reproduces the checked-in generated CSS from config', async () => {
    const { PIXEL_CORNER_CONFIG } = await import('../scripts/pixel-corners.config.mjs');
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');
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
});
