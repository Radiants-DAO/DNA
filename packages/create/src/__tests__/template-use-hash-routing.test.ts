import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(
  new URL('../../../../templates/rados-app-prototype/', import.meta.url)
);

describe('template useHashRouting contract', () => {
  it('keeps hash sync authoritative by closing windows removed from the hash', () => {
    const source = readFileSync(resolve(root, 'hooks/useHashRouting.ts'), 'utf8');

    expect(source).toContain('closeWindow');
    expect(source).not.toContain('if (!hash) return;');
  });
});
