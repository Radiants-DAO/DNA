import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from '@/components/apps/pretext/primitive-registry';
import type { PretextBlock } from '@/components/apps/pretext/markdown';
import { BookView } from '@/components/apps/pretext/primitives/book/BookView';
import {
  paginateBookLayout,
  type BookLayoutBlock,
} from '@/components/apps/pretext/primitives/book/book-layout';
import {
  lineHeight,
  resolveFluid,
} from '@rdna/radiants/patterns/pretext-type-scale';

const LONG_PARAGRAPH = Array.from(
  { length: 80 },
  () =>
    'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
).join(' ');

describe('paginateBookLayout', () => {
  it('creates additional pages when content exceeds the page height', () => {
    const blocks: BookLayoutBlock[] = [
      { kind: 'heading', text: 'Chapter One' },
      { kind: 'paragraph', text: LONG_PARAGRAPH },
      { kind: 'paragraph', text: LONG_PARAGRAPH },
    ];

    const result = paginateBookLayout({
      blocks,
      pageWidth: 448,
      pageHeight: 240,
      columns: 1,
      cache: new Map(),
    });

    expect(result.pages.length).toBeGreaterThan(1);
  });

  it('narrows line widths around image obstacles', () => {
    const blocks: BookLayoutBlock[] = [
      { kind: 'paragraph', text: LONG_PARAGRAPH },
    ];

    const result = paginateBookLayout({
      blocks,
      pageWidth: 448,
      pageHeight: 360,
      columns: 1,
      obstacles: [{ id: 'obs-1', x: 240, y: 72, w: 120, h: 120, pageIndex: 0 }],
      cache: new Map(),
    });

    const obstacleLine = result.pages[0]?.els.find(
      (el) =>
        el.kind === 'line' &&
        el.y >= 72 &&
        el.y < 192,
    );

    expect(obstacleLine).toBeDefined();
    expect(obstacleLine?.kind).toBe('line');
    if (obstacleLine?.kind === 'line') {
      expect(obstacleLine.maxWidth).toBeLessThan(result.columnWidth);
    }
  });

  it('derives heading and body metrics from fluid type and line-height scales', () => {
    const result = paginateBookLayout({
      blocks: [{ kind: 'paragraph', text: LONG_PARAGRAPH }],
      pageWidth: 448,
      pageHeight: 704,
      columns: 2,
      cache: new Map(),
    });

    expect(result.bodyFontSize).toBe(resolveFluid('base', result.columnWidth));
    expect(result.headingFontSize).toBe(resolveFluid('xl', result.columnWidth));
    expect(result.bodyLh).toBe(result.bodyFontSize * lineHeight.snug);
    expect(result.headingLh).toBe(result.headingFontSize * lineHeight.none);
  });
});

describe('BookView', () => {
  it('renders the shared paginated book primitive', async () => {
    const settings = createDefaultSettings('book');
    const blocks: PretextBlock[] = [
      { type: 'heading', depth: 1, text: 'Book Title' },
      { type: 'paragraph', text: LONG_PARAGRAPH },
      { type: 'rule' },
      { type: 'image', alt: 'Illustration', src: '/book-cover.png' },
      { type: 'paragraph', text: LONG_PARAGRAPH },
    ];

    render(
      <BookView
        blocks={blocks}
        settings={settings.primitiveSettings}
        assets={settings.assets}
        containerWidth={500}
        containerHeight={400}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('pretext-primitive-book')).toHaveAttribute(
        'data-page-count',
      );
    });

    expect(screen.getByTestId('pretext-primitive-book')).toHaveAttribute(
      'data-container-width',
      '500',
    );
    expect(screen.getAllByTestId('pretext-book-page').length).toBeGreaterThan(
      0,
    );
  });
});
