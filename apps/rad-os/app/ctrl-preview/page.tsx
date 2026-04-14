'use client';

import { forwardRef, useRef, useState } from 'react';
import { Dropdown } from '@rdna/ctrl/selectors/Dropdown/Dropdown';
import { ColorPicker } from '@rdna/ctrl/selectors/ColorPicker/ColorPicker';
import { NumberInput } from '@rdna/ctrl/controls/NumberInput/NumberInput';
import { ScrubSurface } from '@rdna/ctrl/controls/ScrubSurface/ScrubSurface';
import { IconRadioGroup } from '@rdna/ctrl/selectors/IconRadioGroup/IconRadioGroup';
import { TooltipProvider } from '@rdna/ctrl/readouts/Tooltip/Tooltip';
import { Agentation } from 'agentation';

// ============================================================================
// Layout Inspector Panel — Visual build from Paper node SJE-0
// Uses RDNA ctrl tokens for all colors. Page-level composition only.
// ============================================================================

/** Gold glow text-shadow — 3-layer: tight accent + medium accent + wide cream bloom */
const GLOW = 'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px, var(--color-main) 0 0 10px';
const GLOW_SOFT = 'var(--color-accent) 0 0 0.5px, var(--color-accent) 0 0 3px';

/** Box-model visualization colors — unique to this inspector, not general tokens */
const BOX = {
  outline: 'oklch(0.9780 0.0295 94.34 / 0.25)', // cream 25%
  margin: 'oklch(0 0 0 / 0.8)',                  // margin indicator bg
  padding: 'oklch(0 0 0 / 0.9)',                 // padding indicator bg
};

// ── Trapezoid Box-Model Indicator ──────────────────────────────────────────

type Side = 'top' | 'right' | 'bottom' | 'left';

const CLIP: Record<Side, string> = {
  top: 'polygon(0 0, 100% 0, calc(100% - 24px) 100%, 24px 100%)',
  bottom: 'polygon(24px 0, calc(100% - 24px) 0, 100% 100%, 0 100%)',
  left: 'polygon(0 0, 0 100%, 100% calc(100% - 24px), 100% 24px)',
  right: 'polygon(100% 0, 100% 100%, 0 calc(100% - 24px), 0 24px)',
};

const TRAP_POS: Record<Side, React.CSSProperties> = {
  top: { top: -1, left: 0, right: 0, height: 24 },
  bottom: { bottom: -1, left: 0, right: 0, height: 24 },
  left: { left: -1, top: 0, bottom: 0, width: 24 },
  right: { right: -1, top: 0, bottom: 0, width: 24 },
};

/** Local alias — use ScrubSurface from the ctrl package for the box-model scrub handles. */
const ScrubTrap = ScrubSurface;

/** Visual pip — the small centered dot/dash inside a side trapezoid. */
function Pip({ horizontal }: { horizontal: boolean }) {
  return (
    <div
      className="shrink-0"
      style={{
        backgroundColor: BOX.outline,
        boxShadow: horizontal
          ? `${BOX.outline} 0 0 0.5px, ${BOX.outline} 0 0 3px`
          : 'inset 0 2px 3px #00000033',
        width: horizontal ? 3 : 1,
        height: horizontal ? 1 : 3,
      }}
    />
  );
}

/** Style for a trapezoid side — combines position, clip-path, and variant bg. */
function trapStyle(side: Side, variant: 'margin' | 'padding'): React.CSSProperties {
  return { ...TRAP_POS[side], clipPath: CLIP[side], backgroundColor: BOX[variant] };
}


// ── Cell Primitives ────────────────────────────────────────────────────────

function LabelCell({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center shrink-0 bg-black self-stretch"
      style={{ width: 24, minHeight: 24, paddingInline: 4 }}
    >
      <span
        className="shrink-0 text-center text-ctrl-text-active uppercase"
        style={{ fontSize: 10, lineHeight: 'round(up, 100%, 1px)', textShadow: GLOW }}
      >
        {label}
      </span>
    </div>
  );
}

