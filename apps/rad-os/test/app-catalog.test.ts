import { describe, expect, it } from 'vitest';
import { getApp, getDesktopLaunchers, getStartMenuSections, getWindowChrome } from '@/lib/apps/catalog';

describe('app catalog selectors', () => {
  it('keeps start menu projections derived from catalog data', () => {
    const sections = getStartMenuSections();
    expect(sections.apps.map((app) => app.id)).toContain('brand');
    expect(sections.apps.map((app) => app.id)).toContain('control-lab');
    expect(sections.web3.map((app) => app.id)).toContain('studio');
  });

  it('allows launcher copy to differ from window copy explicitly', () => {
    const brand = getApp('brand');
    expect(brand?.windowTitle).toBe('Design Codex');
    expect(brand?.launcherTitle).toBe('Brand & Press');
  });

  it('derives app window chrome from the catalog boundary', () => {
    const brand = getWindowChrome('brand');
    expect(brand?.windowTitle).toBe('Design Codex');
    expect(brand?.helpConfig).toBeDefined();
  });

  it('registers the control surface lab as a desktop-visible internal tool', () => {
    const controlLab = getApp('control-lab');

    expect(controlLab?.windowTitle).toBe('Control Surface Lab');
    expect(getDesktopLaunchers().map((app) => app.id)).toContain('control-lab');
  });

  it('drops the launch-ready Links stub from the catalog', () => {
    expect(getApp('links')).toBeUndefined();
    expect(getDesktopLaunchers().map((app) => app.id)).not.toContain('links');
    expect(getStartMenuSections().apps.map((app) => app.id)).not.toContain('links');
  });
});
