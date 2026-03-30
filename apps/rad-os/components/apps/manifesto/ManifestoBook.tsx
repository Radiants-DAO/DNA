'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PreparedTextWithSegments } from '@chenglou/pretext';
import { useContainerSize } from '@/hooks/useContainerSize';
import { MANIFESTO_ELEMENTS, ALL_TRIGGERS, ALL_GLOSSARY } from './manifesto-data';
import type { ImageTrigger, GlossaryTerm } from './manifesto-data';
import {
  paginateManifesto,
  type ImageObstacle,
  type Page,
  type PageEl,
  type PaginationResult,
} from './manifesto-layout';
import { CoverPage } from './CoverPage';
import { ForwardPage } from './ForwardPage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_MARGIN = 32;

// ---------------------------------------------------------------------------
// Trigger-aware line renderer
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Annotation types — unified for matching against line text
// ---------------------------------------------------------------------------

type Annotation =
  | { type: 'trigger'; trigger: ImageTrigger; phrase: string }
  | { type: 'glossary'; term: GlossaryTerm; phrase: string };

function buildAnnotations(triggers: ImageTrigger[], glossary: GlossaryTerm[]): Annotation[] {
  const anns: Annotation[] = [];
  for (const t of triggers) anns.push({ type: 'trigger', trigger: t, phrase: t.phrase });
  for (const g of glossary) anns.push({ type: 'glossary', term: g, phrase: g.term });
  // Sort longest phrase first to avoid partial matches
  anns.sort((a, b) => b.phrase.length - a.phrase.length);
  return anns;
}

