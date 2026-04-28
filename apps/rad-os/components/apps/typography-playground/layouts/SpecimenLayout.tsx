'use client';
import { CORE_FONTS, EDITORIAL_FONTS, TYPE_SCALE, ELEMENT_STYLES, type FontEntry } from '../typography-data';
import { FONT_RATIONALE } from '../type-manual-copy';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMERALS = '0123456789';
const PUNCTUATION = '!@#$%^&*(){}[]|/\\:;\'"<>,.?-+=~`_';

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b-2 border-main pb-2 mb-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-mute tracking-wide">
          {number}
        </span>
        <h2 className="font-heading text-sm text-main uppercase tracking-tight">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="font-mono text-xs text-mute mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Font Specimen Block
// ---------------------------------------------------------------------------

function FontSpecimen({ font, index }: { font: FontEntry; index: number }) {
  const rationale = FONT_RATIONALE.find((r) => r.shortName === font.shortName);

  return (
    <div className="border-b border-line pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
      {/* Font name + role header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-mute">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-heading text-sm text-main uppercase tracking-tight">
              {font.name}
            </h3>
          </div>
          {rationale && (
            <span className="font-mono text-xs text-mute mt-0.5 block">
              {rationale.voiceLabel}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="font-mono text-xs text-sub block">
            {font.role}
          </span>
          <span className="font-mono text-xs text-mute block">
            {font.cssVar}
          </span>
        </div>
      </div>

      {/* Two-column: specimen left, metadata right */}
      <div className="grid grid-cols-[1fr_160px] gap-4">
        {/* Left column: alphabet + waterfall */}
        <div className="min-w-0 space-y-3">
          {/* Large specimen preview */}
          <div className={`${font.className} text-2xl text-main leading-tight`}>
            AaBbCcDdEeFf
          </div>

          {/* Full alphabet */}
          <div
            className={`${font.className} text-sm text-main leading-relaxed break-all tracking-wide`}
          >
            {ALPHA_UPPER}
          </div>
          <div
            className={`${font.className} text-sm text-sub leading-relaxed break-all tracking-wide`}
          >
            {ALPHA_LOWER}
          </div>
          <div
            className={`${font.className} text-xs text-mute leading-relaxed break-all tracking-wide`}
          >
            {NUMERALS}
          </div>
          <div
            className={`${font.className} text-xs text-mute leading-relaxed break-all tracking-wide`}
          >
            {PUNCTUATION}
          </div>

          {/* Size waterfall */}
          <div className="border-t border-line pt-3 mt-3 space-y-1">
            {TYPE_SCALE.map(({ label, rem }) => (
              <div key={label} className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-mute w-8 shrink-0 text-right">
                  {label}
                </span>
                <span
                  className={`${font.className} text-main leading-tight truncate`}
                  style={{ fontSize: rem }}
                >
                  Radiants Design System
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: metadata */}
        <div className="space-y-3 border-l border-line pl-3">
          {/* Weights */}
          <div>
            <span className="font-mono text-xs text-mute uppercase tracking-wide block mb-1">
              Weights
            </span>
            {font.weights.map((w) => (
              <div key={w.value} className="flex items-baseline justify-between py-0.5">
                <span
                  className={`${font.className} text-sm text-main`}
                  style={{ fontWeight: w.value }}
                >
                  Aa
                </span>
                <span className="font-mono text-xs text-mute">
                  {w.value} {w.label}
                </span>
              </div>
            ))}
            {font.hasItalic && (
              <div className="flex items-baseline justify-between py-0.5">
                <span className={`${font.className} text-sm text-main italic`}>
                  Aa
                </span>
                <span className="font-mono text-xs text-mute">Italic</span>
              </div>
            )}
          </div>

          {/* CSS references */}
          <div className="border-t border-line pt-2">
            <span className="font-mono text-xs text-mute uppercase tracking-wide block mb-1">
              CSS
            </span>
            <div className="space-y-0.5">
              <div className="font-mono text-xs text-sub truncate">
                var({font.cssVar})
              </div>
              <div className="font-mono text-xs text-sub truncate">
                .{font.tailwindClass}
              </div>
              <div className="font-mono text-xs text-sub truncate">
                {font.fontFamily.split(',')[0].replace(/'/g, '')}
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="border-t border-line pt-2">
            <span className="font-mono text-xs text-mute uppercase tracking-wide block mb-1">
              Usage
            </span>
            <p className="font-mono text-xs text-sub leading-relaxed">
              {font.usage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Element Mapping Table
// ---------------------------------------------------------------------------

function ElementMapping() {
  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[56px_1fr_80px_48px_56px] gap-2 px-2 py-1.5 border-b-2 border-main">
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          El.
        </span>
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          Font
        </span>
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          Size
        </span>
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          Wt.
        </span>
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          Lead
        </span>
      </div>

      {/* Rows */}
      {ELEMENT_STYLES.map(({ el, font, fontClass, size, weight, leading }) => (
        <div
          key={el}
          className="grid grid-cols-[56px_1fr_80px_48px_56px] gap-2 px-2 py-1.5 border-b border-line"
        >
          <code className="font-mono text-xs text-main">&lt;{el}&gt;</code>
          <span
            className={`${fontClass} text-xs text-main truncate`}
            style={{ fontWeight: weight }}
          >
            {font}
          </span>
          <span className="font-mono text-xs text-sub">text-{size}</span>
          <span className="font-mono text-xs text-sub">{weight}</span>
          <span className="font-mono text-xs text-sub">{leading}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type Scale Grid
// ---------------------------------------------------------------------------

function TypeScaleGrid() {
  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[48px_1fr_72px_40px] gap-2 px-2 py-1.5 border-b-2 border-main">
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          Step
        </span>
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          Token
        </span>
        <span className="font-mono text-xs text-mute uppercase tracking-wide">
          Rem
        </span>
        <span className="font-mono text-xs text-mute uppercase tracking-wide text-right">
          Px
        </span>
      </div>

      {/* Scale rows */}
      {TYPE_SCALE.map(({ token, label, rem, px }) => (
        <div
          key={token}
          className="grid grid-cols-[48px_1fr_72px_40px] gap-2 px-2 py-2 border-b border-line items-baseline"
        >
          <span className="font-heading text-xs text-main uppercase tracking-tight">
            {label}
          </span>
          <span className="font-mono text-xs text-sub truncate">{token}</span>
          <span className="font-mono text-xs text-sub">{rem}</span>
          <span className="font-mono text-xs text-main text-right font-medium">
            {px}
          </span>
        </div>
      ))}

      {/* Visual size comparison */}
      <div className="mt-4 pt-4 border-t border-line space-y-2">
        <span className="font-mono text-xs text-mute uppercase tracking-wide block mb-2">
          Visual Scale
        </span>
        {TYPE_SCALE.map(({ label, rem }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="font-mono text-xs text-mute w-8 shrink-0 text-right">
              {label}
            </span>
            <div
              className="h-0.5 bg-main"
              style={{
                width: `calc(${rem} * 6)`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function SpecimenLayout() {
  return (
    <div className="text-main h-full min-h-0 overflow-y-auto">
      {/* Page header */}
      <div className="px-5 pt-5 pb-4 border-b-2 border-main">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-lg text-main uppercase tracking-tight">
              Type Specimen
            </h1>
            <p className="font-mono text-xs text-mute mt-1">
              RDNA Brand Typography -- Complete Reference
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono text-xs text-mute block">
              6 fonts / 11 weights / 7 scale steps
            </span>
            <span className="font-mono text-xs text-mute block">
              Radiants Design System v1
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-0">
        {/* Section 01: Core Fonts */}
        <section>
          <SectionHeader
            number="01"
            title="Core Fonts"
            subtitle="UI foundation — loaded immediately, used across all surfaces"
          />
          <div className="space-y-0">
            {CORE_FONTS.map((font, i) => (
              <FontSpecimen key={font.cssVar} font={font} index={i} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-line my-8" />

        {/* Section 02: Editorial Fonts */}
        <section>
          <SectionHeader
            number="02"
            title="Editorial Fonts"
            subtitle="Display and content fonts — lazy-loaded when editorial layouts open"
          />
          <div className="space-y-0">
            {EDITORIAL_FONTS.map((font, i) => (
              <FontSpecimen key={font.cssVar} font={font} index={CORE_FONTS.length + i} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-line my-8" />

        {/* Section 03: Element Mapping */}
        <section>
          <SectionHeader
            number="03"
            title="Element Mapping"
            subtitle="HTML element to font, size, weight, and leading assignments"
          />
          <ElementMapping />
        </section>

        {/* Divider */}
        <div className="border-t border-line my-8" />

        {/* Section 04: Type Scale */}
        <section>
          <SectionHeader
            number="04"
            title="Type Scale"
            subtitle="All 7 scale steps with token name, rem value, and pixel equivalent"
          />
          <TypeScaleGrid />
        </section>
      </div>
    </div>
  );
}
