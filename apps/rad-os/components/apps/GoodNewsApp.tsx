'use client';

import { type AppProps } from '@/lib/apps';
import { AppWindow } from '@rdna/radiants/components/core';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { resolveFluid, resolveFluidRaw, spacing, type FluidTierName } from '@rdna/radiants/patterns/pretext-type-scale';

// ============================================================================
// Document content — in reading order, split at inline insertion points
// ============================================================================

const P1 = 'orem ipsum dolor sit amet consectetur. Big ipsum feugiat morbi ulputate sed. Rehawww. Yeeeeeeee big dawg here we go. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque. Orem ipsum dolor sit amet consectetur. Big ipsum feugiat morbi ulputate sed. Rehawww. Yeeeeeeee big dawg here we go. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque';

const P2 = 'pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique.';

const P3 = 'Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim';

const P4 = 'nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel';


// ============================================================================
// Layout types
// ============================================================================

interface Column { x: number; width: number }
interface ObsRect { x: number; y: number; w: number; h: number }

type El =
  | { kind: 'line'; x: number; y: number; text: string }
  | { kind: 'dropcap'; x: number; y: number }
  | { kind: 'heading-line'; x: number; y: number; w: number; text: string; family: string; fontSize: number; bold: boolean; lh: number; center: boolean }
  | { kind: 'hero'; x: number; y: number; w: number; h: number }
  | { kind: 'rule'; x: number; y: number; w: number; section: 'masthead' | 'editorial' }
  | { kind: 'masthead-text'; x: number; y: number; w: number; text: string; family: string; fontSize: number; bold: boolean; lh: number; align: 'left' | 'center' | 'right'; uppercase: boolean; letterSpacing: string }

interface SpreadResult { els: El[]; height: number; baseFontSize: number; bodyLh: number; mastheadHeight: number }

// ============================================================================
// Obstacle avoidance — polygon hull wrapping (matches dynamic-layout demo)
// ============================================================================

const OBS_H_PAD = 6;  // horizontal padding around the polygon
const OBS_V_PAD = 2;  // vertical padding

function getLineSlots(
  colX: number, colW: number, lineY: number, lineH: number, transformedHull: Point[] | null,
): { x: number; w: number } | null {
  const base: Interval = { left: colX, right: colX + colW };

  if (!transformedHull) return { x: base.left, w: base.right - base.left };

  const blocked: Interval[] = [];
  const interval = getPolygonIntervalForBand(transformedHull, lineY, lineY + lineH, OBS_H_PAD, OBS_V_PAD);
  if (interval) blocked.push(interval);

  const slots = carveTextLineSlots(base, blocked);
  if (slots.length === 0) return null;

  // Pick the widest slot
  let best = slots[0]!;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i]!.right - slots[i]!.left > best.right - best.left) best = slots[i]!;
  }

  return { x: best.left, w: best.right - best.left };
}

// ============================================================================
// Prepare cache — matches the @chenglou/pretext dynamic-layout demo pattern.
// `prepareWithSegments` is the expensive step (canvas measurement); layout
// functions are pure arithmetic on the cached widths.  We key by font+text
// and only re-prepare when either actually changes.
// ============================================================================

