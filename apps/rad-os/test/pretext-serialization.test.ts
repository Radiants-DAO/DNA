import { describe, expect, it } from 'vitest';
import {
  deserializePretextBundle,
  deserializePretextBundleFromPaste,
  serializePretextBundle,
  validateSettings,
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

const sampleBroadsheetSettings: PretextDocumentSettings = {
  version: 1,
  id: 'doc-2',
  title: 'News',
  slug: 'news',
  primitive: 'broadsheet',
  preview: { windowWidth: 960, windowHeight: 720, density: 'comfortable' },
  primitiveSettings: {
    primitive: 'broadsheet',
    columns: 3,
    masthead: 'The Daily',
    heroWrap: 'leftSide',
  },
  assets: {},
};

const sampleBookSettings: PretextDocumentSettings = {
  version: 1,
  id: 'doc-3',
  title: 'Book',
  slug: 'book',
  primitive: 'book',
  preview: { windowWidth: 680, windowHeight: 880, density: 'comfortable' },
  primitiveSettings: {
    primitive: 'book',
    pageWidth: 612,
    pageHeight: 792,
    columns: 1,
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
    expect(() => deserializePretextBundle('# Test', badJson)).toThrow(
      /Invalid primitive kind/,
    );
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

describe('validateSettings', () => {
  it('rejects missing version', () => {
    const { version: _, ...noVersion } = sampleSettings;
    expect(() => validateSettings(noVersion)).toThrow(/version/);
  });

  it('rejects wrong version', () => {
    expect(() =>
      validateSettings({ ...sampleSettings, version: 2 }),
    ).toThrow(/version/);
  });

  it('rejects missing preview.windowWidth', () => {
    expect(() =>
      validateSettings({ ...sampleSettings, preview: {} }),
    ).toThrow(/preview/);
  });

  it('rejects mismatched primitiveSettings.primitive', () => {
    expect(() =>
      validateSettings({
        ...sampleSettings,
        primitive: 'editorial',
        primitiveSettings: {
          ...sampleSettings.primitiveSettings,
          primitive: 'book',
        },
      }),
    ).toThrow(/primitiveSettings\.primitive/);
  });

  it('accepts valid editorial settings', () => {
    expect(validateSettings(sampleSettings)).toEqual(sampleSettings);
  });

  it('accepts valid broadsheet settings', () => {
    expect(validateSettings(sampleBroadsheetSettings)).toEqual(
      sampleBroadsheetSettings,
    );
  });

  it('accepts valid book settings', () => {
    expect(validateSettings(sampleBookSettings)).toEqual(sampleBookSettings);
  });

  // Per-primitive validation
  it('rejects editorial with missing dropCap', () => {
    expect(() =>
      validateSettings({
        ...sampleSettings,
        primitiveSettings: { primitive: 'editorial' },
      }),
    ).toThrow(/dropCap/);
  });

  it('rejects editorial with invalid columnCount', () => {
    expect(() =>
      validateSettings({
        ...sampleSettings,
        primitiveSettings: {
          ...sampleSettings.primitiveSettings,
          columnCount: 5,
        },
      }),
    ).toThrow(/columnCount/);
  });

  it('rejects broadsheet with missing columns', () => {
    expect(() =>
      validateSettings({
        ...sampleBroadsheetSettings,
        primitiveSettings: { primitive: 'broadsheet' },
      }),
    ).toThrow(/columns/);
  });

  it('rejects broadsheet with invalid heroWrap', () => {
    expect(() =>
      validateSettings({
        ...sampleBroadsheetSettings,
        primitiveSettings: {
          ...sampleBroadsheetSettings.primitiveSettings,
          heroWrap: 'top',
        },
      }),
    ).toThrow(/heroWrap/);
  });

  it('rejects book with missing pageWidth', () => {
    expect(() =>
      validateSettings({
        ...sampleBookSettings,
        primitiveSettings: { primitive: 'book', columns: 1 },
      }),
    ).toThrow(/pageWidth/);
  });

  it('rejects book with non-numeric pageHeight', () => {
    expect(() =>
      validateSettings({
        ...sampleBookSettings,
        primitiveSettings: {
          primitive: 'book',
          pageWidth: 612,
          pageHeight: 'tall',
          columns: 1,
        },
      }),
    ).toThrow(/pageHeight/);
  });
});

describe('deserializePretextBundleFromPaste', () => {
  it('returns empty for blank input', () => {
    expect(deserializePretextBundleFromPaste('')).toEqual({ kind: 'empty' });
    expect(deserializePretextBundleFromPaste('   ')).toEqual({ kind: 'empty' });
  });

  it('returns markdown-only for plain markdown', () => {
    const result = deserializePretextBundleFromPaste(
      '# Hello\n\nSome body text.',
    );
    expect(result.kind).toBe('markdown-only');
    if (result.kind === 'markdown-only') {
      expect(result.markdown).toBe('# Hello\n\nSome body text.');
    }
  });

  it('returns settings-only for pure JSON settings', () => {
    const result = deserializePretextBundleFromPaste(
      JSON.stringify(sampleSettings),
    );
    expect(result.kind).toBe('settings-only');
    if (result.kind === 'settings-only') {
      expect(result.settings.primitive).toBe('editorial');
    }
  });

  it('returns full bundle for markdown + fenced settings', () => {
    const text = `# Title\n\nBody.\n\n\`\`\`json\n${JSON.stringify(sampleSettings)}\n\`\`\``;
    const result = deserializePretextBundleFromPaste(text);
    expect(result.kind).toBe('full');
    if (result.kind === 'full') {
      expect(result.markdown).toBe('# Title\n\nBody.');
      expect(result.settings.primitive).toBe('editorial');
    }
  });

  it('treats malformed fenced JSON as markdown-only', () => {
    const text = '# Title\n\n```json\n{not valid json}\n```';
    const result = deserializePretextBundleFromPaste(text);
    expect(result.kind).toBe('markdown-only');
  });

  // Finding 1: settings-shaped JSON with bad data must throw, not downgrade
  it('throws on pasted JSON with wrong version', () => {
    const badSettings = { ...sampleSettings, version: 2 };
    expect(() =>
      deserializePretextBundleFromPaste(JSON.stringify(badSettings)),
    ).toThrow(/version/);
  });

  it('throws on pasted JSON with invalid primitive', () => {
    const badSettings = { ...sampleSettings, primitive: 'zine' };
    expect(() =>
      deserializePretextBundleFromPaste(JSON.stringify(badSettings)),
    ).toThrow(/primitive/);
  });

  it('throws on fenced settings with invalid primitive', () => {
    const badSettings = { ...sampleSettings, primitive: 'zine' };
    const text = `# Title\n\n\`\`\`json\n${JSON.stringify(badSettings)}\n\`\`\``;
    expect(() => deserializePretextBundleFromPaste(text)).toThrow(/primitive/);
  });

  it('throws on fenced settings with missing per-primitive fields', () => {
    const badSettings = {
      ...sampleBookSettings,
      primitiveSettings: { primitive: 'book' },
    };
    const text = `# Title\n\n\`\`\`json\n${JSON.stringify(badSettings)}\n\`\`\``;
    expect(() => deserializePretextBundleFromPaste(text)).toThrow(/pageWidth/);
  });

  it('treats non-settings JSON as markdown-only', () => {
    // Valid JSON but not settings-shaped (no version/primitive keys)
    const result = deserializePretextBundleFromPaste('{"name":"test","items":[1,2]}');
    expect(result.kind).toBe('markdown-only');
  });
});

describe('legacy doc coercion', () => {
  it('wraps old BlockNote docs as legacy-blocknote', () => {
    const oldDoc = {
      id: 'old-1',
      title: 'Old Note',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] },
      ],
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
