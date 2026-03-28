'use client';

import { type AppProps } from '@/lib/apps';
import { useEffect, useRef, useState } from 'react';
import {
  prepareWithSegments,
  layout,
  layoutNextLine,
  type LayoutCursor,
} from '@chenglou/pretext';

// ============================================================================
// Document content — in reading order, split at inline insertion points
// ============================================================================

const P1 = 'orem ipsum dolor sit amet consectetur. Big ipsum feugiat morbi ulputate sed. Rehawww. Yeeeeeeee big dawg here we go. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque';

const P2 = 'pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique.';

const P3 = 'Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim';

const P4 = 'nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci. In tellus eu bibendum ultricies. Cursus mi pellentesque vel';

const CAPTION = 'It all seemed so misguided, our fortunes tied to fleeting pixels and the whims of a market unable to see beyond the surface. To most, we were chasing shadows, lost in a world they deemed absurd. Yet, perhaps we were merely misdirected, perhaps it was just a preamble.';

// ============================================================================
// Layout types
// ============================================================================

interface Column { x: number; width: number }
interface ObsRect { x: number; y: number; w: number; h: number }

type El =
  | { kind: 'line'; x: number; y: number; text: string }
  | { kind: 'dropcap'; x: number; y: number }
  | { kind: 'heading'; x: number; y: number; w: number; h: number; text: string; font: string; fontSize: number; lh: number; center?: boolean }
  | { kind: 'hero'; x: number; y: number; w: number; h: number }
  | { kind: 'rule'; x: number; y: number; w: number };

interface LayoutResult { els: El[]; height: number }

// ============================================================================
// Obstacle avoidance — text lines carve around a draggable image
// ============================================================================

const OBS_GAP = 12; // px gap between obstacle and text

function getLineSlot(
  colX: number, colW: number, lineY: number, obs: ObsRect | null,
): { x: number; w: number } | null {
  if (!obs) return { x: colX, w: colW };

  // No vertical overlap → full width
  if (lineY + 19.2 <= obs.y || lineY >= obs.y + obs.h) {
    return { x: colX, w: colW };
  }

  const colR = colX + colW;
  const obsR = obs.x + obs.w;

  // No horizontal overlap → full width
  if (obs.x >= colR || obsR <= colX) {
    return { x: colX, w: colW };
  }

  // Compute available space on each side of the obstacle
  const leftSpace = Math.max(obs.x - colX - OBS_GAP, 0);
  const rightSpace = Math.max(colR - obsR - OBS_GAP, 0);

  // Use the wider side (if wide enough for text)
  if (leftSpace >= rightSpace && leftSpace > 40) {
    return { x: colX, w: leftSpace };
  }
  if (rightSpace > 40) {
    return { x: obsR + OBS_GAP, w: rightSpace };
  }

  // Both sides too narrow — skip this line position
  return null;
}

// ============================================================================
// Layout engine
// ============================================================================

const BODY_FONT = "16px Mondwest";
const BODY_LH = 19.2;

