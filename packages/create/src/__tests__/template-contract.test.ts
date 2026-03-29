import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(
  new URL('../../../../templates/rados-app-prototype/', import.meta.url)
);

describe('template RadOS shell', () => {
  it('wraps the real radiants CoreAppWindow with store bindings', () => {
    const appWindow = readFileSync(resolve(root, 'components/AppWindow.tsx'), 'utf8');
    expect(appWindow).toContain('CoreAppWindow');
    expect(appWindow).toContain('useWindowManager');
  });

  it('provides catalog-driven app registration', () => {
    const catalog = readFileSync(resolve(root, 'lib/catalog.tsx'), 'utf8');
    expect(catalog).toContain('APP_CATALOG');
    expect(catalog).toContain('getWindowChrome');
    expect(catalog).toContain('getStartMenuSections');
  });

  it('boots the prototype from rdna package imports', () => {
    const globals = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    const desktop = readFileSync(resolve(root, 'components/Desktop.tsx'), 'utf8');

    expect(globals).toContain("@import '@rdna/radiants';");
    expect(globals).toContain("@import '@rdna/radiants/dark';");
    expect(globals).toContain('@source "../node_modules/@rdna/radiants";');
    expect(desktop).toContain("from '@rdna/radiants/components/core'");
    expect(desktop).toContain("from '@rdna/radiants/icons/runtime'");
  });
});
