import { describe, expect, it } from 'vitest';
import {
  createDefaultSettings,
  isPrimitiveKind,
  primitiveKinds,
} from '@/components/apps/pretext/primitive-registry';
import type {
  PretextDocumentSettings,
  PretextDocumentSettingsOf,
} from '@/components/apps/pretext/types';

describe('pretext document contract', () => {
  it('defines the v1 primitive registry', () => {
    expect(primitiveKinds).toEqual(['editorial', 'broadsheet', 'book']);
  });

  it('creates default editorial settings with narrowed type', () => {
    const settings = createDefaultSettings('editorial');
    // TypeScript narrows: settings.primitiveSettings is EditorialSettings
    expect(settings.primitive).toBe('editorial');
    expect(settings.version).toBe(1);
    expect(settings.preview.windowWidth).toBeGreaterThan(0);
    expect(settings.primitiveSettings.primitive).toBe('editorial');
    expect(settings.primitiveSettings.dropCap).toBe(true);
  });

  it('creates default broadsheet settings with narrowed type', () => {
    const settings = createDefaultSettings('broadsheet');
    expect(settings.primitive).toBe('broadsheet');
    expect(settings.version).toBe(1);
    expect(settings.primitiveSettings.primitive).toBe('broadsheet');
    expect(settings.primitiveSettings.columns).toBe(3);
  });

  it('creates default book settings with narrowed type', () => {
    const settings = createDefaultSettings('book');
    expect(settings.primitive).toBe('book');
    expect(settings.version).toBe(1);
    expect(settings.primitiveSettings.primitive).toBe('book');
    expect(settings.primitiveSettings.pageWidth).toBe(612);
  });

  it('validates primitive kinds', () => {
    expect(isPrimitiveKind('editorial')).toBe(true);
    expect(isPrimitiveKind('broadsheet')).toBe(true);
    expect(isPrimitiveKind('book')).toBe(true);
    expect(isPrimitiveKind('zine')).toBe(false);
    expect(isPrimitiveKind('')).toBe(false);
  });

  it('narrowed settings are assignable to the base union', () => {
    // Proves the generic is compatible with the union
    const editorial: PretextDocumentSettingsOf<'editorial'> =
      createDefaultSettings('editorial');
    const asUnion: PretextDocumentSettings = editorial;
    expect(asUnion.primitive).toBe('editorial');
  });

  it('settings satisfy the PretextDocumentSettings type', () => {
    const settings: PretextDocumentSettings =
      createDefaultSettings('editorial');
    expect(settings.id).toBeTruthy();
    expect(settings.title).toBe('');
    expect(settings.slug).toBe('');
    expect(settings.assets).toEqual({});
  });
});