// Body font: corresponds to --font-sans token (Mondwest)
// Pretext requires literal font names — canvas measureText can't resolve CSS vars.
// We derive px from the computed root font size at runtime to respect user preferences.
function getBodyFontSize(): number {
  if (typeof window === 'undefined') return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const BODY_LH_RATIO = 1.375; // matches typography.css leading-snug (was 1.2)

/** Fonts used by headings — kept in sync with the document flow below. */
const HEADING_SPECS = [
  { text: 'RadOS Coming Soon', family: "'Joystix Monospace'", tier: 'xl' as FluidTierName, bold: false },
  { text: 'RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM', family: "PixelCode", tier: 'xl' as FluidTierName, bold: true },
  { text: 'The Battlefield Widens for RadOS Agent Seats', family: "Mondwest", tier: '3xl' as FluidTierName, bold: true },
] as const;

const DROP_CAP_SIZE = 80; // px — matches line-height for this font
const DROP_CAP_LH_PX = 80; // line-height in px — must match render
const DROP_CAP_FONT = `${DROP_CAP_LH_PX}px 'Waves Blackletter CPC'`;

const PAT_TOKENS = [
  '--pat-checkerboard', '--pat-checkerboard-alt', '--pat-pinstripe-v', '--pat-pinstripe-v-wide',
  '--pat-pinstripe-h', '--pat-pinstripe-h-wide', '--pat-diagonal', '--pat-diagonal-dots',
  '--pat-diagonal-right', '--pat-grid', '--pat-brick', '--pat-shelf', '--pat-columns',
  '--pat-stagger', '--pat-diamond', '--pat-confetti', '--pat-weave', '--pat-brick-diagonal',
  '--pat-brick-diagonal-alt', '--pat-caret', '--pat-trellis', '--pat-arch', '--pat-cross',
  '--pat-sawtooth', '--pat-chevron', '--pat-basket', '--pat-tweed', '--pat-dust', '--pat-mist',
  '--pat-scatter', '--pat-scatter-alt', '--pat-scatter-pair', '--pat-rain', '--pat-rain-cluster',
  '--pat-spray', '--pat-spray-grid', '--pat-spray-mixed', '--pat-fill-75', '--pat-fill-75-rows',
  '--pat-fill-75-sweep', '--pat-fill-75-offset', '--pat-fill-75-inv', '--pat-fill-75-bars',
  '--pat-fill-81', '--pat-fill-88', '--pat-fill-88-alt', '--pat-fill-94', '--pat-fill-94-alt',
  '--pat-fill-97',
];

// 1x base values — multiply by scale (1–4)
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
  glyphWidth: number; // pretext-measured, already at render scale
  scale?: 1 | 2 | 3 | 4;
  onScaleChange?: (scale: 1 | 2 | 3 | 4) => void;
  cycleSpeed?: number;
}

