import {
  layoutNextLine,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
// Official upstream export used by Pretext's obstacle-wrap demos.
import {
  carveTextLineSlots,
  getRectIntervalsForBand,
  type Rect,
} from '@chenglou/pretext/demos/wrap-geometry';
import type { PretextBlock } from '../../markdown';
import {
  lineHeight,
  resolveFluid,
  spacing,
} from '@rdna/radiants/patterns/pretext-type-scale';
import {
  measureHyphenWidth,
  measureSpaceWidth,
} from '@rdna/radiants/patterns/pretext-prepare';
import {
  optimalLayout,
  type JustifiedSegment,
} from '@rdna/radiants/patterns/pretext-justify';
import { getPreparedText } from '../shared/prepared-text-cache';

const PAGE_MARGIN = 32;
const COLUMN_GAP = 16;
const COLUMN_RULE_WIDTH = 1;
const BODY_FONT_FAMILY = 'Mondwest';
const HEADING_FONT_FAMILY = 'Joystix Monospace';
const MIN_SLOT_WIDTH = 50;
const IMAGE_COLUMN_FRACTION = 0.52;
const OBS_H_PAD = 8;
const OBS_V_PAD = 4;

export type BookLayoutBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'section-title'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'rule' }
  | {
      kind: 'image';
      src: string;
      alt: string;
      width?: number;
      height?: number;
    };

export type BookPageEl =
  | {
      kind: 'line';
      x: number;
      y: number;
      text: string;
      font: string;
      maxWidth: number;
      justified?: {
        segments: JustifiedSegment[];
        maxWidth: number;
        isLast: boolean;
      };
    }
  | { kind: 'heading-line'; x: number; y: number; text: string; font: string }
  | { kind: 'section-title'; text: string; font: string }
  | { kind: 'rule'; x: number; y: number; w: number }
  | { kind: 'col-rule'; x: number; y: number; h: number }
  | { kind: 'image'; x: number; y: number; w: number; h: number; src: string; alt: string };

export interface BookPage {
  els: BookPageEl[];
}

export interface BookObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pageIndex: number;
}

export interface BookPaginationResult {
  pages: BookPage[];
  bodyFontSize: number;
  headingFontSize: number;
  bodyLh: number;
  headingLh: number;
  normalSpaceW: number;
  columnWidth: number;
}

export interface PaginateBookLayoutOptions {
  blocks: BookLayoutBlock[];
  pageWidth: number;
  pageHeight: number;
  columns: 1 | 2;
  obstacles?: BookObstacle[];
  cache?: Map<string, PreparedTextWithSegments>;
}

interface Column {
  x: number;
  width: number;
}

function buildColumns(pageWidth: number, columns: 1 | 2): Column[] {
  const totalMargin = PAGE_MARGIN * 2;
  const totalGutter = (columns - 1) * (COLUMN_GAP * 2 + COLUMN_RULE_WIDTH);
  const availableWidth = pageWidth - totalMargin - totalGutter;
  const columnWidth = Math.floor(availableWidth / columns);

  return Array.from({ length: columns }, (_, index) => ({
    x:
      PAGE_MARGIN +
      index * (columnWidth + COLUMN_GAP * 2 + COLUMN_RULE_WIDTH),
    width: columnWidth,
  }));
}

function layoutLinesWithObstacles(
  prepared: PreparedTextWithSegments,
  startCursor: LayoutCursor,
  x: number,
  startY: number,
  layoutWidth: number,
  lineHeightPx: number,
  maxY: number,
  obstacles: Rect[],
): {
  lines: { x: number; y: number; text: string; maxWidth: number }[];
  cursor: LayoutCursor;
  y: number;
  exhausted: boolean;
} {
  let cursor = startCursor;
  let y = startY;
  const lines: { x: number; y: number; text: string; maxWidth: number }[] = [];

  while (y + lineHeightPx <= maxY) {
    const blocked = getRectIntervalsForBand(
      obstacles,
      y,
      y + lineHeightPx,
      OBS_H_PAD,
      OBS_V_PAD,
    );
    const slots = carveTextLineSlots(
      { left: x, right: x + layoutWidth },
      blocked,
    ).filter((slot) => slot.right - slot.left >= MIN_SLOT_WIDTH);

    if (slots.length === 0) {
      y += lineHeightPx;
      continue;
    }

    const slot = slots.reduce((best, candidate) =>
      candidate.right - candidate.left > best.right - best.left
        ? candidate
        : best,
    );

    const line = layoutNextLine(prepared, cursor, slot.right - slot.left);
    if (!line) {
      return { lines, cursor, y, exhausted: true };
    }

    lines.push({
      x: slot.left,
      y,
      text: line.text,
      maxWidth: slot.right - slot.left,
    });
    cursor = line.end;
    y += lineHeightPx;
  }

  const peek = layoutNextLine(prepared, cursor, layoutWidth);
  return { lines, cursor, y, exhausted: peek === null };
}

