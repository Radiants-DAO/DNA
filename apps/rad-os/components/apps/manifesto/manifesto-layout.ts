// ---------------------------------------------------------------------------
// manifesto-layout.ts — Paginated pretext layout engine for the manifesto book
// ---------------------------------------------------------------------------
//
// Pure function: takes ManifestoElement[] + page dimensions → PaginationResult
// (array of pages, each containing positioned layout elements).
//
// Key features:
// - Cursor checkpoints: when Y exceeds page height minus margin, start new page
// - Obstacle avoidance: images act as rect obstacles, text wraps around them
// - Page-break rules: headings need room for 1+ body lines, images push to next page
// - Font sizes from resolveFluid (body = 'base', heading = 'xl')
// - Spacing from pretext-type-scale multipliers × bodyLh
// ---------------------------------------------------------------------------

import {
  prepareWithSegments,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext';
import {
  getRectIntervalsForBand,
  carveTextLineSlots,
  type Interval,
  type Rect,
} from '@chenglou/pretext/demos/wrap-geometry';
import {
  resolveFluid,
  spacing,
  lineHeight as lhScale,
} from '@rdna/radiants/patterns/pretext-type-scale';
import type { ManifestoElement } from './manifesto-data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_MARGIN = 32;
const BODY_FONT_FAMILY = 'Mondwest';
const HEADING_FONT_FAMILY = 'Joystix Monospace';
const IMAGE_PLACEHOLDER_H = 160;
const MIN_SLOT_WIDTH = 50;

// Padding around rect obstacles when carving text line slots
const OBS_H_PAD = 8;
const OBS_V_PAD = 4;

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type PageEl =
  | { kind: 'line'; x: number; y: number; text: string; font: string }
  | { kind: 'heading-line'; x: number; y: number; text: string; font: string }
  | {
      kind: 'image';
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      alt: string;
      src: string;
    }
  | { kind: 'rule'; x: number; y: number; w: number };

export interface Page {
  els: PageEl[];
}

export interface PaginationResult {
  pages: Page[];
  bodyFontSize: number;
  bodyLh: number;
}

// ---------------------------------------------------------------------------
// Obstacle state (per-image drag/resize positions)
// ---------------------------------------------------------------------------

export interface ImageObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pageIndex: number;
}

// ---------------------------------------------------------------------------
// Prepare cache — keyed by "font::text" to avoid re-measuring identical text
// ---------------------------------------------------------------------------