function DropCapBox({
  x, y, topOffset,
  letter = 'F',
  glyphWidth,
  scale = 4,
  onScaleChange,
  cycleSpeed = 75,
}: DropCapProps) {
  const s = scale;
  const fontSize = DC_BASE.fontSize * s;
  const lh = `${DC_BASE.lineHeight * s}px`;
  const borderWidth = DC_BASE.borderWidth * s;
  const maskSz = `${DC_BASE.patternScale * s}px`;

  const [patIdx, setPatIdx] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycle = useCallback(() => {
    let idx = 0;
    intervalRef.current = setInterval(() => {
      setPatIdx(idx % PAT_TOKENS.length);
      idx++;
    }, cycleSpeed);
  }, [cycleSpeed]);

  const stopCycle = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPatIdx(null);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const textStyle = { fontFamily: "var(--font-blackletter)", fontSize, fontWeight: 400, lineHeight: 'normal', letterSpacing: '0' } as const;

  return (
    <div
      className="absolute text-head"
      style={{ left: x, top: y + topOffset, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', width: Math.ceil(glyphWidth / s) * s + s * 4 + borderWidth * 2, padding: `${s * 2}px ${s * 2}px 0`, border: `${borderWidth}px solid var(--color-line)`, overflow: 'hidden' }}
      onClick={() => onScaleChange?.((scale % 4 + 1) as 1 | 2 | 3 | 4)}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--color-accent)' }} />
      {patIdx !== null && <div className="rdna-pat" style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--color-ink)', maskSize: maskSz, WebkitMaskSize: maskSz, ['--_pat' as string]: `var(${PAT_TOKENS[patIdx]})` }} />}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: s * -2 }}>
        <span style={{ position: 'relative', ...textStyle, fontFamily: "var(--font-blackletter-shadow)", color: 'var(--color-accent)' }}>{letter}</span>
        <span style={{ position: 'absolute', ...textStyle }}>{letter}</span>
      </div>
    </div>
  );
}

// Masthead text — all laid out by pretext, not CSS
const MASTHEAD = {
  title: 'Good News',
  titleFamily: "'Waves Blackletter CPC'",
  // Display size — larger than 4xl, resolved via resolveFluidRaw
  // At 500px → 52px, at 790px → 72px, at 1000px → 86px (capped 90)
  titleSize: { min: 40, base: 16, coeff: 7, max: 90 },
  left: [
    { text: 'Largest Daily Founders Workshop', family: 'Mondwest', bold: true, tier: 'xl' as FluidTierName, uppercase: false },
    { text: 'Solana Mobile X Radiants', family: "'Pixeloid Sans'", bold: false, tier: 'sm' as FluidTierName, uppercase: true },
  ],
  right: [
    { text: '$2,000,000 In Pages Burnt', family: 'Mondwest', bold: false, tier: 'xl' as FluidTierName, uppercase: false },
    { text: 'More on p6', family: "'Pixeloid Sans'", bold: false, tier: 'sm' as FluidTierName, uppercase: true },
  ],
  dateline: [
    { text: 'Monday, November 28th, 2026', family: "'Pixeloid Sans'", bold: true, tier: 'sm' as FluidTierName, uppercase: true },
    { text: '$1.50 per issue', family: "'Pixeloid Sans'", bold: true, tier: 'sm' as FluidTierName, uppercase: true },
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
  if (cached !== undefined) return cached;
  const prepared = prepareWithSegments(text, font);
  cache.set(key, prepared);
  return prepared;
}

function buildPreparedTexts(
  cache: Map<string, PreparedTextWithSegments>,
  colWidths: number[],
  bodyFont: string,
  containerWidth: number,
  dcScale: number,
): PreparedTexts {
  const bodyTexts = [P1, P2, P3, P4];
  const body = bodyTexts.map(t => getPrepared(cache, t, bodyFont));

  // Headings can land in any column, and font size depends on column width.
  // Pre-prepare for every unique column width so the cache is warm regardless
  // of which column a heading flows into.
  const headings = new Map<string, PreparedTextWithSegments>();
  const uniqueWidths = [...new Set(colWidths)];
  for (const spec of HEADING_SPECS) {
    for (const w of uniqueWidths) {
      const fontSize = resolveFluid(spec.tier, w);
      const fontStr = `${spec.bold ? 'bold ' : ''}${fontSize}px ${spec.family}`;
      headings.set(`${spec.text}::${fontStr}`, getPrepared(cache, spec.text, fontStr));
    }
  }

  // Masthead texts — prepared at container width (they span the full width)
  const masthead = new Map<string, PreparedTextWithSegments>();
  const mhTitleSize = resolveFluidRaw(MASTHEAD.titleSize, containerWidth);
  const mhTitleFont = `${mhTitleSize}px ${MASTHEAD.titleFamily}`;
  masthead.set('title', getPrepared(cache, MASTHEAD.title, mhTitleFont));
  for (const item of [...MASTHEAD.left, ...MASTHEAD.right, ...MASTHEAD.dateline]) {
    const sz = resolveFluid(item.tier, containerWidth);
    const font = `${item.bold ? 'bold ' : ''}${sz}px ${item.family}`;
    masthead.set(`${item.text}::${font}`, getPrepared(cache, item.text, font));
  }

  const dcFontSize = DC_BASE.fontSize * dcScale;
  const dcFont = `${dcFontSize}px 'Waves Blackletter CPC'`;
  const dropCap = getPrepared(cache, 'F', dcFont);

  return { body, headings, masthead, dropCap };
}

// ============================================================================
// Responsive column geometry
// ============================================================================

const COL_MARGIN = 16;
const COL_RULE_W = 1;
const COL_GAP = 8; // gap on each side of a column rule

// Tailwind v4 breakpoints applied to container width (not viewport)
function getColCount(containerWidth: number): number {
  if (containerWidth >= 768) return 3;  // md
  if (containerWidth >= 640) return 2;  // sm
  return 1;
}

function buildColumns(containerWidth: number, colCount: number): Column[] {
  const ruleCount = colCount - 1;
  const avail = Math.max(containerWidth - COL_MARGIN * 2 - COL_RULE_W * ruleCount, 100);

  if (colCount === 1) {
    return [{ x: COL_MARGIN, width: avail }];
  }

  if (colCount === 2) {
    const colW = Math.floor((avail - COL_GAP * 2) / 2);
    return [
      { x: COL_MARGIN, width: colW },
      { x: COL_MARGIN + colW + COL_GAP + COL_RULE_W + COL_GAP, width: colW },
    ];
  }

  // 3 columns: 24% / 52% / 24%
  const lW = Math.floor(avail * 0.24);
  const rW = Math.floor(avail * 0.24);
  const cW = avail - lW - rW;
  return [
    { x: COL_MARGIN, width: lW - COL_GAP },
    { x: COL_MARGIN + lW + COL_RULE_W + COL_GAP, width: cW - COL_GAP * 2 },
    { x: COL_MARGIN + lW + COL_RULE_W + cW + COL_RULE_W + COL_GAP, width: rW - COL_GAP },
  ];
}

/** X positions of vertical column rules (between columns). */
function getRuleXPositions(containerWidth: number, colCount: number): number[] {
  if (colCount <= 1) return [];
  const avail = Math.max(containerWidth - COL_MARGIN * 2 - COL_RULE_W * (colCount - 1), 100);

  if (colCount === 2) {
    const colW = Math.floor((avail - COL_GAP * 2) / 2);
    return [COL_MARGIN + colW + COL_GAP];
  }

  // 3 columns
  const lW = Math.floor(avail * 0.24);
  const cW = avail - lW - Math.floor(avail * 0.24);
  return [COL_MARGIN + lW, COL_MARGIN + lW + COL_RULE_W + cW];
}

// ============================================================================
// Layout engine
// ============================================================================

function computeLayout(
  containerWidth: number,
  obstacle: ObsRect | null,
  hull: Point[] | null,
  prepared: PreparedTexts,
  dcScale: number,
  baseFontSize: number,
  bodyLh: number,
): SpreadResult {
  // Transform normalized hull (0-1) to obstacle's actual pixel position
  const transformedHull = hull && obstacle
    ? transformWrapPoints(hull, { x: obstacle.x, y: obstacle.y, width: obstacle.w, height: obstacle.h }, 0)
    : null;

  const colCount = getColCount(containerWidth);
  const cols = buildColumns(containerWidth, colCount);

  // Pre-pass: balanced column heights (reuses pre-prepared body texts)
  let totalBodyLines = 0;
  for (const p of prepared.body) {
    totalBodyLines += layout(p, cols[0].width, bodyLh).lineCount;
  }
  const maxColH = Math.ceil((totalBodyLines * bodyLh + 500) / colCount) + 80;

  const els: El[] = [];
  let ci = 0;
  let y = bodyLh * 3; // 3× bodyLh above masthead

  function col() { return cols[ci]!; }
  function fits(h: number) { return y + h <= maxColH; }
  function nextCol(): boolean { ci++; y = 0; return ci < cols.length; }

  // --- Body text with obstacle avoidance ---
  let bodyIdx = 0;
  function layText(dropCapW = 0, dropCapH = 0) {
    const prep = prepared.body[bodyIdx++]!;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    while (ci < cols.length) {
      if (!fits(bodyLh)) { if (!nextCol()) return; continue; }

      const inDropCap = ci === 0 && y < dropCapH && dropCapW > 0;
      let lineW = inDropCap ? col().width - dropCapW : col().width;
      let lineX = inDropCap ? col().x + dropCapW : col().x;

      const slot = getLineSlots(lineX, lineW, y, bodyLh, transformedHull);
      if (!slot) { y += bodyLh; continue; }
      lineX = slot.x;
      lineW = slot.w;

      const line = layoutNextLine(prep, cursor, lineW);
      if (!line) return;

      els.push({ kind: 'line', x: lineX, y, text: line.text });
      cursor = line.end;
      y += bodyLh;
    }
  }

  // --- Heading — each line laid out individually with layoutNextLine,
  //     matching the dynamic-layout demo pattern ---
  function layHeading(text: string, family: string, tier: FluidTierName, lhRatio: number, bold = false, center = false) {
    if (ci >= cols.length) return;
    y += bodyLh * spacing.headingBefore;
    const fontSize = resolveFluid(tier, col().width);
    const lh = Math.round(fontSize * lhRatio);
    const fontStr = `${bold ? 'bold ' : ''}${fontSize}px ${family}`;
    const prep = prepared.headings.get(`${text}::${fontStr}`)!;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    while (ci < cols.length) {
      if (!fits(lh)) { if (!nextCol()) return; continue; }

      // Headings also respect the polygon obstacle
      const slot = getLineSlots(col().x, col().width, y, lh, transformedHull);
      if (!slot) { y += lh; continue; }

      const line = layoutNextLine(prep, cursor, slot.w);
      if (!line) break;

      els.push({
        kind: 'heading-line',
        x: slot.x,
        y,
        w: slot.w,
        text: line.text,
        family,
        fontSize,
        bold,
        lh,
        center,
      });
      cursor = line.end;
      y += lh;
    }
    y += bodyLh * spacing.headingAfter;
  }

  // --- Hero image — if current column is too narrow, advance to a wider one ---
  function layHero() {
    if (colCount >= 3) {
      // Jump to center column (index 1), reset Y — regardless of where P1 ended
      ci = 1;
      y = 0;
    } else if (colCount === 2) {
      // Jump to column 2
      ci = 1;
      y = 0;
    } else {
      // Single column — flow naturally
      if (!fits(col().width / (357 / 258))) return;
    }
    if (ci >= cols.length) return;
    const w = col().width;
    const imgH = w / (357 / 258);
    const totalH = imgH + bodyLh * spacing.paragraph;
    els.push({ kind: 'hero', x: col().x, y, w, h: imgH });
    y += totalH;
  }

  // --- Spacing — all derived from bodyLh × named roles ---
  function laySpace(role: keyof typeof spacing) {
    y += bodyLh * spacing[role];
  }

  // --- Horizontal rule (owns its own spacing, don't add extra around it) ---
  function layRule() {
    if (ci >= cols.length) return;
    y += bodyLh * spacing.rule;
    els.push({ kind: 'rule', x: col().x, y, w: col().width, section: 'editorial' });
    y += 1;
    y += bodyLh * spacing.rule;
  }

  // ==========================================================================
  // Masthead — pretext-measured, absolutely positioned
  // ==========================================================================

  function layMastheadText(
    text: string, family: string, tier: FluidTierName, bold: boolean,
    x: number, w: number, align: 'left' | 'center' | 'right',
    uppercase = false, letterSpacingEm = '0em',
  ) {
    const fontSize = resolveFluid(tier, containerWidth);
    const lh = Math.round(fontSize * 1.15);
    const font = `${bold ? 'bold ' : ''}${fontSize}px ${family}`;
    const key = text === MASTHEAD.title ? 'title' : `${text}::${font}`;
    const prep = prepared.masthead.get(key);
    if (!prep) return lh;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    const startY = y;
    while (true) {
      const line = layoutNextLine(prep, cursor, w);
      if (!line) break;
      els.push({
        kind: 'masthead-text',
        x, y, w, text: line.text,
        family, fontSize, bold, lh, align, uppercase,
        letterSpacing: letterSpacingEm,
      });
      cursor = line.end;
      y += lh;
    }
    return y - startY;
  }

  // Title helper — uses custom display size, not a standard tier
  function layMastheadTitle(x: number, w: number) {
    const fontSize = resolveFluidRaw(MASTHEAD.titleSize, containerWidth);
    const lh = Math.round(fontSize * 1.05);
    const font = `${fontSize}px ${MASTHEAD.titleFamily}`;
    const prep = prepared.masthead.get('title');
    if (!prep) return;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    while (true) {
      const line = layoutNextLine(prep, cursor, w);
      if (!line) break;
      els.push({
        kind: 'masthead-text',
        x, y, w, text: line.text,
        family: MASTHEAD.titleFamily,
        fontSize, bold: false, lh, align: 'center',
        uppercase: false, letterSpacing: '-0.06em',
      });
      cursor = line.end;
      y += lh;
    }
  }

  // Title: "Good News" centered across full content width
  const contentW = containerWidth - COL_MARGIN * 2;
  const savedY = y;

  // Side columns for left/right info (use editorial column widths if 3-col, else stack)
  if (colCount >= 3) {
    const sideW = cols[0].width;
    const centerX = cols[1].x;
    const centerW = cols[1].width;
    const rightX = cols[2].x;
    const rightW = cols[2].width;

    // Left column
    const leftStartY = y;
    for (const item of MASTHEAD.left) {
      layMastheadText(item.text, item.family, item.tier, item.bold, COL_MARGIN, sideW, 'left', item.uppercase ?? false, '-0.03em');
    }
    const leftH = y - leftStartY;

    // Title spans full content width, centered
    y = savedY;
    layMastheadTitle(COL_MARGIN, contentW);
    const centerH = y - savedY;

    // Right column
    y = savedY;
    for (const item of MASTHEAD.right) {
      layMastheadText(item.text, item.family, item.tier, item.bold, rightX, rightW, 'right', item.uppercase ?? false, '-0.03em');
    }
    const rightH = y - savedY;

    y = savedY + Math.max(leftH, centerH, rightH);
  } else {
    // Narrow: title spans full width, side text below
    layMastheadTitle(COL_MARGIN, contentW);
  }

  // Rule above dateline
  y += bodyLh * 0.75;
  els.push({ kind: 'rule', x: COL_MARGIN, y, w: contentW, section: 'masthead' });
  y += 1;
  y += 4;

  // Dateline bar — measure both items, stack vertically if they'd overlap
  const datelineSize = resolveFluid('sm', containerWidth);
  const datelineLh = Math.round(datelineSize * 1.2);
  const datelineFont = `bold ${datelineSize}px 'Pixeloid Sans'`;

  const dlLeftText = MASTHEAD.dateline[0].text;
  const dlRightText = MASTHEAD.dateline[1].text;
  const dlLeftPrep = prepared.masthead.get(`${dlLeftText}::${datelineFont}`);
  const dlRightPrep = prepared.masthead.get(`${dlRightText}::${datelineFont}`);
  const dlLeftLine = dlLeftPrep ? layoutNextLine(dlLeftPrep, { segmentIndex: 0, graphemeIndex: 0 }, contentW) : null;
  const dlRightLine = dlRightPrep ? layoutNextLine(dlRightPrep, { segmentIndex: 0, graphemeIndex: 0 }, contentW) : null;

  // Account for CSS letter-spacing (0.05em) which pretext doesn't measure
  const lsEm = 0.05;
  const dlLeftW = (dlLeftLine?.width ?? 0) + dlLeftText.length * datelineSize * lsEm;
  const dlRightW = (dlRightLine?.width ?? 0) + dlRightText.length * datelineSize * lsEm;
  const datelineGap = datelineSize * 2;

  if (dlLeftW + dlRightW + datelineGap <= contentW) {
    // Side-by-side: left-align date, right-align price
    els.push({
      kind: 'masthead-text',
      x: COL_MARGIN, y, w: contentW,
      text: dlLeftText,
      family: "'Pixeloid Sans'", fontSize: datelineSize, bold: true,
      lh: datelineLh, align: 'left', uppercase: true, letterSpacing: '0.05em',
    });
    els.push({
      kind: 'masthead-text',
      x: COL_MARGIN, y, w: contentW,
      text: dlRightText,
      family: "'Pixeloid Sans'", fontSize: datelineSize, bold: true,
      lh: datelineLh, align: 'right', uppercase: true, letterSpacing: '0.05em',
    });
    y += datelineLh + 4;
  } else {
    // Stacked: both centered on separate lines
    els.push({
      kind: 'masthead-text',
      x: COL_MARGIN, y, w: contentW,
      text: dlLeftText,
      family: "'Pixeloid Sans'", fontSize: datelineSize, bold: true,
      lh: datelineLh, align: 'center', uppercase: true, letterSpacing: '0.05em',
    });
    y += datelineLh;
    els.push({
      kind: 'masthead-text',
      x: COL_MARGIN, y, w: contentW,
      text: dlRightText,
      family: "'Pixeloid Sans'", fontSize: datelineSize, bold: true,
      lh: datelineLh, align: 'center', uppercase: true, letterSpacing: '0.05em',
    });
    y += datelineLh + 4;
  }

  // Rule under dateline
  els.push({ kind: 'rule', x: COL_MARGIN, y, w: contentW, section: 'masthead' });
  y += 1;
  y += bodyLh;

  const mastheadHeight = y;

  // Reset y for column layout — columns start after masthead
  y = 0;

  // ==========================================================================
  // Document flow (editorial content in columns, below masthead)
  // ==========================================================================

  const dcLine = layoutNextLine(prepared.dropCap, { segmentIndex: 0, graphemeIndex: 0 }, 200);
  const dcGlyphW = Math.ceil((dcLine?.width ?? 50) / dcScale) * dcScale; // snap up to grid
  const dcBorder = DC_BASE.borderWidth * dcScale;
  const dcPad = dcScale * 2; // px padding (scales with size)
  const dcW = dcGlyphW + dcPad * 2 + dcBorder * 2 + dcScale * 4; // glyph + padding + border + gap
  const dcH = DC_BASE.fontSize * dcScale + dcPad * 2 + dcBorder * 2 + dcScale * 4; // top padding + extra bottom gap + chrome buffer
  els.push({ kind: 'dropcap', x: col().x, y });

  layText(dcW, dcH);   // P1
  laySpace('section');
  layHero();
  layHeading('RadOS Coming Soon', "'Joystix Monospace'", 'xl', 1.2, false, true);
  layText();           // P2
  layRule();
  layHeading('RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM', "PixelCode", 'xl', 1.2, true, true);
  layRule();
  layText();           // P3
  layRule();
  layHeading('The Battlefield Widens for RadOS Agent Seats', "Mondwest", '3xl', 1.1, true, false);
  layText();           // P4

  const maxY = els.reduce((m, el) => Math.max(m, el.y + ('h' in el ? el.h : bodyLh)), 0);
  return { els, height: maxY + 32, baseFontSize, bodyLh, mastheadHeight, dcGlyphW };
}

// ============================================================================
// Component
// ============================================================================

export function GoodNewsApp({ windowId }: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(790);
  const [result, setResult] = useState<SpreadResult | null>(null);
  const [dcScale, setDcScale] = useState<1 | 2 | 3 | 4>(4);

  // Obstacle slot (null = no obstacle, kept for future inline image support)
  const obs = null;
  const hull = null;

  // Prepare cache — survives across renders so drag/resize frames only
  // re-run the cheap layout arithmetic, not the expensive canvas measurement.
  // Keyed by `font::text`, matching the @chenglou/pretext demo pattern.
  const prepareCacheRef = useRef(new Map<string, PreparedTextWithSegments>());

  // --- ResizeObserver ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0]?.contentRect.width ?? 790));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- Run layout on resize or obstacle move ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.fonts.ready.then(() => {
      const baseFontSize = getBodyFontSize();
      // Body font: corresponds to --font-sans token (Mondwest)
      const bodyFont = `${baseFontSize}px Mondwest`;
      const bodyLh = baseFontSize * BODY_LH_RATIO;

      const cols = buildColumns(containerWidth, getColCount(containerWidth));
      const colWidths = cols.map(c => c.width);
      const prepared = buildPreparedTexts(prepareCacheRef.current, colWidths, bodyFont, containerWidth, dcScale);
      setResult(computeLayout(containerWidth, obs, hull, prepared, dcScale, baseFontSize, bodyLh));
    });
  }, [containerWidth, obs, hull, dcScale]);

  // Cleanup: free pretext internal measurement caches on unmount
  useEffect(() => {
    return () => {
      prepareCacheRef.current.clear();
      clearCache();
    };
  }, []);

  // Column geometry (for vertical rules)
  const colCount = getColCount(containerWidth);
  const ruleXs = getRuleXPositions(containerWidth, colCount);

  return (
    <AppWindow.Content layout="bleed">
    <div className="h-full relative">
      <div className="absolute top-0 left-0 right-0 h-1 z-10" style={{ backgroundImage: 'var(--pat-diagonal-dots)', backgroundRepeat: 'repeat' }} />
      <div className="absolute top-1 left-0 right-0 h-1 z-10" style={{ backgroundImage: 'var(--pat-spray-grid)', backgroundRepeat: 'repeat' }} />
      <div ref={containerRef} className="bg-card h-full overflow-y-auto border-t border-ink">

      {/* ================================================================
          ALL CONTENT — masthead + editorial, fully pretext-rendered
          ================================================================ */}
      {result && (
        <div className="relative" style={{ height: result.mastheadHeight + result.height + 32 }}>
          {/* Vertical column rules (editorial area only) */}
          {ruleXs.map((rx, i) => (
            <div key={`rule-${i}`} className="absolute bg-head" style={{ left: rx, top: result.mastheadHeight, width: 1, height: result.height }} />
          ))}

          {/* Pretext-rendered elements */}
          {result.els.map((el, i) => {
            // All elements use mastheadHeight as baseline; masthead elements offset by top padding only
            const isMasthead = el.kind === 'masthead-text' || (el.kind === 'rule' && el.section === 'masthead');
            const topOffset = isMasthead ? 0 : result.mastheadHeight;

            switch (el.kind) {
              case 'masthead-text':
                return (
                  <div
                    key={i}
                    className="absolute text-head"
                    style={{
                      left: el.x,
                      top: el.y + topOffset,
                      width: el.w,
                      whiteSpace: 'pre',
                      fontFamily: el.family,
                      fontSize: el.fontSize,
                      fontWeight: el.bold ? 700 : 400,
                      lineHeight: `${el.lh}px`,
                      textAlign: el.align,
                      textTransform: el.uppercase ? 'uppercase' : undefined,
                      letterSpacing: el.letterSpacing,
                    }}
                  >
                    {el.text}
                  </div>
                );
              case 'line':
                return (
                  <div key={i} className="absolute text-head" style={{ left: el.x, top: el.y + topOffset, whiteSpace: 'pre', font: `${result.baseFontSize}px/${result.bodyLh}px 'Mondwest', serif` }}>
                    {el.text}
                  </div>
                );
              case 'dropcap':
                return <DropCapBox key={i} x={el.x} y={el.y} topOffset={topOffset} letter="F" glyphWidth={result.dcGlyphW} scale={dcScale} onScaleChange={setDcScale} />;
              case 'heading-line':
                return (
                  <div
                    key={i}
                    className="absolute text-head"
                    style={{
                      left: el.x,
                      top: el.y + topOffset,
                      width: el.center ? el.w : undefined,
                      whiteSpace: 'pre',
                      fontFamily: el.family.includes('PixelCode') ? "var(--font-pixel-code)" : el.family.includes('Joystix') ? "var(--font-heading)" : "var(--font-sans)",
                      fontSize: el.fontSize,
                      fontWeight: el.bold ? 700 : 400,
                      lineHeight: `${el.lh}px`,
                      textAlign: el.center ? 'center' : undefined,
                    }}
                  >
                    {el.text}
                  </div>
                );
              case 'hero':
                return (
                  <div key={i} className="absolute border border-line overflow-hidden" style={{ left: el.x, top: el.y + topOffset, width: el.w, height: el.h }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/tabloid/hero-image.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                );
              case 'rule':
                return el.w > 1 ? <div key={i} className="absolute bg-head" style={{ left: el.x, top: el.y + topOffset, width: el.w, height: 1 }} /> : null;
              default:
                return null;
            }
          })}

        </div>
      )}
      </div>
    </div>
    </AppWindow.Content>
  );
}

export default GoodNewsApp;
