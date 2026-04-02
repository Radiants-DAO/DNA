'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppProps } from '@/lib/apps';

// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------

interface Slide {
  kind: 'title' | 'quote' | 'section' | 'bullets' | 'end';
  heading?: string;
  subhead?: string;
  body?: string[];
  bullets?: string[];
  label?: string;
  note?: string;
}

const SLIDES: Slide[] = [
  {
    kind: 'title',
    heading: 'Ship Pretty\nor Die',
    subhead: 'Branding in the age of agents',
  },
  {
    kind: 'quote',
    body: [
      '"Taste" is bullshit.',
      'There is no inherent value in having taste.',
      'What matters is applying it, relentlessly, over a large number of years.',
    ],
    label: 'Thesis',
  },
  {
    kind: 'bullets',
    heading: 'I.',
    subhead: 'Long Live the Tradesman',
    bullets: [
      'The old division is dead. Designer makes mockups, developer writes code. Gone.',
      'Design is a full-stack trade now. Tokens, components, linting rules, deployment, motion, typography, color science.',
      'If you can\'t ship it, you didn\'t design it.',
      'The walls just fell down. Design was always full stack. We just didn\'t have the tools to prove it.',
    ],
    note: 'AI is the best chisel ever made. It\'s still just a chisel. You need to know what you\'re carving.',
  },
  {
    kind: 'bullets',
    heading: 'II.',
    subhead: 'The Filter Is the Brand Kit',
    bullets: [
      'Your linter is your brand guardian now. Not your brand PDF. Not your Figma library. Your linter.',
      'Enforced token usage, semantic color rules, spacing constraints, motion limits.',
      'Consistent design at scale without a 40-page style guide nobody reads.',
    ],
    note: 'Build a good filter, have good design.',
  },
  {
    kind: 'bullets',
    heading: 'III.',
    subhead: 'Build Your Own Tools',
    body: [
      'You cannot compete with the flaming money pile. They will have access to tools you do not. Unless you build your own.',
    ],
    bullets: [
      'Flow: Webflow replacement. Chrome extension. Edit the web directly.',
      'RadOS: Desktop-OS UI. Window system. App ecosystem.',
      'DNA / Radiants: Token system, component schemas, theme spec. Portable design system that agents can read.',
    ],
    note: 'The moat isn\'t the technology. It\'s the taste baked into the toolchain.',
  },
  {
    kind: 'bullets',
    heading: 'IV.',
    subhead: 'The Agentic Web Demands Beauty',
    bullets: [
      'The web is getting more agentic. Agents browsing, agents buying, agents comparing.',
      'Humans become the scarce resource.',
      'You must give people reasons to want to use the website. Not need to. Want to.',
      'Agents don\'t care about your brand. Humans do.',
      'Beauty is the last defensible moat against automation.',
    ],
  },
  {
    kind: 'bullets',
    heading: 'V.',
    subhead: 'Branding Has Collapsed Into Design',
    bullets: [
      'Branding, UI/UX, visual design, product design, motion design. These used to be separate careers. They\'ve collapsed into one discipline.',
      'The strongest designers have always been generalists.',
      'Now they need only a team of agents and a Claude Max subscription.',
      'The generalist designer with taste and agency is the new full-stack.',
      'The specialist who can only push pixels in one tool is the new junior.',
    ],
  },
  {
    kind: 'bullets',
    heading: 'VI.',
    subhead: 'Time in the Market of the Mind',
    bullets: [
      'We\'re all fatigued by new things. Every day there\'s a new tool, a new framework, a new AI wrapper.',
      'The brands that win are the ones that stay. Not the ones that launch loudest.',
      'Consistency compounds. Every day your brand exists and doesn\'t embarrass itself is a day it gets stronger.',
    ],
    note: 'Taste is a snapshot. Applied taste, over years, is a brand.',
  },
  {
    kind: 'bullets',
    heading: 'VII.',
    subhead: 'Open Brand > Protected Brand',
    bullets: [
      'You\'ve been there. Scraping assets off of websites to build pitches. Pulling logos from Google Images.',
      'Begging for brand guidelines that don\'t exist or are locked behind an NDA.',
      'Now flip it: make every asset, every token, every component available.',
      'Your superfans become your design team. They build things you never imagined.',
      'You can hire based on what people have already made for you, unprompted.',
    ],
    note: 'Free cult labor is the best kind of labor.',
  },
  {
    kind: 'end',
    body: [
      'An open brand is better than a protected one.',
      'Make your assets available so that your superfans can build without you.',
    ],
    label: 'Core Pitch',
  },
];

