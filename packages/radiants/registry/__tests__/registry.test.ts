import { describe, it, expect } from 'vitest';
import { registry, CATEGORIES, CATEGORY_LABELS } from '../index';
import { componentMetaIndex } from '../../meta';
import { componentData } from '../../schemas';

describe('Component Registry', () => {
  it('contains entries for all non-excluded components', () => {
    expect(registry.length).toBeGreaterThanOrEqual(22);
  });

  it('every entry has required fields', () => {
    for (const entry of registry) {
      expect(entry.name).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.sourcePath).toMatch(/^packages\/radiants\//);
      expect(entry.schemaPath).toMatch(/\.schema\.json$/);
      expect(entry.renderMode).toMatch(/^(inline|custom|description-only)$/);
      expect(CATEGORIES).toContain(entry.category);
    }
  });

  it('every category has a label', () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it('inline components have a component ref', () => {
    const inlines = registry.filter((e) => e.renderMode === 'inline');
    expect(inlines.length).toBeGreaterThan(0);
    for (const entry of inlines) {
      expect(entry.component).toBeDefined();
    }
  });

  it('custom components have a Demo component', () => {
    const customs = registry.filter((e) => e.renderMode === 'custom');
    expect(customs.length).toBeGreaterThan(0);
    for (const entry of customs) {
      expect(entry.Demo).toBeDefined();
      expect(typeof entry.Demo).toBe('function');
    }
  });

  it('entries are sorted by category then name', () => {
    for (let i = 1; i < registry.length; i++) {
      const prev = registry[i - 1];
      const curr = registry[i];
      const catCmp = prev.category.localeCompare(curr.category);
      if (catCmp === 0) {
        expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
      } else {
        expect(catCmp).toBeLessThan(0);
      }
    }
  });

  it('components with enum props get auto-generated variants', () => {
    const button = registry.find((e) => e.name === 'Button');
    expect(button).toBeDefined();
    expect(button!.variants).toBeDefined();
    expect(button!.variants!.length).toBeGreaterThan(0);
  });

  it('compound components have custom or description-only render mode', () => {
    const compounds = ['Dialog', 'Sheet', 'Select', 'Tabs'];
    for (const name of compounds) {
      const entry = registry.find((e) => e.name === name);
      if (entry) {
        expect(
          entry.renderMode === 'custom' || entry.renderMode === 'description-only',
        ).toBe(true);
      }
    }
  });

  it('schema barrel and registry expose the same non-excluded component set', () => {
    const excludedNames = new Set(
      Object.entries(componentMetaIndex)
        .filter(([, entry]) => entry.meta.registry?.exclude)
        .map(([name]) => name),
    );

    const registryNames = [...new Set(registry.map((entry) => entry.name))].sort();
    const schemaNames = Object.keys(componentData)
      .filter((name) => !excludedNames.has(name))
      .sort();

    expect(schemaNames).toEqual(registryNames);
  });
});
