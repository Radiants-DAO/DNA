'use client';

import { type AppProps } from '@/lib/apps';
import { AppWindow } from '@rdna/radiants/components/core';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  prepareWithSegments,
  layout,
  layoutNextLine,
  clearCache,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import {
  transformWrapPoints,
  getPolygonIntervalForBand,
  carveTextLineSlots,
  type Point,
  type Interval,
} from '@chenglou/pretext/demos/wrap-geometry';
import {
  resolveFluid,
  resolveFluidRaw,
  spacing,
  type FluidTierName,
} from '@rdna/radiants/patterns/pretext-type-scale';

const P1 =
  'orem ipsum dolor sit amet consectetur. Big ipsum feugiat morbi ulputate sed. Rehawww. Yeeeeeeee big dawg here we go. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque. Orem ipsum dolor sit amet consectetur. Big ipsum feugiat morbi ulputate sed. Rehawww. Yeeeeeeee big dawg here we go. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque';

const P2 =
  'pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique.';

const P3 =
  'Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim';

const P4 =
  'nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel';

interface Column {
  x: number;
  width: number;
}

interface ObsRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type El =
  | { kind: 'line'; x: number; y: number; text: string }
  | { kind: 'dropcap'; x: number; y: number }
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
  | { kind: 'hero'; x: number; y: number; w: number; h: number }
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

interface SpreadResult {
  els: El[];
  height: number;
  baseFontSize: number;
  bodyLh: number;
  mastheadHeight: number;
  dcGlyphW: number;
}

const OBS_H_PAD = 6;
const OBS_V_PAD = 2;

function getLineSlots(
  colX: number,
  colW: number,
  lineY: number,
  lineH: number,
  transformedHull: Point[] | null,
): { x: number; w: number } | null {
  const base: Interval = { left: colX, right: colX + colW };

  if (!transformedHull) {
    return { x: base.left, w: base.right - base.left };
  }

  const blocked: Interval[] = [];
  const interval = getPolygonIntervalForBand(
    transformedHull,
    lineY,
    lineY + lineH,
    OBS_H_PAD,
    OBS_V_PAD,
  );

  if (interval) {
    blocked.push(interval);
  }

  const slots = carveTextLineSlots(base, blocked);
  if (slots.length === 0) {
    return null;
  }

  let best = slots[0]!;
  for (let index = 1; index < slots.length; index++) {
    if (slots[index]!.right - slots[index]!.left > best.right - best.left) {
      best = slots[index]!;
    }
  }

  return { x: best.left, w: best.right - best.left };
}

