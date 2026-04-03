import { describe, expect, it } from 'vitest';
import {
  deserializePretextBundle,
  serializePretextBundle,
} from '@/components/apps/pretext/serialization';
import { coerceStoredDoc } from '@/components/apps/pretext/legacy';
import type { PretextDocumentSettings } from '@/components/apps/pretext/types';

const sampleSettings: PretextDocumentSettings = {
  version: 1,
  id: 'doc-1',
  title: 'Hello',
  slug: 'hello',
  primitive: 'editorial',
  preview: { windowWidth: 720, windowHeight: 900, density: 'comfortable' },
  primitiveSettings: {
    primitive: 'editorial',
    dropCap: true,
    pullquote: false,
    columnCount: 1,
  },
  assets: {},
};

describe('pretext bundle serialization', () => {
  it('round-trips markdown + settings', () => {
    const bundle = {
      markdown: '# Hello\n\nBody copy.',
      settings: sampleSettings,
    };

    const encoded = serializePretextBundle(bundle);
    expect(typeof encoded.markdown).toBe('string');
    expect(typeof encoded.settingsJson).toBe('string');

    const decoded = deserializePretextBundle(
      encoded.markdown,
      encoded.settingsJson,
    );
    expect(decoded.markdown).toBe(bundle.markdown);
    expect(decoded.settings).toEqual(bundle.settings);
  });

  it('rejects invalid primitive names in settings JSON', () => {
    const badJson = JSON.stringify({ ...sampleSettings, primitive: 'zine' });
    expect(() =>
      deserializePretextBundle('# Test', badJson),
    ).toThrow();
  });

  it('preserves settings fields exactly', () => {
    const encoded = serializePretextBundle({
      markdown: '# Title',
      settings: sampleSettings,
    });
    const parsed = JSON.parse(encoded.settingsJson);
    expect(parsed.version).toBe(1);
    expect(parsed.primitive).toBe('editorial');
    expect(parsed.preview.density).toBe('comfortable');
  });
});

describe('legacy doc coercion', () => {
  it('wraps old BlockNote docs as legacy-blocknote', () => {
    const oldDoc = {
      id: 'old-1',
      title: 'Old Note',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
      updatedAt: Date.now(),
    };
    const result = coerceStoredDoc(oldDoc);
    expect(result.kind).toBe('legacy-blocknote');
    expect(result.id).toBe('old-1');
    expect(result.title).toBe('Old Note');
  });

  it('passes through pretext docs unchanged', () => {
    const pretextDoc = {
      kind: 'pretext' as const,
      id: 'pt-1',
      title: 'New Doc',
      markdown: '# New',
      settings: sampleSettings,
      updatedAt: Date.now(),
    };
    const result = coerceStoredDoc(pretextDoc);
    expect(result.kind).toBe('pretext');
    expect(result.id).toBe('pt-1');
  });
});
