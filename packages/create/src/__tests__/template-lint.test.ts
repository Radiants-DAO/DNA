import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(
  new URL('../../../../templates/rados-app-prototype/', import.meta.url)
);

describe('template lint contract', () => {
  it('includes scaffold-time eslint wiring for the documented lint command', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(root, 'package.json.template'), 'utf8')
    );

    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.devDependencies.eslint).toBe('^9');
    expect(pkg.devDependencies['eslint-config-next']).toBe('16.0.10');
    expect(existsSync(resolve(root, 'eslint.config.mjs'))).toBe(true);
  });
});