function getBodyFontSize(): number {
  if (typeof window === 'undefined') {
    return 16;
  }

  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const BODY_LH_RATIO = 1.375;

const HEADING_SPECS = [
  {
    text: 'RadOS Coming Soon',
    family: "'Joystix Monospace'",
    tier: 'xl' as FluidTierName,
    bold: false,
  },
  {
    text: 'RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM',
    family: 'PixelCode',
    tier: 'xl' as FluidTierName,
    bold: true,
  },
  {
    text: 'The Battlefield Widens for RadOS Agent Seats',
    family: 'Mondwest',
    tier: '3xl' as FluidTierName,
    bold: true,
  },
] as const;

const PAT_TOKENS = [
  '--pat-checkerboard',
  '--pat-checkerboard-alt',
  '--pat-pinstripe-v',
  '--pat-pinstripe-v-wide',
  '--pat-pinstripe-h',
  '--pat-pinstripe-h-wide',
  '--pat-diagonal',
  '--pat-diagonal-dots',
  '--pat-diagonal-right',
  '--pat-grid',
  '--pat-brick',
  '--pat-shelf',
  '--pat-columns',
  '--pat-stagger',
  '--pat-diamond',
  '--pat-confetti',
  '--pat-weave',
  '--pat-brick-diagonal',
  '--pat-brick-diagonal-alt',
  '--pat-caret',
  '--pat-trellis',
  '--pat-arch',
  '--pat-cross',
  '--pat-sawtooth',
  '--pat-chevron',
  '--pat-basket',
  '--pat-tweed',
  '--pat-dust',
  '--pat-mist',
  '--pat-scatter',
  '--pat-scatter-alt',
  '--pat-scatter-pair',
  '--pat-rain',
  '--pat-rain-cluster',
  '--pat-spray',
  '--pat-spray-grid',
  '--pat-spray-mixed',
  '--pat-fill-75',
  '--pat-fill-75-rows',
  '--pat-fill-75-sweep',
  '--pat-fill-75-offset',
  '--pat-fill-75-inv',
  '--pat-fill-75-bars',
  '--pat-fill-81',
  '--pat-fill-88',
  '--pat-fill-88-alt',
  '--pat-fill-94',
  '--pat-fill-94-alt',
  '--pat-fill-97',
];

const DC_BASE = {
  fontSize: 20,
  lineHeight: 20,
  borderWidth: 1,
  patternScale: 8,
};

interface DropCapProps {
  x: number;
  y: number;
  topOffset: number;
  letter?: string;
  glyphWidth: number;
  scale?: 1 | 2 | 3 | 4;
  onScaleChange?: (scale: 1 | 2 | 3 | 4) => void;
  cycleSpeed?: number;
}

function DropCapBox({
  x,
  y,
  topOffset,
  letter = 'F',
  glyphWidth,
  scale = 4,
  onScaleChange,
  cycleSpeed = 75,
}: DropCapProps) {
  const size = scale;
  const fontSize = DC_BASE.fontSize * size;
  const borderWidth = DC_BASE.borderWidth * size;
  const maskSize = `${DC_BASE.patternScale * size}px`;

  const [patternIndex, setPatternIndex] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycle = useCallback(() => {
    let index = 0;
    intervalRef.current = setInterval(() => {
      setPatternIndex(index % PAT_TOKENS.length);
      index++;
    }, cycleSpeed);
  }, [cycleSpeed]);

  const stopCycle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPatternIndex(null);
  }, []);

  useEffect(() => () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const textStyle = {
    fontFamily: 'var(--font-blackletter)',
    fontSize,
    fontWeight: 400,
    lineHeight: 'normal',
    letterSpacing: '0',
  } as const;

  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:goodnews-dropcap-art-button owner:rad-os expires:2027-01-01 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#goodnews-print-art-rendering
    <button
      type="button"
      className="absolute text-head"
      style={{
        left: x,
        top: y + topOffset,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        width: Math.ceil(glyphWidth / size) * size + size * 4 + borderWidth * 2,
        ['--goodnews-dropcap-padding' as string]: `${size * 2}px`,
        paddingTop: 'var(--goodnews-dropcap-padding)',
        paddingRight: 'var(--goodnews-dropcap-padding)',
        paddingLeft: 'var(--goodnews-dropcap-padding)',
        borderWidth,
        borderStyle: 'solid',
        borderColor: 'var(--color-line)',
        overflow: 'hidden',
        appearance: 'none',
        background: 'none',
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
        textAlign: 'inherit',
      }}
      onClick={() => onScaleChange?.((scale % 4 + 1) as 1 | 2 | 3 | 4)}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0%',
          backgroundColor: 'var(--color-accent)',
        }}
      />
      {patternIndex !== null ? (
        <div
          className="rdna-pat"
          style={{
            position: 'absolute',
            inset: '0%',
            ['--_pat' as string]: `var(${PAT_TOKENS[patternIndex]})`,
            ['--pat-color' as string]: 'var(--color-ink)',
            ['--pat-mask-size' as string]: `${maskSize} ${maskSize}`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: size * -2,
        }}
      >
        <span
          style={{
            position: 'relative',
            ...textStyle,
            fontFamily: 'var(--font-blackletter-shadow)',
            color: 'var(--color-accent)',
          }}
        >
          {letter}
        </span>
        <span style={{ position: 'absolute', ...textStyle }}>{letter}</span>
      </div>
    </button>
  );
}

