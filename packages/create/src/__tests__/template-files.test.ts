import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(
  new URL('../../../../templates/rados-app-prototype/', import.meta.url)
);

describe('template files', () => {
  it('includes the RadOS desktop shell', () => {
    expect(existsSync(resolve(root, 'app/page.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/AppWindow.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/Desktop.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/Taskbar.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/StartMenu.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'components/DesktopIcon.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'store/index.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'hooks/useWindowManager.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'lib/catalog.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'lib/windowSizing.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'eslint.config.mjs'))).toBe(true);
  });
});
