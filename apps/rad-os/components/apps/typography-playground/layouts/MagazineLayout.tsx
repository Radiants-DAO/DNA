'use client';
import { FONTS, type FontEntry } from '../typography-data';
import { DESIGN_STATEMENT, FONT_RATIONALE, type FontRationale } from '../type-manual-copy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SPECIMEN = 'AaBbCc';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';

function getRationale(shortName: string): FontRationale | undefined {
  return FONT_RATIONALE.find((r) => r.shortName === shortName);
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section className="px-8 pt-16 pb-20 space-y-8">
      {/* Overline */}
      <span className="font-mono text-xs text-mute uppercase tracking-wide block">
        RDNA Type System
      </span>

      {/* Headline */}
      <h1 className="font-joystix text-3xl text-main leading-tight uppercase tracking-tight">
        {DESIGN_STATEMENT.headline}
      </h1>

      {/* Body */}
      <p className="font-mondwest text-base text-sub leading-relaxed max-w-[32rem]">
        {DESIGN_STATEMENT.body}
      </p>

      {/* Subhead accent strip */}
      <div className="bg-accent px-6 py-4 inline-block">
        <span className="font-joystix text-lg text-inv uppercase tracking-tight">
          {DESIGN_STATEMENT.subhead}
        </span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Font Profile Spread
// ---------------------------------------------------------------------------

interface FontProfileProps {
  font: FontEntry;
  rationale: FontRationale;
  inverted?: boolean;
  alignRight?: boolean;
}

function FontProfile({ font, rationale, inverted, alignRight }: FontProfileProps) {
  const bg = inverted ? 'bg-inv' : 'bg-page';
  const textPrimary = inverted ? 'text-flip' : 'text-main';
  const textSecondary = inverted ? 'text-flip/70' : 'text-sub';
  const textTertiary = inverted ? 'text-flip/50' : 'text-mute';
  const ruleBorder = inverted ? 'border-flip/20' : 'border-rule';
  const alignment = alignRight ? 'text-right' : 'text-left';

  return (
    <section className={`${bg} px-8 py-16 space-y-10`}>
      {/* Voice label + name */}
      <div className={`space-y-3 ${alignment}`}>
        <span className={`font-mono text-xs ${textTertiary} uppercase tracking-wide block`}>
          {rationale.voiceLabel}
        </span>
        <h2 className={`font-joystix text-2xl ${textPrimary} uppercase tracking-tight`}>
          {font.name}
        </h2>
        <p className={`font-mono text-xs ${textTertiary}`}>
          {font.role}
        </p>
      </div>

      {/* Personality + Rationale */}
      <div className={`space-y-4 ${alignment} max-w-[28rem] ${alignRight ? 'ml-auto' : ''}`}>
        <p className={`font-mondwest text-base ${textSecondary} leading-relaxed`}>
          {rationale.personality}
        </p>
        <p className={`font-mondwest text-sm ${textTertiary} leading-relaxed`}>
          {rationale.rationale}
        </p>
      </div>

      {/* Large specimen */}
      <div className={alignment}>
        <span className={`${font.className} text-3xl ${textPrimary} leading-none block`}>
          {SPECIMEN}
        </span>
      </div>

      {/* Full character set */}
      <div className={`space-y-1 ${alignment}`}>
        <div className={`${font.className} text-sm ${textSecondary} leading-relaxed break-all tracking-wide`}>
          {UPPER}
        </div>
        <div className={`${font.className} text-sm ${textSecondary} leading-relaxed break-all tracking-wide`}>
          {LOWER}
        </div>
        <div className={`${font.className} text-xs ${textTertiary} leading-relaxed break-all tracking-wide`}>
          {DIGITS}
        </div>
      </div>

      {/* Weight parade */}
      <div className={`border-t ${ruleBorder} pt-6 space-y-3`}>
        <span className={`font-mono text-xs ${textTertiary} uppercase tracking-wide block ${alignment}`}>
          Weight Parade
        </span>
        <div className="space-y-2">
          {font.weights.map((w) => (
            <div
              key={w.value}
              className={`flex items-baseline justify-between gap-4 ${alignRight ? 'flex-row-reverse' : ''}`}
            >
              <span
                className={`${font.className} text-lg ${textPrimary} leading-snug`}
                style={{ fontWeight: w.value }}
              >
                The quick brown fox jumps
              </span>
              <span className={`font-mono text-xs ${textTertiary} shrink-0`}>
                {w.label} {w.value}
              </span>
            </div>
          ))}
          {font.hasItalic && (
            <div className={`flex items-baseline justify-between gap-4 ${alignRight ? 'flex-row-reverse' : ''}`}>
              <span className={`${font.className} text-lg ${textPrimary} leading-snug italic`}>
                The quick brown fox jumps
              </span>
              <span className={`font-mono text-xs ${textTertiary} shrink-0`}>
                Italic
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// In-Use Contextual Moments
// ---------------------------------------------------------------------------

function InUseMoments() {
  return (
    <section className="px-8 py-16 space-y-14">
      {/* Section header */}
      <div className="space-y-3">
        <span className="font-mono text-xs text-mute uppercase tracking-wide block">
          In Context
        </span>
        <h2 className="font-joystix text-2xl text-main uppercase tracking-tight">
          Each Font in Its Habitat
        </h2>
        <p className="font-mondwest text-sm text-sub leading-relaxed max-w-[28rem]">
          Every font has a place. Here they are, doing what they do best.
        </p>
      </div>

      {/* Heading moment -- Joystix */}
      <div className="space-y-4">
        <span className="font-mono text-xs text-accent uppercase tracking-wide block">
          Joystix -- Display
        </span>
        <div className="border border-rule p-6 space-y-3">
          <h3 className="font-joystix text-xl text-main uppercase tracking-tight leading-tight">
            Welcome to Radiants
          </h3>
          <p className="font-joystix text-xs text-mute uppercase tracking-wide">
            Design tokens for the pixel age
          </p>
          <div className="bg-accent h-1 w-16 mt-2" />
        </div>
      </div>

      {/* Paragraph moment -- Mondwest */}
      <div className="space-y-4">
        <span className="font-mono text-xs text-accent uppercase tracking-wide block">
          Mondwest -- Editorial
        </span>
        <div className="border border-rule p-6 space-y-4">
          <h4 className="font-joystix text-sm text-main uppercase tracking-tight">
            On Pixel Warmth
          </h4>
          <p className="font-mondwest text-base text-main leading-relaxed">
            There is a particular warmth to bitmap typography that smooth vectors
            cannot replicate. Each letter sits on a grid, its edges stepping in
            deliberate increments. This is not a limitation. It is a voice.
          </p>
          <p className="font-mondwest text-sm text-sub leading-relaxed">
            Mondwest carries the editorial weight of the system. Long-form
            descriptions, thoughtful explanations, and quiet moments of
            communication all pass through this font.
          </p>
        </div>
      </div>

      {/* Code moment -- PixelCode */}
      <div className="space-y-4">
        <span className="font-mono text-xs text-accent uppercase tracking-wide block">
          PixelCode -- Technical
        </span>
        <div className="border border-rule p-6 space-y-3">
          <div className="font-mono text-xs text-mute">tokens.css</div>
          <pre className="font-mono text-sm text-main leading-relaxed">
{`@theme {
  --color-sun-yellow: oklch(0.91 0.12 94);
  --color-page: var(--color-parchment);
  --color-main: var(--color-ink);
  --font-heading: 'Joystix Monospace';
  --font-sans: 'Mondwest';
  --font-mono: 'PixelCode';
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Closing mark
// ---------------------------------------------------------------------------

function ClosingMark() {
  return (
    <section className="px-8 py-16 flex flex-col items-center text-center space-y-4">
      <div className="bg-accent w-2 h-2" />
      <span className="font-joystix text-xs text-mute uppercase tracking-wide">
        RDNA Type System v1
      </span>
      <span className="font-mono text-xs text-mute">
        Three voices. One vocabulary.
      </span>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MagazineLayout() {
  // Build font profiles with alternating style
  const profiles = FONTS.map((font, index) => {
    const rationale = getRationale(font.shortName);
    if (!rationale) return null;

    return (
      <FontProfile
        key={font.cssVar}
        font={font}
        rationale={rationale}
        // Middle font (Mondwest) gets the inverted treatment
        inverted={index === 1}
        // Alternate alignment: left, right, left
        alignRight={index === 1}
      />
    );
  });

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden">
      {/* Thin top rule */}
      <div className="h-px bg-accent mx-8 mt-4" />

      <HeroSection />

      {/* Divider before profiles */}
      <div className="h-px bg-rule mx-8" />

      {/* Font profile spreads */}
      <div className="space-y-0">
        {profiles}
      </div>

      {/* Divider before in-use */}
      <div className="h-px bg-rule mx-8" />

      <InUseMoments />

      {/* Closing */}
      <div className="h-px bg-rule mx-8" />
      <ClosingMark />
    </div>
  );
}