/** Right-slot label (MIN / MAX) — matches ValueCell suffix styling */
function SuffixLabel({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <span
      className="shrink-0 uppercase"
      style={{
        fontSize: 10,
        lineHeight: 'round(up, 100%, 1px)',
        width: 'max-content',
        marginRight: 4,
        ...(active ? { color: 'var(--color-main)', textShadow: GLOW } : {}),
      }}
    >
      {text}
    </span>
  );
}

/** Non-editable keyword cell (FILL / FIT / AUTO) — matches NumberInput cell shape */
const KeywordCell = forwardRef<
  HTMLDivElement,
  {
    text: string;
    suffix?: React.ReactNode;
    className?: string;
  }
>(function KeywordCell({ text, suffix, className = '' }, ref) {
  return (
    <div
      ref={ref}
      data-rdna="ctrl-keyword-cell"
      className={['flex items-center bg-black font-mono min-w-0 self-stretch', className].filter(Boolean).join(' ')}
      style={{ minHeight: 24 }}
    >
      <span
        className="flex-1 uppercase truncate"
        style={{
          fontSize: 10,
          lineHeight: 'round(up, 100%, 1px)',
          paddingInline: 4,
          color: 'var(--color-accent)',
          textShadow: GLOW,
        }}
      >
        {text}
      </span>
      {suffix}
    </div>
  );
});

// ── Pixel-Art Icons (from Paper SJE-0) ─────────────────────────────────────

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="currentColor" d="M1 7.5H2V8.5H1V7.5ZM2 6.5H3V7.5H2V6.5ZM2 8.5H3V9.5H2V8.5ZM3 5.5H5V6.5H3V5.5ZM3 9.5H5V10.5H3V9.5ZM5 4.5H11V5.5H5V4.5ZM5 10.5H11V11.5H5V10.5ZM6 6.5H8V7.5H7V8.5H6V6.5ZM7 8.5H9V9.5H7V8.5ZM9 6.5H10V8.5H9V6.5ZM11 5.5H13V6.5H11V5.5ZM11 9.5H13V10.5H11V9.5ZM13 6.5H14V7.5H13V6.5ZM13 8.5H14V9.5H13V8.5ZM14 7.5H15V8.5H14V7.5Z" />
    </svg>
  );
}

function IconResize() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="currentColor" d="M1 7H2V8H1V7ZM2 6H3V7H2V6ZM2 8H3V9H2V8ZM3 5H5V6H3V5ZM3 9H5V10H3V9ZM4 12H5V13H4V12ZM5 4H10V5H5V4ZM5 11H6V12H5V11ZM6 6H8V7H7V8H6V6ZM6 10H7V11H6V10ZM7 9H8V10H7V9ZM8 8H9V9H8V8ZM8 10H11V11H8V10ZM9 7H10V8H9V7ZM10 6H11V7H10V6ZM11 5H12V6H11V5ZM11 9H13V10H11V9ZM12 4H13V5H12V4ZM13 3H14V4H13V3ZM13 6H14V7H13V6ZM13 8H14V9H13V8ZM14 7H15V8H14V7Z" />
    </svg>
  );
}

function IconPosition() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="currentColor" d="M11 1H12V4H11ZM4 4H15V5H4ZM4 5H5V11H4ZM11 5H12V11H11ZM1 11H12V12H1ZM4 12H5V15H4Z" />
    </svg>
  );
}

function IconFloat() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="currentColor" d="M3 4H8V11H3Z" style={{ opacity: 0.3 }} />
      <path fill="currentColor" d="M1 2H15V3H1ZM1 11H9V12H1ZM12 5H13V10H12ZM11 10H14V11H11ZM12 11H13V12H12Z" />
    </svg>
  );
}

