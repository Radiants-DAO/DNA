'use client';

// =============================================================================
// LogoMakerControls — Docked control surface for the LogoMaker canvas.
//
// Presentational / "dumb" component. All state and handlers live in the parent
// (LogoMaker.tsx today; lifted further in task 4). This component is shaped to
// fit inside an AppWindow.controlSurface dock slot at ~260px wide.
//
// Sections (match the dock mockup):
//   1. SIZE            — LCD slider + stepped markers + PX readout
//   2. COLOR           — grid of BrandColor swatches
//   3. PATTERN         — horizontal scroll grid of pattern thumbnails
//   4. ASPECT RATIO    — button strip over RATIO_PRESETS
//   5. EXPORT SIZE     — button strip over export multipliers
//   6. FORMAT          — PNG / SVG segmented control
//   7. EXPORT          — Copy + Download action buttons
// =============================================================================

import { useId, type ReactNode } from 'react';
import {
  ActionButton,
  ButtonStrip,
  ColorSwatch as CtrlColorSwatch,
  ControlPanel,
  IconCell,
  PropertyRow,
  Section,
  SegmentedControl,
  Slider,
} from '@rdna/ctrl';
import { Icon } from '@rdna/radiants/icons/runtime';
import {
  BRAND_HEX,
  RATIO_PRESETS,
  type BgOption,
  type BrandColor,
  type LogoVariant,
  type RatioPresetId,
} from '@/lib/logo-maker';

const VARIANT_LABELS: Record<string, string> = {
  mark: 'MARK',
  wordmark: 'WORDMARK',
  radsun: 'RADSUN',
};

// ─── Types ───────────────────────────────────────────────────────────────

export interface LogoMakerPatternOption {
  /** Pattern registry name — unique key used as the control value. */
  name: string;
  /** Tile thumbnail (SVG or bitmap) rendered inside the pattern cell. */
  preview: ReactNode;
}

export interface LogoMakerControlsProps {
  // ─── SIZE ─────────────────────────────────────────────────────────────
  /**
   * Current size value. Interpreted as-is by the parent; the control renders
   * it against `sizeMin`/`sizeMax`/`sizeTicks`. LogoMaker today stores size
   * as a 0..1 canvas fraction — task 4 can swap this to raw pixels if the
   * mockup's PX readout is wanted verbatim.
   */
  size: number;
  sizeMin: number;
  sizeMax: number;
  sizeStep?: number;
  /** Stepped markers on the slider (e.g. [16, 128, 512, 1024, 2048]). */
  sizeTicks?: readonly number[];
  /** Unit label for the readout (mockup uses `PX`). */
  sizeUnit?: string;
  /** Optional readout formatter — overrides the default `round(size) + unit`. */
  formatSize?: (value: number) => string;
  onSizeChange: (value: number) => void;

  // ─── LOGO (variant) ───────────────────────────────────────────────────
  /** Variant (`mark`, `wordmark`, `radsun`). Section hidden when omitted. */
  variant?: LogoVariant;
  availableVariants?: ReadonlyArray<LogoVariant>;
  onVariantChange?: (variant: LogoVariant) => void;

  // ─── COLOR ────────────────────────────────────────────────────────────
  color: BrandColor;
  availableColors: ReadonlyArray<BrandColor>;
  onColorChange: (color: BrandColor) => void;

  // ─── BG (background fill) ─────────────────────────────────────────────
  /** Background option (`transparent` | `pattern` | BrandColor). Section hidden when omitted. */
  bgOption?: BgOption;
  availableBgOptions?: ReadonlyArray<BgOption>;
  onBgOptionChange?: (option: BgOption) => void;

  // ─── PATTERN ──────────────────────────────────────────────────────────
  pattern: string;
  availablePatterns: ReadonlyArray<LogoMakerPatternOption>;
  onPatternChange: (patternName: string) => void;
  /** Pattern foreground color — only shown when bgOption === 'pattern'. */
  patternFg?: BrandColor;
  onPatternFgChange?: (color: BrandColor) => void;
  /** Pattern background color — only shown when bgOption === 'pattern'. */
  patternBg?: BrandColor;
  onPatternBgChange?: (color: BrandColor) => void;
  /** Pattern tile scale [0..1] — only shown when bgOption === 'pattern'. */
  patternScale?: number;
  patternScaleMin?: number;
  patternScaleMax?: number;
  patternScaleStep?: number;
  onPatternScaleChange?: (value: number) => void;