function getPrepared(
  cache: Map<string, PreparedTextWithSegments>,
  text: string,
  font: string,
): PreparedTextWithSegments {
  const key = `${font}::${text}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const prep = prepareWithSegments(text, font);
  cache.set(key, prep);
  return prep;
}

// ---------------------------------------------------------------------------
// Line layout with obstacle avoidance
// ---------------------------------------------------------------------------

/**
 * Lay out lines of prepared text, carving around rect obstacles at each
 * Y band. Returns the lines placed, the final cursor, and the final Y.
 * Stops when text is exhausted or Y exceeds maxY.
 */
function layoutLinesWithObstacles(
  prep: PreparedTextWithSegments,
  startCursor: LayoutCursor,
  x: number,
  startY: number,
  layoutW: number,
  lineH: number,
  maxY: number,
  obstacles: Rect[],
): {
  lines: { x: number; y: number; text: string }[];
  cursor: LayoutCursor;
  y: number;
  exhausted: boolean;
} {
  let cursor = startCursor;
  let y = startY;
  const lines: { x: number; y: number; text: string }[] = [];

  while (y + lineH <= maxY) {
    // Carve available slots around obstacles at this line's Y band
    const blocked = getRectIntervalsForBand(
      obstacles,
      y,
      y + lineH,
      OBS_H_PAD,
      OBS_V_PAD,
    );
    const slots = carveTextLineSlots(
      { left: x, right: x + layoutW },
      blocked,
    ).filter((s) => s.right - s.left >= MIN_SLOT_WIDTH);

    if (slots.length === 0) {
      // Fully blocked by obstacles — skip this band
      y += lineH;
      continue;
    }

    // Use widest available slot
    const slot = slots.reduce((best, s) =>
      s.right - s.left > best.right - best.left ? s : best,
    );

    const line = layoutNextLine(prep, cursor, slot.right - slot.left);
    if (!line) return { lines, cursor, y, exhausted: true };

    lines.push({ x: slot.left, y, text: line.text });
    cursor = line.end;
    y += lineH;
  }

  // Check if text is actually exhausted at this point
  const peek = layoutNextLine(prep, cursor, layoutW);
  return { lines, cursor, y, exhausted: peek === null };
}

// ---------------------------------------------------------------------------
// Main pagination function
// ---------------------------------------------------------------------------

export function paginateManifesto(
  elements: ManifestoElement[],
  pageWidth: number,
  pageHeight: number,
  imageObstacles: ImageObstacle[],
  cache: Map<string, PreparedTextWithSegments>,
): PaginationResult {
  const pages: Page[] = [];
  const layoutW = pageWidth - PAGE_MARGIN * 2;
  const maxY = pageHeight - PAGE_MARGIN;

  if (layoutW <= 0 || maxY <= PAGE_MARGIN) {
    return { pages: [], bodyFontSize: 14, bodyLh: 19 };
  }

  // Resolve sizes from layout width
  const bodyFontSize = resolveFluid('base', layoutW);
  const headingFontSize = resolveFluid('xl', layoutW);
  const bodyLh = bodyFontSize * lhScale.snug;
  const headingLh = headingFontSize * lhScale.none;

  const bodyFont = `${bodyFontSize}px '${BODY_FONT_FAMILY}'`;
  const headingFont = `bold ${headingFontSize}px '${HEADING_FONT_FAMILY}'`;

  let currentPage: PageEl[] = [];
  let y = PAGE_MARGIN;
  let pageIndex = 0;

  function startNewPage() {
    pages.push({ els: currentPage });
    currentPage = [];
    pageIndex++;
    y = PAGE_MARGIN;
  }

  function spaceLeft() {
    return maxY - y;
  }

  // Get obstacles for current page as Rects for wrap-geometry
  function pageObstacleRects(): Rect[] {
    return imageObstacles
      .filter((o) => o.pageIndex === pageIndex)
      .map((o) => ({ x: o.x, y: o.y, width: o.w, height: o.h }));
  }

  for (let ei = 0; ei < elements.length; ei++) {
    const element = elements[ei]!;

    switch (element.kind) {
      case 'heading': {
        // Space needed: headingBefore gap + heading line + headingAfter gap + 1 body line
        const headingSpace =
          bodyLh * spacing.headingBefore +
          headingLh +
          bodyLh * spacing.headingAfter;

        // Don't orphan heading at bottom — need room for at least 1 body line after
        if (spaceLeft() < headingSpace + bodyLh) {
          startNewPage();
        }

        y += bodyLh * spacing.headingBefore;

        const prep = getPrepared(cache, element.text, headingFont);
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

        while (true) {
          if (y + headingLh > maxY) {
            startNewPage();
          }
          const line = layoutNextLine(prep, cursor, layoutW);
          if (!line) break;

          currentPage.push({
            kind: 'heading-line',
            x: PAGE_MARGIN,
            y,
            text: line.text,
            font: headingFont,
          });
          cursor = line.end;
          y += headingLh;
        }

        y += bodyLh * spacing.headingAfter;
        break;
      }

      case 'paragraph': {
        const prep = getPrepared(cache, element.text, bodyFont);
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

        // Layout paragraph lines, potentially spanning multiple pages
        let done = false;
        while (!done) {
          if (y + bodyLh > maxY) {
            startNewPage();
          }

          const obstacles = pageObstacleRects();
          const result = layoutLinesWithObstacles(
            prep,
            cursor,
            PAGE_MARGIN,
            y,
            layoutW,
            bodyLh,
            maxY,
            obstacles,
          );

          for (const line of result.lines) {
            currentPage.push({
              kind: 'line',
              x: line.x,
              y: line.y,
              text: line.text,
              font: bodyFont,
            });
          }

          cursor = result.cursor;
          y = result.y;

          if (result.exhausted) {
            done = true;
          } else {
            // More text but page is full — continue on next page
            startNewPage();
          }
        }

        y += bodyLh * spacing.paragraph;
        break;
      }

      case 'image': {
        const imgH = IMAGE_PLACEHOLDER_H;

        // Image doesn't fit on current page? Push to next.
        if (y + imgH > maxY) {
          startNewPage();
        }

        // Check if user has positioned this image (obstacle state)
        const userObs = imageObstacles.find(
          (o) => o.id === element.id && o.pageIndex === pageIndex,
        );

        const imgX = userObs?.x ?? PAGE_MARGIN;
        const imgY = userObs?.y ?? y;
        const imgW = userObs?.w ?? layoutW;
        const imgHFinal = userObs?.h ?? imgH;

        currentPage.push({
          kind: 'image',
          id: element.id,
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgHFinal,
          alt: element.alt,
          src: element.src,
        });

        // If no user-positioned obstacle, advance Y past the image
        if (!userObs) {
          y += imgHFinal + bodyLh * spacing.paragraph;
        }
        break;
      }

      case 'rule': {
        const ruleSpace = bodyLh * spacing.rule * 2 + 1;
        if (spaceLeft() < ruleSpace) {
          startNewPage();
        }
        y += bodyLh * spacing.rule;
        currentPage.push({
          kind: 'rule',
          x: PAGE_MARGIN,
          y,
          w: layoutW,
        });
        y += 1; // rule thickness
        y += bodyLh * spacing.rule;
        break;
      }
    }
  }

  // Push final page if it has content
  if (currentPage.length > 0) {
    pages.push({ els: currentPage });
  }

  return { pages, bodyFontSize, bodyLh };
}
