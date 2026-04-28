'use client';

import { useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import type { PretextBlock } from '../../markdown';
import type { BookSettings } from '../../types';
import { useFontsReady } from '../shared/useFontsReady';
import {
  paginateBookLayout,
  pretextBlocksToBookLayoutBlocks,
  type BookPaginationResult,
  type BookPageEl,
  type BookObstacle,
} from './book-layout';

interface BookViewProps {
  blocks: PretextBlock[];
  settings: BookSettings;
  assets: Record<string, string>;
  containerWidth: number;
  containerHeight: number;
  obstacles?: BookObstacle[];
}

function renderPageElement(el: BookPageEl, key: string) {
  switch (el.kind) {
    case 'line':
      return (
        <div
          key={key}
          className="absolute text-head"
          style={{ left: el.x, top: el.y, whiteSpace: 'pre', font: el.font }}
        >
          {el.text}
        </div>
      );

    case 'heading-line':
      return (
        <div
          key={key}
          className="absolute text-head"
          style={{ left: el.x, top: el.y, whiteSpace: 'pre', font: el.font }}
        >
          {el.text}
        </div>
      );

    case 'section-title':
      return (
        <div
          key={key}
          className="flex h-full items-center justify-center px-8 text-center text-head"
          style={{ font: el.font }}
        >
          {el.text}
        </div>
      );

    case 'rule':
      return (
        <div
          key={key}
          className="absolute bg-head"
          style={{
            ['--pretext-rule-thickness' as string]: '1px',
            left: el.x,
            top: el.y,
            width: el.w,
            height: 'var(--pretext-rule-thickness)',
          } as CSSProperties}
        />
      );

    case 'col-rule':
      return (
        <div
          key={key}
          className="absolute bg-line"
          style={{
            ['--pretext-rule-thickness' as string]: '1px',
            left: el.x,
            top: el.y,
            width: 'var(--pretext-rule-thickness)',
            height: el.h,
          } as CSSProperties}
        />
      );

    case 'image':
      return (
        <Image
          key={key}
          src={el.src}
          alt={el.alt}
          width={Math.max(1, Math.round(el.w))}
          height={Math.max(1, Math.round(el.h))}
          unoptimized
          className="absolute object-cover"
          style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
        />
      );
  }
}

export function BookView({
  blocks,
  settings,
  assets,
  containerWidth,
  containerHeight,
  obstacles = [],
}: BookViewProps) {
  const cacheRef = useRef<Map<string, PreparedTextWithSegments>>(new Map());
  const [result, setResult] = useState<BookPaginationResult | null>(null);

  useFontsReady(() => {
    const layoutBlocks = pretextBlocksToBookLayoutBlocks(blocks, assets);
    const nextResult = paginateBookLayout({
      blocks: layoutBlocks,
      pageWidth: settings.pageWidth,
      pageHeight: settings.pageHeight,
      columns: settings.columns,
      obstacles,
      cache: cacheRef.current,
    });
    setResult(nextResult);
  }, [assets, blocks, obstacles, settings.columns, settings.pageHeight, settings.pageWidth]);

  const pages = result?.pages ?? [];

  return (
    <div
      data-testid="pretext-primitive-book"
      data-page-count={pages.length}
      data-container-width={containerWidth}
      data-container-height={containerHeight}
      className="h-full w-full overflow-auto"
    >
      <div className="flex min-h-full flex-col items-center gap-4 p-4">
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            data-testid="pretext-book-page"
            className="relative overflow-hidden border border-line bg-card shadow-sm"
            style={{ width: settings.pageWidth, height: settings.pageHeight }}
          >
            {page.els.length === 1 && page.els[0]?.kind === 'section-title'
              ? renderPageElement(page.els[0], `page-${pageIndex}-title`)
              : page.els.map((el, elementIndex) =>
                  renderPageElement(el, `page-${pageIndex}-${elementIndex}`),
                )}
          </div>
        ))}
      </div>
    </div>
  );
}
