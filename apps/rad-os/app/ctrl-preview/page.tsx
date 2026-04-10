'use client';

import { useState } from 'react';


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

function Trap({ side, value, variant }: {
  side: Side;
  value: string | number;
  variant: 'margin' | 'padding';
}) {
  const active = variant === 'padding' && value !== 0 && value !== '0';
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ ...TRAP_POS[side], clipPath: CLIP[side], backgroundColor: BOX[variant] }}
    >
      <span
        className="shrink-0 text-center uppercase"
        style={{
          fontSize: 10,
          lineHeight: 'round(up, 100%, 1px)',
          color: active ? 'var(--color-accent)' : 'var(--ctrl-label)',
          textShadow: active ? GLOW : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Cell Primitives ────────────────────────────────────────────────────────

function LabelCell({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center shrink-0 bg-black" style={{ width: 24, height: 24, paddingInline: 4 }}>
      <span
        className="shrink-0 text-center text-ctrl-text-active uppercase"
        style={{ fontSize: 10, lineHeight: 'round(up, 100%, 1px)', textShadow: GLOW }}
      >
        {label}
      </span>
    </div>
  );
}

function ValueCell({ label, unit, active = false }: {
  label: string;
  unit?: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-between bg-black" style={{ height: 24, paddingInline: 4, gap: 4 }}>
      <span
        className="shrink-0 text-center"
        style={{
          fontSize: 10,
          lineHeight: 'round(up, 100%, 1px)',
          color: active ? 'var(--color-main)' : 'var(--ctrl-label)',
          textShadow: active ? GLOW : 'none',
        }}
      >
        {label}
      </span>
      <span className="flex items-start gap-[3px]">
        {unit && (
          <span style={{ fontSize: 10, lineHeight: 'round(up, 100%, 1px)', color: 'var(--ctrl-label)', textAlign: 'center' }}>
            {unit}
          </span>
        )}
        <span style={{ fontSize: 10, lineHeight: 'round(up, 100%, 1px)', color: 'var(--ctrl-label)', textAlign: 'center', width: 'max-content' }}>
          ▾
        </span>
      </span>
    </div>
  );
}

// ── Pixel-Art Icons (from Paper SJE-0) ─────────────────────────────────────

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="var(--color-accent)" d="M1 7.5H2V8.5H1V7.5ZM2 6.5H3V7.5H2V6.5ZM2 8.5H3V9.5H2V8.5ZM3 5.5H5V6.5H3V5.5ZM3 9.5H5V10.5H3V9.5ZM5 4.5H11V5.5H5V4.5ZM5 10.5H11V11.5H5V10.5ZM6 6.5H8V7.5H7V8.5H6V6.5ZM7 8.5H9V9.5H7V8.5ZM9 6.5H10V8.5H9V6.5ZM11 5.5H13V6.5H11V5.5ZM11 9.5H13V10.5H11V9.5ZM13 6.5H14V7.5H13V6.5ZM13 8.5H14V9.5H13V8.5ZM14 7.5H15V8.5H14V7.5Z" />
    </svg>
  );
}

function IconResize() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="var(--ctrl-label)" d="M1 7H2V8H1V7ZM2 6H3V7H2V6ZM2 8H3V9H2V8ZM3 5H5V6H3V5ZM3 9H5V10H3V9ZM4 12H5V13H4V12ZM5 4H10V5H5V4ZM5 11H6V12H5V11ZM6 6H8V7H7V8H6V6ZM6 10H7V11H6V10ZM7 9H8V10H7V9ZM8 8H9V9H8V8ZM8 10H11V11H8V10ZM9 7H10V8H9V7ZM10 6H11V7H10V6ZM11 5H12V6H11V5ZM11 9H13V10H11V9ZM12 4H13V5H12V4ZM13 3H14V4H13V3ZM13 6H14V7H13V6ZM13 8H14V9H13V8ZM14 7H15V8H14V7Z" />
    </svg>
  );
}

function IconPosition() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="var(--ctrl-label)" d="M11 1H12V4H11ZM4 4H15V5H4ZM4 5H5V11H4ZM11 5H12V11H11ZM1 11H12V12H1ZM4 12H5V15H4Z" />
    </svg>
  );
}