/** 11x11 — cross inside a dim bordered square. Used for margin + border color "lock" indicator. */
function IconLock() {
  return (
    <div className="shrink-0 relative" style={{ width: 11, height: 11 }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', translate: '-50%', width: 5, height: 1, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', translate: '-50%', width: 5, height: 1, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
      <div style={{ position: 'absolute', right: 0, top: '50%', translate: '0 -50%', width: 1, height: 5, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
      <div style={{ position: 'absolute', left: 0, top: '50%', translate: '0 -50%', width: 1, height: 5, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', translate: '-50% -50%', width: 7, height: 7, border: `1px solid ${BOX.outline}` }} />
    </div>
  );
}

/** 11x11 — vertical bar with dots top/bottom. Used for padding row label icon. */
function IconPaddingGlyph() {
  return (
    <div className="shrink-0 relative" style={{ width: 11, height: 11, border: `1px solid ${BOX.outline}` }}>
      <div style={{ position: 'absolute', top: 1, left: 3, width: 3, height: 1, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
      <div style={{ position: 'absolute', top: 7, left: 3, width: 3, height: 1, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
      <div style={{ position: 'absolute', top: 3, left: 7, width: 1, height: 3, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
      <div style={{ position: 'absolute', top: 3, left: 1, width: 1, height: 3, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
    </div>
  );
}

/** 11x11 — four L-bracket corners inside a dim bordered square. Used for corner-radius row. */
function IconCornerRadius() {
  return (
    <div className="shrink-0 relative" style={{ width: 11, height: 11 }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', translate: '-50% -50%', width: 7, height: 7, border: `1px solid ${BOX.outline}` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: 3, borderTop: '1px solid var(--color-accent)', borderLeft: '1px solid var(--color-accent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 3, height: 3, borderBottom: '1px solid var(--color-accent)', borderLeft: '1px solid var(--color-accent)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: 3, borderTop: '1px solid var(--color-accent)', borderRight: '1px solid var(--color-accent)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 3, height: 3, borderBottom: '1px solid var(--color-accent)', borderRight: '1px solid var(--color-accent)' }} />
    </div>
  );
}

/** Border-style picker — 4 patterns (2 bars, 6 dots, 3 dashes, 1 yellow bar = active). */
function BorderStylePicker() {
  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      <div className="flex flex-col" style={{ gap: 1 }}>
        <div style={{ width: 11, height: 1, backgroundColor: BOX.outline }} />
        <div style={{ width: 11, height: 1, backgroundColor: BOX.outline }} />
      </div>
      <div className="flex" style={{ gap: 1 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ width: 1, height: 1, backgroundColor: BOX.outline }} />
        ))}
      </div>
      <div className="flex" style={{ gap: 1 }}>
        <div style={{ width: 3, height: 1, backgroundColor: BOX.outline }} />
        <div style={{ width: 3, height: 1, backgroundColor: BOX.outline }} />
        <div style={{ width: 3, height: 1, backgroundColor: BOX.outline }} />
      </div>
      <div style={{ width: 11, height: 1, backgroundColor: 'var(--color-accent)', boxShadow: GLOW_SOFT }} />
    </div>
  );
}

/** Reusable pixel-code label text — the small 8px cream/accent caption style. */
function CaptionText({
  children,
  accent = false,
  className = '',
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={['uppercase', className].filter(Boolean).join(' ')}
      style={{
        fontSize: 8,
        lineHeight: '10px',
        ...(accent
          ? { color: 'var(--color-accent)', textShadow: GLOW_SOFT }
          : { color: 'var(--ctrl-label)' }),
      }}
    >
      {children}
    </span>
  );
}

/** Big value text — 10px cream with glow, used for px values in labeled rows. */
function ValueText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-center"
      style={{
        fontSize: 10,
        lineHeight: 'round(up, 100%, 1px)',
        color: 'var(--color-main)',
        textShadow: GLOW,
      }}
    >
      {children}
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

/** Unit options shared by W/H main value cells — keywords + numeric units */
const MAIN_UNIT_OPTIONS = [
  { value: 'fill', label: 'FILL' },
  { value: 'fit', label: 'FIT' },
  { value: 'auto', label: 'AUTO' },
  { value: 'px', label: 'PX' },
  { value: '%', label: '%' },
  { value: 'em', label: 'EM' },
  { value: 'rem', label: 'REM' },
  { value: 'vw', label: 'VW' },
  { value: 'vh', label: 'VH' },
];

/** Numeric-only unit options for MIN/MAX cells (no keywords). */
const NUMERIC_UNIT_OPTIONS = [
  { value: 'px', label: 'PX' },
  { value: '%', label: '%' },
  { value: 'em', label: 'EM' },
  { value: 'rem', label: 'REM' },
  { value: 'vw', label: 'VW' },
  { value: 'vh', label: 'VH' },
];

/** Brand color swatches for the box-model color picker */
const BRAND_SWATCHES = [
  { value: 'var(--color-cream)', label: '#FEF8E2' },
  { value: 'var(--color-sun-yellow)', label: '#FCE184' },
  { value: 'var(--color-sunset-fuzz)', label: '#FCC383' },
  { value: 'var(--color-sun-red)', label: '#FF7F7F' },
  { value: 'var(--color-mint)', label: '#CEF5CA' },
  { value: 'var(--color-sky-blue)', label: '#95BAD2' },
  { value: 'var(--color-sky-blue-dark)', label: '#467994' },
  { value: 'var(--color-ink)', label: '#0F0E0C' },
  { value: 'var(--color-pure-white)', label: '#FFFFFF' },
];

/** Whether this unit is a keyword (no numeric value, input displays the unit text) */
const KEYWORD_UNITS = new Set(['fill', 'fit', 'auto']);

/** Display modes for the inspector — pixel-art icons + short labels */
const DISPLAY_OPTIONS = [
  { value: 'show', icon: <IconEye />, tooltip: 'Visible' },
  { value: 'resize', icon: <IconResize />, tooltip: 'Resize' },
  { value: 'position', icon: <IconPosition />, tooltip: 'Position' },
  { value: 'float', icon: <IconFloat />, tooltip: 'Float' },
  { value: 'auto', icon: <span className="text-[8px] uppercase leading-[10px]">Auto</span>, tooltip: 'Auto' },
];

export default function CtrlPreview() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<'min' | 'max'>('max');

  // W row
  const [wValue, setWValue] = useState<number | null>(null);
  const [wUnit, setWUnit] = useState('fill');
  const [wMin, setWMin] = useState<number | null>(null);
  const [wMinUnit, setWMinUnit] = useState('');
  const [wMax, setWMax] = useState<number | null>(null);
  const [wMaxUnit, setWMaxUnit] = useState('');
  const wCellRef = useRef<HTMLDivElement>(null);
  const wMinRef = useRef<HTMLDivElement>(null);
  const wMaxRef = useRef<HTMLDivElement>(null);

  // H row
  const [hValue, setHValue] = useState<number | null>(10);
  const [hUnit, setHUnit] = useState('vh');
  const [hMin, setHMin] = useState<number | null>(null);
  const [hMinUnit, setHMinUnit] = useState('');
  const [hMax, setHMax] = useState<number | null>(null);
  const [hMaxUnit, setHMaxUnit] = useState('');
  const hCellRef = useRef<HTMLDivElement>(null);
  const hMinRef = useRef<HTMLDivElement>(null);
  const hMaxRef = useRef<HTMLDivElement>(null);

  const [display, setDisplay] = useState('show');

  // Box-model values — 4 sides for margin & padding, single value for border
  const [margin, setMargin] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [padding, setPadding] = useState({ top: 2, right: 2, bottom: 2, left: 2 });
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderColor, setBorderColor] = useState('var(--color-sun-yellow)');

  const setMarginSide = (side: Side) => (v: number | null) =>
    setMargin((m) => ({ ...m, [side]: Math.max(0, v ?? 0) }));
  const setPaddingSide = (side: Side) => (v: number | null) =>
    setPadding((p) => ({ ...p, [side]: Math.max(0, v ?? 0) }));

  return (
    <TooltipProvider>
      <div className="dark min-h-screen bg-page flex items-center justify-center p-8">
        {/* Panel Container */}
        <div
          className="flex flex-col font-mono text-xs leading-4"
          style={{
            width: 353,
            padding: 16,
            backgroundColor: '#000',
            color: 'var(--ctrl-label)',
            boxShadow: 'inset 2px 2px 9.6px #000, 0 1px 0 1px oklch(1 0 0 / 0.04), 0 -2px 0 #000',
            WebkitFontSmoothing: 'antialiased',
            fontSynthesis: 'none',
          }}
        >
          {/* ── Panel Title: LAYOUT ── */}
          <div className="flex items-end gap-2 h-6 shrink-0 justify-center">
            <span
              className="text-base leading-5 uppercase shrink-0"
              style={{ color: 'var(--color-main)', textShadow: GLOW, width: 'max-content' }}
            >
              Layout
            </span>
            <div
              className="relative"
              style={{
                width: '100%',
                height: 'round(50%, 1px)',
                borderTop: '1px solid var(--ctrl-border-active)',
                borderRight: '1px solid var(--ctrl-border-active)',
              }}
            />
          </div>

          {/* ── Section Body ── */}
          <div className="flex flex-col flex-1">
            {/* Section Header: SIZE */}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex items-end gap-1 h-6 w-full text-left shrink-0 cursor-pointer"
            >
              {/* Left bracket ⌐ */}
              <div className="shrink-0" style={{ width: 4, height: 'round(50%, 1px)', borderLeft: '1px solid var(--ctrl-border-inactive)', borderTop: '1px solid var(--ctrl-border-inactive)' }} />

              <span
                className="self-stretch flex items-center shrink-0 text-xs leading-4 uppercase"
                style={{ color: 'var(--color-main)', textShadow: GLOW }}
              >
                Size
              </span>

              {/* Rule */}
              <div className="flex-1 relative" style={{ height: 'round(50%, 1px)', borderTop: '1px solid var(--ctrl-border-inactive)' }} />

              {/* Min/Max toggle */}
              <div className="flex items-center gap-1 shrink-0 self-stretch justify-center" style={{ width: 60 }}>
                <span className="shrink-0 text-center uppercase" style={{ fontSize: 8, lineHeight: '10px', width: 'max-content' }}>
                  min
                </span>
                <div
                  className="flex items-center shrink-0 cursor-pointer"
                  style={{
                    width: 16,
                    padding: 1,
                    border: '1px solid var(--ctrl-border-active)',
                    boxShadow: GLOW_SOFT,
                    justifyContent: mode === 'max' ? 'flex-end' : 'flex-start',
                  }}
                  onClick={(e) => { e.stopPropagation(); setMode(m => m === 'min' ? 'max' : 'min'); }}
                >
                  <div className="shrink-0" style={{ width: 6, height: 6, backgroundColor: 'var(--color-main)', boxShadow: GLOW_SOFT }} />
                </div>
                <span
                  className="shrink-0 text-center uppercase"
                  style={{ fontSize: 8, lineHeight: '10px', color: 'var(--color-main)', textShadow: GLOW_SOFT, width: 'max-content' }}
                >
                  max
                </span>
              </div>

              {/* Rule (short) */}
              <div className="shrink-0 relative" style={{ width: 12, height: 'round(50%, 1px)', borderTop: '1px solid var(--ctrl-border-inactive)' }} />

              <span className="self-stretch flex items-center shrink-0 uppercase" style={{ fontSize: 8, lineHeight: '10px' }}>
                {open ? 'Collapse' : 'Expand'}
              </span>

              {/* Right bracket ¬ */}
              <div className="shrink-0" style={{ width: 4, height: 'round(50%, 1px)', borderRight: '1px solid var(--ctrl-border-inactive)', borderTop: '1px solid var(--ctrl-border-inactive)' }} />
            </button>

            {/* Section Content */}
            {open && (
              <div className="flex flex-1 min-w-0">
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                  {/* Box-Model Visualizer — W/H rows stack above the margin layer */}
                  <div className="flex flex-col flex-1 min-w-0" style={{ backgroundColor: BOX.outline, padding: 1, gap: 1 }}>
                    {/* W row */}
                    <div className="flex self-stretch gap-[1px] min-w-0" style={{ height: 28 }}>
                      <LabelCell label="W" />
                      {KEYWORD_UNITS.has(wUnit) ? (
                        <KeywordCell
                          ref={wCellRef}
                          text={wUnit}
                          className="flex-1"
                          suffix={
                            <Dropdown
                              value={wUnit}
                              onValueChange={setWUnit}
                              options={MAIN_UNIT_OPTIONS}
                              className="shrink-0"
                              hideLabel
                              anchor={wCellRef}
                              popupFullWidth
                            />
                          }
                        />
                      ) : (
                        <NumberInput
                          ref={wCellRef}
                          value={wValue}
                          onValueChange={setWValue}
                          active={wValue !== null}
                          className="flex-1"
                          suffix={
                            <Dropdown
                              value={wUnit}
                              onValueChange={setWUnit}
                              options={MAIN_UNIT_OPTIONS}
                              className="shrink-0"
                              anchor={wCellRef}
                              popupFullWidth
                            />
                          }
                        />
                      )}
                      <NumberInput
                        ref={wMinRef}
                        value={wMin}
                        onValueChange={setWMin}
                        placeholder="-"
                        className="flex-1"
                        innerSuffix={<SuffixLabel text="MIN" />}
                        suffix={
                          <Dropdown
                            value={wMinUnit}
                            onValueChange={setWMinUnit}
                            options={NUMERIC_UNIT_OPTIONS}
                            className="shrink-0"
                            anchor={wMinRef}
                            popupFullWidth
                          />
                        }
                      />
                      <NumberInput
                        ref={wMaxRef}
                        value={wMax}
                        onValueChange={setWMax}
                        placeholder="-"
                        className="flex-1"
                        innerSuffix={<SuffixLabel text="MAX" />}
                        suffix={
                          <Dropdown
                            value={wMaxUnit}
                            onValueChange={setWMaxUnit}
                            options={NUMERIC_UNIT_OPTIONS}
                            className="shrink-0"
                            anchor={wMaxRef}
                            popupFullWidth
                          />
                        }
                      />
                    </div>
                    {/* H row */}
                    <div className="flex self-stretch gap-[1px] min-w-0" style={{ height: 28 }}>
                      <LabelCell label="H" />
                      {KEYWORD_UNITS.has(hUnit) ? (
                        <KeywordCell
                          ref={hCellRef}
                          text={hUnit}
                          className="flex-1"
                          suffix={
                            <Dropdown
                              value={hUnit}
                              onValueChange={setHUnit}
                              options={MAIN_UNIT_OPTIONS}
                              className="shrink-0"
                              hideLabel
                              anchor={hCellRef}
                              popupFullWidth
                            />
                          }
                        />
                      ) : (
                        <NumberInput
                          ref={hCellRef}
                          value={hValue}
                          onValueChange={setHValue}
                          active={hValue !== null}
                          className="flex-1"
                          suffix={
                            <Dropdown
                              value={hUnit}
                              onValueChange={setHUnit}
                              options={MAIN_UNIT_OPTIONS}
                              className="shrink-0"
                              anchor={hCellRef}
                              popupFullWidth
                            />
                          }
                        />
                      )}
                      <NumberInput
                        ref={hMinRef}
                        value={hMin}
                        onValueChange={setHMin}
                        placeholder="-"
                        className="flex-1"
                        innerSuffix={<SuffixLabel text="MIN" />}
                        suffix={
                          <Dropdown
                            value={hMinUnit}
                            onValueChange={setHMinUnit}
                            options={NUMERIC_UNIT_OPTIONS}
                            className="shrink-0"
                            anchor={hMinRef}
                            popupFullWidth
                          />
                        }
                      />
                      <NumberInput
                        ref={hMaxRef}
                        value={hMax}
                        onValueChange={setHMax}
                        placeholder="-"
                        className="flex-1"
                        innerSuffix={<SuffixLabel text="MAX" />}
                        suffix={
                          <Dropdown
                            value={hMaxUnit}
                            onValueChange={setHMaxUnit}
                            options={NUMERIC_UNIT_OPTIONS}
                            className="shrink-0"
                            anchor={hMaxRef}
                            popupFullWidth
                          />
                        }
                      />
                    </div>
                    {/* Margin layer */}
                    <div className="relative flex flex-1 overflow-clip min-w-0" style={{ padding: 24 }}>
                      <ScrubTrap
                        value={margin.left}
                        onValueChange={setMarginSide('left')}
                        className="absolute flex items-center justify-center"
                        style={trapStyle('left', 'margin')}
                      >
                        <Pip horizontal={false} />
                      </ScrubTrap>
                      <ScrubTrap
                        value={margin.right}
                        onValueChange={setMarginSide('right')}
                        className="absolute flex items-center justify-center"
                        style={trapStyle('right', 'margin')}
                      >
                        <Pip horizontal={false} />
                      </ScrubTrap>
                      <ScrubTrap
                        value={margin.bottom}
                        onValueChange={setMarginSide('bottom')}
                        className="absolute flex items-center justify-center"
                        style={trapStyle('bottom', 'margin')}
                      >
                        <Pip horizontal={true} />
                      </ScrubTrap>
                      {/* Top margin: labeled row with "margin" + lock icon, plus offset value overlay */}
                      <ScrubTrap
                        value={margin.top}
                        onValueChange={setMarginSide('top')}
                        className="absolute flex items-center"
                        style={{ ...TRAP_POS.top, clipPath: CLIP.top }}
                      >
                        <div
                          className="flex items-center self-stretch flex-1"
                          style={{ backgroundColor: '#0A0A08', gap: 4, paddingInline: 24 }}
                        >
                          <CaptionText accent className="flex-1">margin</CaptionText>
                          <IconLock />
                        </div>
                        <div className="absolute flex items-start" style={{ left: 168, top: 7, gap: 4 }}>
                          <ValueText>{margin.top}</ValueText>
                          <CaptionText>px</CaptionText>
                        </div>
                      </ScrubTrap>

                      {/* Center content — 3 rows: Border / Padding box / Corner Radius */}
                      <div className="flex flex-col flex-1 self-stretch min-w-0" style={{ gap: 1 }}>
                        {/* ── Border row ── */}
                        <ScrubTrap
                          value={borderWidth}
                          onValueChange={setBorderWidth}
                          className="relative flex self-stretch shrink-0"
                          style={{ height: 24, gap: 1 }}
                        >
                          <div className="flex items-center justify-center shrink-0" style={{ width: 24, backgroundColor: 'oklch(0 0 0 / 0.8)' }}>
                            <div style={{ width: 6, height: 6, borderTop: `1px solid ${BOX.outline}`, borderLeft: `1px solid ${BOX.outline}` }} />
                          </div>
                          <div
                            className="flex items-center flex-1 self-stretch min-w-0"
                            style={{ backgroundColor: '#0A0A08', gap: 4, paddingLeft: 8, paddingRight: 4 }}
                          >
                            <div className="flex items-center flex-1 min-w-0" style={{ gap: 8 }}>
                              <CaptionText accent>Border</CaptionText>
                              <BorderStylePicker />
                            </div>
                            <ColorPicker
                              value={borderColor}
                              onValueChange={setBorderColor}
                              swatches={BRAND_SWATCHES}
                              onCustomClick={() => {}}
                            />
                            <IconLock />
                          </div>
                          <div className="flex items-center justify-center shrink-0" style={{ width: 24, backgroundColor: 'oklch(0 0 0 / 0.8)', paddingInline: 4 }}>
                            <div style={{ width: 6, height: 6, borderTop: `1px solid ${BOX.outline}`, borderRight: `1px solid ${BOX.outline}` }} />
                          </div>
                          <div className="absolute flex items-start pointer-events-none" style={{ left: '50%', top: '50%', translate: '-50% -50%', gap: 4 }}>
                            <ValueText>{borderWidth}</ValueText>
                            <CaptionText>px</CaptionText>
                          </div>
                        </ScrubTrap>

                        {/* ── Padding row (flex 1) ── */}
                        <div className="flex self-stretch flex-1 min-w-0" style={{ gap: 1 }}>
                          {/* Left pip cell */}
                          <div className="flex items-center justify-center shrink-0 overflow-clip" style={{ width: 24, backgroundColor: 'oklch(0 0 0 / 0.8)' }}>
                            <div style={{ width: 1, height: 3, backgroundColor: BOX.outline, boxShadow: 'inset 0 2px 3px #00000033' }} />
                          </div>

                          {/* Yellow-bordered padding box */}
                          <div className="flex flex-col flex-1 self-stretch min-w-0">
                            <div className="flex flex-col flex-1 self-stretch min-w-0" style={{ paddingInline: 1 }}>
                              <div
                                className="relative flex flex-1 items-center justify-center overflow-clip self-stretch min-w-0"
                                style={{ padding: 24, border: '2px solid var(--color-accent)', borderRadius: 4 }}
                              >
                                <ScrubTrap
                                  value={padding.left}
                                  onValueChange={setPaddingSide('left')}
                                  className="absolute flex items-center justify-center"
                                  style={trapStyle('left', 'padding')}
                                >
                                  <Pip horizontal={false} />
                                </ScrubTrap>
                                <ScrubTrap
                                  value={padding.right}
                                  onValueChange={setPaddingSide('right')}
                                  className="absolute flex items-center justify-center"
                                  style={trapStyle('right', 'padding')}
                                >
                                  <Pip horizontal={false} />
                                </ScrubTrap>
                                <ScrubTrap
                                  value={padding.bottom}
                                  onValueChange={setPaddingSide('bottom')}
                                  className="absolute flex items-center justify-center"
                                  style={trapStyle('bottom', 'padding')}
                                >
                                  <Pip horizontal={true} />
                                </ScrubTrap>
                                {/* Top padding: labeled row */}
                                <ScrubTrap
                                  value={padding.top}
                                  onValueChange={setPaddingSide('top')}
                                  className="absolute flex items-center"
                                  style={{ ...TRAP_POS.top, clipPath: CLIP.top }}
                                >
                                  <div
                                    className="flex items-center self-stretch flex-1 relative"
                                    style={{ backgroundColor: '#0A0A08', gap: 4, paddingInline: 22 }}
                                  >
                                    <CaptionText accent className="flex-1">padding</CaptionText>
                                    <IconPaddingGlyph />
                                    <div className="absolute flex items-start" style={{ left: '50%', top: '50%', translate: '-50% -50%', gap: 4 }}>
                                      <ValueText>{padding.top}</ValueText>
                                      <CaptionText>px</CaptionText>
                                    </div>
                                  </div>
                                </ScrubTrap>

                                {/* Center: display mode icon strip only (W/H moved to top) */}
                                <div className="flex flex-col flex-1 self-stretch items-center justify-center relative min-w-0" style={{ gap: 1 }}>
                                  <IconRadioGroup
                                    value={display}
                                    onValueChange={setDisplay}
                                    options={DISPLAY_OPTIONS}
                                    cellHeight={20}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right pip cell */}
                          <div className="flex items-center justify-center shrink-0 overflow-clip" style={{ width: 24, backgroundColor: 'oklch(0 0 0 / 0.8)' }}>
                            <div style={{ width: 1, height: 3, backgroundColor: BOX.outline, boxShadow: 'inset 0 2px 3px #00000033' }} />
                          </div>
                        </div>

                        {/* ── Bottom border row (same value as top Border row) ── */}
                        <ScrubTrap
                          value={borderWidth}
                          onValueChange={setBorderWidth}
                          className="flex self-stretch shrink-0"
                          style={{ gap: 1, height: 24 }}
                        >
                          <div className="flex items-center justify-center shrink-0" style={{ width: 24, backgroundColor: 'oklch(0 0 0 / 0.8)' }}>
                            <div style={{ width: 6, height: 6, borderBottom: `1px solid ${BOX.outline}`, borderLeft: `1px solid ${BOX.outline}` }} />
                          </div>
                          <div className="flex items-center justify-center flex-1 overflow-clip" style={{ backgroundColor: 'oklch(0 0 0 / 0.8)' }}>
                            <div style={{ width: 3, height: 1, backgroundColor: BOX.outline, boxShadow: `${BOX.outline} 0 0 0.5px, ${BOX.outline} 0 0 3px` }} />
                          </div>
                          <div className="flex items-center" style={{ backgroundColor: 'oklch(0 0 0 / 0.8)', paddingInline: 4, gap: 4 }}>
                            <ValueText>{borderWidth}</ValueText>
                            <CaptionText>px</CaptionText>
                            <IconCornerRadius />
                          </div>
                        </ScrubTrap>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer: SHOW CSS */}
            <div className="flex items-start gap-1 h-6 shrink-0">
              <div className="flex-1 relative" style={{ height: 'round(50%, 1px)', borderBottom: '1px solid var(--ctrl-border-inactive)', borderLeft: '1px solid var(--ctrl-border-inactive)' }} />
              <span className="self-stretch flex items-center uppercase text-center" style={{ fontSize: 8, lineHeight: '10px' }}>
                Show css
              </span>
              <div className="flex-1 relative" style={{ height: 'round(50%, 1px)', borderBottom: '1px solid var(--ctrl-border-inactive)', borderRight: '1px solid var(--ctrl-border-inactive)' }} />
            </div>
          </div>
        </div>
      </div>
      <Agentation />
    </TooltipProvider>
  );
}
