import {
  layout,
  layoutNextLine,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import {
  lineHeight,
  resolveFluid,
  resolveFluidRaw,
  spacing,
  type FluidTierName,
} from '@rdna/radiants/patterns/pretext-type-scale';
import type { PretextBlock } from '../../markdown';
import { getPreparedText } from '../shared/prepared-text-cache';

const COL_MARGIN = 16;
const COL_RULE_W = 1;
const COL_GAP = 8;
const HERO_ASPECT_RATIO = 357 / 258;

const MASTHEAD_TITLE_SIZE = {
  min: 40,
  base: 16,
  coeff: 7,
  max: 90,
} as const;

export interface BroadsheetColumn {
  x: number;
  width: number;
}

export type BroadsheetFlowBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'rule' };

export type BroadsheetLayoutElement =
  | { kind: 'line'; x: number; y: number; text: string }
  | { kind: 'dropcap'; x: number; y: number; letter: string }
  | {
      kind: 'heading-line';
      x: number;
      y: number;
      w: number;
      text: string;
      family: string;
      fontSize: number;
      bold: boolean;
      lh: number;
      center: boolean;
    }
  | { kind: 'hero'; x: number; y: number; w: number; h: number; src: string }
  | { kind: 'rule'; x: number; y: number; w: number; section: 'masthead' | 'editorial' }
  | {
      kind: 'masthead-text';
      x: number;
      y: number;
      w: number;
      text: string;
      family: string;
      fontSize: number;
      bold: boolean;
      lh: number;
      align: 'left' | 'center' | 'right';
      uppercase: boolean;
      letterSpacing: string;
    };

export interface BroadsheetLayoutResult {
  elements: BroadsheetLayoutElement[];
  columns: BroadsheetColumn[];
  columnCount: 2 | 3;
  height: number;
  mastheadHeight: number;
  bodyFont: string;
  baseFontSize: number;
  bodyLh: number;
}

export interface ComputeBroadsheetLayoutOptions {
  containerWidth: number;
  masthead: string;
  dateline: string;
  headline: string;
  columns: 2 | 3;
  heroWrap: 'leftSide' | 'rightSide' | 'both';
  heroImageSrc?: string;
  flow: BroadsheetFlowBlock[];
  cache?: Map<string, PreparedTextWithSegments>;
}

function buildColumns(
  containerWidth: number,
  columnCount: 2 | 3,
): BroadsheetColumn[] {
  const ruleCount = columnCount - 1;
  const availableWidth = Math.max(
    containerWidth - COL_MARGIN * 2 - COL_RULE_W * ruleCount,
    100,
  );

  if (columnCount === 2) {
    const columnWidth = Math.floor((availableWidth - COL_GAP * 2) / 2);
    return [
      { x: COL_MARGIN, width: columnWidth },
      {
        x: COL_MARGIN + columnWidth + COL_GAP + COL_RULE_W + COL_GAP,
        width: columnWidth,
      },
    ];
  }

  const leftWidth = Math.floor(availableWidth * 0.24);
  const rightWidth = Math.floor(availableWidth * 0.24);
  const centerWidth = availableWidth - leftWidth - rightWidth;

  return [
    { x: COL_MARGIN, width: leftWidth - COL_GAP },
    {
      x: COL_MARGIN + leftWidth + COL_RULE_W + COL_GAP,
      width: centerWidth - COL_GAP * 2,
    },
    {
      x:
        COL_MARGIN +
        leftWidth +
        COL_RULE_W +
        centerWidth +
        COL_RULE_W +
        COL_GAP,
      width: rightWidth - COL_GAP,
    },
  ];
}

function getHeroColumnIndex(
  columnCount: 2 | 3,
  heroWrap: 'leftSide' | 'rightSide' | 'both',
) {
  if (heroWrap === 'leftSide') {
    return 0;
  }

  if (heroWrap === 'rightSide') {
    return columnCount - 1;
  }

  return columnCount === 3 ? 1 : columnCount - 1;
}

function getHeroRect(
  columns: BroadsheetColumn[],
  heroColumnIndex: number,
  heroWrap: 'leftSide' | 'rightSide' | 'both',
  heroY: number,
  heroImageSrc?: string,
) {
  if (!heroImageSrc) {
    return null;
  }

  const column = columns[heroColumnIndex]!;
  const width =
    heroWrap === 'both' ? column.width : Math.floor(column.width * 0.78);
  const x =
    heroWrap === 'rightSide'
      ? column.x + column.width - width
      : column.x;
  const height = width / HERO_ASPECT_RATIO;

  return {
    kind: 'hero' as const,
    x,
    y: heroY,
    w: width,
    h: height,
    src: heroImageSrc,
  };
}

