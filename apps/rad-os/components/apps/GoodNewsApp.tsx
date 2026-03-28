'use client';

import { type AppProps } from '@/lib/apps';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  prepareWithSegments,
  layoutNextLine,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';

// ============================================================================
// Article Content
// ============================================================================

const LONG = 'Ultricies mauris diam. In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique. Posuere leo convallis eu facilisis mattis ut urna egestas. Arcu congue congue sem vulputate orci.';
const SHORT = 'In tellus eu bibendum ultricies. Cursus mi pellentesque vel ridiculus interdum orci. Nibh non sed et commodo felis urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia. Suspendisse odio ullamcorper sit risus malesuada elementum malesuada pellentesque pharetra. Augue sit nulla feugiat porttitor elementum. Id aliquet maecenas morbi tristique.';

const ARTICLE = [LONG, SHORT, LONG, SHORT, LONG, SHORT, LONG, SHORT, LONG, SHORT, 'urna purus dignissim nisi. Donec tortor in malesuada sed est lacinia.'].join(' ');

const INTRO = 'orem ipsum dolor sit amet consectetur. Big ipsum feugiat morbi ulputate sed. Rehawww. Yeeeeeeee big dawg here we go.';

const CAPTION = 'It all seemed so misguided, our fortunes tied to fleeting pixels and the whims of a market unable to see beyond the surface. To most, we were chasing shadows, lost in a world they deemed absurd. Yet, perhaps we were merely misdirected, perhaps it was just a preamble.';

// ============================================================================
// Pretext Flow Hook
//
// prepare() is expensive (canvas measurement) — cached in a ref.
// layoutNextLine() is pure arithmetic (~0.0002ms/line) — re-runs on every
// resize via the `areas` dependency. This is pretext's core value: instant
// re-layout without touching the DOM.
// ============================================================================

interface FlowArea {
  width: number;
  maxLines: number;
}

function useFlowingText(text: string, font: string, areas: FlowArea[]): string[] {
  const [texts, setTexts] = useState<string[]>(() => areas.map(() => ''));
  const cacheRef = useRef<{ key: string; prepared: PreparedTextWithSegments } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.fonts.ready.then(() => {
      // Cache the expensive prepare() call — only re-run if text or font change
      const cacheKey = `${text}|${font}`;
      if (!cacheRef.current || cacheRef.current.key !== cacheKey) {
        cacheRef.current = { key: cacheKey, prepared: prepareWithSegments(text, font) };
      }

      const { prepared } = cacheRef.current;
      const results: string[] = [];
      let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

      // Walk through the article, filling each area until maxLines, then
      // continue where we left off in the next area. ~0.02ms total.
      for (const area of areas) {
        if (area.width <= 0) { results.push(''); continue; }
        const lines: string[] = [];
        for (let i = 0; i < area.maxLines; i++) {
          const line = layoutNextLine(prepared, cursor, area.width);
          if (!line) break;
          lines.push(line.text);
          cursor = line.end;
        }
        results.push(lines.join(' '));
      }

      setTexts(results);
    });
  }, [text, font, areas]);

  return texts;
}

// ============================================================================
// Body Text
// ============================================================================

const bodyStyle: React.CSSProperties = {
  fontFamily: "'Mondwest', serif",
  fontSize: 12,
  lineHeight: 1.2,
  letterSpacing: -0.12,
};

