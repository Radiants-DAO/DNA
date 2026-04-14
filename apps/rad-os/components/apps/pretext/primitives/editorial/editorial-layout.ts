import {
  layout,
  layoutWithLines,
  layoutNextLine,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import {
  lineHeight,
  resolveFluid,
  spacing,
} from '@rdna/radiants/patterns/pretext-type-scale';
import type { HeadingBlock, PretextBlock } from '../../markdown';
import { getPreparedText } from '../shared/prepared-text-cache';

const OUTER_MARGIN = 40;
const COLUMN_GAP = 40;
const MIN_TWO_COLUMN_WIDTH = 960;
const DROP_CAP_GAP = 10;
const IMAGE_ASPECT_RATIO = 16 / 9;

const DISPLAY_FONT_FAMILY = "'Waves Blackletter CPC'";
const HEADING_FONT_FAMILY = "'Joystix Monospace'";
const BODY_FONT_FAMILY = 'Mondwest';
const CODE_FONT_FAMILY = "'PixelCode'";

export interface EditorialColumn {
  x: number;
  width: number;
}

export type EditorialLayoutElement =
  | {
      kind: 'line';
      x: number;
      y: number;
      text: string;
      font: string;
      lh: number;
      variant: 'body' | 'quote' | 'list' | 'code';
    }
  | {
      kind: 'heading-line';
      x: number;
      y: number;
      w: number;
      text: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lh: number;
      center: boolean;
    }
  | {
      kind: 'dropcap';
      x: number;
      y: number;
      w: number;
      h: number;
      letter: string;
      fontFamily: string;
      fontSize: number;
    }
  | {
      kind: 'pullquote';
      x: number;
      y: number;
      w: number;
      h: number;
      lines: string[];
      fontFamily: string;
      fontSize: number;
      lh: number;
    }
  | { kind: 'image'; x: number; y: number; w: number; h: number; src: string; alt: string }
  | { kind: 'rule'; x: number; y: number; w: number };

export interface EditorialLayoutResult {
  elements: EditorialLayoutElement[];
  columns: EditorialColumn[];
  columnCount: 1 | 2;
  height: number;
  bodyFont: string;
  bodyFontSize: number;
  bodyLh: number;
}

export interface ComputeEditorialLayoutOptions {
  blocks: PretextBlock[];
  containerWidth: number;
  desiredColumns: 1 | 2;
  dropCap: boolean;
  pullquote: boolean;
  assets?: Record<string, string>;
  cache?: Map<string, PreparedTextWithSegments>;
}

type EditorialFlowBlock =
  | { kind: 'heading'; depth: HeadingBlock['depth']; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'blockquote'; text: string }
  | { kind: 'pullquote'; text: string }
  | { kind: 'list-item'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'rule' };

interface HeadingStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeightPx: number;
  center: boolean;
}

function resolveColumnCount(
  desiredColumns: 1 | 2,
  containerWidth: number,
): 1 | 2 {
  return desiredColumns === 2 && containerWidth >= MIN_TWO_COLUMN_WIDTH ? 2 : 1;
}

function buildColumns(
  containerWidth: number,
  columnCount: 1 | 2,
): EditorialColumn[] {
  const contentWidth = Math.max(
    containerWidth - OUTER_MARGIN * 2 - (columnCount - 1) * COLUMN_GAP,
    240,
  );

  if (columnCount === 1) {
    return [{ x: OUTER_MARGIN, width: contentWidth }];
  }

  const columnWidth = Math.floor((contentWidth - COLUMN_GAP) / 2);

  return [
    { x: OUTER_MARGIN, width: columnWidth },
    { x: OUTER_MARGIN + columnWidth + COLUMN_GAP, width: columnWidth },
  ];
}