function resolveImageSize(
  block: Extract<BookLayoutBlock, { kind: 'image' }>,
  columnWidth: number,
) {
  const width = Math.min(columnWidth * IMAGE_COLUMN_FRACTION, columnWidth - 24);
  const aspectRatio =
    block.width && block.height && block.height > 0
      ? block.width / block.height
      : 4 / 3;

  return {
    width,
    height: width / aspectRatio,
  };
}

function formatListItem(item: string, ordered: boolean, index: number) {
  return ordered ? `${index + 1}. ${item}` : `• ${item}`;
}

export function pretextBlocksToBookLayoutBlocks(
  blocks: PretextBlock[],
  assets: Record<string, string> = {},
): BookLayoutBlock[] {
  const mapped: BookLayoutBlock[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        mapped.push({
          kind: block.depth === 1 ? 'section-title' : 'heading',
          text: block.text,
        });
        break;

      case 'paragraph':
        mapped.push({ kind: 'paragraph', text: block.text });
        break;

      case 'blockquote':
        mapped.push({ kind: 'paragraph', text: block.text });
        break;

      case 'list':
        for (const [index, item] of block.items.entries()) {
          mapped.push({
            kind: 'paragraph',
            text: formatListItem(item, block.ordered, index),
          });
        }
        break;

      case 'rule':
        mapped.push({ kind: 'rule' });
        break;

      case 'code':
        mapped.push({ kind: 'paragraph', text: block.value });
        break;

      case 'image':
        mapped.push({
          kind: 'image',
          alt: block.alt,
          src: assets[block.src] ?? block.src,
        });
        break;
    }
  }

  return mapped;
}