function getTextSlot(
  column: BroadsheetColumn,
  y: number,
  lineHeightPx: number,
  hero: ReturnType<typeof getHeroRect>,
  heroColumnIndex: number,
  currentColumnIndex: number,
  heroWrap: 'leftSide' | 'rightSide' | 'both',
) {
  if (
    !hero ||
    currentColumnIndex !== heroColumnIndex ||
    y + lineHeightPx <= hero.y ||
    y >= hero.y + hero.h
  ) {
    return { x: column.x, width: column.width };
  }

  if (heroWrap === 'both') {
    return null;
  }

  if (heroWrap === 'leftSide') {
    const x = hero.x + hero.w + COL_GAP;
    const width = column.x + column.width - x;
    return width > 0 ? { x, width } : null;
  }

  const width = hero.x - COL_GAP - column.x;
  return width > 0 ? { x: column.x, width } : null;
}

export function computeBroadsheetLayout({
  containerWidth,
  masthead,
  dateline,
  headline,
  columns: columnCount,
  heroWrap,
  heroImageSrc,
  flow,
  cache = new Map<string, PreparedTextWithSegments>(),
}: ComputeBroadsheetLayoutOptions): BroadsheetLayoutResult {
  const columns = buildColumns(containerWidth, columnCount);
  const bodyFontSize = resolveFluid('base', columns[0]!.width);
  const bodyLh = bodyFontSize * lineHeight.snug;
  const bodyFont = `${bodyFontSize}px Mondwest`;
  const contentWidth = containerWidth - COL_MARGIN * 2;
  const elements: BroadsheetLayoutElement[] = [];

  let totalLines = 0;
  for (const block of flow) {
    if (block.kind === 'paragraph') {
      totalLines += layout(
        getPreparedText(cache, block.text, bodyFont),
        columns[0]!.width,
        bodyLh,
      ).lineCount;
    }
  }

  const heroY = bodyLh * 10;
  const heroColumnIndex = getHeroColumnIndex(columnCount, heroWrap);
  const hero = getHeroRect(
    columns,
    heroColumnIndex,
    heroWrap,
    heroY,
    heroImageSrc,
  );
  const maxColumnHeight =
    Math.ceil((totalLines * bodyLh + (hero?.h ?? 0) + 280) / columnCount) + 80;

  let mastheadY = bodyLh * 3;
  const mastheadFontSize = resolveFluidRaw(MASTHEAD_TITLE_SIZE, containerWidth);
  const mastheadLineHeight = Math.round(mastheadFontSize * 1.05);
  elements.push({
    kind: 'masthead-text',
    x: COL_MARGIN,
    y: mastheadY,
    w: contentWidth,
    text: masthead,
    family: "'Waves Blackletter CPC'",
    fontSize: mastheadFontSize,
    bold: false,
    lh: mastheadLineHeight,
    align: 'center',
    uppercase: false,
    letterSpacing: '-0.06em',
  });
  mastheadY += mastheadLineHeight + bodyLh * 0.75;

  elements.push({
    kind: 'rule',
    x: COL_MARGIN,
    y: mastheadY,
    w: contentWidth,
    section: 'masthead',
  });
  mastheadY += 1 + 4;

  const datelineFontSize = resolveFluid('sm', containerWidth);
  const datelineLineHeight = Math.round(datelineFontSize * 1.2);
  elements.push({
    kind: 'masthead-text',
    x: COL_MARGIN,
    y: mastheadY,
    w: contentWidth,
    text: dateline,
    family: "'Pixeloid Sans'",
    fontSize: datelineFontSize,
    bold: true,
    lh: datelineLineHeight,
    align: 'left',
    uppercase: true,
    letterSpacing: '0.05em',
  });
  mastheadY += datelineLineHeight + 4;

  elements.push({
    kind: 'rule',
    x: COL_MARGIN,
    y: mastheadY,
    w: contentWidth,
    section: 'masthead',
  });
  mastheadY += 1 + bodyLh;

  const mastheadHeight = mastheadY;

  if (hero) {
    elements.push(hero);
  }

  const headlineFontSize = resolveFluid('3xl', columns[0]!.width);
  const headlineLineHeight = Math.round(headlineFontSize * 1.1);
  const headlineFont = `bold ${headlineFontSize}px Mondwest`;
  const headlinePrepared = getPreparedText(cache, headline, headlineFont);

  let currentColumnIndex = 0;
  let editorialY = 0;

  function currentColumn() {
    return columns[currentColumnIndex]!;
  }

  function nextColumn() {
    currentColumnIndex += 1;
    editorialY = 0;
    return currentColumnIndex < columns.length;
  }

  function ensureSpace(height: number) {
    while (editorialY + height > maxColumnHeight) {
      if (!nextColumn()) {
        return false;
      }
    }
    return true;
  }

  const dropCapLetter =
    flow.find((block) => block.kind === 'paragraph')?.text[0]?.toUpperCase() ??
    'F';
  const dropCapHeight = bodyFontSize * 4;
  const dropCapWidth = bodyFontSize * 2.4;
  elements.push({
    kind: 'dropcap',
    x: columns[0]!.x,
    y: editorialY,
    letter: dropCapLetter,
  });

  if (ensureSpace(headlineLineHeight * 2)) {
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    while (currentColumnIndex < columns.length) {
      const line = layoutNextLine(
        headlinePrepared,
        cursor,
        currentColumn().width,
      );
      if (!line) {
        break;
      }

      elements.push({
        kind: 'heading-line',
        x: currentColumn().x,
        y: editorialY,
        w: currentColumn().width,
        text: line.text,
        family: 'Mondwest',
        fontSize: headlineFontSize,
        bold: true,
        lh: headlineLineHeight,
        center: false,
      });
      cursor = line.end;
      editorialY += headlineLineHeight;
    }
    editorialY += bodyLh * spacing.headingAfter;
  }

  let paragraphIndex = 0;
  for (const block of flow) {
    if (block.kind === 'rule') {
      if (!ensureSpace(bodyLh * spacing.rule * 2 + 1)) {
        break;
      }
      editorialY += bodyLh * spacing.rule;
      elements.push({
        kind: 'rule',
        x: currentColumn().x,
        y: editorialY,
        w: currentColumn().width,
        section: 'editorial',
      });
      editorialY += 1 + bodyLh * spacing.rule;
      continue;
    }

    const text =
      block.kind === 'heading' ? block.text.toUpperCase() : block.text;
    const tier: FluidTierName = block.kind === 'heading' ? 'xl' : 'base';
    const fontSize = resolveFluid(tier, currentColumn().width);
    const localLineHeight =
      block.kind === 'heading'
        ? Math.round(fontSize * 1.2)
        : bodyLh;
    const font =
      block.kind === 'heading'
        ? `bold ${fontSize}px PixelCode`
        : bodyFont;
    const prepared = getPreparedText(cache, text, font);
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    if (block.kind === 'heading') {
      editorialY += bodyLh * spacing.headingBefore;
    }

    while (currentColumnIndex < columns.length) {
      if (!ensureSpace(localLineHeight)) {
        break;
      }

      const slot = getTextSlot(
        currentColumn(),
        editorialY,
        localLineHeight,
        hero,
        heroColumnIndex,
        currentColumnIndex,
        heroWrap,
      );

      if (!slot || slot.width < 32) {
        editorialY += localLineHeight;
        continue;
      }

      const inDropCap =
        paragraphIndex === 0 &&
        currentColumnIndex === 0 &&
        editorialY < dropCapHeight;

      const x = inDropCap ? slot.x + dropCapWidth : slot.x;
      const width = inDropCap ? slot.width - dropCapWidth : slot.width;
      if (width < 32) {
        editorialY += localLineHeight;
        continue;
      }

      const line = layoutNextLine(prepared, cursor, width);
      if (!line) {
        break;
      }

      if (block.kind === 'heading') {
        elements.push({
          kind: 'heading-line',
          x,
          y: editorialY,
          w: width,
          text: line.text,
          family: 'PixelCode',
          fontSize,
          bold: true,
          lh: localLineHeight,
          center: true,
        });
      } else {
        elements.push({
          kind: 'line',
          x,
          y: editorialY,
          text: line.text,
        });
      }

      cursor = line.end;
      editorialY += localLineHeight;
    }

    editorialY +=
      block.kind === 'heading'
        ? bodyLh * spacing.headingAfter
        : bodyLh * spacing.paragraph;
    if (block.kind === 'paragraph') {
      paragraphIndex += 1;
    }
  }

  const maxEditorialY = elements.reduce((max, element) => {
    switch (element.kind) {
      case 'hero':
        return Math.max(max, element.y + element.h);

      case 'masthead-text':
        return Math.max(max, element.y + element.lh);

      default:
        return Math.max(max, element.y + bodyLh);
    }
  }, 0);

  return {
    elements,
    columns,
    columnCount,
    height: maxEditorialY + 32,
    mastheadHeight,
    bodyFont,
    baseFontSize: bodyFontSize,
    bodyLh,
  };
}