const MASTHEAD = {
  title: 'Good News',
  titleFamily: "'Waves Blackletter CPC'",
  titleSize: { min: 40, base: 16, coeff: 7, max: 90 },
  left: [
    {
      text: 'Largest Daily Founders Workshop',
      family: 'Mondwest',
      bold: true,
      tier: 'xl' as FluidTierName,
      uppercase: false,
    },
    {
      text: 'Solana Mobile X Radiants',
      family: "'Pixeloid Sans'",
      bold: false,
      tier: 'sm' as FluidTierName,
      uppercase: true,
    },
  ],
  right: [
    {
      text: '$2,000,000 In Pages Burnt',
      family: 'Mondwest',
      bold: false,
      tier: 'xl' as FluidTierName,
      uppercase: false,
    },
    {
      text: 'More on p6',
      family: "'Pixeloid Sans'",
      bold: false,
      tier: 'sm' as FluidTierName,
      uppercase: true,
    },
  ],
  dateline: [
    {
      text: 'Monday, November 28th, 2026',
      family: "'Pixeloid Sans'",
      bold: true,
      tier: 'sm' as FluidTierName,
      uppercase: true,
    },
    {
      text: '$1.50 per issue',
      family: "'Pixeloid Sans'",
      bold: true,
      tier: 'sm' as FluidTierName,
      uppercase: true,
    },
  ],
} as const;

interface PreparedTexts {
  body: PreparedTextWithSegments[];
  headings: Map<string, PreparedTextWithSegments>;
  masthead: Map<string, PreparedTextWithSegments>;
  dropCap: PreparedTextWithSegments;
}