// ---------------------------------------------------------------------------
// Slide renderers
// ---------------------------------------------------------------------------

function TitleSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h1
        className="text-head text-center whitespace-pre-line leading-none"
        style={{ font: "700 64px 'Mondwest'" }}
      >
        {slide.heading}
      </h1>
      {slide.subhead && (
        <p className="mt-8 text-mute font-joystix text-sm uppercase tracking-widest">
          {slide.subhead}
        </p>
      )}
    </div>
  );
}

function QuoteSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-12">
      {slide.label && (
        <p className="mb-8 text-mute font-joystix text-sm uppercase tracking-widest">
          {slide.label}
        </p>
      )}
      <div className="max-w-[34rem] space-y-4">
        {slide.body?.map((line, i) => (
          <p
            key={i}
            className="text-head text-center leading-relaxed"
            style={{ font: "26px 'Mondwest'" }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function SectionSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col justify-center h-full px-12 py-10">
      {/* Section number + title */}
      <div className="mb-8">
        {slide.heading && (
          <span
            className="text-mute block mb-2"
            style={{ font: "bold 14px 'Joystix Monospace'" }}
          >
            {slide.heading}
          </span>
        )}
        {slide.subhead && (
          <h2
            className="text-head leading-tight"
            style={{ font: "700 36px 'Mondwest'" }}
          >
            {slide.subhead}
          </h2>
        )}
      </div>

      {/* Body */}
      {slide.body && (
        <div className="max-w-[36rem] space-y-3 mb-4">
          {slide.body.map((line, i) => (
            <p
              key={i}
              className="text-head leading-relaxed"
              style={{ font: "20px 'Mondwest'" }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Bullets */}
      {slide.bullets && (
        <ul className="mt-2 max-w-[36rem] space-y-3">
          {slide.bullets.map((b, i) => (
            <li
              key={i}
              className="text-head leading-relaxed pl-5 border-l-2 border-line"
              style={{ font: "19px 'Mondwest'" }}
            >
              {b}
            </li>
          ))}
        </ul>
      )}

      {/* Pull-quote / note */}
      {slide.note && (
        <p
          className="mt-8 text-accent italic max-w-[32rem]"
          style={{ font: "italic 20px 'Mondwest'" }}
        >
          {slide.note}
        </p>
      )}
    </div>
  );
}

function EndSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-12">
      {slide.label && (
        <p className="mb-8 text-mute font-joystix text-sm uppercase tracking-widest">
          {slide.label}
        </p>
      )}
      <div className="max-w-[34rem] space-y-4">
        {slide.body?.map((line, i) => (
          <p
            key={i}
            className="text-head text-center leading-relaxed"
            style={{ font: "700 26px 'Mondwest'" }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function renderSlide(slide: Slide) {
  switch (slide.kind) {
    case 'title':
      return <TitleSlide slide={slide} />;
    case 'quote':
      return <QuoteSlide slide={slide} />;
    case 'section':
    case 'bullets':
      return <SectionSlide slide={slide} />;
    case 'end':
      return <EndSlide slide={slide} />;
  }
}

// ---------------------------------------------------------------------------
// ShipPrettyApp
// ---------------------------------------------------------------------------

export function ShipPrettyApp({ windowId: _windowId }: AppProps) {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  const goNext = useCallback(() => {
    setCurrent((p) => Math.min(p + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrent((p) => Math.max(p - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const slide = SLIDES[current]!;

  return (
    <div className="h-full w-full flex flex-col bg-card">
      {/* Slide area */}
      <div className="relative flex-1 overflow-hidden">
        {renderSlide(slide)}
      </div>

      {/* Navigation bar — matches ManifestoBook pattern */}
      <div className="flex items-center gap-3 py-2 text-mute font-joystix text-xs select-none justify-center">
        <button
          type="button"
          className="px-2 py-1 disabled:opacity-30"
          disabled={current === 0}
          onClick={goPrev}
          aria-label="Previous slide"
        >
          &larr;
        </button>
        <span className="min-w-[5rem] text-center">
          {current + 1} / {total}
        </span>
        <button
          type="button"
          className="px-2 py-1 disabled:opacity-30"
          disabled={current >= total - 1}
          onClick={goNext}
          aria-label="Next slide"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}

export default ShipPrettyApp;
