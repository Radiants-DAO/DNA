'use client';

import { type AppProps } from '@/lib/apps';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  prepareWithSegments,
  layout,
  layoutNextLine,
  type LayoutCursor,
  type PreparedTextWithSegments,
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

type El =
  | { kind: 'line'; x: number; y: number; text: string }
  | { kind: 'dropcap'; x: number; y: number }
  | { kind: 'heading'; x: number; y: number; w: number; h: number; text: string; font: string; fontSize: number; lh: number; center?: boolean }
  | { kind: 'hero'; x: number; y: number; w: number; h: number }
  | { kind: 'rule'; x: number; y: number; w: number };

interface LayoutResult { els: El[]; height: number }

// ============================================================================
// Layout engine — runs in ~0.1ms, pure pretext arithmetic
// ============================================================================

const BODY_FONT = "16px Mondwest";
const BODY_LH = 19.2; // 16px × 1.2
const MAX_COL_H = 900;

function computeLayout(containerWidth: number): LayoutResult {
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

  // Rule x positions (for vertical column dividers)
  const ruleX1 = margin + lW;
  const ruleX2 = margin + lW + ruleW + cW;

  const els: El[] = [];
  let ci = 0; // current column index
  let y = 0;  // current y within column

  function col() { return cols[ci]!; }
  function fits(h: number) { return y + h <= MAX_COL_H; }
  function nextCol(): boolean {
    ci++;
    y = 0;
    return ci < cols.length;
  }

  // --- Lay out body text, returns when segment is exhausted or columns full ---
  function layText(text: string, dropCapW = 0, dropCapH = 0) {
    const prepared = prepareWithSegments(text, BODY_FONT);
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

    while (ci < cols.length) {
      if (!fits(BODY_LH)) { if (!nextCol()) return; continue; }

      // Obstacle avoidance: narrower width beside the drop cap
      const inDropCap = ci === 0 && y < dropCapH && dropCapW > 0;
      const lineW = inDropCap ? col().width - dropCapW : col().width;
      const lineX = inDropCap ? col().x + dropCapW : col().x;

      const line = layoutNextLine(prepared, cursor, lineW);
      if (!line) return;

      els.push({ kind: 'line', x: lineX, y, text: line.text });
      cursor = line.end;
      y += BODY_LH;
    }
  }

  // --- Lay out a heading block (CSS renders it, pretext measures height) ---
  function layHeading(text: string, fontStr: string, fontSize: number, lh: number, center = false) {
    if (ci >= cols.length) return;
    const prepared = prepareWithSegments(text, fontStr);
    const { height } = layout(prepared, col().width, lh);
    const gap = 16;

    if (!fits(height + gap)) { if (!nextCol()) return; }

    els.push({ kind: 'heading', x: col().x, y, w: col().width, h: height, text, font: fontStr, fontSize, lh, center });
    y += height + gap;
  }

  // --- Lay out the hero image ---
  function layHero() {
    if (ci >= cols.length) return;
    const w = col().width;
    const imgH = w / (357 / 258);
    const captionH = 48;
    const totalH = imgH + captionH;

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
  // Execute the document in reading order
  // ==========================================================================

  // Drop cap — measure "G" width with pretext
  const dropCapPrepared = prepareWithSegments('G', "64px 'Waves Blackletter CPC'");
  const dropCapLine = layoutNextLine(dropCapPrepared, { segmentIndex: 0, graphemeIndex: 0 }, 200);
  const dropCapW = (dropCapLine?.width ?? 50) + 8;
  const dropCapH = 56;
  els.push({ kind: 'dropcap', x: col().x, y });

  // Paragraph 1 — flows around the drop cap
  layText(P1, dropCapW, dropCapH);

  // Hero image + "RadOS Coming Soon"
  layHero();
  layHeading('RadOS Coming Soon', "20px 'Joystix Monospace'", 20, 24, true);

  // Paragraph 2
  layText(P2);

  // "RISE IN FRUSTRATION" heading
  layRule();
  layHeading('RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM', "bold 32px PixelCode", 32, 38, true);
  layRule();

  // Paragraph 3
  layText(P3);

  // "The Battlefield Widens" heading
  layRule();
  layHeading('The Battlefield Widens for RadOS Agent Seats', "bold 48px Mondwest", 48, 53);

  // Paragraph 4
  layText(P4);

  // Compute total height + vertical rules
  const maxY = els.reduce((m, el) => {
    const bottom = el.y + ('h' in el ? el.h : BODY_LH);
    return Math.max(m, bottom);
  }, 0);

  // Add vertical column rules
  els.push({ kind: 'rule', x: ruleX1, y: 0, w: 1 });
  // Override: vertical rules are rendered specially (full height)

  return { els, height: maxY + 32 };
}

// ============================================================================
// Component
// ============================================================================

export function GoodNewsApp({ windowId }: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(790);
  const [result, setResult] = useState<LayoutResult | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 790);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Run layout on resize — pretext prepare() is cached internally
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.fonts.ready.then(() => {
      setResult(computeLayout(containerWidth));
    });
  }, [containerWidth]);

  // Column geometry (for rules)
  const margin = 16;
  const ruleW = 1;
  const avail = Math.max(containerWidth - margin * 2 - ruleW * 2, 100);
  const lW = Math.floor(avail * 0.24);
  const rW = Math.floor(avail * 0.24);
  const cW = avail - lW - rW;
  const rule1X = margin + lW;
  const rule2X = margin + lW + ruleW + cW;

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-page">
      <div style={{ padding: `0 ${margin}px` }}>

        {/* ============================================================
            MASTHEAD (static chrome — outside the document flow)
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
          DOCUMENT FLOW — every line is an absolutely positioned div
          ================================================================ */}
      {result && (
        <div className="relative" style={{ height: result.height, marginTop: 8 }}>
          {/* Vertical column rules */}
          <div className="absolute bg-head" style={{ left: rule1X, top: 0, width: 1, height: result.height }} />
          <div className="absolute bg-head" style={{ left: rule2X, top: 0, width: 1, height: result.height }} />

          {/* RAD☀NEWS logos (static chrome) */}
          <div className="absolute flex items-center gap-1" style={{ left: margin, top: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tabloid/radsun-black.svg" alt="" style={{ width: 128, height: 37 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tabloid/radnews-frame.svg" alt="" style={{ width: 108, height: 25 }} />
          </div>

          {/* Rendered elements from pretext layout */}
          {result.els.map((el, i) => {
            switch (el.kind) {
              case 'line':
                return (
                  <div
                    key={i}
                    className="absolute text-head"
                    style={{
                      left: el.x,
                      top: el.y + 52, // offset below logos
                      whiteSpace: 'pre',
                      font: "1rem/1.2 'Mondwest', serif",
                    }}
                  >
                    {el.text}
                  </div>
                );

              case 'dropcap':
                return (
                  <div
                    key={i}
                    className="absolute text-head"
                    style={{
                      left: el.x,
                      top: el.y + 52,
                      fontFamily: "'Waves Blackletter CPC', serif",
                      fontSize: '4rem',
                      fontWeight: 400,
                      lineHeight: 0.85,
                      letterSpacing: '-0.04em',
                    }}
                  >
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
                      top: el.y + 52,
                      width: el.w,
                      fontFamily: el.font.includes('PixelCode') ? "'PixelCode', monospace"
                        : el.font.includes('Joystix') ? "'Joystix Monospace', monospace"
                        : "'Mondwest', serif",
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
                  <div
                    key={i}
                    className="absolute border border-line overflow-hidden"
                    style={{ left: el.x, top: el.y + 52, width: el.w, height: el.h }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/tabloid/hero-image.png"
                      alt="Calling the Radiants"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                );

              case 'rule':
                // Only render horizontal rules (vertical rules are separate)
                return el.w > 1 ? (
                  <div
                    key={i}
                    className="absolute bg-head"
                    style={{ left: el.x, top: el.y + 52, width: el.w, height: 1 }}
                  />
                ) : null;

              default:
                return null;
            }
          })}

          {/* Screenshot — absolutely positioned (future: draggable/resizable) */}
          <div
            className="absolute border border-line overflow-hidden"
            style={{ left: margin, bottom: 0, width: '47%', aspectRatio: '1 / 1' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tabloid/screenshot.png"
              alt="RadOS Screenshot"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 text-head"
              // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:semi-transparent-caption-overlay owner:design-system expires:2027-01-01 issue:DNA-newspaper
              style={{
                padding: 16,
                fontFamily: "'Mondwest', serif",
                fontSize: '0.92rem',
                lineHeight: 1.3,
                background: 'rgba(255, 252, 243, 0.92)',
              }}
            >
              <p className="italic">{CAPTION}</p>
              <p className="text-accent font-bold" style={{ marginTop: 4 }}>
                In the twilight of confusion new ideas emerge.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoodNewsApp;
