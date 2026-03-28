'use client';

import { type AppProps } from '@/lib/apps';
import { useEffect, useRef, useState } from 'react';
import {
  prepareWithSegments,
  layoutWithLines,
  type LayoutLine,
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
// Pretext Line Hook
//
// prepare() runs once per text+font (canvas measurement, cached in ref).
// layoutWithLines() is pure arithmetic — re-runs on every width change.
// Returns every line of the text, each with .text and .width.
// ============================================================================

function usePretextLines(text: string, font: string, width: number): LayoutLine[] {
  const [lines, setLines] = useState<LayoutLine[]>([]);
  const cacheRef = useRef<{ key: string; prepared: PreparedTextWithSegments } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || width <= 0) return;

    document.fonts.ready.then(() => {
      const cacheKey = `${text}|${font}`;
      if (!cacheRef.current || cacheRef.current.key !== cacheKey) {
        cacheRef.current = { key: cacheKey, prepared: prepareWithSegments(text, font) };
      }

      const lineHeight = 19.2; // 1rem × 1.2
      const result = layoutWithLines(cacheRef.current.prepared, width, lineHeight);
      setLines(result.lines);
    });
  }, [text, font, width]);

  return lines;
}

// ============================================================================
// Component
// ============================================================================

export function GoodNewsApp({ windowId }: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(790);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 790);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const margin = 16;
  const columnGap = 16;
  const contentWidth = containerWidth - margin * 2;
  const columnWidth = Math.floor((contentWidth - columnGap * 2) / 3);

  // Pretext measures at columnWidth - 1 for subpixel safety
  const lines = usePretextLines(ARTICLE, '16px Mondwest', columnWidth - 1);

  // Adaptive insert points — where to place inline elements
  const n = lines.length;
  const heroAt = Math.floor(n * 0.12);
  const headlineAt = Math.floor(n * 0.55);

  const renderLines = (from: number, to: number) =>
    lines.slice(from, to).map((line, i) => (
      <span key={`${from}-${i}`} style={{ display: 'block' }}>{line.text}</span>
    ));

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-page">
      <div style={{ padding: `0 ${margin}px` }}>

        {/* ================================================================
            CHROME — masthead, teasers, date bar (outside column flow)
            ================================================================ */}
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

        {/* ================================================================
            ARTICLE — single multi-column container.
            Pretext owns line breaks, CSS columns own distribution.
            Images use column-span: all or float to interrupt the flow.
            ================================================================ */}
        <article
          className="text-head text-justify"
          style={{
            columnCount: 3,
            columnGap,
            columnRule: '1px solid var(--color-head)',
            fontFamily: "'Mondwest', serif",
            fontSize: '1rem',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginTop: 8,
            paddingBottom: 16,
          }}
        >
          {/* --- Logos (inline, avoid column break) --- */}
          <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tabloid/radsun-black.svg" alt="" style={{ width: 128, height: 37 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tabloid/radnews-frame.svg" alt="" style={{ width: 108, height: 25, marginLeft: 4 }} />
          </div>

          {/* --- Drop cap + intro (CSS float, no pretext needed) --- */}
          <div style={{ breakInside: 'avoid', marginBottom: 16 }}>
            <span
              className="text-head float-left"
              style={{
                fontFamily: "'Waves Blackletter CPC', serif",
                fontSize: '4rem',
                lineHeight: 0.85,
                letterSpacing: '-0.04em',
                marginRight: 5,
              }}
            >
              G
            </span>
            {INTRO}
          </div>

          {/* --- Pretext lines: intro → hero --- */}
          {renderLines(0, heroAt)}

          {/* --- Hero image + headline banner (spans all columns) --- */}
          <figure
            style={{
              columnSpan: 'all',
              margin: '16px 0',
              display: 'flex',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <div style={{ flex: '1 1 55%' }}>
              <div className="border border-line overflow-hidden" style={{ aspectRatio: '357 / 258' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/tabloid/hero-image.png"
                  alt="Calling the Radiants"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <p
                className="text-center"
                style={{
                  fontFamily: "'Joystix Monospace', monospace",
                  fontSize: '1.67rem',
                  lineHeight: 'normal',
                  marginTop: 12,
                }}
              >
                RadOS Coming Soon
              </p>
            </div>
            <div style={{ flex: '1 1 35%' }}>
              <p
                className="text-center"
                style={{
                  fontFamily: "'PixelCode', monospace",
                  fontSize: '2rem',
                  fontWeight: 700,
                  lineHeight: 'normal',
                }}
              >
                RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM
              </p>
            </div>
          </figure>

          {/* --- Pretext lines: hero → headline --- */}
          {renderLines(heroAt, headlineAt)}

          {/* --- Main headline (spans all columns) --- */}
          <div style={{ columnSpan: 'all', margin: '16px 0' }}>
            <div className="bg-head" style={{ height: 1, marginBottom: 12 }} />
            <h2
              style={{
                fontFamily: "'Mondwest', serif",
                fontSize: '3rem',
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              The Battlefield Widens for RadOS Agent Seats
            </h2>
          </div>

          {/* --- Screenshot (floats left, text wraps around) --- */}
          <div style={{ float: 'left', width: '55%', marginRight: 16, marginBottom: 8, breakInside: 'avoid' }}>
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
                  padding: 16,
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

          {/* --- Pretext lines: headline → end (wraps around screenshot) --- */}
          {renderLines(headlineAt, n)}
        </article>
      </div>
    </div>
  );
}

export default GoodNewsApp;