function renderAnnotatedLine(
  lineText: string,
  x: number,
  y: number,
  font: string,
  annotations: Annotation[],
  activeTriggers: Map<string, ImageTrigger>,
  onToggle: (trigger: ImageTrigger) => void,
  idx: number,
  justified?: { segments: { text: string; width: number; isSpace: boolean }[]; maxWidth: number; isLast: boolean },
) {
  // Find all annotation matches with their positions
  const matches: { start: number; end: number; ann: Annotation }[] = [];
  for (const ann of annotations) {
    const pos = lineText.indexOf(ann.phrase);
    if (pos !== -1) {
      matches.push({ start: pos, end: pos + ann.phrase.length, ann });
    }
  }

  const hasAnnotations = matches.length > 0;

  // ── Justified line, no annotations: flexbox word segments ──
  if (justified && !hasAnnotations) {
    const words = justified.segments.filter(s => !s.isSpace);
    if (justified.isLast || words.length <= 1) {
      // Last line or single word: left-aligned
      return (
        <div key={idx} className="absolute text-head" style={{ left: x, top: y, font, width: justified.maxWidth }}>
          {words.map((w, i) => <span key={i}>{w.text}</span>).reduce<React.ReactNode[]>((acc, el, i) => {
            if (i > 0) acc.push(' ');
            acc.push(el);
            return acc;
          }, [])}
        </div>
      );
    }
    return (
      <div
        key={idx}
        className="absolute text-head"
        style={{
          left: x, top: y, font,
          width: justified.maxWidth,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {words.map((w, i) => <span key={i}>{w.text}</span>)}
      </div>
    );
  }

  // ── Justified line WITH annotations: CSS text-align justify ──
  if (justified && hasAnnotations) {
    matches.sort((a, b) => a.start - b.start);
    const filtered: typeof matches = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        filtered.push(m);
        lastEnd = m.end;
      }
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    let partKey = 0;

    for (const m of filtered) {
      if (m.start > cursor) {
        parts.push(<span key={`p-${partKey++}`}>{lineText.slice(cursor, m.start)}</span>);
      }
      const text = lineText.slice(m.start, m.end);
      if (m.ann.type === 'trigger') {
        const trig = m.ann.trigger;
        const isActive = activeTriggers.has(trig.id);
        parts.push(
          <span
            key={trig.id}
            className={`cursor-pointer ${isActive ? 'bg-accent/50' : 'bg-accent/30'}`}
            title="tap to show image"
            onClick={(e) => { e.stopPropagation(); onToggle(trig); }}
          >{text}</span>,
        );
      } else {
        parts.push(
          <span
            key={`g-${partKey++}`}
            className="cursor-help hover:bg-link/20 transition-colors"
            title={m.ann.term.definition}
          >{text}</span>,
        );
      }
      cursor = m.end;
    }
    if (cursor < lineText.length) {
      parts.push(<span key={`p-${partKey++}`}>{lineText.slice(cursor)}</span>);
    }

    return (
      <div
        key={idx}
        className="absolute text-head"
        style={{
          left: x, top: y, font,
          width: justified.maxWidth,
          textAlign: justified.isLast ? 'left' : 'justify',
          textAlignLast: justified.isLast ? undefined : 'justify',
        }}
      >
        {parts}
      </div>
    );
  }

  // ── Non-justified (greedy) with no annotations ──
  if (!hasAnnotations) {
    return (
      <div key={idx} className="absolute text-head" style={{ left: x, top: y, whiteSpace: 'pre', font }}>
        {lineText}
      </div>
    );
  }

  // ── Non-justified with annotations ──
  matches.sort((a, b) => a.start - b.start);
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let partKey = 0;

  for (const m of filtered) {
    if (m.start > cursor) {
      parts.push(<span key={`p-${partKey++}`}>{lineText.slice(cursor, m.start)}</span>);
    }
    const text = lineText.slice(m.start, m.end);
    if (m.ann.type === 'trigger') {
      const trig = m.ann.trigger;
      const isActive = activeTriggers.has(trig.id);
      parts.push(
        <span
          key={trig.id}
          className={`cursor-pointer ${isActive ? 'bg-accent/50' : 'bg-accent/30'}`}
          title="tap to show image"
          onClick={(e) => { e.stopPropagation(); onToggle(trig); }}
        >{text}</span>,
      );
    } else {
      parts.push(
        <span
          key={`g-${partKey++}`}
          className="cursor-help hover:bg-link/20 transition-colors"
          title={m.ann.term.definition}
        >{text}</span>,
      );
    }
    cursor = m.end;
  }
  if (cursor < lineText.length) {
    parts.push(<span key={`p-${partKey++}`}>{lineText.slice(cursor)}</span>);
  }

  return (
    <div key={idx} className="absolute text-head" style={{ left: x, top: y, whiteSpace: 'pre', font }}>
      {parts}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compute obstacle position from an active trigger
// ---------------------------------------------------------------------------

function computeObstacleForTrigger(
  trigger: ImageTrigger,
  page: Page,
  pageIndex: number,
  colWidth: number,
): ImageObstacle {
  // Find the line containing the trigger phrase
  let triggerY = PAGE_MARGIN + 40; // fallback
  let triggerX = PAGE_MARGIN;
  for (const el of page.els) {
    if ((el.kind === 'line' || el.kind === 'heading-line') && el.text.includes(trigger.phrase)) {
      triggerY = el.y + 20; // just below the trigger line
      triggerX = el.x;
      break;
    }
  }

  const maxW = colWidth * 0.5;
  const aspect = (trigger.naturalWidth && trigger.naturalHeight)
    ? trigger.naturalWidth / trigger.naturalHeight
    : 16 / 9;
  const w = maxW;
  const h = w / aspect;

  return {
    id: trigger.id,
    x: triggerX + colWidth - maxW, // right-align in column
    y: triggerY,
    w,
    h,
    pageIndex,
  };
}

// ---------------------------------------------------------------------------
// Element renderers
// ---------------------------------------------------------------------------

// Pre-build annotations once (triggers + glossary merged)
const ANNOTATIONS = buildAnnotations(ALL_TRIGGERS, ALL_GLOSSARY);

function renderElement(
  el: PageEl,
  idx: number,
  activeTriggers: Map<string, ImageTrigger>,
  onToggle: (trigger: ImageTrigger) => void,
) {
  switch (el.kind) {
    case 'line':
      return renderAnnotatedLine(
        el.text, el.x, el.y, el.font,
        ANNOTATIONS, activeTriggers, onToggle, idx,
        el.justified,
      );

    case 'heading-line':
      return (
        <div
          key={idx}
          className="absolute text-head"
          style={{ left: el.x, top: el.y, whiteSpace: 'pre', font: el.font }}
        >
          {el.text}
        </div>
      );

    case 'section-title':
      // Rendered as a full centered page — see page-level rendering below
      return null;

    case 'rule':
      return (
        <div
          key={idx}
          className="absolute bg-head"
          style={{ left: el.x, top: el.y, width: el.w, height: 1 }}
        />
      );

    case 'col-rule':
      return (
        <div
          key={`col-rule-${idx}`}
          className="absolute bg-head opacity-20"
          style={{ left: el.x, top: el.y, width: 1, height: el.h }}
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
  const [activeTriggers, setActiveTriggers] = useState<Map<string, ImageTrigger>>(new Map());
  const [imageObstacles, setImageObstacles] = useState<ImageObstacle[]>([]);

  // Toggle a trigger on/off
  const handleToggleTrigger = useCallback((trigger: ImageTrigger) => {
    setActiveTriggers((prev) => {
      const next = new Map(prev);
      if (next.has(trigger.id)) {
        next.delete(trigger.id);
      } else {
        next.set(trigger.id, trigger);
      }
      return next;
    });
  }, []);

  // Single effect: paginate first (no obstacles), then compute obstacle
  // positions from the result, then re-paginate WITH obstacles.
  // Two-pass approach avoids the circular dependency.
  useEffect(() => {
    if (pageWidth <= 0 || pageHeight <= 0) return;
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;

      // Pass 1: paginate without obstacles to find trigger line positions
      const pass1 = paginateManifesto(
        MANIFESTO_ELEMENTS,
        pageWidth,
        pageHeight,
        [], // no obstacles
        cacheRef.current,
      );

      if (activeTriggers.size === 0) {
        // No active triggers — pass 1 is final
        setImageObstacles([]);
        setResult(pass1);
        return;
      }

      // Compute column width
      const totalMargin = PAGE_MARGIN * 2;
      const colGap = 16;
      const colRuleW = 1;
      const numCols = 2;
      const totalGutter = (numCols - 1) * (colGap * 2 + colRuleW);
      const colWidth = Math.floor((pageWidth - totalMargin - totalGutter) / numCols);

      // Compute obstacle positions from pass 1 layout
      const obstacles: ImageObstacle[] = [];
      for (const trigger of activeTriggers.values()) {
        for (let pi = 0; pi < pass1.pages.length; pi++) {
          const page = pass1.pages[pi]!;
          const hasPhrase = page.els.some(
            (el) => (el.kind === 'line' || el.kind === 'heading-line') && el.text.includes(trigger.phrase),
          );
          if (hasPhrase) {
            obstacles.push(computeObstacleForTrigger(trigger, page, pi, colWidth));
            break;
          }
        }
      }

      // Pass 2: re-paginate WITH obstacles so text reflows around images
      const pass2 = paginateManifesto(
        MANIFESTO_ELEMENTS,
        pageWidth,
        pageHeight,
        obstacles,
        cacheRef.current,
      );

      setImageObstacles(obstacles);
      setResult(pass2);
    });

    return () => {
      cancelled = true;
    };
  }, [pageWidth, pageHeight, activeTriggers]);

  // Total page count: cover + forward + content pages
  const totalContentPages = result?.pages.length ?? 0;
  const SPECIAL_PAGES = 2; // 0 = cover, 1 = forward
  const totalPages = SPECIAL_PAGES + totalContentPages;

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
  const contentPageIndex = currentPage - SPECIAL_PAGES;
  const contentPage: Page | undefined = result?.pages[contentPageIndex];

  // Page label
  const pageLabel =
    currentPage === 0
      ? 'Cover'
      : currentPage === 1
        ? 'Forward'
        : `${currentPage - SPECIAL_PAGES + 1} / ${totalContentPages}`;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-card">
      {/* Page area */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-hidden"
      >
        {currentPage === 0 ? (
          <CoverPage pageWidth={pageWidth} pageHeight={pageHeight} />
        ) : currentPage === 1 ? (
          <ForwardPage pageWidth={pageWidth} pageHeight={pageHeight} />
        ) : contentPage && contentPage.els.length === 1 && contentPage.els[0]!.kind === 'section-title' ? (
          // Section title page — centered like cover/forward
          <div
            className="relative bg-card flex items-center justify-center"
            style={{ width: pageWidth, height: pageHeight }}
          >
            <div
              className="text-head text-center px-8"
              style={{ font: contentPage.els[0]!.font }}
            >
              {contentPage.els[0]!.text}
            </div>
          </div>
        ) : contentPage ? (
          <div
            className="relative bg-card"
            style={{ width: pageWidth, height: pageHeight }}
          >
            {contentPage.els.map((el, i) =>
              renderElement(el, i, activeTriggers, handleToggleTrigger),
            )}
            {/* Render active trigger images/videos */}
            {Array.from(activeTriggers.values()).map((trigger) => {
              const obs = imageObstacles.find((o) => o.id === trigger.id);
              if (!obs || obs.pageIndex !== contentPageIndex) return null;
              const isPlaceholder = trigger.src.startsWith('/placeholders/');
              const isVideo = trigger.src.endsWith('.mp4');
              if (isPlaceholder) {
                return (
                  <div
                    key={trigger.id}
                    className="absolute bg-depth flex items-center justify-center text-mute font-joystix text-xs p-2 text-center leading-relaxed cursor-pointer"
                    style={{ left: obs.x, top: obs.y, width: obs.w, height: obs.h }}
                    onClick={() => handleToggleTrigger(trigger)}
                  >
                    {trigger.phrase}
                  </div>
                );
              }
              if (isVideo) {
                return (
                  <video
                    key={trigger.id}
                    src={trigger.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute object-cover cursor-pointer"
                    style={{ left: obs.x, top: obs.y, width: obs.w, height: obs.h }}
                    onClick={() => handleToggleTrigger(trigger)}
                  />
                );
              }
              return (
                <img
                  key={trigger.id}
                  src={trigger.src}
                  alt={trigger.phrase}
                  className="absolute object-cover cursor-pointer"
                  style={{ left: obs.x, top: obs.y, width: obs.w, height: obs.h }}
                  onClick={() => handleToggleTrigger(trigger)}
                />
              );
            })}
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
