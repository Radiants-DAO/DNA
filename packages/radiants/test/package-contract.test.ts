import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJsonPath = resolve(process.cwd(), 'package.json');

describe('@rdna/radiants package contract', () => {
  it('does not require the workspace-only preview package at runtime', () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    expect(pkg.dependencies['@rdna/preview']).toBeUndefined();
    expect(pkg.devDependencies['@rdna/preview']).toBe('workspace:*');
  });
});