function BodyText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-head text-justify ${className}`} style={bodyStyle}>
      {children}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function GoodNewsApp({ windowId }: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(790); // sensible default

  // Track container width for responsive reflow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 790);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Derive column widths from container
  const margin = 16;
  const ruleW = 1;
  const available = Math.max(containerWidth - margin * 2 - ruleW * 2, 100);
  const leftW = Math.floor(available * 0.24);
  const rightW = Math.floor(available * 0.24);
  const centerW = available - leftW - rightW;

  // Dynamic flow areas — recalculated on resize, triggers pretext re-layout
  const flowAreas = useMemo<FlowArea[]>(() => [
    { width: Math.max(leftW - 8, 10), maxLines: 30 },    // Left column body
    { width: Math.max(centerW - 16, 10), maxLines: 8 },   // Center below hero
    { width: Math.max(rightW - 8, 10), maxLines: 24 },    // Right column
    { width: Math.max(Math.floor(centerW * 0.45), 10), maxLines: 24 },  // Lower center
    { width: Math.max(rightW - 8, 10), maxLines: 24 },    // Lower right
  ], [leftW, centerW, rightW]);

  const sections = useFlowingText(ARTICLE, '12px Mondwest', flowAreas);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-page">
      <div style={{ padding: `0 ${margin}px` }}>

        {/* ================================================================
            MASTHEAD
            ================================================================ */}
        <div className="text-center" style={{ paddingTop: 20 }}>
          <h1
            className="text-head"
            style={{
              fontFamily: "'Waves Blackletter CPC', serif",
              fontSize: Math.min(containerWidth * 0.08, 64),
              letterSpacing: -3.84,
              lineHeight: 'normal',
            }}
          >
            Good News
          </h1>

          {/* Header teasers */}
          <div className="flex justify-between items-start" style={{ marginTop: 4 }}>
            <div style={{ textAlign: 'left', maxWidth: 140 }}>
              <p className="text-head font-bold" style={{ fontFamily: "'Mondwest', serif", fontSize: 14, letterSpacing: -0.8, lineHeight: 'normal' }}>
                Largest Daily Founders Workshop
              </p>
              <p className="text-head uppercase" style={{ fontFamily: "'Pixeloid Sans', sans-serif", fontSize: 7, lineHeight: 'normal' }}>
                Solana Mobile X Radiants
              </p>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 100 }}>
              <p className="text-head" style={{ fontFamily: "'Mondwest', serif", fontSize: 14, letterSpacing: -0.8, lineHeight: 'normal' }}>
                $2,000,000 In Pages Burnt
              </p>
              <p className="text-head uppercase" style={{ fontFamily: "'Pixeloid Sans', sans-serif", fontSize: 7, lineHeight: 'normal' }}>
                More on <strong>p6</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================
            RULES + DATE BAR
            ================================================================ */}
        <div className="bg-head" style={{ height: 1, marginTop: 6 }} />
        <div
          className="flex justify-between text-head uppercase"
          style={{ fontFamily: "'Pixeloid Sans', sans-serif", fontSize: 10, fontWeight: 700, padding: '4px 0', lineHeight: 'normal' }}
        >
          <span>Monday, November 28th, 2026</span>
          <span>$1.50 per issue</span>
        </div>
        <div className="bg-head" style={{ height: 1 }} />

        {/* ================================================================
            THREE-COLUMN GRID — widths drive pretext reflow
            ================================================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${leftW}px ${ruleW}px ${centerW}px ${ruleW}px ${rightW}px`,
            marginTop: 8,
          }}
        >
          {/* --- LEFT COLUMN --- */}
          <div style={{ paddingRight: 8 }}>
            {/* RAD☀NEWS branding */}
            <div className="flex items-center gap-1" style={{ marginBottom: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tabloid/radsun-black.svg" alt="" style={{ height: 28 }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tabloid/radnews-frame.svg" alt="" style={{ height: 19 }} />
            </div>

            {/* Drop cap intro */}
            <BodyText>
              <span
                className="text-head float-left"
                style={{
                  fontFamily: "'Waves Blackletter CPC', serif",
                  fontSize: 48,
                  lineHeight: 0.85,
                  letterSpacing: -2,
                  marginRight: 4,
                }}
              >
                G
              </span>
              {INTRO}
            </BodyText>

            {/* Flowing article — section 0 */}
            <BodyText className="mt-3">{sections[0]}</BodyText>
          </div>

          {/* Vertical rule */}
          <div className="bg-head" />

          {/* --- CENTER COLUMN --- */}
          <div style={{ padding: '0 8px' }}>
            {/* Hero image */}
            <div className="border border-line overflow-hidden" style={{ aspectRatio: '357 / 258' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/tabloid/hero-image.png"
                alt="Calling the Radiants"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* RADOS COMING SOON */}
            <p
              className="text-head text-center"
              style={{
                fontFamily: "'Joystix Monospace', monospace",
                fontSize: Math.min(centerW * 0.055, 20),
                lineHeight: 'normal',
                margin: '12px 0',
              }}
            >
              RadOS Coming Soon
            </p>

            {/* Flowing article — section 1 */}
            <BodyText>{sections[1]}</BodyText>

            {/* Rule */}
            <div className="bg-head my-3" style={{ height: 1 }} />

            {/* Big headline */}
            <h2
              className="text-head"
              style={{
                fontFamily: "'Mondwest', serif",
                fontSize: Math.min(centerW * 0.1, 36),
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              The Battlefield Widens for RadOS Agent Seats
            </h2>
          </div>

          {/* Vertical rule */}
          <div className="bg-head" />

          {/* --- RIGHT COLUMN --- */}
          <div style={{ paddingLeft: 8 }}>
            {/* Feature headline */}
            <p
              className="text-head text-center"
              style={{
                fontFamily: "'PixelCode', monospace",
                fontSize: Math.min(rightW * 0.14, 24),
                fontWeight: 700,
                lineHeight: 'normal',
                marginBottom: 12,
              }}
            >
              RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM
            </p>

            <div className="bg-head" style={{ height: 1, marginBottom: 12 }} />

            {/* Flowing article — section 2 */}
            <BodyText>{sections[2]}</BodyText>
          </div>
        </div>

        {/* ================================================================
            LOWER SECTION
            ================================================================ */}
        <div
          className="mt-4 mb-4"
          style={{
            display: 'grid',
            gridTemplateColumns: '47% 1fr 1fr',
            gap: 16,
          }}
        >
          {/* Screenshot with caption */}
          <div className="relative border border-line overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
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
                padding: 12,
                fontFamily: "'Mondwest', serif",
                fontSize: 11,
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

          {/* Flowing article — section 3 */}
          <BodyText>{sections[3]}</BodyText>

          {/* Flowing article — section 4 */}
          <BodyText>{sections[4]}</BodyText>
        </div>
      </div>
    </div>
  );
}

export default GoodNewsApp;
