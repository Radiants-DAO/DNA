import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(
  new URL('../../../../templates/rados-app-prototype/', import.meta.url)
);

describe('template lint contract', () => {
  it('omits scaffold-time eslint wiring so prototypes stay lightweight', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(root, 'package.json.template'), 'utf8')
    );

    expect(pkg.scripts.lint).toBeUndefined();
    expect(pkg.devDependencies.eslint).toBeUndefined();
    expect(pkg.devDependencies['eslint-config-next']).toBeUndefined();
    expect(existsSync(resolve(root, 'eslint.config.mjs'))).toBe(false);
  });
});