function computeLayout(containerWidth: number, obstacle: ObsRect | null): LayoutResult {
  const margin = 16;
  const ruleW = 1;
  const avail = Math.max(containerWidth - margin * 2 - ruleW * 2, 100);
  const lW = Math.floor(avail * 0.24);
  const rW = Math.floor(avail * 0.24);
  const cW = avail - lW - rW;

  const cols: Column[] = [
    { x: margin, width: lW - 8 },
    { x: margin + lW + ruleW + 8, width: cW - 16 },
    { x: margin + lW + ruleW + cW + ruleW + 8, width: rW - 8 },
  ];

  // Pre-pass: balanced column heights
  let totalBodyLines = 0;
  for (const text of [P1, P2, P3, P4]) {
    totalBodyLines += layout(prepareWithSegments(text, BODY_FONT), cols[0].width, BODY_LH).lineCount;
  }
  const maxColH = Math.ceil((totalBodyLines * BODY_LH + 500) / 3) + 80;

  const els: El[] = [];
  let ci = 0;
  let y = 0;

  function col() { return cols[ci]!; }
  function fits(h: number) { return y + h <= maxColH; }
  function nextCol(): boolean { ci++; y = 0; return ci < cols.length; }

  // --- Body text with obstacle avoidance ---
  function layText(text: string, dropCapW = 0, dropCapH = 0) {
    const prepared = prepareWithSegments(text, BODY_FONT);
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    while (ci < cols.length) {
      if (!fits(BODY_LH)) { if (!nextCol()) return; continue; }

      // Drop cap obstacle (first column only)
      const inDropCap = ci === 0 && y < dropCapH && dropCapW > 0;
      let lineW = inDropCap ? col().width - dropCapW : col().width;
      let lineX = inDropCap ? col().x + dropCapW : col().x;

      // Draggable screenshot obstacle
      const slot = getLineSlot(lineX, lineW, y, obstacle);
      if (!slot) {
        // Line blocked by obstacle — skip this y position
        y += BODY_LH;
        continue;
      }
      lineX = slot.x;
      lineW = slot.w;

      const line = layoutNextLine(prepared, cursor, lineW);
      if (!line) return;

      els.push({ kind: 'line', x: lineX, y, text: line.text });
      cursor = line.end;
      y += BODY_LH;
    }
  }

  // --- Heading ---
  function layHeading(text: string, family: string, maxSize: number, lhRatio: number, scale: number, bold = false, center = false) {
    if (ci >= cols.length) return;
    const fontSize = Math.round(Math.min(col().width * scale, maxSize));
    const lh = Math.round(fontSize * lhRatio);
    const fontStr = `${bold ? 'bold ' : ''}${fontSize}px ${family}`;
    const { height } = layout(prepareWithSegments(text, fontStr), col().width, lh);
    const gap = 16;
    if (!fits(height + gap)) { if (!nextCol()) return; }
    els.push({ kind: 'heading', x: col().x, y, w: col().width, h: height, text, font: fontStr, fontSize, lh, center });
    y += height + gap;
  }

  // --- Hero image ---
  function layHero() {
    if (ci >= cols.length) return;
    const w = col().width;
    const imgH = w / (357 / 258);
    const totalH = imgH + 48;
    if (!fits(totalH)) { if (!nextCol()) return; }
    els.push({ kind: 'hero', x: col().x, y, w, h: imgH });
    y += totalH;
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

  const dcPrep = prepareWithSegments('G', "64px 'Waves Blackletter CPC'");
  const dcLine = layoutNextLine(dcPrep, { segmentIndex: 0, graphemeIndex: 0 }, 200);
  const dcW = (dcLine?.width ?? 50) + 8;
  els.push({ kind: 'dropcap', x: col().x, y });

  layText(P1, dcW, 56);
  layHero();
  layHeading('RadOS Coming Soon', "'Joystix Monospace'", 27, 1.2, 0.073, false, true);
  layText(P2);
  layRule();
  layHeading('RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM', "PixelCode", 32, 1.2, 0.18, true, true);
  layRule();
  layText(P3);
  layRule();
  layHeading('The Battlefield Widens for RadOS Agent Seats', "Mondwest", 48, 1.1, 0.13, true, false);
  layText(P4);

  const maxY = els.reduce((m, el) => Math.max(m, el.y + ('h' in el ? el.h : BODY_LH)), 0);
  return { els, height: maxY + 32 };
}

// ============================================================================
// Component
// ============================================================================

const CHROME_Y = 52; // px offset for logos above the document flow

export function GoodNewsApp({ windowId }: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(790);
  const [result, setResult] = useState<LayoutResult | null>(null);

  // Screenshot obstacle — draggable & resizable
  const [obs, setObs] = useState<ObsRect>({ x: 16, y: 600, w: 340, h: 340 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);

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
    document.fonts.ready.then(() => setResult(computeLayout(containerWidth, obs)));
  }, [containerWidth, obs]);

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
  const margin = 16;
  const ruleW = 1;
  const avail = Math.max(containerWidth - margin * 2 - ruleW * 2, 100);
  const lW = Math.floor(avail * 0.24);
  const cW = avail - lW - Math.floor(avail * 0.24);
  const rule1X = margin + lW;
  const rule2X = margin + lW + ruleW + cW;

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-page">
      <div style={{ padding: `0 ${margin}px` }}>

        {/* ============================================================
            MASTHEAD
            ============================================================ */}
        <div className="text-center" style={{ paddingTop: 20 }}>
          <h1
            className="text-head"
            style={{
              fontFamily: "'Waves Blackletter CPC', serif",
              fontSize: Math.min(containerWidth * 0.107, 85),
              fontWeight: 400,
              letterSpacing: '-0.06em',
              lineHeight: 'normal',
            }}
          >
            Good News
          </h1>
          <div className="flex justify-between items-start" style={{ marginTop: 4 }}>
            <div style={{ textAlign: 'left', maxWidth: 180 }}>
              <p className="text-head font-bold" style={{ fontFamily: "'Mondwest', serif", fontSize: '1.17rem', letterSpacing: '-0.06em', lineHeight: 'normal' }}>
                Largest Daily Founders Workshop
              </p>
              <p className="text-head uppercase" style={{ fontFamily: "'Pixeloid Sans', sans-serif", fontSize: '0.58rem', lineHeight: 'normal' }}>
                Solana Mobile X Radiants
              </p>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 130 }}>
              <p className="text-head" style={{ fontFamily: "'Mondwest', serif", fontSize: '1.17rem', letterSpacing: '-0.06em', lineHeight: 'normal' }}>
                $2,000,000 In Pages Burnt
              </p>
              <p className="text-head uppercase" style={{ fontFamily: "'Pixeloid Sans', sans-serif", fontSize: '0.58rem', lineHeight: 'normal' }}>
                More on <strong>p6</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-head" style={{ height: 1, marginTop: 6 }} />
        <div
          className="flex justify-between text-head uppercase"
          style={{ fontFamily: "'Pixeloid Sans', sans-serif", fontSize: '0.83rem', fontWeight: 700, padding: '4px 0', lineHeight: 'normal' }}
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
          <div className="absolute bg-head" style={{ left: rule1X, top: 0, width: 1, height: result.height }} />
          <div className="absolute bg-head" style={{ left: rule2X, top: 0, width: 1, height: result.height }} />

          {/* RAD☀NEWS logos */}
          <div className="absolute flex items-center gap-1" style={{ left: margin, top: 0 }}>
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
                  <div key={i} className="absolute text-head" style={{ left: el.x, top: el.y + CHROME_Y, whiteSpace: 'pre', font: "1rem/1.2 'Mondwest', serif" }}>
                    {el.text}
                  </div>
                );
              case 'dropcap':
                return (
                  <div key={i} className="absolute text-head" style={{ left: el.x, top: el.y + CHROME_Y, fontFamily: "'Waves Blackletter CPC', serif", fontSize: '4rem', fontWeight: 400, lineHeight: 0.85, letterSpacing: '-0.04em' }}>
                    G
                  </div>
                );
              case 'heading':
                return (
                  <div
                    key={i}
                    className="absolute text-head"
                    style={{
                      left: el.x,
                      top: el.y + CHROME_Y,
                      width: el.w,
                      fontFamily: el.font.includes('PixelCode') ? "'PixelCode', monospace" : el.font.includes('Joystix') ? "'Joystix Monospace', monospace" : "'Mondwest', serif",
                      fontSize: el.fontSize,
                      fontWeight: el.font.includes('bold') ? 700 : 400,
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
          <div
            className="absolute border border-line overflow-hidden select-none"
            style={{ left: obs.x, top: obs.y + CHROME_Y, width: obs.w, height: obs.h, cursor: 'grab', zIndex: 10 }}
            onPointerDown={onDragDown}
            onPointerMove={onDragMove}
            onPointerUp={onDragUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tabloid/screenshot.png" alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            <div
              className="absolute bottom-0 left-0 right-0 text-head"
              // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:semi-transparent-caption-overlay owner:design-system expires:2027-01-01 issue:DNA-newspaper
              style={{ padding: 16, fontFamily: "'Mondwest', serif", fontSize: '0.92rem', lineHeight: 1.3, background: 'rgba(255, 252, 243, 0.92)', pointerEvents: 'none' }}
            >
              <p className="italic">{CAPTION}</p>
              <p className="text-accent font-bold" style={{ marginTop: 4 }}>In the twilight of confusion new ideas emerge.</p>
            </div>

            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 bg-head/20 hover:bg-head/40"
              style={{ width: 16, height: 16, cursor: 'se-resize' }}
              onPointerDown={onResizeDown}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeUp}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GoodNewsApp;
