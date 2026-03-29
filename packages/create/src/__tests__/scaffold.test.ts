import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { scaffoldProject } from '../scaffold';

const radiantsPackageJsonPath = resolve(process.cwd(), '..', 'radiants', 'package.json');
const radiantsPackageJson = JSON.parse(readFileSync(radiantsPackageJsonPath, 'utf8')) as {
  version: string;
};

describe('scaffoldProject', () => {
  it('writes a standalone app manifest that plain pnpm install can resolve', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'rdna-create-'));

    await scaffoldProject({
      appName: 'motion-lab',
      outDir,
    });

    expect(existsSync(resolve(outDir, 'components/AppWindow.tsx'))).toBe(true);
    expect(existsSync(resolve(outDir, 'store/index.ts'))).toBe(true);
    expect(existsSync(resolve(outDir, 'lib/catalog.tsx'))).toBe(true);
    expect(existsSync(resolve(outDir, 'tsconfig.tsbuildinfo'))).toBe(false);

    const pkg = JSON.parse(readFileSync(resolve(outDir, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('motion-lab');
    expect(pkg.dependencies['@rdna/radiants']).toBe(`^${radiantsPackageJson.version}`);
    expect(pkg.dependencies.zustand).toBeDefined();
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.devDependencies.eslint).toBe('^9');
    expect(pkg.devDependencies['eslint-config-next']).toBe('16.0.10');

    const dependencySpecs = Object.values<string>({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    });

    expect(dependencySpecs.some((value) => value.startsWith('file:'))).toBe(false);
    expect(dependencySpecs.some((value) => value.startsWith('workspace:'))).toBe(false);
  });

  it('rejects app names that normalize to an empty package name', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'rdna-create-invalid-'));

    await expect(
      scaffoldProject({
        appName: '!!!',
        outDir,
      }),
    ).rejects.toThrow('app name must include at least one letter or number');
  });

  it('refuses to overwrite a non-empty output directory', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'rdna-create-existing-'));
    mkdirSync(resolve(outDir, 'nested'));
    writeFileSync(resolve(outDir, 'nested', 'keep.txt'), 'keep');

    await expect(
      scaffoldProject({
        appName: 'motion-lab',
        outDir,
      }),
    ).rejects.toThrow('output directory must be empty');
  });
});
