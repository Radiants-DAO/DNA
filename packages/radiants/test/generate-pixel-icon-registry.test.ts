import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  pixelIconRegistry as canonicalPixelIconRegistry,
  preparePixelIcon,
} from '@rdna/pixel/icons';
import { pixelIconSource } from '../pixel-icons/source';
import { renderPixelIconRegistry } from '../scripts/generate-pixel-icon-registry';

const root = resolve(process.cwd());
const workspaceRoot = resolve(root, '..', '..');
const registryPath = resolve(root, 'pixel-icons/registry.ts');
const iconGeneratorPath = resolve(root, 'scripts/generate-pixel-icon-registry.ts');
const pixelSourcePath = resolve(workspaceRoot, 'packages/pixel/src');

describe('pixel icon source', () => {
  it('bridges the canonical pixel registry from @rdna/pixel', () => {
    expect(pixelIconSource).toBe(canonicalPixelIconRegistry);
  });

  it('stores icon bitstrings as the source of truth', () => {
    expect(pixelIconSource.length).toBeGreaterThan(0);
    expect(pixelIconSource.every((entry) => entry.bits.length === entry.width * entry.height)).toBe(true);
  });
});

describe('generate-pixel-icon-registry', () => {
  it('reproduces the checked-in registry from the source bitstrings', () => {
    const expected = readFileSync(registryPath, 'utf8');
    expect(renderPixelIconRegistry()).toBe(expected);
  });

  it('runs on a clean checkout shape without packages/pixel/dist', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'rdna-pixel-icon-generator-'));
    const tempScriptPath = join(
      tempRoot,
      'packages/radiants/scripts/generate-pixel-icon-registry.ts',
    );
    const tempPixelSourcePath = join(tempRoot, 'packages/pixel/src');
    const tempPixelIconsDir = join(tempRoot, 'packages/radiants/pixel-icons');

    cpSync(iconGeneratorPath, tempScriptPath);
    cpSync(pixelSourcePath, tempPixelSourcePath, { recursive: true });
    mkdirSync(tempPixelIconsDir, { recursive: true });

    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        'const { writePixelIconRegistry } = await import(process.argv[1]); writePixelIconRegistry();',
        pathToFileURL(tempScriptPath).href,
      ],
      {
        cwd: join(tempRoot, 'packages/radiants'),
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('ERR_MODULE_NOT_FOUND');
    expect(readFileSync(join(tempPixelIconsDir, 'registry.ts'), 'utf8')).toBe(
      renderPixelIconRegistry(),
    );
  });

  it('includes precomputed prepared icon data for each icon entry', () => {
    const code = renderPixelIconRegistry();
    const preparedCaret = preparePixelIcon('caret');

    expect(preparedCaret).toBeDefined();
    expect(code).toContain(`path: ${JSON.stringify(preparedCaret?.path)}`);
    expect(code).toContain('maskImage:');
    expect(code).toContain('data:image/svg+xml');
    expect(code).toContain('name: "caret"');
  });
});
