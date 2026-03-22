import { describe, expect, it } from 'vitest';
import { buildRegistryMetadata } from '../build-registry-metadata';

describe('buildRegistryMetadata', () => {
  it('returns only server-safe metadata', () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.name).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.sourcePath).toMatch(/^packages\/radiants\//);
      expect('component' in entry).toBe(false);
      expect('Demo' in entry).toBe(false);
    }
  });

  it('every entry has a renderMode', () => {
    const entries = buildRegistryMetadata();
    for (const entry of entries) {
      expect(['inline', 'custom', 'description-only']).toContain(entry.renderMode);
    }
  });

  it('returns all non-excluded components', () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThanOrEqual(22);
  });

  it('surfaces canonical props, slots, and display labels', () => {
    const button = buildRegistryMetadata().find((entry) => entry.name === 'Button');

    expect(button?.id).toBe('button');
    expect(button?.label).toBe('Button.tsx');
    expect(button?.group).toBe('Actions');
    expect(button?.props?.mode?.type).toBe('enum');
    expect(button?.slots).toEqual(expect.any(Object));
  });

  it('surfaces defaultProps and tokenBindings from canonical metadata', () => {
    const input = buildRegistryMetadata().find((entry) => entry.name === 'Input');
    const button = buildRegistryMetadata().find((entry) => entry.name === 'Button');

    expect(input?.defaultProps).toEqual(expect.any(Object));
    expect(button?.tokenBindings).toEqual(expect.any(Object));
  });

  it('keeps co-authored components distinct even when they share a source file', () => {
    const entries = buildRegistryMetadata();
    const label = entries.find((entry) => entry.name === 'Label');
    const radio = entries.find((entry) => entry.name === 'Radio');

    expect(label?.props?.children).toBeDefined();
    expect(radio?.props?.checked).toBeDefined();
  });

  it('accepts enum metadata authored with options or values', () => {
    const drawer = buildRegistryMetadata().find((entry) => entry.name === 'Drawer');

    expect(drawer?.props?.direction?.options ?? drawer?.props?.direction?.values).toEqual([
      'bottom',
      'top',
      'left',
      'right',
    ]);
  });
});
