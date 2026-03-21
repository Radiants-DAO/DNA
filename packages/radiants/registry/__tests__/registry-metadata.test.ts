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
});
