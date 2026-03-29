'use client';

import { type AppProps } from '@/lib/apps';
import { useEffect, useRef, useState } from 'react';
import {
  prepareWithSegments,
  layout,
  layoutNextLine,
  clearCache,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import {
  getWrapHull,
  transformWrapPoints,
  getPolygonIntervalForBand,
  carveTextLineSlots,
  type Point,
  type Interval,
} from '@chenglou/pretext/demos/wrap-geometry';

// ============================================================================
// Document content — in reading order, split at inline insertion points
// ============================================================================

const P1 = 'orem ipsum dolor sit amet consectetur. Big ipsum feugiat morbi ulputate sed. Rehawww. Yeeeeeeee big dawg here we go. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque';

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
  | { kind: 'rule'; x: number; y: number; w: number };

interface SpreadResult { els: El[]; height: number; baseFontSize: number; bodyLh: number }

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
  { text: 'RadOS Coming Soon', family: "'Joystix Monospace'", maxSize: 27, scale: 0.065, bold: false },
  { text: 'RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM', family: "PixelCode", maxSize: 32, scale: 0.08, bold: true },
  { text: 'The Battlefield Widens for RadOS Agent Seats', family: "Mondwest", maxSize: 48, scale: 0.12, bold: true },
] as const;

const DROP_CAP_SIZE = 64; // px — must match render
const DROP_CAP_LH = 0.85; // line-height multiplier — must match render
const DROP_CAP_FONT = `${DROP_CAP_SIZE}px 'Waves Blackletter CPC'`;

