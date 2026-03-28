import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const cliPath = fileURLToPath(new URL('../cli.ts', import.meta.url));

describe('rdna-create CLI', () => {
  it('accepts multi-word app names and writes a normalized folder by default', () => {
    const root = mkdtempSync(join(tmpdir(), 'rdna-create-cli-'));

    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', cliPath, 'control', 'surface'],
      {
        cwd: root,
        encoding: 'utf8'
      }
    );

    expect(result.status).toBe(0);
    expect(existsSync(resolve(root, 'control-surface', 'package.json'))).toBe(true);

    const pkg = JSON.parse(
      readFileSync(resolve(root, 'control-surface', 'package.json'), 'utf8')
    );

    expect(pkg.name).toBe('control-surface');
  });
});
