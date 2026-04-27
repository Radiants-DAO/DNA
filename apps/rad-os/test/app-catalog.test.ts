import { describe, expect, it } from 'vitest';
import {
  getApp,
  getDesktopLaunchers,
  getStartMenuCategories,
  getWindowChrome,
} from '@/lib/apps/catalog';

describe('app catalog selectors', () => {
  it('groups apps into start-menu categories with stable ordering', () => {
    const cats = getStartMenuCategories();
    const ids = cats.map((c) => c.id);
    expect(ids).toEqual(['tools', 'media', 'about', 'links']);
    expect(cats.find((c) => c.id === 'tools')?.apps.map((a) => a.id)).toContain('brand');
    expect(cats.find((c) => c.id === 'media')?.apps.map((a) => a.id)).toContain('good-news');
    expect(cats.find((c) => c.id === 'about')?.apps.map((a) => a.id)).toContain('about');
  });

  it('exposes external links via the Links category', () => {
    const links = getStartMenuCategories().find((c) => c.id === 'links');
    expect(links?.apps).toEqual([]);
    expect(links?.links?.map((l) => l.id)).toEqual(['twitter', 'discord']);
  });

  it('surfaces subtabs for apps that expose deep-link targets', () => {
    const tools = getStartMenuCategories().find((c) => c.id === 'tools');
    const brand = tools?.apps.find((a) => a.id === 'brand');
    expect(brand?.subtabs?.map((s) => s.id)).toEqual([
      'logos',
      'colors',
      'fonts',
    ]);
    const lab = tools?.apps.find((a) => a.id === 'lab');
    expect(lab?.subtabs?.map((s) => s.id)).toEqual([
      'components',
    ]);
    const pixelLab = tools?.apps.find((a) => a.id === 'pixel-lab');
    expect(pixelLab?.subtabs?.map((s) => s.id)).toEqual([
      'radiants',
      'corners',
      'icons',
      'patterns',
      'dither',
      'canvas',
    ]);
  });

  it('keeps Dev Tools and Pixel Lab launchable after merging Studio into Pixel Lab', () => {
    const launcherIds = getDesktopLaunchers().map((app) => app.id);

    expect(launcherIds).toContain('lab');
    expect(launcherIds).toContain('pixel-lab');
    expect(launcherIds).not.toContain('studio');
  });

  it('renames the old Lab surface and moves the flask icon to Pixel Lab', () => {
    const devTools = getApp('lab');
    const pixelLab = getApp('pixel-lab');

    expect(devTools?.windowTitle).toBe('Dev Tools');
    expect(devTools?.launcherTitle).toBe('Dev Tools');
    expect(pixelLab?.windowIcon).toMatchObject({
      props: expect.objectContaining({ name: 'school-science-test-flask' }),
    });
  });

  it('allows launcher copy to differ from window copy explicitly', () => {
    const brand = getApp('brand');
    expect(brand?.windowTitle).toBe('Brand');
    expect(brand?.launcherTitle).toBe('Brand');
  });

  it('derives app window chrome from the catalog boundary', () => {
    const brand = getWindowChrome('brand');
    expect(brand?.windowTitle).toBe('Brand');
    expect(brand?.helpConfig).toBeDefined();
  });

  it('locks Pixel Lab to a wide near-square content aspect', () => {
    const pixelLab = getWindowChrome('pixel-lab');

    expect(pixelLab?.aspectRatio).toBeCloseTo(1.01, 4);
  });

  it('uses the same near-square aspect for Brand and Pixel Lab', () => {
    const brand = getWindowChrome('brand');
    const pixelLab = getWindowChrome('pixel-lab');

    expect(brand?.aspectRatio).toBe(pixelLab?.aspectRatio);
    expect(brand?.defaultSize).toEqual(pixelLab?.defaultSize);
  });

  it('does not expose a launch-ready Links app in the catalog', () => {
    expect(getApp('links')).toBeUndefined();
    expect(getDesktopLaunchers().map((app) => app.id)).not.toContain('links');
    const tools = getStartMenuCategories().find((c) => c.id === 'tools');
    expect(tools?.apps.map((a) => a.id)).not.toContain('links');
  });
});
