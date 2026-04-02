'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppProps } from '@/lib/apps';
import { parseSlides, type Slide } from './ship-pretty/parse-slides';
import slidesRaw from './ship-pretty/slides.md';

// ---------------------------------------------------------------------------
// Slide data (parsed from slides.md)
// ---------------------------------------------------------------------------

const SLIDES: Slide[] = parseSlides(slidesRaw);

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
