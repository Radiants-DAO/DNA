import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

describe('legacy cleanup', () => {
  it('removes the stale rad-os create-app script', () => {
    const pkgPath = resolve(repoRoot, 'apps/rad-os/package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

    expect(pkg.scripts['create-app']).toBeUndefined();
    expect(existsSync(resolve(repoRoot, 'apps/rad-os/scripts/create-app.ts'))).toBe(false);
  });
});
