import { describe, expect, it } from 'vitest';
import type { PretextBlock } from '@/components/apps/pretext/markdown';
import { computeEditorialLayout } from '@/components/apps/pretext/primitives/editorial/editorial-layout';

const LONG_PARAGRAPH = Array.from(
  { length: 36 },
  () =>
    'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
).join(' ');

const baseBlocks: PretextBlock[] = [
  { type: 'heading', depth: 1, text: 'Essay Title' },
  { type: 'paragraph', text: LONG_PARAGRAPH },
  { type: 'paragraph', text: LONG_PARAGRAPH },
];

describe('computeEditorialLayout', () => {
  it('lays out a one-column article flow', () => {
    const result = computeEditorialLayout({
      blocks: baseBlocks,
      containerWidth: 720,
      desiredColumns: 1,
      dropCap: false,
      pullquote: false,
    });

    expect(result.columnCount).toBe(1);
    expect(result.columns).toHaveLength(1);
    expect(result.elements.some((el) => el.kind === 'line')).toBe(true);
  });

  it('uses two columns on wide containers when requested', () => {
    const result = computeEditorialLayout({
      blocks: [
        ...baseBlocks,
        { type: 'paragraph', text: LONG_PARAGRAPH },
        { type: 'paragraph', text: LONG_PARAGRAPH },
      ],
      containerWidth: 1120,
      desiredColumns: 2,
      dropCap: false,
      pullquote: false,
    });

    expect(result.columnCount).toBe(2);
    expect(result.columns).toHaveLength(2);
    expect(
      result.elements.some(
        (el) => el.kind === 'line' && el.x >= result.columns[1]!.x,
      ),
    ).toBe(true);
  });

  it('renders an optional drop cap on the opening paragraph', () => {
    const result = computeEditorialLayout({
      blocks: baseBlocks,
      containerWidth: 720,
      desiredColumns: 1,
      dropCap: true,
      pullquote: false,
    });

    expect(result.elements.some((el) => el.kind === 'dropcap')).toBe(true);
  });

  it('renders a pullquote block when enabled', () => {
    const result = computeEditorialLayout({
      blocks: [
        ...baseBlocks,
        { type: 'blockquote', text: 'Society will tire of gimmick merchants.' },
      ],
      containerWidth: 720,
      desiredColumns: 1,
      dropCap: false,
      pullquote: true,
    });

    expect(result.elements.some((el) => el.kind === 'pullquote')).toBe(true);
  });

  it('renders image blocks inline without pagination', () => {
    const result = computeEditorialLayout({
      blocks: [
        ...baseBlocks,
        { type: 'image', alt: 'Inline image', src: 'hero' },
      ],
      containerWidth: 720,
      desiredColumns: 1,
      dropCap: false,
      pullquote: false,
      assets: { hero: '/images/hero.png' },
    });

    const image = result.elements.find((el) => el.kind === 'image');
    expect(image).toBeDefined();
    if (image?.kind === 'image') {
      expect(image.src).toBe('/images/hero.png');
      expect(image.h).toBeGreaterThan(0);
    }
  });
});
