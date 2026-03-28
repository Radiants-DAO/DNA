import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageJsonPath = fileURLToPath(
  new URL('../../package.json', import.meta.url)
);

describe('@rdna/create package contract', () => {
  it('publishes JavaScript entrypoints and template assets with a build step', () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    expect(pkg.private).not.toBe(true);
    expect(pkg.bin['rdna-create']).toBe('./dist/cli.js');
    expect(pkg.exports['.']).toBe('./dist/index.js');
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('templates');
    expect(pkg.scripts.build).toBe('node scripts/sync-templates.mjs && tsc -p tsconfig.json');
    expect(pkg.scripts.prepack).toBe('pnpm run build');
  });
});
