import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
const shellCssPath = join(root, 'pixel-corners.css');
const generatedCssPath = join(root, 'pixel-corners.generated.css');
const generatorPath = join(root, 'scripts/generate-pixel-corners.ts');
const generatorLibPath = join(root, 'scripts/pixel-corners-lib.ts');
const generatorConfigPath = join(root, 'scripts/pixel-corners.config.ts');
const packageJsonPath = join(root, 'package.json');
const GENERATED_CSS_BYTE_BUDGET = 290_000;

const generatorLibUrl = pathToFileURL(generatorLibPath).href;
const generatorConfigUrl = pathToFileURL(generatorConfigPath).href;

function readBlock(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'm'));
  return match?.[1] ?? '';
}

function selectorsForStandardMaskImage(css: string) {
  const selectors: string[] = [];
  const declaration = '\n  mask-image:';
  let offset = 0;

  while (offset < css.length) {
    const declarationIndex = css.indexOf(declaration, offset);
    if (declarationIndex === -1) {
      break;
    }

    const blockOpen = css.lastIndexOf('{', declarationIndex);
    const previousBlockClose = css.lastIndexOf('}', blockOpen);
    selectors.push(css.slice(previousBlockClose + 1, blockOpen).trim());
    offset = declarationIndex + declaration.length;
  }

  return selectors;
}

describe('pixel corners file layout', () => {
  it('keeps a checked-in generated geometry file', () => {
    expect(existsSync(generatedCssPath)).toBe(true);
  });

  it('keeps manual utilities in the shell file', () => {
    const shellCss = readFileSync(shellCssPath, 'utf8');
    expect(shellCss).toContain("@import './pixel-corners.generated.css';");
    expect(shellCss).toContain('.pixel-shadow-surface');
    expect(shellCss).toContain('.pixel-border-danger::after');
    expect(shellCss).toContain('.pixel-concave-corner');
    expect(shellCss).toContain('mask-image: var(--px-concave-mask)');
    expect(shellCss).not.toContain('[class*="pixel-bleed-"]');
    expect(shellCss).not.toContain('pixel-bleed-');
    expect(shellCss).toContain(':focus-visible');
  });

  it('does not contain geometry or dead fixed-shape runtime selectors in the shell file', () => {
    const shellCss = readFileSync(shellCssPath, 'utf8');
    expect(shellCss).not.toContain('clip-path');
    expect(shellCss).not.toContain('position: relative');
    expect(shellCss).not.toContain('pixel-chamfer-');
    expect(shellCss).not.toContain('pixel-scallop-');
    expect(shellCss).not.toContain('.pixel-rounded-xs');
    expect(shellCss).not.toContain('.pixel-rounded-sm');
    expect(shellCss).not.toContain('.pixel-rounded-md');
    expect(shellCss).not.toContain('.pixel-rounded-lg');
    expect(shellCss).not.toContain('.pixel-rounded-xl');
  });
});