function getPrepared(
  cache: Map<string, PreparedTextWithSegments>,
  text: string,
  font: string,
): PreparedTextWithSegments {
  const key = `${font}::${text}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const prepared = prepareWithSegments(text, font);
  cache.set(key, prepared);
  return prepared;
}

function buildPreparedTexts(
  cache: Map<string, PreparedTextWithSegments>,
  columnWidths: number[],
  bodyFont: string,
  containerWidth: number,
  dropCapScale: number,
): PreparedTexts {
  const bodyTexts = [P1, P2, P3, P4];
  const body = bodyTexts.map((text) => getPrepared(cache, text, bodyFont));

  const headings = new Map<string, PreparedTextWithSegments>();
  const uniqueWidths = [...new Set(columnWidths)];

  for (const spec of HEADING_SPECS) {
    for (const width of uniqueWidths) {
      const fontSize = resolveFluid(spec.tier, width);
      const font = `${spec.bold ? 'bold ' : ''}${fontSize}px ${spec.family}`;
      headings.set(`${spec.text}::${font}`, getPrepared(cache, spec.text, font));
    }
  }

  const masthead = new Map<string, PreparedTextWithSegments>();
  const mastheadTitleSize = resolveFluidRaw(MASTHEAD.titleSize, containerWidth);
  const mastheadTitleFont = `${mastheadTitleSize}px ${MASTHEAD.titleFamily}`;
  masthead.set('title', getPrepared(cache, MASTHEAD.title, mastheadTitleFont));

  for (const item of [
    ...MASTHEAD.left,
    ...MASTHEAD.right,
    ...MASTHEAD.dateline,
  ]) {
    const size = resolveFluid(item.tier, containerWidth);
    const font = `${item.bold ? 'bold ' : ''}${size}px ${item.family}`;
    masthead.set(`${item.text}::${font}`, getPrepared(cache, item.text, font));
  }

  const dropCapFontSize = DC_BASE.fontSize * dropCapScale;
  const dropCapFont = `${dropCapFontSize}px 'Waves Blackletter CPC'`;
  const dropCap = getPrepared(cache, 'F', dropCapFont);

  return { body, headings, masthead, dropCap };
}

const COL_MARGIN = 16;
const COL_RULE_W = 1;
const COL_GAP = 8;

function getColCount(containerWidth: number): number {
  if (containerWidth >= 768) {
    return 3;
  }
  if (containerWidth >= 640) {
    return 2;
  }
  return 1;
}

function buildColumns(containerWidth: number, colCount: number): Column[] {
  const ruleCount = colCount - 1;
  const availableWidth = Math.max(
    containerWidth - COL_MARGIN * 2 - COL_RULE_W * ruleCount,
    100,
  );

  if (colCount === 1) {
    return [{ x: COL_MARGIN, width: availableWidth }];
  }

  if (colCount === 2) {
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

function getRuleXPositions(containerWidth: number, colCount: number): number[] {
  if (colCount <= 1) {
    return [];
  }

  const availableWidth = Math.max(
    containerWidth - COL_MARGIN * 2 - COL_RULE_W * (colCount - 1),
    100,
  );

  if (colCount === 2) {
    const columnWidth = Math.floor((availableWidth - COL_GAP * 2) / 2);
    return [COL_MARGIN + columnWidth + COL_GAP];
  }

  const leftWidth = Math.floor(availableWidth * 0.24);
  const centerWidth = availableWidth - leftWidth - Math.floor(availableWidth * 0.24);
  return [COL_MARGIN + leftWidth, COL_MARGIN + leftWidth + COL_RULE_W + centerWidth];
}

function computeLayout(
  containerWidth: number,
  obstacle: ObsRect | null,
  hull: Point[] | null,
  prepared: PreparedTexts,
  dropCapScale: number,
  baseFontSize: number,
  bodyLh: number,
): SpreadResult {
  const transformedHull =
    hull && obstacle
      ? transformWrapPoints(
          hull,
          {
            x: obstacle.x,
            y: obstacle.y,
            width: obstacle.w,
            height: obstacle.h,
          },
          0,
        )
      : null;

  const colCount = getColCount(containerWidth);
  const columns = buildColumns(containerWidth, colCount);

  let totalBodyLines = 0;
  for (const paragraph of prepared.body) {
    totalBodyLines += layout(paragraph, columns[0]!.width, bodyLh).lineCount;
  }

  const maxColHeight = Math.ceil((totalBodyLines * bodyLh + 500) / colCount) + 80;

  const elements: El[] = [];
  let columnIndex = 0;
  let y = bodyLh * 3;

  function column() {
    return columns[columnIndex]!;
  }

  function fits(height: number) {
    return y + height <= maxColHeight;
  }

  function nextColumn() {
    columnIndex++;
    y = 0;
    return columnIndex < columns.length;
  }

  let bodyIndex = 0;
  function layText(dropCapWidth = 0, dropCapHeight = 0) {
    const preparedText = prepared.body[bodyIndex++]!;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    while (columnIndex < columns.length) {
      if (!fits(bodyLh)) {
        if (!nextColumn()) {
          return;
        }
        continue;
      }

      const inDropCap =
        columnIndex === 0 && y < dropCapHeight && dropCapWidth > 0;
      let lineWidth = inDropCap ? column().width - dropCapWidth : column().width;
      let lineX = inDropCap ? column().x + dropCapWidth : column().x;

      const slot = getLineSlots(lineX, lineWidth, y, bodyLh, transformedHull);
      if (!slot) {
        y += bodyLh;
        continue;
      }

      lineX = slot.x;
      lineWidth = slot.w;

      const line = layoutNextLine(preparedText, cursor, lineWidth);
      if (!line) {
        return;
      }

      elements.push({ kind: 'line', x: lineX, y, text: line.text });
      cursor = line.end;
      y += bodyLh;
    }
  }

  function layHeading(
    text: string,
    family: string,
    tier: FluidTierName,
    lineHeightRatio: number,
    bold = false,
    center = false,
  ) {
    if (columnIndex >= columns.length) {
      return;
    }

    y += bodyLh * spacing.headingBefore;
    const fontSize = resolveFluid(tier, column().width);
    const lineHeight = Math.round(fontSize * lineHeightRatio);
    const font = `${bold ? 'bold ' : ''}${fontSize}px ${family}`;
    const preparedHeading = prepared.headings.get(`${text}::${font}`)!;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    while (columnIndex < columns.length) {
      if (!fits(lineHeight)) {
        if (!nextColumn()) {
          return;
        }
        continue;
      }

      const slot = getLineSlots(
        column().x,
        column().width,
        y,
        lineHeight,
        transformedHull,
      );
      if (!slot) {
        y += lineHeight;
        continue;
      }

      const line = layoutNextLine(preparedHeading, cursor, slot.w);
      if (!line) {
        break;
      }

      elements.push({
        kind: 'heading-line',
        x: slot.x,
        y,
        w: slot.w,
        text: line.text,
        family,
        fontSize,
        bold,
        lh: lineHeight,
        center,
      });
      cursor = line.end;
      y += lineHeight;
    }

    y += bodyLh * spacing.headingAfter;
  }

  function layHero() {
    if (colCount >= 3) {
      columnIndex = 1;
      y = 0;
    } else if (colCount === 2) {
      columnIndex = 1;
      y = 0;
    } else if (!fits(column().width / (357 / 258))) {
      return;
    }

    if (columnIndex >= columns.length) {
      return;
    }

    const width = column().width;
    const imageHeight = width / (357 / 258);
    const totalHeight = imageHeight + bodyLh * spacing.paragraph;
    elements.push({ kind: 'hero', x: column().x, y, w: width, h: imageHeight });
    y += totalHeight;
  }

  function laySpace(role: keyof typeof spacing) {
    y += bodyLh * spacing[role];
  }

  function layRule() {
    if (columnIndex >= columns.length) {
      return;
    }

    y += bodyLh * spacing.rule;
    elements.push({
      kind: 'rule',
      x: column().x,
      y,
      w: column().width,
      section: 'editorial',
    });
    y += 1;
    y += bodyLh * spacing.rule;
  }

  function layMastheadText(
    text: string,
    family: string,
    tier: FluidTierName,
    bold: boolean,
    x: number,
    width: number,
    align: 'left' | 'center' | 'right',
    uppercase = false,
    letterSpacingEm = '0em',
  ) {
    const fontSize = resolveFluid(tier, containerWidth);
    const lineHeight = Math.round(fontSize * 1.15);
    const font = `${bold ? 'bold ' : ''}${fontSize}px ${family}`;
    const key = text === MASTHEAD.title ? 'title' : `${text}::${font}`;
    const preparedMasthead = prepared.masthead.get(key);
    if (!preparedMasthead) {
      return lineHeight;
    }

    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    const startY = y;
    while (true) {
      const line = layoutNextLine(preparedMasthead, cursor, width);
      if (!line) {
        break;
      }

      elements.push({
        kind: 'masthead-text',
        x,
        y,
        w: width,
        text: line.text,
        family,
        fontSize,
        bold,
        lh: lineHeight,
        align,
        uppercase,
        letterSpacing: letterSpacingEm,
      });
      cursor = line.end;
      y += lineHeight;
    }
    return y - startY;
  }

  function layMastheadTitle(x: number, width: number) {
    const fontSize = resolveFluidRaw(MASTHEAD.titleSize, containerWidth);
    const lineHeight = Math.round(fontSize * 1.05);
    const preparedTitle = prepared.masthead.get('title');
    if (!preparedTitle) {
      return;
    }

    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    while (true) {
      const line = layoutNextLine(preparedTitle, cursor, width);
      if (!line) {
        break;
      }

      elements.push({
        kind: 'masthead-text',
        x,
        y,
        w: width,
        text: line.text,
        family: MASTHEAD.titleFamily,
        fontSize,
        bold: false,
        lh: lineHeight,
        align: 'center',
        uppercase: false,
        letterSpacing: '-0.06em',
      });
      cursor = line.end;
      y += lineHeight;
    }
  }

  const contentWidth = containerWidth - COL_MARGIN * 2;
  const savedY = y;

  if (colCount >= 3) {
    const sideWidth = columns[0]!.width;
    const rightX = columns[2]!.x;
    const rightWidth = columns[2]!.width;

    const leftStartY = y;
    for (const item of MASTHEAD.left) {
      layMastheadText(
        item.text,
        item.family,
        item.tier,
        item.bold,
        COL_MARGIN,
        sideWidth,
        'left',
        item.uppercase ?? false,
        '-0.03em',
      );
    }
    const leftHeight = y - leftStartY;

    y = savedY;
    layMastheadTitle(COL_MARGIN, contentWidth);
    const centerHeight = y - savedY;

    y = savedY;
    for (const item of MASTHEAD.right) {
      layMastheadText(
        item.text,
        item.family,
        item.tier,
        item.bold,
        rightX,
        rightWidth,
        'right',
        item.uppercase ?? false,
        '-0.03em',
      );
    }
    const rightHeight = y - savedY;

    y = savedY + Math.max(leftHeight, centerHeight, rightHeight);
  } else {
    layMastheadTitle(COL_MARGIN, contentWidth);
  }

  y += bodyLh * 0.75;
  elements.push({
    kind: 'rule',
    x: COL_MARGIN,
    y,
    w: contentWidth,
    section: 'masthead',
  });
  y += 1;
  y += 4;

  const datelineSize = resolveFluid('sm', containerWidth);
  const datelineLineHeight = Math.round(datelineSize * 1.2);
  const datelineFont = `bold ${datelineSize}px 'Pixeloid Sans'`;

  const leftDatelineText = MASTHEAD.dateline[0].text;
  const rightDatelineText = MASTHEAD.dateline[1].text;
  const leftDatelinePrepared = prepared.masthead.get(
    `${leftDatelineText}::${datelineFont}`,
  );
  const rightDatelinePrepared = prepared.masthead.get(
    `${rightDatelineText}::${datelineFont}`,
  );
  const leftDatelineLine = leftDatelinePrepared
    ? layoutNextLine(leftDatelinePrepared, { segmentIndex: 0, graphemeIndex: 0 }, contentWidth)
    : null;
  const rightDatelineLine = rightDatelinePrepared
    ? layoutNextLine(rightDatelinePrepared, { segmentIndex: 0, graphemeIndex: 0 }, contentWidth)
    : null;

  const letterSpacingEm = 0.05;
  const leftDatelineWidth =
    (leftDatelineLine?.width ?? 0) +
    leftDatelineText.length * datelineSize * letterSpacingEm;
  const rightDatelineWidth =
    (rightDatelineLine?.width ?? 0) +
    rightDatelineText.length * datelineSize * letterSpacingEm;
  const datelineGap = datelineSize * 2;

  if (leftDatelineWidth + rightDatelineWidth + datelineGap <= contentWidth) {
    elements.push({
      kind: 'masthead-text',
      x: COL_MARGIN,
      y,
      w: contentWidth,
      text: leftDatelineText,
      family: "'Pixeloid Sans'",
      fontSize: datelineSize,
      bold: true,
      lh: datelineLineHeight,
      align: 'left',
      uppercase: true,
      letterSpacing: '0.05em',
    });
    elements.push({
      kind: 'masthead-text',
      x: COL_MARGIN,
      y,
      w: contentWidth,
      text: rightDatelineText,
      family: "'Pixeloid Sans'",
      fontSize: datelineSize,
      bold: true,
      lh: datelineLineHeight,
      align: 'right',
      uppercase: true,
      letterSpacing: '0.05em',
    });
    y += datelineLineHeight + 4;
  } else {
    elements.push({
      kind: 'masthead-text',
      x: COL_MARGIN,
      y,
      w: contentWidth,
      text: leftDatelineText,
      family: "'Pixeloid Sans'",
      fontSize: datelineSize,
      bold: true,
      lh: datelineLineHeight,
      align: 'center',
      uppercase: true,
      letterSpacing: '0.05em',
    });
    y += datelineLineHeight;
    elements.push({
      kind: 'masthead-text',
      x: COL_MARGIN,
      y,
      w: contentWidth,
      text: rightDatelineText,
      family: "'Pixeloid Sans'",
      fontSize: datelineSize,
      bold: true,
      lh: datelineLineHeight,
      align: 'center',
      uppercase: true,
      letterSpacing: '0.05em',
    });
    y += datelineLineHeight + 4;
  }

  elements.push({
    kind: 'rule',
    x: COL_MARGIN,
    y,
    w: contentWidth,
    section: 'masthead',
  });
  y += 1;
  y += bodyLh;

  const mastheadHeight = y;
  y = 0;

  const dropCapLine = layoutNextLine(
    prepared.dropCap,
    { segmentIndex: 0, graphemeIndex: 0 },
    200,
  );
  const dropCapGlyphWidth =
    Math.ceil((dropCapLine?.width ?? 50) / dropCapScale) * dropCapScale;
  const dropCapBorder = DC_BASE.borderWidth * dropCapScale;
  const dropCapPadding = dropCapScale * 2;
  const dropCapWidth =
    dropCapGlyphWidth +
    dropCapPadding * 2 +
    dropCapBorder * 2 +
    dropCapScale * 4;
  const dropCapHeight =
    DC_BASE.fontSize * dropCapScale +
    dropCapPadding * 2 +
    dropCapBorder * 2 +
    dropCapScale * 4;
  elements.push({ kind: 'dropcap', x: column().x, y });

  layText(dropCapWidth, dropCapHeight);
  laySpace('section');
  layHero();
  layHeading('RadOS Coming Soon', "'Joystix Monospace'", 'xl', 1.2, false, true);
  layText();
  layRule();
  layHeading(
    'RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM',
    'PixelCode',
    'xl',
    1.2,
    true,
    true,
  );
  layRule();
  layText();
  layRule();
  layHeading(
    'The Battlefield Widens for RadOS Agent Seats',
    'Mondwest',
    '3xl',
    1.1,
    true,
    false,
  );
  layText();

  const maxY = elements.reduce(
    (max, element) => Math.max(max, element.y + ('h' in element ? element.h : bodyLh)),
    0,
  );

  return {
    els: elements,
    height: maxY + 32,
    baseFontSize,
    bodyLh,
    mastheadHeight,
    dcGlyphW: dropCapGlyphWidth,
  };
}

export function GoodNewsLegacyApp(_props: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(790);
  const [result, setResult] = useState<SpreadResult | null>(null);
  const [dropCapScale, setDropCapScale] = useState<1 | 2 | 3 | 4>(4);

  const obstacle = null;
  const hull = null;
  const prepareCacheRef = useRef(new Map<string, PreparedTextWithSegments>());

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 790);
    });
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    document.fonts.ready.then(() => {
      const baseFontSize = getBodyFontSize();
      const bodyFont = `${baseFontSize}px Mondwest`;
      const bodyLh = baseFontSize * BODY_LH_RATIO;
      const columns = buildColumns(containerWidth, getColCount(containerWidth));
      const columnWidths = columns.map((column) => column.width);
      const prepared = buildPreparedTexts(
        prepareCacheRef.current,
        columnWidths,
        bodyFont,
        containerWidth,
        dropCapScale,
      );

      setResult(
        computeLayout(
          containerWidth,
          obstacle,
          hull,
          prepared,
          dropCapScale,
          baseFontSize,
          bodyLh,
        ),
      );
    });
  }, [containerWidth, obstacle, hull, dropCapScale]);

  useEffect(() => {
    return () => {
      prepareCacheRef.current.clear();
      clearCache();
    };
  }, []);

  const colCount = getColCount(containerWidth);
  const ruleXs = getRuleXPositions(containerWidth, colCount);

  return (
    <AppWindow.Content layout="bleed">
      <div className="relative h-full">
        <div className="absolute left-0 right-0 top-0 z-desktop h-1 rdna-pat rdna-pat--diagonal-dots" style={{ ['--pat-color' as string]: 'var(--color-ink)' }} />
        <div className="absolute left-0 right-0 top-1 z-desktop h-1 rdna-pat rdna-pat--spray-grid" style={{ ['--pat-color' as string]: 'var(--color-ink)' }} />
        <div
          ref={containerRef}
          className="h-full overflow-y-auto border-t border-line bg-card"
        >
          {result ? (
            <div
              className="relative"
              style={{
                ['--goodnews-page-height' as string]: `${result.mastheadHeight + result.height + 32}px`,
                height: 'var(--goodnews-page-height)',
              } as CSSProperties}
            >
              {ruleXs.map((ruleX, index) => (
                <div
                  key={`rule-${index}`}
                  className="absolute bg-head"
                  style={{
                    left: ruleX,
                    top: result.mastheadHeight,
                    ['--goodnews-rule-thickness' as string]: '1px',
                    width: 'var(--goodnews-rule-thickness)',
                    height: result.height,
                  } as CSSProperties}
                />
              ))}

              {result.els.map((element, index) => {
                const isMasthead =
                  element.kind === 'masthead-text' ||
                  (element.kind === 'rule' && element.section === 'masthead');
                const topOffset = isMasthead ? 0 : result.mastheadHeight;

                switch (element.kind) {
                  case 'masthead-text':
                    return (
                      <div
                        key={index}
                        className="absolute text-head"
                        style={{
                          left: element.x,
                          top: element.y + topOffset,
                          width: element.w,
                          whiteSpace: 'pre',
                          fontFamily: element.family,
                          fontSize: element.fontSize,
                          fontWeight: element.bold ? 700 : 400,
                          ['--goodnews-line-height' as string]: `${element.lh}px`,
                          lineHeight: 'var(--goodnews-line-height)',
                          textAlign: element.align,
                          textTransform: element.uppercase ? 'uppercase' : undefined,
                          letterSpacing: element.letterSpacing,
                        } as CSSProperties}
                      >
                        {element.text}
                      </div>
                    );

                  case 'line':
                    return (
                      <div
                        key={index}
                        className="absolute text-head"
                        style={{
                          left: element.x,
                          top: element.y + topOffset,
                          whiteSpace: 'pre',
                          font: `${result.baseFontSize}px/${result.bodyLh}px 'Mondwest', serif`,
                        }}
                      >
                        {element.text}
                      </div>
                    );

                  case 'dropcap':
                    return (
                      <DropCapBox
                        key={index}
                        x={element.x}
                        y={element.y}
                        topOffset={topOffset}
                        letter="F"
                        glyphWidth={result.dcGlyphW}
                        scale={dropCapScale}
                        onScaleChange={setDropCapScale}
                      />
                    );

                  case 'heading-line':
                    return (
                      <div
                        key={index}
                        className="absolute text-head"
                        style={{
                          left: element.x,
                          top: element.y + topOffset,
                          width: element.center ? element.w : undefined,
                          whiteSpace: 'pre',
                          fontFamily: element.family.includes('PixelCode')
                            ? 'var(--font-pixel-code)'
                            : element.family.includes('Joystix')
                              ? 'var(--font-heading)'
                              : 'var(--font-sans)',
                          fontSize: element.fontSize,
                          fontWeight: element.bold ? 700 : 400,
                          ['--goodnews-line-height' as string]: `${element.lh}px`,
                          lineHeight: 'var(--goodnews-line-height)',
                          textAlign: element.center ? 'center' : undefined,
                        } as CSSProperties}
                      >
                        {element.text}
                      </div>
                    );

                  case 'hero':
                    return (
                      <div
                        key={index}
                        className="absolute overflow-hidden border border-line"
                        style={{
                          left: element.x,
                          top: element.y + topOffset,
                          width: element.w,
                          height: element.h,
                        }}
                      >
                        <Image
                          src="/tabloid/hero-image.png"
                          alt=""
                          fill
                          sizes={`${Math.round(element.w)}px`}
                          className="object-cover"
                        />
                      </div>
                    );

                  case 'rule':
                    return element.w > 1 ? (
                      <div
                        key={index}
                        className="absolute bg-head"
                        style={{
                          left: element.x,
                          top: element.y + topOffset,
                          width: element.w,
                          ['--goodnews-rule-thickness' as string]: '1px',
                          height: 'var(--goodnews-rule-thickness)',
                        } as CSSProperties}
                      />
                    ) : null;

                  default:
                    return null;
                }
              })}
            </div>
          ) : null}
        </div>
      </div>
    </AppWindow.Content>
  );
}

export default GoodNewsLegacyApp;