export function paginateBookLayout({
  blocks,
  pageWidth,
  pageHeight,
  columns,
  obstacles = [],
  cache = new Map<string, PreparedTextWithSegments>(),
}: PaginateBookLayoutOptions): BookPaginationResult {
  const pages: BookPage[] = [];
  const pageBlocks: BookPageEl[] = [];
  const inlineObstacles: BookObstacle[] = [];
  const builtColumns = buildColumns(pageWidth, columns);
  const maxY = pageHeight - PAGE_MARGIN;

  if (builtColumns.length === 0 || builtColumns[0]!.width <= 0 || maxY <= PAGE_MARGIN) {
    return {
      pages: [],
      bodyFontSize: 14,
      headingFontSize: 20,
      bodyLh: 14 * lineHeight.snug,
      headingLh: 20 * lineHeight.none,
      normalSpaceW: 4,
      columnWidth: 0,
    };
  }

  const columnWidth = builtColumns[0]!.width;
  const bodyFontSize = resolveFluid('base', columnWidth);
  const headingFontSize = resolveFluid('xl', columnWidth);
  const bodyLh = bodyFontSize * lineHeight.snug;
  const headingLh = headingFontSize * lineHeight.none;
  const bodyFont = `${bodyFontSize}px '${BODY_FONT_FAMILY}'`;
  const headingFont = `bold ${headingFontSize}px '${HEADING_FONT_FAMILY}'`;
  const spaceWidth = measureSpaceWidth(bodyFont);
  const hyphenWidth = measureHyphenWidth(bodyFont);
  const ruleX =
    columns > 1
      ? builtColumns[0]!.x + builtColumns[0]!.width + COLUMN_GAP
      : null;

  let currentPageEls = pageBlocks;
  let currentPageIndex = 0;
  let currentColumnIndex = 0;
  let y = PAGE_MARGIN;
  let imageCounter = 0;

  function currentColumn() {
    return builtColumns[currentColumnIndex]!;
  }

  function pushCurrentPage() {
    if (currentPageEls.length === 0) {
      return;
    }

    if (ruleX !== null) {
      currentPageEls.push({
        kind: 'col-rule',
        x: ruleX,
        y: PAGE_MARGIN,
        h: maxY - PAGE_MARGIN,
      });
    }

    pages.push({ els: currentPageEls });
    currentPageEls = [];
  }

  function nextColumn(): boolean {
    if (currentColumnIndex < builtColumns.length - 1) {
      currentColumnIndex += 1;
      y = PAGE_MARGIN;
      return true;
    }

    return false;
  }

  function advanceOrStartNewPage() {
    if (!nextColumn()) {
      pushCurrentPage();
      currentPageIndex += 1;
      currentColumnIndex = 0;
      y = PAGE_MARGIN;
    }
  }

  function pageObstacleRects() {
    return [...obstacles, ...inlineObstacles]
      .filter((obstacle) => obstacle.pageIndex === currentPageIndex)
      .map((obstacle) => ({
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.w,
        height: obstacle.h,
      }));
  }

  function spaceLeft() {
    return maxY - y;
  }

  for (const block of blocks) {
    switch (block.kind) {
      case 'section-title': {
        pushCurrentPage();
        pages.push({
          els: [{ kind: 'section-title', text: block.text, font: headingFont }],
        });
        currentPageIndex += 1;
        currentColumnIndex = 0;
        y = PAGE_MARGIN;
        break;
      }

      case 'heading': {
        const headingSpace =
          bodyLh * spacing.headingBefore +
          headingLh +
          bodyLh * spacing.headingAfter;

        if (spaceLeft() < headingSpace + bodyLh) {
          advanceOrStartNewPage();
        }

        y += bodyLh * spacing.headingBefore;

        const prepared = getPreparedText(cache, block.text, headingFont);
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

        while (true) {
          if (y + headingLh > maxY) {
            advanceOrStartNewPage();
          }

          const line = layoutNextLine(prepared, cursor, currentColumn().width);
          if (!line) {
            break;
          }

          currentPageEls.push({
            kind: 'heading-line',
            x: currentColumn().x,
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
        const prepared = getPreparedText(cache, block.text, bodyFont);
        const totalObstacles = obstacles.length + inlineObstacles.length;

        if (totalObstacles === 0) {
          const justifiedLines = optimalLayout(
            prepared,
            columnWidth,
            spaceWidth,
            hyphenWidth,
          );

          for (const line of justifiedLines) {
            if (y + bodyLh > maxY) {
              advanceOrStartNewPage();
            }

            currentPageEls.push({
              kind: 'line',
              x: currentColumn().x,
              y,
              text: line.segments.map((segment) => segment.text).join(''),
              font: bodyFont,
              maxWidth: line.maxWidth,
              justified: {
                segments: line.segments,
                maxWidth: line.maxWidth,
                isLast: line.isLast,
              },
            });
            y += bodyLh;
          }
        } else {
          let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
          let exhausted = false;

          while (!exhausted) {
            if (y + bodyLh > maxY) {
              advanceOrStartNewPage();
            }

            const lines = layoutLinesWithObstacles(
              prepared,
              cursor,
              currentColumn().x,
              y,
              currentColumn().width,
              bodyLh,
              maxY,
              pageObstacleRects(),
            );

            for (const line of lines.lines) {
              currentPageEls.push({
                kind: 'line',
                x: line.x,
                y: line.y,
                text: line.text,
                font: bodyFont,
                maxWidth: line.maxWidth,
              });
            }

            cursor = lines.cursor;
            y = lines.y;
            exhausted = lines.exhausted;

            if (!exhausted) {
              advanceOrStartNewPage();
            }
          }
        }

        y += bodyLh * spacing.paragraph;
        break;
      }

      case 'rule': {
        const ruleSpace = bodyLh * spacing.rule * 2 + 1;
        if (spaceLeft() < ruleSpace) {
          advanceOrStartNewPage();
        }

        y += bodyLh * spacing.rule;
        currentPageEls.push({
          kind: 'rule',
          x: currentColumn().x,
          y,
          w: currentColumn().width,
        });
        y += 1;
        y += bodyLh * spacing.rule;
        break;
      }

      case 'image': {
        const { width, height } = resolveImageSize(block, currentColumn().width);

        if (spaceLeft() < bodyLh) {
          advanceOrStartNewPage();
        }

        const x = currentColumn().x + currentColumn().width - width;
        const obstacle: BookObstacle = {
          id: `book-image-${imageCounter++}`,
          x,
          y,
          w: width,
          h: height,
          pageIndex: currentPageIndex,
        };

        inlineObstacles.push(obstacle);
        currentPageEls.push({
          kind: 'image',
          x,
          y,
          w: width,
          h: height,
          src: block.src,
          alt: block.alt,
        });
        y += bodyLh * spacing.paragraph;
        break;
      }
    }
  }

  pushCurrentPage();

  return {
    pages,
    bodyFontSize,
    headingFontSize,
    bodyLh,
    headingLh,
    normalSpaceW: spaceWidth,
    columnWidth,
  };
}
