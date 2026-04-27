import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

import { preparePattern, preparePatterns } from '@rdna/pixel/patterns';

import { getPatternByName, patternRegistry } from '../patterns';
import { renderPatternCss } from '../scripts/generate-pattern-css';

const root = resolve(process.cwd());
const workspaceRoot = resolve(root, '..', '..');
const patternsCssPath = resolve(root, 'patterns.css');
const patternGeneratorPath = resolve(root, 'scripts/generate-pattern-css.ts');
const pixelSourcePath = resolve(workspaceRoot, 'packages/pixel/src');

describe('pattern registry', () => {
  it('reuses the prepared pixel registry instead of owning a second copy', () => {
    expect(patternRegistry).toBe(preparePatterns());
  });

  it('resolves canonical pixel patterns without reviving removed legacy aliases', () => {
    expect(getPatternByName('checkerboard')).toBe(preparePattern('checkerboard'));
    expect(getPatternByName('checker-32')).toBeUndefined();
  });
});

describe('generate-pattern-css', () => {
  it('uses the pixel prepare contract instead of reimplementing pattern preparation', () => {
    const source = readFileSync(patternGeneratorPath, 'utf8');

    expect(source).toContain('preparePatterns');
    expect(source).not.toContain('bitsToPath');
    expect(source).not.toContain('bitsToMaskURI');
    expect(source).not.toContain('countFilledBits');
    expect(source).not.toContain('roundPatternFill');
    expect(source).not.toContain('PATTERN_REGISTRY.map');
  });

  it('reproduces the checked-in patterns.css from registry bitstrings', () => {
    const expected = readFileSync(patternsCssPath, 'utf8');
    expect(renderPatternCss()).toBe(expected);
  });

  it('runs on a clean checkout shape without packages/pixel/dist', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'rdna-pattern-generator-'));
    const tempScriptPath = join(
      tempRoot,
      'packages/radiants/scripts/generate-pattern-css.ts',
    );
    const tempPixelSourcePath = join(tempRoot, 'packages/pixel/src');

    cpSync(patternGeneratorPath, tempScriptPath);
    cpSync(pixelSourcePath, tempPixelSourcePath, { recursive: true });

    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        'const { writePatternCss } = await import(process.argv[1]); writePatternCss();',
        pathToFileURL(tempScriptPath).href,
      ],
      {
        cwd: join(tempRoot, 'packages/radiants'),
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('ERR_MODULE_NOT_FOUND');
    expect(readFileSync(join(tempRoot, 'packages/radiants/patterns.css'), 'utf8')).toBe(
      renderPatternCss(),
    );
  });

  it('keeps the public token and utility surface intact', () => {
    const css = renderPatternCss();
    const checkerboard = preparePattern('checkerboard');

    expect(checkerboard).toBeDefined();
    expect(css).toContain(`${checkerboard!.token}: ${checkerboard!.maskImage};`);
    expect(css).toContain('--pat-checkerboard:');
    expect(css).toContain('--pat-fill-97:');
    expect(css).toContain('.rdna-pat');
    expect(css).toContain('.rdna-pat--checkerboard');
    expect(css).toContain('.rdna-pat--2x');
    expect(css).toContain('--pat-mask-size');
    expect(css).toContain('var(--pixel-scale, 1)');
    expect(css).toContain('background: var(--pat-fill, var(--pat-color, var(--color-main)))');
    expect(css).toContain('mask-image');
    expect(css).toContain('mask-repeat');
    expect(css).toContain('.rdna-pat > *');
    expect(css).toContain('z-index: 1;');
  });
});
