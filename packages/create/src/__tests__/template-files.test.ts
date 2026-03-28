import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(
  new URL('../../../../templates/rados-app-prototype/', import.meta.url)
);

describe('template files', () => {
  it('includes the standalone app shell', () => {
    expect(existsSync(resolve(root, 'app/page.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/AppWindow.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/WindowContent.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'lib/controlSurface.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'eslint.config.mjs'))).toBe(true);
  });
});