describe('generator contract', () => {
  it('is TypeScript and package script runs it through node strip-types', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    expect(existsSync(generatorPath)).toBe(true);
    expect(existsSync(generatorLibPath)).toBe(true);
    expect(existsSync(generatorConfigPath)).toBe(true);
    expect(existsSync(resolve(root, 'scripts/generate-pixel-corners.mjs'))).toBe(false);
    expect(existsSync(resolve(root, 'scripts/pixel-corners-lib.mjs'))).toBe(false);
    expect(existsSync(resolve(root, 'scripts/pixel-corners.config.mjs'))).toBe(false);
    expect(packageJson.scripts['generate:pixel-corners']).toBe(
      'node --experimental-strip-types scripts/generate-pixel-corners.ts',
    );
    expect(packageJson.scripts['generate:icons']).toBe(
      'node --experimental-strip-types scripts/generate-icons.ts',
    );
  });

  it('uses shared pixel corner preparation instead of rebuilding geometry', () => {
    const source = readFileSync(generatorLibPath, 'utf8');
    const configSource = readFileSync(generatorConfigPath, 'utf8');

    expect(source).toContain('prepareCornerProfile');
    expect(source).not.toContain('generateShape');
    expect(source).not.toContain('generateCorner');
    expect(source).not.toContain('bitsToPath');
    expect(source).not.toContain('bitsToMaskURI');
    expect(configSource).toContain('prepareCornerProfile');
    expect(configSource).not.toContain('generateShape');
    expect(configSource).not.toContain('generateCorner');
  });

  it('reproduces the checked-in generated CSS from the shared prep generator', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const expected = readFileSync(generatedCssPath, 'utf8');
    expect(renderPixelCornersGeneratedCss()).toBe(expected);
  });

  it('uses mask-image for rounded utilities and does not emit clip-path utilities', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('mask-image');
    expect(css).toContain('-webkit-mask-image');
    expect(css).not.toContain('clip-path');
    expect(css).not.toContain('pixel-bleed-');

    const roundedBlocks = css.match(/\.pixel-rounded-[^{]+\{[^}]*\}/g) ?? [];
    expect(roundedBlocks.length).toBeGreaterThan(0);
    for (const block of roundedBlocks) {
      expect(block).not.toContain('clip-path');
    }
  });

  it('does not emit pixel bleed utilities from the corner package', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    expect(css).not.toContain('pixel-bleed-');
  });

  it('emits only numeric size utilities and pixel-rounded-full', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('.pixel-rounded-4');
    expect(css).toContain('.pixel-rounded-8');
    expect(css).toContain('.pixel-rounded-12');
    expect(css).toContain('.pixel-rounded-20');
    expect(css).toContain('.pixel-rounded-full');
    expect(css).not.toContain('.pixel-rounded-xs');
    expect(css).not.toContain('.pixel-rounded-sm');
    expect(css).not.toContain('.pixel-rounded-md');
    expect(css).not.toContain('.pixel-rounded-lg');
    expect(css).not.toContain('.pixel-rounded-xl');
    expect(css).not.toContain('DEPRECATED');
  });

  it('keeps .pixel-corner as the single structural host mask rule', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    const hostMaskSelectors = selectorsForStandardMaskImage(css).filter(
      (selector) => !selector.includes('::after'),
    );

    expect(hostMaskSelectors).toHaveLength(1);
    expect(hostMaskSelectors[0]).toContain('.pixel-corner');
    expect(hostMaskSelectors[0]).toContain('.pixel-rounded-4');
    expect(hostMaskSelectors[0]).toContain('.pixel-rounded-full');
  });

  it('keeps structural position selectors at one-class specificity', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('.pixel-rounded-8:where(:not(.absolute, .fixed, .sticky))');
    expect(css).not.toContain('.pixel-rounded-8:not(.absolute, .fixed, .sticky)');
  });

  it('preset utilities assign variables without duplicating mask blocks', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    const rounded8Block = readBlock(css, '.pixel-rounded-8');
    expect(rounded8Block).toContain('--px-tl-cover: var(--pc-8-cover-tl);');
    expect(rounded8Block).toContain('--px-br-border: var(--pc-8-border-br);');
    expect(rounded8Block).toContain('--px-tl-s: 8px;');
    expect(rounded8Block).not.toContain('mask-image');
    expect(css).not.toMatch(/\.pixel-rounded-8::after\s*\{/);
  });

  it('emits ::after border ring rules through the shared structural selector', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    const afterMaskSelectors = selectorsForStandardMaskImage(css).filter((selector) =>
      selector.includes('::after'),
    );

    expect(afterMaskSelectors).toHaveLength(1);
    expect(afterMaskSelectors[0]).toContain('.pixel-corner::after');
    expect(afterMaskSelectors[0]).toContain('.pixel-rounded-4::after');
    expect(afterMaskSelectors[0]).toContain('.pixel-rounded-full::after');
    expect(css).toContain('var(--color-line)');
  });

  it('emits :root custom properties for mask URIs', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain(':root');
    expect(css).toContain('--pc-');
    expect(css).toContain('-cover-tl');
    expect(css).toContain('-border-tl');
    expect(css).toContain(':root[data-corner-shape="chamfer"]');
    expect(css).toContain(':root[data-corner-shape="scallop"]');
  });

  it('resets variable-driven px props to neutral defaults to avoid inherited masks', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    const css = renderPixelCornersGeneratedCss();
    expect(css).toContain('--px-tl-cover: none;');
    expect(css).toContain('--px-tr-cover: none;');
    expect(css).toContain('--px-bl-cover: none;');
    expect(css).toContain('--px-br-cover: none;');
    expect(css).toContain('--px-tl-border: none;');
    expect(css).toContain('--px-tr-border: none;');
    expect(css).toContain('--px-bl-border: none;');
    expect(css).toContain('--px-br-border: none;');
    expect(css).toContain('--px-tl-s: 0px;');
    expect(css).toContain('--px-tr-s: 0px;');
    expect(css).toContain('--px-bl-s: 0px;');
    expect(css).toContain('--px-br-s: 0px;');
    expect(css).toContain('--px-et: 1;');
    expect(css).toContain('--px-er: 1;');
    expect(css).toContain('--px-eb: 1;');
    expect(css).toContain('--px-el: 1;');
  });

  it('stays below the committed generated CSS byte budget', async () => {
    const { renderPixelCornersGeneratedCss } = await import(generatorLibUrl);

    expect(Buffer.byteLength(renderPixelCornersGeneratedCss(), 'utf8')).toBeLessThanOrEqual(
      GENERATED_CSS_BYTE_BUDGET,
    );
  });
});

describe('config exports', () => {
  it('exports numeric and full presets with radius-based shared prep data', async () => {
    const config = await import(generatorConfigUrl);
    const { FULL_SIZE, NUMERIC_SIZES, generateSizeData } = config;

    expect(NUMERIC_SIZES.length).toBeGreaterThanOrEqual(10);
    expect(NUMERIC_SIZES[0]).toHaveProperty('suffix');
    expect(NUMERIC_SIZES[0]).toHaveProperty('gridSize');
    expect(NUMERIC_SIZES[0]).toHaveProperty('radiusPx');
    expect(config).not.toHaveProperty('BLEED_SIZES');
    expect(FULL_SIZE.suffix).toBe('full');
    expect(FULL_SIZE.gridSize).toBe(20);

    const data = generateSizeData(8);
    expect(data.gridSize).toBe(8);
    expect(data.radiusPx).toBe(7);
    expect(data.profile).toHaveProperty('cover');
    expect(data.profile).toHaveProperty('border');
    expect(data.profile.cover.tl).toHaveProperty('maskImage');
  });

  it('does not export legacy aliases for backward compatibility', async () => {
    const config = await import(generatorConfigUrl);
    expect(config).not.toHaveProperty('LEGACY_ALIASES');
  });
});
