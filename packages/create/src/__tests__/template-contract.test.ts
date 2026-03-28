import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(
  new URL('../../../../templates/rados-app-prototype/', import.meta.url)
);

describe('template control-surface seam', () => {
  it('uses a generic title-bar action slot instead of control-specific booleans', () => {
    const appWindow = readFileSync(resolve(root, 'components/AppWindow.tsx'), 'utf8');
    expect(appWindow).toContain('titleBarActions');
  });

  it('defines the future control-surface stub in lib/controlSurface.ts', () => {
    const seam = readFileSync(resolve(root, 'lib/controlSurface.ts'), 'utf8');
    expect(seam).toContain('AppControlSurfaceConfig');
    expect(seam).toContain("enabled: false");
  });

  it('boots the prototype from rdna package imports instead of local theme copies', () => {
    const globals = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    const app = readFileSync(resolve(root, 'components/app/MyApp.tsx'), 'utf8');

    expect(globals).toContain("@import '@rdna/radiants';");
    expect(globals).toContain("@import '@rdna/radiants/dark';");
    expect(globals).toContain('@source "../node_modules/@rdna/radiants";');
    expect(app).toContain("from '@rdna/radiants/components/core'");
    expect(app).toContain("from '@rdna/radiants/icons/runtime'");
    expect(app).toContain("from '@rdna/radiants/patterns'");
  });
});
