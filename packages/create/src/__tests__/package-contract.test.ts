import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageJsonPath = fileURLToPath(
  new URL('../../package.json', import.meta.url)
);

describe('@rdna/create package contract', () => {
  it('publishes JavaScript entrypoints with a build step', () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    expect(pkg.bin['rdna-create']).toBe('./dist/cli.js');
    expect(pkg.exports['.']).toBe('./dist/index.js');
    expect(pkg.files).toContain('dist');
    expect(pkg.scripts.build).toBe('tsc -p tsconfig.json');
    expect(pkg.scripts.prepack).toBe('pnpm run build');
  });
});
