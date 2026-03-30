'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import { useContainerSize } from '@/hooks/useContainerSize';
import { MANIFESTO_ELEMENTS } from './manifesto-data';
import {
  paginateManifesto,
  type ImageObstacle,
  type Page,
  type PageEl,
  type PaginationResult,
} from './manifesto-layout';
import { CoverPage } from './CoverPage';

// ---------------------------------------------------------------------------
// Element renderers
// ---------------------------------------------------------------------------

function renderElement(el: PageEl, idx: number) {
  switch (el.kind) {
    case 'line':
      return (
        <div
          key={idx}
          className="absolute text-sub"
          style={{ left: el.x, top: el.y, whiteSpace: 'pre', font: el.font }}
        >
          {el.text}
        </div>
      );

    case 'heading-line':
      return (
        <div
          key={idx}
          className="absolute text-main"
          style={{ left: el.x, top: el.y, whiteSpace: 'pre', font: el.font }}
        >
          {el.text}
        </div>
      );

    case 'image': {
      const label = el.alt.replace(/^Placeholder:\s*/i, '');
      return (
        <div
          key={idx}
          className="absolute bg-depth flex items-center justify-center text-mute font-joystix text-xs p-2 text-center leading-relaxed"
          style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
        >
          {label}
        </div>
      );
    }

    case 'rule':
      return (
        <div
          key={idx}
          className="absolute bg-line"
          style={{ left: el.x, top: el.y, width: el.w, height: 1 }}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// ManifestoBook
// ---------------------------------------------------------------------------

export function ManifestoBook() {
  const [containerRef, { width: pageWidth, height: pageHeight }] =
    useContainerSize(448, 704);
  const cacheRef = useRef<Map<string, PreparedTextWithSegments>>(new Map());

  const [currentPage, setCurrentPage] = useState(0);
  const [result, setResult] = useState<PaginationResult | null>(null);
  const [imageObstacles] = useState<ImageObstacle[]>([]);

  // Paginate whenever dimensions or obstacles change
  useEffect(() => {
    if (pageWidth <= 0 || pageHeight <= 0) return;
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      const r = paginateManifesto(
        MANIFESTO_ELEMENTS,
        pageWidth,
        pageHeight,
        imageObstacles,
        cacheRef.current,
      );
      setResult(r);
    });

    return () => {
      cancelled = true;
    };
  }, [pageWidth, pageHeight, imageObstacles]);

  // Total page count: cover + content pages
  const totalContentPages = result?.pages.length ?? 0;
  const totalPages = 1 + totalContentPages; // page 0 = cover

  // Navigation helpers
  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  // Current content page (0-indexed into result.pages)
  const contentPageIndex = currentPage - 1;
  const contentPage: Page | undefined = result?.pages[contentPageIndex];

  // Page label
  const pageLabel =
    currentPage === 0
      ? 'Cover'
      : `${currentPage} / ${totalContentPages}`;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-page">
      {/* Page area */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-hidden"
      >
        {currentPage === 0 ? (
          <CoverPage pageWidth={pageWidth} pageHeight={pageHeight} />
        ) : contentPage ? (
          <div
            className="relative bg-page"
            style={{ width: pageWidth, height: pageHeight }}
          >
            {contentPage.els.map((el, i) => renderElement(el, i))}
          </div>
        ) : null}
      </div>

      {/* Page indicator */}
      <div className="flex items-center gap-3 py-2 text-mute font-joystix text-xs select-none">
        <button
          type="button"
          className="px-2 py-1 disabled:opacity-30"
          disabled={currentPage === 0}
          onClick={goPrev}
          aria-label="Previous page"
        >
          &larr;
        </button>
        <span className="min-w-[5rem] text-center">{pageLabel}</span>
        <button
          type="button"
          className="px-2 py-1 disabled:opacity-30"
          disabled={currentPage >= totalPages - 1}
          onClick={goNext}
          aria-label="Next page"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