function resolveHeadingStyle(
  depth: HeadingBlock['depth'],
  containerWidth: number,
  lineWidth: number,
): HeadingStyle {
  if (depth === 1) {
    const fontSize = resolveFluid('3xl', containerWidth);
    return {
      fontFamily: DISPLAY_FONT_FAMILY,
      fontSize,
      fontWeight: 400,
      lineHeightPx: Math.round(fontSize * 1.02),
      center: false,
    };
  }

  if (depth === 2) {
    const fontSize = resolveFluid('xl', lineWidth);
    return {
      fontFamily: HEADING_FONT_FAMILY,
      fontSize,
      fontWeight: 700,
      lineHeightPx: Math.round(fontSize * 1.1),
      center: false,
    };
  }

  const fontSize = resolveFluid('lg', lineWidth);
  return {
    fontFamily: HEADING_FONT_FAMILY,
    fontSize,
    fontWeight: 700,
    lineHeightPx: Math.round(fontSize * 1.15),
    center: false,
  };
}

function resolveImageSize(columnWidth: number) {
  const width = Math.min(columnWidth, 560);
  return {
    width,
    height: Math.round(width / IMAGE_ASPECT_RATIO),
  };
}

function formatListItem(item: string, ordered: boolean, index: number) {
  return ordered ? `${index + 1}. ${item}` : `• ${item}`;
}

