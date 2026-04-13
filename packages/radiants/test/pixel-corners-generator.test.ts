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
  it('reproduces the checked-in generated CSS from the mask-image generator', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const expected = readFileSync(generatedCssPath, 'utf8');
    expect(renderPixelCornersGeneratedCss()).toBe(expected);
  });

  it('generated CSS uses mask-image (not clip-path polygon)', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('mask-image');
    expect(css).toContain('-webkit-mask-image');
    expect(css).not.toContain('clip-path');
  });

  it('emits numeric size classes', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('.pixel-rounded-4');
    expect(css).toContain('.pixel-rounded-8');
    expect(css).toContain('.pixel-rounded-12');
    expect(css).toContain('.pixel-rounded-20');
  });

  it('emits pixel-rounded-full class', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('.pixel-rounded-full');
  });

  it('emits deprecated legacy t-shirt aliases', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('.pixel-rounded-sm');
    expect(css).toContain('.pixel-rounded-md');
    expect(css).toContain('.pixel-rounded-xl');
    expect(css).toContain('DEPRECATED');
  });

  it('emits ::after border ring rules', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('::after');
    expect(css).toContain('var(--color-line)');
  });

  it('emits :root custom properties for mask URIs', async () => {
    const { renderPixelCornersGeneratedCss } = await import('../scripts/pixel-corners-lib.mjs');

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain(':root');
    expect(css).toContain('--pc-');
    expect(css).toContain('-cover-tl');
    expect(css).toContain('-border-tl');
  });
});

describe('config exports', () => {
  it('exports NUMERIC_SIZES with expected entries', async () => {
    const { NUMERIC_SIZES } = await import('../scripts/pixel-corners.config.mjs');
    expect(NUMERIC_SIZES.length).toBeGreaterThanOrEqual(10);
    expect(NUMERIC_SIZES[0]).toHaveProperty('suffix');
    expect(NUMERIC_SIZES[0]).toHaveProperty('gridSize');
  });

  it('exports FULL_SIZE targeting gridSize 20', async () => {
    const { FULL_SIZE } = await import('../scripts/pixel-corners.config.mjs');
    expect(FULL_SIZE.suffix).toBe('full');
    expect(FULL_SIZE.gridSize).toBe(20);
  });

  it('exports LEGACY_ALIASES for backward compat', async () => {
    const { LEGACY_ALIASES } = await import('../scripts/pixel-corners.config.mjs');
    const suffixes = LEGACY_ALIASES.map((a: { suffix: string }) => a.suffix);
    expect(suffixes).toContain('xs');
    expect(suffixes).toContain('sm');
    expect(suffixes).toContain('md');
    expect(suffixes).toContain('lg');
    expect(suffixes).toContain('xl');
  });

  it('generateSizeData returns a corner set with cover and border grids', async () => {
    const { generateSizeData } = await import('../scripts/pixel-corners.config.mjs');
    const data = generateSizeData(8);
    expect(data.gridSize).toBe(8);
    expect(data.radius).toBe(7);
    expect(data.cornerSet).toHaveProperty('tl');
    expect(data.cornerSet).toHaveProperty('border');
    expect(data.cornerSet.tl).toHaveProperty('bits');
  });
});
