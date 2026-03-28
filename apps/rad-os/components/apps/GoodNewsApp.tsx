'use client';

import { type AppProps } from '@/lib/apps';
import { useEffect, useState } from 'react';
import {
  prepareWithSegments,
  layoutNextLine,
  type LayoutCursor,
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
// Pretext Column Flow
// ============================================================================

interface FlowArea {
  width: number;
  maxLines: number;
}

// Text areas the article flows through, in reading order
const FLOW_AREAS: FlowArea[] = [
  { width: 180, maxLines: 30 },  // Left column body
  { width: 357, maxLines: 8 },   // Center below hero
  { width: 180, maxLines: 45 },  // Right column body
  { width: 170, maxLines: 24 },  // Lower center (beside screenshot)
  { width: 180, maxLines: 24 },  // Lower right
];

function useFlowingText(text: string, font: string, areas: FlowArea[]): string[] {
  const [texts, setTexts] = useState<string[]>(() => areas.map(() => ''));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.fonts.ready.then(() => {
      try {
        const prepared = prepareWithSegments(text, font);
        const results: string[] = [];
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

        for (const area of areas) {
          const lineTexts: string[] = [];
          for (let i = 0; i < area.maxLines; i++) {
            const line = layoutNextLine(prepared, cursor, area.width);
            if (!line) break;
            lineTexts.push(line.text);
            cursor = line.end;
          }
          results.push(lineTexts.join(' '));
        }

        setTexts(results);
      } catch {
        // Font not ready or measurement failed — fall back to raw text chunks
        const words = text.split(' ');
        const chunkSize = Math.ceil(words.length / areas.length);
        setTexts(areas.map((_, i) => words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ')));
      }
    });
  }, [text, font, areas]);

  return texts;
}

// ============================================================================
// Shared Styles
// ============================================================================

const bodyStyle: React.CSSProperties = {
  fontFamily: "'Mondwest', sans-serif",
  fontSize: 12,
  lineHeight: 1.2,
  letterSpacing: -0.12,
};

const pixeloidStyle: React.CSSProperties = {
  fontFamily: "'Pixeloid Sans', sans-serif",
  lineHeight: 'normal',
};

// ============================================================================
// Component
// ============================================================================

export function GoodNewsApp({ windowId }: AppProps) {
  const sections = useFlowingText(ARTICLE, '12px Mondwest', FLOW_AREAS);

  return (
    // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:newspaper-print-aesthetic owner:design-system expires:2027-01-01 issue:DNA-newspaper
    <div className="h-full overflow-y-auto" style={{ background: '#fffcf3' }}>
      <article
        className="relative border border-line mx-auto"
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:newspaper-print-aesthetic owner:design-system expires:2027-01-01 issue:DNA-newspaper
        style={{ width: 790, height: 1060, margin: '16px auto', background: '#fffcf3' }}
      >
        {/* ================================================================
            MASTHEAD
            ================================================================ */}
        <p
          className="absolute text-head text-center whitespace-nowrap"
          style={{
            fontFamily: "'Waves Blackletter CPC', serif",
            fontSize: 64,
            letterSpacing: -3.84,
            lineHeight: 'normal',
            left: '50%',
            top: 32,
            transform: 'translateX(-50%)',
          }}
        >
          Good News
        </p>

        {/* ================================================================
            HEADER TEASERS
            ================================================================ */}
        <div className="absolute text-head" style={{ left: 19, top: 39, width: 129 }}>
          <p className="font-bold" style={{ fontFamily: "'Mondwest', sans-serif", fontSize: 16, letterSpacing: -0.8, lineHeight: 'normal' }}>
            Largest Daily Founders Workshop
          </p>
          <p className="uppercase" style={{ ...pixeloidStyle, fontSize: 7 }}>
            Solana Mobile X Radiants
          </p>
        </div>

        <div className="absolute text-head text-right" style={{ right: 19, top: 39, width: 91 }}>
          <p style={{ fontFamily: "'Mondwest', sans-serif", fontSize: 16, letterSpacing: -0.8, lineHeight: 'normal' }}>
            $2,000,000 In Pages Burnt
          </p>
          <p className="uppercase" style={{ ...pixeloidStyle, fontSize: 7 }}>
            <span style={{ fontWeight: 400 }}>More on</span>
            <span style={{ fontWeight: 700 }}> p6</span>
          </p>
        </div>

        {/* ================================================================
            HORIZONTAL RULES + DATE BAR
            ================================================================ */}
        <div className="absolute bg-head" style={{ left: 19, top: 116, width: 751, height: 1 }} />
        <div className="absolute bg-head" style={{ left: 19, top: 138, width: 751, height: 1 }} />

        <p
          className="absolute text-head uppercase"
          style={{ ...pixeloidStyle, fontSize: 10, fontWeight: 700, left: 19, top: 121 }}
        >
          Monday, November 28th, 2026
        </p>
        <p
          className="absolute text-head text-right uppercase"
          style={{ ...pixeloidStyle, fontSize: 10, fontWeight: 700, right: 19, top: 121 }}
        >
          $1.50 per issue
        </p>

        {/* ================================================================
            VERTICAL RULES
            ================================================================ */}
        <div className="absolute bg-head" style={{ left: 207, top: 147, width: 1, height: 520 }} />
        <div className="absolute bg-head" style={{ left: 581, top: 147, width: 1, height: 879 }} />

        {/* ================================================================
            LEFT COLUMN
            ================================================================ */}

        {/* RAD☀NEWS branding */}
        <div className="absolute flex items-center" style={{ left: 20, top: 158 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tabloid/radsun-black.png" alt="RadSun" style={{ height: 28 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tabloid/radnews-frame.png" alt="RadNews" style={{ height: 19, marginLeft: 4 }} />
        </div>

        {/* Drop cap */}
        <p
          className="absolute text-head text-center"
          style={{
            fontFamily: "'Waves Blackletter CPC', serif",
            fontSize: 56,
            lineHeight: 'normal',
            letterSpacing: -2.8,
            left: 19,
            top: 207,
            width: 43,
          }}
        >
          G
        </p>

        {/* Intro text beside drop cap */}
        <p className="absolute text-head text-justify" style={{ ...bodyStyle, left: 71, top: 205, width: 128 }}>
          {INTRO}
        </p>

        {/* Left body — pretext section 0 */}
        <div className="absolute text-head text-justify" style={{ ...bodyStyle, left: 19, top: 279, width: 180 }}>
          {sections[0]}
        </div>

        {/* ================================================================
            CENTER COLUMN
            ================================================================ */}

        {/* Hero image */}
        <div
          className="absolute border border-line overflow-hidden"
          style={{ left: 216, top: 147, width: 357, height: 258 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tabloid/hero-image.png"
            alt="Calling the Radiants"
            style={{ width: '134.69%', height: '104.75%', position: 'absolute', left: '-17.34%', top: '-3.14%', objectFit: 'cover' }}
          />
        </div>

        {/* RADOS COMING SOON */}
        <p
          className="absolute text-head text-center"
          style={{
            fontFamily: "'Joystix Monospace', monospace",
            fontSize: 20,
            lineHeight: 'normal',
            left: 216,
            top: 425,
            width: 357,
          }}
        >
          RadOS Coming Soon
        </p>

        {/* Center body — pretext section 1 */}
        <p className="absolute text-head text-justify" style={{ ...bodyStyle, left: 216, top: 455, width: 357 }}>
          {sections[1]}
        </p>

        {/* Center horizontal rule */}
        <div className="absolute bg-head" style={{ left: 216, top: 558, width: 357, height: 1 }} />

        {/* Big headline */}
        <p
          className="absolute text-head"
          style={{
            fontFamily: "'Mondwest', sans-serif",
            fontSize: 36,
            fontWeight: 700,
            lineHeight: '33px',
            left: 220,
            top: 578,
            width: 357,
          }}
        >
          The Battlefield Widens for RadOS Agent Seats
        </p>

        {/* ================================================================
            RIGHT COLUMN
            ================================================================ */}

        {/* Feature headline */}
        <p
          className="absolute text-head text-center"
          style={{
            fontFamily: "'PixelCode', monospace",
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 'normal',
            left: 590,
            top: 155,
            width: 180,
          }}
        >
          RISE IN FRUSTRATION ACROSS THE SOLANA ECOSYSTEM
        </p>

        {/* Right column rule */}
        <div className="absolute bg-head" style={{ left: 590, top: 279, width: 180, height: 1 }} />

        {/* Right body — pretext section 2 */}
        <div className="absolute text-head text-justify" style={{ ...bodyStyle, left: 590, top: 296, width: 180 }}>
          {sections[2]}
        </div>

        {/* ================================================================
            LOWER SECTION
            ================================================================ */}

        {/* Screenshot image */}
        <div
          className="absolute border border-line overflow-hidden"
          style={{ left: 17, top: 654, width: 373, height: 372 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tabloid/screenshot.png"
            alt="RadOS Screenshot"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Caption overlay */}
          <div
            className="absolute text-head"
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:newspaper-caption-overlay owner:design-system expires:2027-01-01 issue:DNA-newspaper
            style={{ bottom: 0, left: 0, right: 0, padding: 12, fontFamily: "'Mondwest', sans-serif", fontSize: 11, lineHeight: 1.3, background: 'rgba(255, 252, 243, 0.92)' }}
          >
            <p className="italic">{CAPTION}</p>
            <p className="text-accent font-bold" style={{ marginTop: 4 }}>
              In the twilight of confusion new ideas emerge.
            </p>
          </div>
        </div>

        {/* Lower center body — pretext section 3 */}
        <div className="absolute text-head text-justify" style={{ ...bodyStyle, left: 398, top: 659, width: 170 }}>
          {sections[3]}
        </div>

        {/* Lower right body — pretext section 4 */}
        <div className="absolute text-head text-justify" style={{ ...bodyStyle, left: 590, top: 660, width: 180 }}>
          {sections[4]}
        </div>
      </article>
    </div>
  );
}

export default GoodNewsApp;