function pretextBlocksToEditorialFlow(
  blocks: PretextBlock[],
  pullquote: boolean,
  assets: Record<string, string>,
): EditorialFlowBlock[] {
  const mapped: EditorialFlowBlock[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        mapped.push({
          kind: 'heading',
          depth: block.depth,
          text: block.text,
        });
        break;

      case 'paragraph':
        mapped.push({ kind: 'paragraph', text: block.text });
        break;

      case 'blockquote':
        mapped.push({
          kind: pullquote ? 'pullquote' : 'blockquote',
          text: block.text,
        });
        break;

      case 'list':
        for (const [index, item] of block.items.entries()) {
          mapped.push({
            kind: 'list-item',
            text: formatListItem(item, block.ordered, index),
          });
        }
        break;

      case 'rule':
        mapped.push({ kind: 'rule' });
        break;

      case 'code':
        mapped.push({ kind: 'code', text: block.value });
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

function estimateTextHeight(
  cache: Map<string, PreparedTextWithSegments>,
  text: string,
  font: string,
  width: number,
  lineHeightPx: number,
) {
  if (!text.trim()) {
    return lineHeightPx;
  }

  return layout(getPreparedText(cache, text, font), width, lineHeightPx).lineCount * lineHeightPx;
}

function estimateFlowBlockHeight(
  block: EditorialFlowBlock,
  columnWidth: number,
  bodyFont: string,
  bodyLh: number,
  containerWidth: number,
  cache: Map<string, PreparedTextWithSegments>,
) {
  const quoteFontSize = Math.max(resolveFluid('lg', columnWidth) * 0.9, bodyLh / lineHeight.relaxed);
  const quoteLh = Math.round(quoteFontSize * lineHeight.relaxed);
  const quoteFont = `700 ${quoteFontSize}px ${BODY_FONT_FAMILY}`;
  const monoFontSize = resolveFluid('sm', columnWidth);
  const monoLh = Math.round(monoFontSize * lineHeight.relaxed);

  switch (block.kind) {
    case 'heading': {
      const heading = resolveHeadingStyle(block.depth, containerWidth, columnWidth);
      const height = estimateTextHeight(
        cache,
        block.text,
        `${heading.fontWeight} ${heading.fontSize}px ${heading.fontFamily}`,
        columnWidth,
        heading.lineHeightPx,
      );
      return bodyLh * spacing.headingBefore + height + bodyLh * spacing.headingAfter;
    }

    case 'paragraph':
    case 'list-item':
      return (
        estimateTextHeight(cache, block.text, bodyFont, columnWidth, bodyLh) +
        bodyLh * spacing.paragraph
      );

    case 'blockquote':
      return (
        estimateTextHeight(cache, block.text, quoteFont, columnWidth - 24, quoteLh) +
        bodyLh * spacing.paragraph
      );

    case 'pullquote': {
      const fontSize = resolveFluid('xl', columnWidth);
      const quoteWidth = Math.min(columnWidth, 420);
      const quoteLhPx = Math.round(fontSize * 1.15);
      return (
        estimateTextHeight(
          cache,
          block.text,
          `700 ${fontSize}px ${HEADING_FONT_FAMILY}`,
          quoteWidth - 32,
          quoteLhPx,
        ) +
        quoteLhPx +
        bodyLh * spacing.section
      );
    }

    case 'code':
      return (
        block.text.split('\n').length * monoLh +
        bodyLh * spacing.paragraph
      );

    case 'image':
      return resolveImageSize(columnWidth).height + bodyLh * spacing.section;

    case 'rule':
      return bodyLh * spacing.rule + 1 + bodyLh * spacing.rule;
  }
}

function pushTextLines(
  elements: EditorialLayoutElement[],
  cache: Map<string, PreparedTextWithSegments>,
  text: string,
  font: string,
  variant: Extract<EditorialLayoutElement, { kind: 'line' }>['variant'],
  x: number,
  y: number,
  width: number,
  lineHeightPx: number,
) {
  const prepared = getPreparedText(cache, text, font);
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let nextY = y;

  while (true) {
    const line = layoutNextLine(prepared, cursor, width);
    if (!line) {
      break;
    }

    elements.push({
      kind: 'line',
      x,
      y: nextY,
      text: line.text,
      font,
      lh: lineHeightPx,
      variant,
    });
    cursor = line.end;
    nextY += lineHeightPx;
  }

  return nextY;
}

function pushHeadingLines(
  elements: EditorialLayoutElement[],
  cache: Map<string, PreparedTextWithSegments>,
  text: string,
  heading: HeadingStyle,
  x: number,
  y: number,
  width: number,
) {
  const font = `${heading.fontWeight} ${heading.fontSize}px ${heading.fontFamily}`;
  const prepared = getPreparedText(cache, text, font);
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let nextY = y;

  while (true) {
    const line = layoutNextLine(prepared, cursor, width);
    if (!line) {
      break;
    }

    elements.push({
      kind: 'heading-line',
      x,
      y: nextY,
      w: width,
      text: line.text,
      fontFamily: heading.fontFamily,
      fontSize: heading.fontSize,
      fontWeight: heading.fontWeight,
      lh: heading.lineHeightPx,
      center: heading.center,
    });
    cursor = line.end;
    nextY += heading.lineHeightPx;
  }

  return nextY;
}

function pushParagraphWithDropCap(
  elements: EditorialLayoutElement[],
  cache: Map<string, PreparedTextWithSegments>,
  text: string,
  font: string,
  bodyFontSize: number,
  bodyLh: number,
  x: number,
  y: number,
  width: number,
) {
  const trimmed = text.trim();
  if (!trimmed) {
    return y;
  }

  const letter = trimmed[0]!;
  const remainder = trimmed.slice(letter.length).trimStart();
  const dropCapFontSize = Math.round(bodyFontSize * 4);
  const dropCapWidth = Math.round(dropCapFontSize * 0.72);
  const dropCapHeight = Math.round(bodyLh * 3.2);
  const wrappedLineCount = Math.max(2, Math.ceil(dropCapHeight / bodyLh));

  elements.push({
    kind: 'dropcap',
    x,
    y,
    w: dropCapWidth,
    h: dropCapHeight,
    letter,
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: dropCapFontSize,
  });

  const prepared = getPreparedText(cache, remainder, font);
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let nextY = y;
  let lineIndex = 0;

  while (true) {
    const lineX = lineIndex < wrappedLineCount ? x + dropCapWidth + DROP_CAP_GAP : x;
    const lineWidth =
      lineIndex < wrappedLineCount
        ? Math.max(width - dropCapWidth - DROP_CAP_GAP, 120)
        : width;
    const line = layoutNextLine(prepared, cursor, lineWidth);
    if (!line) {
      break;
    }

    elements.push({
      kind: 'line',
      x: lineX,
      y: nextY,
      text: line.text,
      font,
      lh: bodyLh,
      variant: 'body',
    });
    cursor = line.end;
    nextY += bodyLh;
    lineIndex += 1;
  }

  return Math.max(nextY, y + dropCapHeight);
}

function getMaxY(elements: EditorialLayoutElement[]) {
  return elements.reduce((maxY, element) => {
    switch (element.kind) {
      case 'line':
        return Math.max(maxY, element.y + element.lh);
      case 'heading-line':
        return Math.max(maxY, element.y + element.lh);
      case 'dropcap':
      case 'pullquote':
      case 'image':
        return Math.max(maxY, element.y + element.h);
      case 'rule':
        return Math.max(maxY, element.y + 1);
    }
  }, 0);
}

export function computeEditorialLayout({
  blocks,
  containerWidth,
  desiredColumns,
  dropCap,
  pullquote,
  assets = {},
  cache = new Map<string, PreparedTextWithSegments>(),
}: ComputeEditorialLayoutOptions): EditorialLayoutResult {
  const columnCount = resolveColumnCount(desiredColumns, containerWidth);
  const columns = buildColumns(containerWidth, columnCount);
  const flow = pretextBlocksToEditorialFlow(blocks, pullquote, assets);
  const bodyFontSize = resolveFluid('base', columns[0]?.width ?? containerWidth);
  const bodyLh = Math.round(bodyFontSize * lineHeight.relaxed);
  const bodyFont = `${bodyFontSize}px ${BODY_FONT_FAMILY}`;
  const elements: EditorialLayoutElement[] = [];

  if (columns.length === 0 || containerWidth <= 0) {
    return {
      elements,
      columns: [],
      columnCount,
      height: 0,
      bodyFont,
      bodyFontSize,
      bodyLh,
    };
  }

  let titleOffsetY = bodyLh * 2;
  let flowStartIndex = 0;

  if (flow[0]?.kind === 'heading' && flow[0].depth === 1) {
    const title = flow[0];
    const width = containerWidth - OUTER_MARGIN * 2;
    const heading = resolveHeadingStyle(1, containerWidth, width);
    titleOffsetY = pushHeadingLines(
      elements,
      cache,
      title.text,
      heading,
      OUTER_MARGIN,
      titleOffsetY,
      width,
    );
    titleOffsetY += bodyLh * spacing.headingAfter;
    elements.push({
      kind: 'rule',
      x: OUTER_MARGIN,
      y: titleOffsetY,
      w: width,
    });
    titleOffsetY += bodyLh * spacing.section;
    flowStartIndex = 1;
  }

  const flowBlocks = flow.slice(flowStartIndex);
  const estimatedFlowHeight = flowBlocks.reduce(
    (sum, block) =>
      sum +
      estimateFlowBlockHeight(
        block,
        columns[0]!.width,
        bodyFont,
        bodyLh,
        containerWidth,
        cache,
      ),
    0,
  );
  const targetColumnHeight =
    columnCount === 1
      ? Number.POSITIVE_INFINITY
      : Math.max(
          estimatedFlowHeight / columnCount + bodyLh * 2,
          containerWidth * 0.4,
        );

  let currentColumnIndex = 0;
  let currentY = titleOffsetY;
  let usedDropCap = false;

  for (const block of flowBlocks) {
    const column = columns[currentColumnIndex]!;
    const estimatedHeight = estimateFlowBlockHeight(
      block,
      column.width,
      bodyFont,
      bodyLh,
      containerWidth,
      cache,
    );

    if (
      columnCount === 2 &&
      currentColumnIndex < columns.length - 1 &&
      currentY > titleOffsetY &&
      currentY - titleOffsetY + estimatedHeight > targetColumnHeight
    ) {
      currentColumnIndex += 1;
      currentY = titleOffsetY;
    }

    const activeColumn = columns[currentColumnIndex]!;

    switch (block.kind) {
      case 'heading': {
        currentY += bodyLh * spacing.headingBefore;
        const heading = resolveHeadingStyle(
          block.depth,
          containerWidth,
          activeColumn.width,
        );
        currentY = pushHeadingLines(
          elements,
          cache,
          block.text,
          heading,
          activeColumn.x,
          currentY,
          activeColumn.width,
        );
        currentY += bodyLh * spacing.headingAfter;
        break;
      }

      case 'paragraph':
        if (dropCap && !usedDropCap) {
          currentY = pushParagraphWithDropCap(
            elements,
            cache,
            block.text,
            bodyFont,
            bodyFontSize,
            bodyLh,
            activeColumn.x,
            currentY,
            activeColumn.width,
          );
          usedDropCap = true;
        } else {
          currentY = pushTextLines(
            elements,
            cache,
            block.text,
            bodyFont,
            'body',
            activeColumn.x,
            currentY,
            activeColumn.width,
            bodyLh,
          );
        }
        currentY += bodyLh * spacing.paragraph;
        break;

      case 'blockquote': {
        const quoteFontSize = Math.max(
          resolveFluid('lg', activeColumn.width) * 0.9,
          bodyFontSize,
        );
        const quoteLh = Math.round(quoteFontSize * lineHeight.relaxed);
        const quoteFont = `700 ${quoteFontSize}px ${BODY_FONT_FAMILY}`;
        currentY = pushTextLines(
          elements,
          cache,
          block.text,
          quoteFont,
          'quote',
          activeColumn.x + 20,
          currentY,
          activeColumn.width - 20,
          quoteLh,
        );
        currentY += bodyLh * spacing.paragraph;
        break;
      }

      case 'pullquote': {
        const fontSize = resolveFluid('xl', activeColumn.width);
        const quoteLh = Math.round(fontSize * 1.15);
        const font = `700 ${fontSize}px ${HEADING_FONT_FAMILY}`;
        const quoteWidth = Math.min(activeColumn.width, 420);
        const lines = layoutWithLines(
          getPreparedText(cache, block.text, font),
          quoteWidth - 32,
          quoteLh,
        ).lines.map((line) => line.text);
        const quoteHeight = lines.length * quoteLh + 32;
        elements.push({
          kind: 'pullquote',
          x: activeColumn.x,
          y: currentY,
          w: quoteWidth,
          h: quoteHeight,
          lines,
          fontFamily: HEADING_FONT_FAMILY,
          fontSize,
          lh: quoteLh,
        });
        currentY += quoteHeight + bodyLh * spacing.paragraph;
        break;
      }

      case 'list-item':
        currentY = pushTextLines(
          elements,
          cache,
          block.text,
          bodyFont,
          'list',
          activeColumn.x,
          currentY,
          activeColumn.width,
          bodyLh,
        );
        currentY += bodyLh * 0.35;
        break;

      case 'code': {
        const monoFontSize = resolveFluid('sm', activeColumn.width);
        const monoLh = Math.round(monoFontSize * lineHeight.relaxed);
        const monoFont = `${monoFontSize}px ${CODE_FONT_FAMILY}`;
        for (const line of block.text.split('\n')) {
          elements.push({
            kind: 'line',
            x: activeColumn.x + 12,
            y: currentY,
            text: line,
            font: monoFont,
            lh: monoLh,
            variant: 'code',
          });
          currentY += monoLh;
        }
        currentY += bodyLh * spacing.paragraph;
        break;
      }

      case 'image': {
        const size = resolveImageSize(activeColumn.width);
        elements.push({
          kind: 'image',
          x: activeColumn.x,
          y: currentY,
          w: size.width,
          h: size.height,
          src: block.src,
          alt: block.alt,
        });
        currentY += size.height + bodyLh * spacing.paragraph;
        break;
      }

      case 'rule':
        currentY += bodyLh * spacing.rule;
        elements.push({
          kind: 'rule',
          x: activeColumn.x,
          y: currentY,
          w: activeColumn.width,
        });
        currentY += 1 + bodyLh * spacing.rule;
        break;
    }
  }

  return {
    elements,
    columns,
    columnCount,
    height: getMaxY(elements) + bodyLh * 2,
    bodyFont: `${bodyFontSize}px ${BODY_FONT_FAMILY}`,
    bodyFontSize,
    bodyLh,
  };
}