interface PreparedTexts {
  body: PreparedTextWithSegments[];
  headings: Map<string, PreparedTextWithSegments>;
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
  baseFontSize: number,
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
      // Clamp: headings never smaller than body text size
      const fontSize = Math.round(Math.max(Math.min(w * spec.scale, spec.maxSize), baseFontSize));
      const fontStr = `${spec.bold ? 'bold ' : ''}${fontSize}px ${spec.family}`;
      // Key includes font string so different column widths produce distinct entries
      headings.set(`${spec.text}::${fontStr}`, getPrepared(cache, spec.text, fontStr));
    }
  }

  const dropCap = getPrepared(cache, 'G', DROP_CAP_FONT);

  return { body, headings, dropCap };
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
  let y = 0;

  function col() { return cols[ci]!; }
  function fits(h: number) { return y + h <= maxColH; }
  function nextCol(): boolean { ci++; y = 0; return ci < cols.length; }

  // --- Body text with obstacle avoidance ---
  let bodyIdx = 0;
  function layText(dropCapW = 0, dropCapH = 0) {
    const prep = prepared.body[bodyIdx++]!;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    // Note: Narrow columns (~173px) produce ~11 chars/line at body size.
    // This is intentional newspaper-density editorial layout.
    // Pretext handles line-breaking; CSS hyphens are not applicable.
    while (ci < cols.length) {
      if (!fits(bodyLh)) { if (!nextCol()) return; continue; }

      // Drop cap obstacle (first column only)
      const inDropCap = ci === 0 && y < dropCapH && dropCapW > 0;
      let lineW = inDropCap ? col().width - dropCapW : col().width;
      let lineX = inDropCap ? col().x + dropCapW : col().x;

      // Polygon obstacle avoidance (draggable logo)
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
  function layHeading(text: string, family: string, maxSize: number, lhRatio: number, scale: number, bold = false, center = false) {
    if (ci >= cols.length) return;
    // Clamp: headings never smaller than body text size
    const fontSize = Math.round(Math.max(Math.min(col().width * scale, maxSize), baseFontSize));
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
    y += 16; // gap after heading
  }

  // --- Hero image — if current column is too narrow, advance to a wider one ---
  function layHero() {
    if (ci >= cols.length) return;
    // Skip narrow columns for the hero — it needs breathing room
    while (ci < cols.length && col().width < 200) {
      if (!nextCol()) return;
    }
    const w = col().width;
    const imgH = w / (357 / 258);
    const totalH = imgH + 16;
    if (!fits(totalH)) { if (!nextCol()) return; }
    els.push({ kind: 'hero', x: col().x, y, w, h: imgH });
    y += totalH;
  }

  // --- Paragraph gap ---
  function layGap(lines = 1.5) {
    y += bodyLh * lines;
  }

  // --- Horizontal rule ---
  function layRule() {
    if (ci >= cols.length) return;
    els.push({ kind: 'rule', x: col().x, y, w: col().width });
    y += 16;
  }

  // ==========================================================================
  // Document flow
  // ==========================================================================

  const dcLine = layoutNextLine(prepared.dropCap, { segmentIndex: 0, graphemeIndex: 0 }, 200);
  const dcW = (dcLine?.width ?? 50) + 8;
  const dcH = Math.ceil(DROP_CAP_SIZE * DROP_CAP_LH);
  els.push({ kind: 'dropcap', x: col().x, y });

  layText(dcW, dcH);   // P1
  layGap(2);
  layHero();
  //                                                           max  lhR  scale  bold  center
  // scale = maxSize / ~400px (target col width where max is reached)
  layHeading('RadOS Coming Soon', "'Joystix Monospace'",         27,  1.2, 0.065, false, true);
  layGap();
  layText();           // P2
  layGap(2);
  layRule();
  layGap();
  layHeading('RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM', "PixelCode", 32, 1.2, 0.08, true, true);
  layGap();
  layRule();
  layGap(2);
  layText();           // P3
  layGap(2);
  layRule();
  layGap();
  layHeading('The Battlefield Widens for RadOS Agent Seats', "Mondwest", 48, 1.1, 0.12, true, false);
  layGap(2);
  layText();           // P4

  const maxY = els.reduce((m, el) => Math.max(m, el.y + ('h' in el ? el.h : bodyLh)), 0);
  return { els, height: maxY + 32, baseFontSize, bodyLh };
}

// ============================================================================
// Component
// ============================================================================

const CHROME_Y = 52; // px offset for logos above the document flow

export function GoodNewsApp({ windowId }: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(790);
  const [result, setResult] = useState<SpreadResult | null>(null);

  // Logo obstacle — draggable & resizable, polygon hull for shape wrapping
  const [obs, setObs] = useState<ObsRect>({ x: 16, y: 600, w: 200, h: 200 });
  const [hull, setHull] = useState<Point[] | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);

  // Prepare cache — survives across renders so drag/resize frames only
  // re-run the cheap layout arithmetic, not the expensive canvas measurement.
  // Keyed by `font::text`, matching the @chenglou/pretext demo pattern.
  const prepareCacheRef = useRef(new Map<string, PreparedTextWithSegments>());

  // Load SVG polygon hull once — traces the alpha contour for shape wrapping
  useEffect(() => {
    getWrapHull('/assets/icons/radiants-logo.svg', { smoothRadius: 6, mode: 'mean' }).then(setHull);
  }, []);

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
      const prepared = buildPreparedTexts(prepareCacheRef.current, colWidths, bodyFont, baseFontSize);
      setResult(computeLayout(containerWidth, obs, hull, prepared, baseFontSize, bodyLh));
    });
  }, [containerWidth, obs, hull]);

  // Cleanup: free pretext internal measurement caches on unmount
  useEffect(() => {
    return () => {
      prepareCacheRef.current.clear();
      clearCache();
    };
  }, []);

  // --- Drag handlers ---
  function onDragDown(e: React.PointerEvent) {
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: obs.x, oy: obs.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDragMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setObs(prev => ({
      ...prev,
      x: dragRef.current!.ox + (e.clientX - dragRef.current!.sx),
      y: dragRef.current!.oy + (e.clientY - dragRef.current!.sy),
    }));
  }
  function onDragUp() { dragRef.current = null; }

  // --- Resize handlers ---
  function onResizeDown(e: React.PointerEvent) {
    e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, ow: obs.w, oh: obs.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onResizeMove(e: React.PointerEvent) {
    if (!resizeRef.current) return;
    setObs(prev => ({
      ...prev,
      w: Math.max(resizeRef.current!.ow + (e.clientX - resizeRef.current!.sx), 120),
      h: Math.max(resizeRef.current!.oh + (e.clientY - resizeRef.current!.sy), 120),
    }));
  }
  function onResizeUp() { resizeRef.current = null; }

  // Column geometry (for vertical rules)
  const colCount = getColCount(containerWidth);
  const ruleXs = getRuleXPositions(containerWidth, colCount);

  return (
    <div className="h-full relative">
      <div className="absolute top-0 left-0 right-0 h-1 z-10" style={{ backgroundImage: 'var(--pat-diagonal-dots)', backgroundRepeat: 'repeat' }} />
      <div className="absolute top-1 left-0 right-0 h-1 z-10" style={{ backgroundImage: 'var(--pat-spray-grid)', backgroundRepeat: 'repeat' }} />
      <div ref={containerRef} className="bg-card h-full overflow-y-auto border-t border-ink">
      <div style={{ padding: `0 ${COL_MARGIN}px` }}>

        {/* ============================================================
            MASTHEAD — left info | GOOD NEWS centered | right info
            ============================================================ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 3fr 1fr',
          columnGap: 16,
          paddingTop: 20,
          alignItems: 'center',
        }}>
          {/* Left info */}
          <div style={{ textAlign: 'left' }}>
            <p className="text-head font-bold" style={{ fontFamily: "var(--font-sans)", fontSize: '1rem', letterSpacing: '-0.05em', lineHeight: 'normal' }}>
              Largest Daily Founders Workshop
            </p>
            <p className="text-head uppercase" style={{ fontFamily: "var(--font-pixeloid)", fontSize: '0.75rem', letterSpacing: '0.05em', lineHeight: 'normal' }}>
              Solana Mobile X Radiants
            </p>
          </div>

          {/* GOOD NEWS — center column */}
          <h1
            className="text-head"
            style={{
              textAlign: 'center',
              fontFamily: "var(--font-blackletter)",
              fontSize: 64,
              fontWeight: 400,
              letterSpacing: '-0.06em',
              lineHeight: 'normal',
            }}
          >
            Good News
          </h1>

          {/* Right info */}
          <div style={{ textAlign: 'right' }}>
            <p className="text-head" style={{ fontFamily: "var(--font-sans)", fontSize: '1rem', letterSpacing: '-0.05em', lineHeight: 'normal' }}>
              $2,000,000 In Pages Burnt
            </p>
            <p className="text-head uppercase" style={{ fontFamily: "var(--font-pixeloid)", fontSize: '0.75rem', letterSpacing: '0.05em', lineHeight: 'normal' }}>
              More on <span style={{ fontWeight: 700 }}>p6</span>
            </p>
          </div>
        </div>

        <div className="bg-head" style={{ height: 1, marginTop: 6 }} />
        <div
          className="flex justify-between text-head uppercase"
          style={{ fontFamily: "var(--font-pixeloid)", fontSize: '0.83rem', fontWeight: 700, padding: '4px 0', lineHeight: 'normal', letterSpacing: '0.05em' }}
        >
          <span>Monday, November 28th, 2026</span>
          <span>$1.50 per issue</span>
        </div>
        <div className="bg-head" style={{ height: 1 }} />
      </div>

      {/* ================================================================
          DOCUMENT FLOW
          ================================================================ */}
      {result && (
        <div className="relative" style={{ height: result.height + 32, marginTop: 8 }}>
          {/* Vertical column rules */}
          {ruleXs.map((rx, i) => (
            <div key={`rule-${i}`} className="absolute bg-head" style={{ left: rx, top: 0, width: 1, height: result.height }} />
          ))}

          {/* RAD☀NEWS logos */}
          <div className="absolute flex items-center gap-1" style={{ left: COL_MARGIN, top: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tabloid/radsun-black.svg" alt="" style={{ width: 128, height: 37 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tabloid/radnews-frame.svg" alt="" style={{ width: 108, height: 25 }} />
          </div>

          {/* Pretext-rendered elements */}
          {result.els.map((el, i) => {
            switch (el.kind) {
              case 'line':
                return (
                  <div key={i} className="absolute text-head" style={{ left: el.x, top: el.y + CHROME_Y, whiteSpace: 'pre', font: `${result.baseFontSize}px/${result.bodyLh}px 'Mondwest', serif` }}>
                    {el.text}
                  </div>
                );
              case 'dropcap':
                return (
                  <div key={i} className="absolute text-head" style={{ left: el.x, top: el.y + CHROME_Y, fontFamily: "var(--font-blackletter)", fontSize: DROP_CAP_SIZE, fontWeight: 400, lineHeight: DROP_CAP_LH, letterSpacing: '-0.04em' }}>
                    G
                  </div>
                );
              case 'heading-line':
                return (
                  <div
                    key={i}
                    className="absolute text-head"
                    style={{
                      left: el.x,
                      top: el.y + CHROME_Y,
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
                  <div key={i} className="absolute border border-line overflow-hidden" style={{ left: el.x, top: el.y + CHROME_Y, width: el.w, height: el.h }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/tabloid/hero-image.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                );
              case 'rule':
                return el.w > 1 ? <div key={i} className="absolute bg-head" style={{ left: el.x, top: el.y + CHROME_Y, width: el.w, height: 1 }} /> : null;
              default:
                return null;
            }
          })}

          {/* ============================================================
              SCREENSHOT — draggable & resizable obstacle
              Text reflows around it in real time via pretext.
              ============================================================ */}
          {/* Draggable logo — inline SVG, text wraps around its polygon hull */}
          <svg
            className="absolute text-head select-none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 65 65"
            fill="none"
            style={{ left: obs.x, top: obs.y + CHROME_Y, width: obs.w, height: obs.h, cursor: 'grab', zIndex: 10 }}
            onPointerDown={onDragDown}
            onPointerMove={onDragMove}
            onPointerUp={onDragUp}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M29.6393 4.93988V0H34.5791V4.93988H39.519V9.87976H24.6994V4.93988H29.6393ZM59.2789 29.6392H64.2188V34.5791H59.2789V39.5189H54.339V24.6993H59.2789V29.6392ZM0 34.5797H4.93988V39.5196H9.87976V24.7H4.93988V29.6399H0V34.5797ZM14.8198 14.8189V19.7587H9.87988V9.87899H19.7596V14.8189H14.8198ZM44.4591 14.8189H49.399V19.7587H54.3389V9.87899H44.4591V14.8189ZM49.399 49.3981L49.399 44.4582H54.3389V54.338H44.4591V49.3981H49.399ZM19.7596 49.3981H14.8198V44.4582H9.87988V54.338H19.7596V49.3981ZM34.5797 59.279V64.2188H29.6398L29.6398 59.279H24.6999V54.3391H39.5195V59.279H34.5797ZM24.6991 14.8204H39.5187V19.7603H44.4586V24.7002H49.3985V39.5198H44.4586V44.4597H39.5187V49.3996H24.6991V44.4597H19.7592V39.5198H14.8193V24.7002H19.7592V19.7603H24.6991V14.8204Z"
              fill="currentColor"
            />
            {/* Resize handle */}
            <rect
              x="57" y="57" width="8" height="8"
              fill="currentColor" opacity="0.2"
              style={{ cursor: 'se-resize' }}
              onPointerDown={onResizeDown}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeUp}
            />
          </svg>
        </div>
      )}
      </div>
    </div>
  );
}

export default GoodNewsApp;
