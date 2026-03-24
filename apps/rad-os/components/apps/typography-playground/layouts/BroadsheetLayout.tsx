'use client';

import React from 'react';
import { FONTS, TYPE_SCALE, ELEMENT_STYLES } from '../typography-data';
import { BROADSHEET, FONT_RATIONALE, DESIGN_STATEMENT } from '../type-manual-copy';

// ---------------------------------------------------------------------------
// Utility: horizontal rule with newspaper styling
// ---------------------------------------------------------------------------
function Rule({ thick = false }: { thick?: boolean }) {
  return (
    <div
      className={`border-rule w-full ${thick ? 'border-t-2' : 'border-t'}`}
      role="separator"
    />
  );
}

// ---------------------------------------------------------------------------
// Utility: small section label in Joystix (newspaper section header)
// ---------------------------------------------------------------------------
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="font-joystix text-xs text-mute uppercase tracking-wide">
        {children}
      </span>
      <div className="flex-1 border-t border-rule" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Masthead -- newspaper nameplate, dateline, volume, tagline
// ---------------------------------------------------------------------------
function Masthead() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="text-center space-y-1 pb-3">
      {/* Top bar: volume left, dateline right */}
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-xs text-mute">{BROADSHEET.volume}</span>
        <span className="font-mono text-xs text-mute">{BROADSHEET.edition}</span>
      </div>
      <Rule thick />
      {/* Nameplate */}
      <h1 className="font-joystix text-2xl text-main tracking-wide py-2 uppercase">
        {BROADSHEET.masthead}
      </h1>
      <Rule thick />
      {/* Below-name row */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="font-mondwest text-sm text-sub italic">
          {BROADSHEET.dateline}
        </span>
        <span className="font-mondwest text-sm text-sub italic">{today}</span>
      </div>
      <p className="font-mondwest text-xs text-mute tracking-wide">
        &ldquo;{BROADSHEET.tagline}&rdquo;
      </p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Lead Story -- the design statement as a feature article
// ---------------------------------------------------------------------------
function LeadStory() {
  return (
    <article className="space-y-2">
      <SectionLabel>Lead Story</SectionLabel>
      <h2 className="font-joystix text-lg text-main uppercase tracking-wide leading-tight">
        {DESIGN_STATEMENT.headline}
      </h2>
      <p className="font-joystix text-xs text-accent uppercase tracking-wide">
        {DESIGN_STATEMENT.subhead}
      </p>
      <p className="font-mondwest text-sm text-main leading-relaxed">
        {DESIGN_STATEMENT.body}
      </p>
      {/* The three voices as a pull-quote sidebar */}
      <div className="border-t border-b border-rule py-2 space-y-1.5 mt-2">
        {FONT_RATIONALE.map((fr) => (
          <div key={fr.shortName} className="flex gap-2 items-start">
            <span className="font-joystix text-xs text-accent shrink-0 w-24 uppercase tracking-wide">
              {fr.voiceLabel}
            </span>
            <p className="font-mondwest text-xs text-sub leading-snug">
              {fr.rationale}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Font Specimens -- each font as a newspaper "column article"
// ---------------------------------------------------------------------------
function FontSpecimens() {
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';

  return (
    <section className="space-y-3">
      <SectionLabel>Font Stack</SectionLabel>
      <div className="space-y-4">
        {FONTS.map((font, i) => (
          <article key={font.cssVar} className="space-y-1.5">
            {/* Font headline */}
            <div className="flex items-baseline justify-between border-b border-rule pb-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-mute">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-joystix text-sm text-main uppercase tracking-wide">
                  {font.name}
                </h3>
              </div>
              <span className="font-mono text-xs text-mute shrink-0">
                {font.role}
              </span>
            </div>

            {/* Specimen block */}
            <div className={`${font.className} text-xl text-main leading-tight`}>
              AaBbCc 123
            </div>
            <div className={`${font.className} text-xs text-sub leading-relaxed break-all tracking-wide`}>
              {UPPER}
            </div>
            <div className={`${font.className} text-xs text-sub leading-relaxed break-all tracking-wide`}>
              {LOWER}
            </div>
            <div className={`${font.className} text-xs text-mute leading-relaxed break-all`}>
              {DIGITS} {'!@#$%&*()-+=[]{}|;:\'",.?/'}
            </div>

            {/* Weights */}
            <div className="space-y-0.5 pt-1">
              {font.weights.map((w) => (
                <div key={w.value} className="flex items-baseline justify-between">
                  <span
                    className={`${font.className} text-sm text-main`}
                    style={{ fontWeight: w.value }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </span>
                  <span className="font-mono text-xs text-mute shrink-0 ml-2">
                    {w.label} {w.value}
                  </span>
                </div>
              ))}
              {font.hasItalic && (
                <div className="flex items-baseline justify-between">
                  <span className={`${font.className} text-sm text-main italic`}>
                    The quick brown fox jumps over the lazy dog
                  </span>
                  <span className="font-mono text-xs text-mute shrink-0 ml-2">
                    Italic
                  </span>
                </div>
              )}
            </div>

            {/* Technical reference row */}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1 text-xs">
              <span className="font-mono text-mute">
                var: <span className="text-main">{font.cssVar}</span>
              </span>
              <span className="font-mono text-mute">
                tw: <span className="text-main">{font.tailwindClass}</span>
              </span>
              <span className="font-mono text-mute">
                src: <span className="text-main">{font.source}</span>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Type Scale Waterfall -- all 7 steps rendered large-to-small
// ---------------------------------------------------------------------------
function TypeScaleWaterfall() {
  return (
    <section className="space-y-2">
      <SectionLabel>Type Scale</SectionLabel>
      <div className="space-y-1">
        {TYPE_SCALE.map(({ token, label, rem, px }) => (
          <div key={token} className="flex items-baseline gap-2">
            {/* Label + size info */}
            <div className="w-20 shrink-0 flex items-baseline justify-between pr-2">
              <span className="font-joystix text-xs text-mute uppercase tracking-wide">
                {label}
              </span>
              <span className="font-mono text-xs text-mute">
                {px}
              </span>
            </div>
            {/* Rendered specimen at the actual size */}
            <span
              className="font-mondwest text-main leading-tight truncate"
              style={{ fontSize: rem }}
            >
              The Daily Glyph
            </span>
          </div>
        ))}
      </div>
      {/* Token reference table */}
      <div className="border-t border-rule pt-2 mt-2">
        <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-xs font-mono">
          <span className="text-mute uppercase">Token</span>
          <span className="text-mute uppercase">Rem</span>
          <span className="text-mute uppercase">Px</span>
          {TYPE_SCALE.map(({ token, rem, px }) => (
            <React.Fragment key={token}>
              <span className="text-main truncate">{token}</span>
              <span className="text-sub">{rem}</span>
              <span className="text-sub">{px}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Element Styles Table -- compact newspaper tabular format
// ---------------------------------------------------------------------------
function ElementStylesTable() {
  return (
    <section className="space-y-2">
      <SectionLabel>Element Styles</SectionLabel>
      <p className="font-mondwest text-xs text-mute leading-snug">
        Default typographic styles applied to HTML elements via typography.css.
        Each element maps to one of the three font voices.
      </p>
      <div className="border-t border-b border-rule divide-y divide-rule">
        {/* Header row */}
        <div className="grid grid-cols-[3rem_1fr_auto] gap-2 py-1 items-baseline">
          <span className="font-mono text-xs text-mute uppercase">El.</span>
          <span className="font-mono text-xs text-mute uppercase">Specimen</span>
          <span className="font-mono text-xs text-mute uppercase text-right">Size/Wt/Lead</span>
        </div>
        {ELEMENT_STYLES.map(({ el, font, fontClass, size, weight, leading }) => (
          <div
            key={el}
            className="grid grid-cols-[3rem_1fr_auto] gap-2 py-1.5 items-baseline"
          >
            <code className="text-xs font-mono text-accent">
              &lt;{el}&gt;
            </code>
            <span
              className={`${fontClass} text-sm text-main truncate`}
              style={{ fontWeight: weight }}
            >
              {el === 'code' || el === 'pre'
                ? 'const radiants = true;'
                : el === 'label'
                  ? 'FORM LABEL'
                  : `The quick brown fox`}
            </span>
            <span className="font-mono text-xs text-mute text-right shrink-0 whitespace-nowrap">
              {size} / {weight} / {leading}
            </span>
          </div>
        ))}
      </div>
      <p className="font-mono text-xs text-mute">
        Source: typography.css / {font.name} per element role
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Font Personality sidebar -- compact personality blurbs
// ---------------------------------------------------------------------------
function FontPersonality() {
  return (
    <section className="space-y-2">
      <SectionLabel>Font Personalities</SectionLabel>
      <div className="space-y-3">
        {FONT_RATIONALE.map((fr) => (
          <div key={fr.shortName} className="space-y-0.5">
            <div className="flex items-baseline justify-between">
              <span className="font-joystix text-xs text-main uppercase tracking-wide">
                {fr.shortName}
              </span>
              <span className="font-mono text-xs text-mute">{fr.voiceLabel}</span>
            </div>
            <p className="font-mondwest text-xs text-sub leading-snug italic">
              {fr.personality}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ===========================================================================
// BroadsheetLayout -- the full newspaper front page
// ===========================================================================

export function BroadsheetLayout() {
  return (
    <div className="bg-page text-main overflow-y-auto h-full">
      <div className="max-w-[52rem] mx-auto px-5 py-4 space-y-4">
        {/* Masthead */}
        <Masthead />

        {/* Lead story -- full width */}
        <LeadStory />

        <Rule />

        {/* Main body -- two-column newspaper layout */}
        <div className="flex gap-5">
          {/* Left column -- wider, primary content */}
          <div className="flex-[3] min-w-0 space-y-4">
            <FontSpecimens />
            <Rule />
            <ElementStylesTable />
          </div>

          {/* Column rule */}
          <div className="w-px bg-rule shrink-0" />

          {/* Right column -- narrower, reference material */}
          <div className="flex-[2] min-w-0 space-y-4">
            <TypeScaleWaterfall />
            <Rule />
            <FontPersonality />
          </div>
        </div>

        <Rule thick />

        {/* Footer / colophon */}
        <footer className="text-center space-y-1 py-2">
          <p className="font-mono text-xs text-mute">
            Typeset in Joystix Monospace, Mondwest, and PixelCode
          </p>
          <p className="font-mono text-xs text-mute">
            Published by the Radiants Design System -- {BROADSHEET.volume}
          </p>
        </footer>
      </div>
    </div>
  );
}
