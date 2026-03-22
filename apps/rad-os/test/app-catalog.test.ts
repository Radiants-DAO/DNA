import { describe, expect, it } from 'vitest';
import { getApp, getDesktopLaunchers, getStartMenuSections, getWindowChrome } from '@/lib/apps/catalog';

describe('app catalog selectors', () => {
  it('keeps start menu projections derived from catalog data', () => {
    const sections = getStartMenuSections();
    expect(sections.apps.map((app) => app.id)).toContain('brand');
    expect(sections.web3.map((app) => app.id)).toContain('studio');
  });

  it('allows launcher copy to differ from window copy explicitly', () => {
    const brand = getApp('brand');
    expect(brand?.windowTitle).toBe('Brand Assets');
    expect(brand?.launcherTitle).toBe('Brand & Press');
  });

  it('derives app window chrome from the catalog boundary', () => {
    const brand = getWindowChrome('brand');
    expect(brand?.windowTitle).toBe('Brand Assets');
    expect(brand?.helpConfig).toBeDefined();
  });
});