function listItemText(item: string, ordered: boolean, index: number) {
  return ordered ? `${index + 1}. ${item}` : `• ${item}`;
}

export function pretextBlocksToBroadsheetModel(
  blocks: PretextBlock[],
  assets: Record<string, string> = {},
) {
  let headline = 'Untitled';
  let heroImageSrc: string | undefined;
  let consumedHeadline = false;
  const flow: BroadsheetFlowBlock[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        if (!consumedHeadline) {
          headline = block.text;
          consumedHeadline = true;
        } else {
          flow.push({ kind: 'heading', text: block.text });
        }
        break;

      case 'paragraph':
        flow.push({ kind: 'paragraph', text: block.text });
        break;

      case 'blockquote':
        flow.push({ kind: 'paragraph', text: block.text });
        break;

      case 'list':
        for (const [index, item] of block.items.entries()) {
          flow.push({
            kind: 'paragraph',
            text: listItemText(item, block.ordered, index),
          });
        }
        break;

      case 'rule':
        flow.push({ kind: 'rule' });
        break;

      case 'code':
        flow.push({ kind: 'paragraph', text: block.value });
        break;

      case 'image':
        if (!heroImageSrc) {
          heroImageSrc = assets[block.src] ?? block.src;
        }
        break;
    }
  }

  return { headline, heroImageSrc, flow };
}
