import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '@/components/apps/pretext/primitive-registry';
import {
  loadPretextBundle,
  loadPretextBundleFromFiles,
  loadPretextBundleFromPair,
} from '@/components/apps/pretext/load-pretext-bundle';

describe('pretext bundle loader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads a markdown/settings pair into a renderer-ready bundle', async () => {
    const settings = createDefaultSettings('editorial');
    const bundle = await loadPretextBundleFromPair(
      '# Essay Title\n\nBody copy.',
      JSON.stringify(settings),
    );

    expect(bundle.markdown).toContain('Essay Title');
    expect(bundle.settings.primitive).toBe('editorial');
    expect(bundle.settings.primitiveSettings.primitive).toBe('editorial');
  });

  it('validates primitive settings when loading from files', async () => {
    const markdownFile = new File(['# Front Page'], 'front-page.md', {
      type: 'text/markdown',
    });
    const settingsFile = new File(
      [
        JSON.stringify({
          version: 1,
          id: 'doc-1',
          title: 'Broken',
          slug: 'broken',
          primitive: 'broadsheet',
          preview: {
            windowWidth: 960,
            windowHeight: 720,
            density: 'comfortable',
          },
          assets: {},
          primitiveSettings: {
            primitive: 'editorial',
            dropCap: true,
            pullquote: false,
            columnCount: 1,
          },
        }),
      ],
      'front-page.pretext.json',
      { type: 'application/json' },
    );

    await expect(
      loadPretextBundleFromFiles(markdownFile, settingsFile),
    ).rejects.toThrow(/primitiveSettings\.primitive/i);
  });

  it('loads a public sample bundle by base path', async () => {
    const settings = createDefaultSettings('book');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('.md')) {
          return new Response('# Book Demo\n\nChapter opening.', { status: 200 });
        }
        if (url.endsWith('.pretext.json')) {
          return new Response(JSON.stringify(settings), { status: 200 });
        }
        return new Response('not found', { status: 404 });
      }),
    );

    const bundle = await loadPretextBundle('/pretext/book-demo');

    expect(bundle.settings.primitive).toBe('book');
    expect(bundle.markdown).toContain('Book Demo');
  });

  it('surfaces fetch failures with the missing file path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('.md')) {
          return new Response('# Book Demo\n\nChapter opening.', { status: 200 });
        }

        return new Response('missing', { status: 404, statusText: 'Not Found' });
      }),
    );

    await expect(
      loadPretextBundle('/pretext/missing-demo'),
    ).rejects.toThrow(/missing-demo\.pretext\.json.*404.*Not Found/i);
  });
});
