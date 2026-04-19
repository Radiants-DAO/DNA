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
    expect(cats.find((c) => c.id === 'media')?.apps.map((a) => a.id)).toContain('music');
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
      'components',
      'ai-gen',
    ]);
  });

  it('allows launcher copy to differ from window copy explicitly', () => {
    const brand = getApp('brand');
    expect(brand?.windowTitle).toBe('Design Codex');
    expect(brand?.launcherTitle).toBe('Design Codex');
  });

  it('derives app window chrome from the catalog boundary', () => {
    const brand = getWindowChrome('brand');
    expect(brand?.windowTitle).toBe('Design Codex');
    expect(brand?.helpConfig).toBeDefined();
  });

  it('does not expose a launch-ready Links app in the catalog', () => {
    expect(getApp('links')).toBeUndefined();
    expect(getDesktopLaunchers().map((app) => app.id)).not.toContain('links');
    const tools = getStartMenuCategories().find((c) => c.id === 'tools');
    expect(tools?.apps.map((a) => a.id)).not.toContain('links');
  });
});