function IconFloat() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 overflow-clip">
      <path fill="var(--ctrl-label)" d="M3 4H8V11H3Z" style={{ opacity: 0.3 }} />
      <path fill="var(--ctrl-label)" d="M1 2H15V3H1ZM1 11H9V12H1ZM12 5H13V10H12ZM11 10H14V11H11ZM12 11H13V12H12Z" />
    </svg>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function CtrlPreview() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<'min' | 'max'>('max');

  return (
    <div className="dark min-h-screen bg-page flex items-center justify-center p-8">
      {/* Panel Container */}
      <div
        className="flex flex-col font-mono text-xs leading-4"
        style={{
          width: 353,
          padding: 16,
          backgroundColor: '#000',
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
              <span className="shrink-0 text-center text-ctrl-label uppercase" style={{ fontSize: 8, lineHeight: '10px', width: 'max-content' }}>
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

            <span className="self-stretch flex items-center shrink-0 text-ctrl-label uppercase" style={{ fontSize: 8, lineHeight: '10px' }}>
              {open ? 'Collapse' : 'Expand'}
            </span>

            {/* Right bracket ¬ */}
            <div className="shrink-0" style={{ width: 4, height: 'round(50%, 1px)', borderRight: '1px solid var(--ctrl-border-inactive)', borderTop: '1px solid var(--ctrl-border-inactive)' }} />
          </button>

          {/* Section Content */}
          {open && (
            <div className="flex flex-1">
              <div className="flex flex-col flex-1 gap-1">
                {/* Box-Model Visualizer */}
                <div className="flex flex-col flex-1" style={{ backgroundColor: BOX.outline, padding: 1, gap: 1 }}>
                  {/* Margin layer */}
                  <div className="relative flex flex-1 overflow-clip" style={{ padding: 24 }}>
                    <Trap side="left" value={0} variant="margin" />
                    <Trap side="top" value={0} variant="margin" />
                    <Trap side="bottom" value={0} variant="margin" />
                    <Trap side="right" value={0} variant="margin" />

                    {/* Padding layer */}
                    <div className="flex flex-1 items-center justify-center relative">
                      <div className="flex flex-col flex-1 self-stretch" style={{ padding: 1 }}>
                        <div className="relative flex flex-1" style={{ padding: 24 }}>
                          <Trap side="left" value={24} variant="padding" />
                          <Trap side="top" value={16} variant="padding" />
                          <Trap side="bottom" value={16} variant="padding" />
                          <Trap side="right" value={24} variant="padding" />

                          {/* Center: Property cells */}
                          <div className="flex flex-col flex-1 self-stretch gap-[1px] items-center justify-center relative">
                            {/* W row */}
                            <div className="flex self-stretch gap-[1px]">
                              <LabelCell label="W" />
                              <ValueCell label="Fill" />
                              <ValueCell label="Min" />
                              <ValueCell label="Max" />
                            </div>
                            {/* H row */}
                            <div className="flex self-stretch gap-[1px]">
                              <LabelCell label="H" />
                              <ValueCell label="10" unit="REM" active />
                              <ValueCell label="Min" />
                              <ValueCell label="Min" />
                            </div>
                            {/* Icon strip */}
                            <div className="flex self-stretch relative" style={{ height: 20, borderRadius: 3 }}>
                              <div className="flex flex-1 items-center justify-center self-stretch bg-black gap-1 px-1">
                                <IconEye />
                              </div>
                              <div className="flex flex-1 items-center justify-center self-stretch bg-black gap-1 px-1">
                                <IconResize />
                              </div>
                              <div className="flex flex-1 items-center justify-center self-stretch bg-black gap-1 px-1">
                                <IconPosition />
                              </div>
                              <div className="flex flex-1 items-center justify-center self-stretch bg-black gap-1 px-1">
                                <IconFloat />
                              </div>
                              <div className="flex flex-1 items-center justify-center self-stretch bg-black flex-col gap-1 px-1">
                                <span
                                  className="text-ctrl-label uppercase overflow-hidden"
                                  style={{ fontSize: 8, lineHeight: '10px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 1, width: 'fit-content' }}
                                >
                                  Auto
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer: SHOW CSS */}
          <div className="flex items-start gap-1 h-6 shrink-0">
            <div className="flex-1 relative" style={{ height: 'round(50%, 1px)', borderBottom: '1px solid var(--ctrl-border-inactive)', borderLeft: '1px solid var(--ctrl-border-inactive)' }} />
            <span className="self-stretch flex items-center text-ctrl-label uppercase text-center" style={{ fontSize: 8, lineHeight: '10px' }}>
              Show css
            </span>
            <div className="flex-1 relative" style={{ height: 'round(50%, 1px)', borderBottom: '1px solid var(--ctrl-border-inactive)', borderRight: '1px solid var(--ctrl-border-inactive)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
