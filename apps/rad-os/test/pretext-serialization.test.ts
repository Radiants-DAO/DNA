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
        primitiveSettings: { ...sampleSettings.primitiveSettings, primitive: 'book' },
      }),
    ).toThrow(/primitiveSettings\.primitive/);
  });

  it('accepts valid settings', () => {
    expect(validateSettings(sampleSettings)).toEqual(sampleSettings);
  });
});

describe('deserializePretextBundleFromPaste', () => {
  it('returns empty for blank input', () => {
    expect(deserializePretextBundleFromPaste('')).toEqual({ kind: 'empty' });
    expect(deserializePretextBundleFromPaste('   ')).toEqual({ kind: 'empty' });
  });

  it('returns markdown-only for plain markdown', () => {
    const result = deserializePretextBundleFromPaste('# Hello\n\nSome body text.');
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
