import { describe, expect, it } from 'vitest';
import {
  createDefaultSettings,
  isPrimitiveKind,
  primitiveKinds,
} from '@/components/apps/pretext/primitive-registry';
import type { PretextDocumentSettings } from '@/components/apps/pretext/types';

describe('pretext document contract', () => {
  it('defines the v1 primitive registry', () => {
    expect(primitiveKinds).toEqual(['editorial', 'broadsheet', 'book']);
  });

  it('creates default editorial settings', () => {
    const settings = createDefaultSettings('editorial');
    expect(settings.primitive).toBe('editorial');
    expect(settings.version).toBe(1);
    expect(settings.preview.windowWidth).toBeGreaterThan(0);
    expect(settings.primitiveSettings.primitive).toBe('editorial');
  });

  it('creates default broadsheet settings', () => {
    const settings = createDefaultSettings('broadsheet');
    expect(settings.primitive).toBe('broadsheet');
    expect(settings.version).toBe(1);
    expect(settings.primitiveSettings.primitive).toBe('broadsheet');
  });

  it('creates default book settings', () => {
    const settings = createDefaultSettings('book');
    expect(settings.primitive).toBe('book');
    expect(settings.version).toBe(1);
    expect(settings.primitiveSettings.primitive).toBe('book');
  });

  it('validates primitive kinds', () => {
    expect(isPrimitiveKind('editorial')).toBe(true);
    expect(isPrimitiveKind('broadsheet')).toBe(true);
    expect(isPrimitiveKind('book')).toBe(true);
    expect(isPrimitiveKind('zine')).toBe(false);
    expect(isPrimitiveKind('')).toBe(false);
  });

  it('settings satisfy the PretextDocumentSettings type', () => {
    const settings: PretextDocumentSettings = createDefaultSettings('editorial');
    expect(settings.id).toBeTruthy();
    expect(settings.title).toBe('');
    expect(settings.slug).toBe('');
    expect(settings.assets).toEqual({});
  });
});