  // ─── ASPECT RATIO ─────────────────────────────────────────────────────
  /**
   * LogoMaker stores the ratio as a `RatioPresetId` (e.g. `'square-512'`). The
   * mockup shows literal ratio strings (`'1:1'`); task 4 decides whether to
   * derive the label from the preset or widen the type.
   */
  aspectRatio: RatioPresetId;
  onAspectRatioChange: (ratio: RatioPresetId) => void;

  // ─── EXPORT SIZE ──────────────────────────────────────────────────────
  exportMultiplier: number;
  availableMultipliers: ReadonlyArray<number>;
  onExportMultiplierChange: (multiplier: number) => void;

  // ─── FORMAT ───────────────────────────────────────────────────────────
  format: 'png' | 'svg';
  onFormatChange: (format: 'png' | 'svg') => void;

  // ─── EXPORT ACTIONS ───────────────────────────────────────────────────
  onCopy: () => void;
  onDownload: () => void;
  /** Optional copy-confirmation flag — flips the COPY button label to COPIED. */
  copied?: boolean;

  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────

export function LogoMakerControls({
  size,
  sizeMin,
  sizeMax,
  sizeStep,
  sizeTicks,
  sizeUnit = 'PX',
  formatSize,
  onSizeChange,

  variant,
  availableVariants,
  onVariantChange,

  color,
  availableColors,
  onColorChange,

  bgOption,
  availableBgOptions,
  onBgOptionChange,

  pattern,
  availablePatterns,
  onPatternChange,
  patternFg,
  onPatternFgChange,
  patternBg,
  onPatternBgChange,
  patternScale,
  patternScaleMin = 0,
  patternScaleMax = 1,
  patternScaleStep = 0.05,
  onPatternScaleChange,

  aspectRatio,
  onAspectRatioChange,

  exportMultiplier,
  availableMultipliers,
  onExportMultiplierChange,

  format,
  onFormatChange,

  onCopy,
  onDownload,
  copied = false,

  className = '',
}: LogoMakerControlsProps) {
  const showVariantSection = !!(variant && availableVariants && onVariantChange);
  const showBgSection = !!(bgOption && availableBgOptions && onBgOptionChange);
  const showPatternSubControls =
    bgOption === 'pattern' && patternFg !== undefined && patternBg !== undefined;
  const panelId = useId();

  // Sequential section counter — JSX children evaluate in source order, and
  // short-circuited conditionals skip the nextSec() call entirely. Keeps
  // numbering dense when optional sections are omitted.
  let secCounter = 0;
  const nextSec = () => ++secCounter;

  const sizeReadout = formatSize
    ? formatSize(size)
    : `${Math.round(size)} ${sizeUnit}`;

  return (
    <ControlPanel
      density="compact"
      className={['w-full min-w-[15rem] max-w-[20rem]', className].filter(Boolean).join(' ')}
    >
      {/* ── SIZE ───────────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. SIZE`}>
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-ctrl-text-active text-xs tabular-nums"
              style={{ textShadow: '0 0 8px var(--color-ctrl-glow)' }}
            >
              {sizeReadout}
            </span>
            <span className="font-mono text-ctrl-label text-xs uppercase tracking-wider">
              {sizeUnit}
            </span>
          </div>
          <Slider
            value={size}
            onChange={onSizeChange}
            min={sizeMin}
            max={sizeMax}
            step={sizeStep ?? 0}
            ticks={sizeTicks ? [...sizeTicks] : undefined}
            snap={!!sizeTicks && sizeTicks.length > 0}
            ariaLabel="Size"
          />
          {sizeTicks && sizeTicks.length > 0 && (
            <div className="flex justify-between font-mono text-ctrl-label text-xs tabular-nums">
              {sizeTicks.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── LOGO (variant) ─────────────────────────────────────────── */}
      {showVariantSection && (
        <Section title={`${nextSec()}. LOGO`}>
          <PropertyRow label="TYPE">
            <ButtonStrip
              value={variant!}
              onChange={(v) => onVariantChange!(v as LogoVariant)}
              options={availableVariants!.map((v) => ({
                value: v,
                label: VARIANT_LABELS[v] ?? v.toUpperCase(),
              }))}
              size="sm"
              className="w-full"
            />
          </PropertyRow>
        </Section>
      )}

      {/* ── COLOR ──────────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. COLOR`}>
        <div
          role="radiogroup"
          aria-label="Logo color"
          className="grid grid-cols-8 gap-1 px-1"
        >
          {availableColors.map((c) => (
            <CtrlColorSwatch
              key={c}
              color={BRAND_HEX[c]}
              size="sm"
              selected={c === color}
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>
      </Section>

      {/* ── BG ─────────────────────────────────────────────────────── */}
      {showBgSection && (
        <Section title={`${nextSec()}. BG`}>
          <PropertyRow label="FILL">
            <ButtonStrip
              value={bgOption!}
              onChange={(v) => onBgOptionChange!(v as BgOption)}
              options={availableBgOptions!.map((opt) => ({
                value: opt,
                label: opt.toUpperCase(),
              }))}
              size="sm"
              className="w-full"
            />
          </PropertyRow>
        </Section>
      )}

      {/* ── PATTERN (+ sub-controls when bg=pattern) ───────────────── */}
      <Section title={`${nextSec()}. PATTERN`}>
        <div
          role="radiogroup"
          aria-label="Pattern"
          className="grid grid-cols-6 gap-[--ctrl-cell-gap] max-h-[8rem] overflow-y-auto px-1"
        >
          {availablePatterns.map((p) => {
            const isActive = p.name === pattern;
            return (
              <IconCell
                key={p.name}
                mode="radio"
                label={p.name}
                selected={isActive}
                onClick={() => onPatternChange(p.name)}
              >
                {p.preview}
              </IconCell>
            );
          })}
        </div>
        {showPatternSubControls && (
          <div className="flex flex-col gap-1 px-1 mt-2">
            <PropertyRow label="FG">
              <div
                role="radiogroup"
                aria-label="Pattern foreground"
                className="flex gap-1"
              >
                {availableColors.map((c) => (
                  <CtrlColorSwatch
                    key={c}
                    color={BRAND_HEX[c]}
                    size="sm"
                    selected={c === patternFg}
                    onClick={() => onPatternFgChange?.(c)}
                  />
                ))}
              </div>
            </PropertyRow>
            <PropertyRow label="BG">
              <div
                role="radiogroup"
                aria-label="Pattern background"
                className="flex gap-1"
              >
                {availableColors.map((c) => (
                  <CtrlColorSwatch
                    key={c}
                    color={BRAND_HEX[c]}
                    size="sm"
                    selected={c === patternBg}
                    onClick={() => onPatternBgChange?.(c)}
                  />
                ))}
              </div>
            </PropertyRow>
            {patternScale !== undefined && onPatternScaleChange && (
              <PropertyRow label="SCALE">
                <Slider
                  value={patternScale}
                  onChange={onPatternScaleChange}
                  min={patternScaleMin}
                  max={patternScaleMax}
                  step={patternScaleStep}
                  ariaLabel="Pattern scale"
                />
              </PropertyRow>
            )}
          </div>
        )}
      </Section>

      {/* ── ASPECT RATIO ───────────────────────────────────────────── */}
      <Section title={`${nextSec()}. ASPECT RATIO`}>
        <PropertyRow label="RATIO">
          <ButtonStrip
            value={aspectRatio}
            onChange={(v) => onAspectRatioChange(v as RatioPresetId)}
            options={RATIO_PRESETS.map((p) => ({
              value: p.id,
              label: p.label,
            }))}
            size="sm"
            className="w-full"
          />
        </PropertyRow>
      </Section>

      {/* ── EXPORT SIZE ────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. EXPORT SIZE`}>
        <PropertyRow label="×">
          <ButtonStrip
            value={String(exportMultiplier)}
            onChange={(v) => {
              const next = Number(v);
              if (Number.isFinite(next)) onExportMultiplierChange(next);
            }}
            options={availableMultipliers.map((m) => ({
              value: String(m),
              label: `${m}x`,
            }))}
            size="sm"
            className="w-full"
          />
        </PropertyRow>
      </Section>

      {/* ── FORMAT ─────────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. FORMAT`}>
        <SegmentedControl
          value={format}
          onChange={(v) => onFormatChange(v === 'svg' ? 'svg' : 'png')}
          options={[
            { value: 'png', label: 'PNG' },
            { value: 'svg', label: 'SVG' },
          ]}
          size="sm"
          className="w-full px-1"
        />
      </Section>

      {/* ── EXPORT ─────────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. EXPORT`}>
        <div
          className="flex items-stretch gap-[--ctrl-cell-gap] px-1"
          aria-describedby={panelId}
        >
          <ActionButton
            label={copied ? 'Copied' : 'Copy'}
            icon={<Icon name={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} />}
            onClick={onCopy}
          />
          <ActionButton
            label="Download"
            icon={<Icon name="download" />}
            onClick={onDownload}
          />
        </div>
        <span id={panelId} className="sr-only">
          Copy SVG source to clipboard or download as {format.toUpperCase()}.
        </span>
      </Section>
    </ControlPanel>
  );
}
