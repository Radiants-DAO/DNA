import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { scaffoldProject } from '../scaffold';

describe('scaffoldProject', () => {
  it('writes a standalone app manifest that plain pnpm install can resolve', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'rdna-create-'));

    await scaffoldProject({
      appName: 'motion-lab',
      outDir
    });

    expect(existsSync(resolve(outDir, 'components/AppWindow.tsx'))).toBe(true);
    expect(existsSync(resolve(outDir, 'lib/controlSurface.ts'))).toBe(true);
    expect(existsSync(resolve(outDir, 'tsconfig.tsbuildinfo'))).toBe(false);

    const pkg = JSON.parse(readFileSync(resolve(outDir, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('motion-lab');
    expect(pkg.dependencies['@rdna/radiants']).toBeUndefined();

    const dependencySpecs = Object.values<string>({
      ...pkg.dependencies,
      ...pkg.devDependencies
    });

    expect(dependencySpecs.some((value) => value.startsWith('file:'))).toBe(false);
    expect(dependencySpecs.some((value) => value.startsWith('workspace:'))).toBe(false);
  });
});
