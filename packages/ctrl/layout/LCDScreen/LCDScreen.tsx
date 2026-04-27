'use client';

import type { CSSProperties, ReactNode } from 'react';
import './LCDScreen.css';

// =============================================================================
// LCDScreen — Dark display panel with radial sheen.
//
// Default variant is `inset` — a recessed LCD-style screen: top-left dark
// interior shadow + bottom-right highlight read as "the surface sits lower
// than the bezel." Callers that want the old raised look (outer drop shadow)
// must opt in via `variant="raised"`.
//
// No border on either variant — the layered inset shadows define the edge.
//
// Used anywhere a device-style "LCD" surface is needed: track displays,
// level meters, effect racks, rail chrome. Children render inside the
// clipped, padded area.
// =============================================================================

type LCDVariant = 'inset' | 'raised';

interface LCDScreenProps {
  children?: ReactNode;
  /** Tailwind / custom className merged onto the screen shell */
  className?: string;
  /** Inline style overrides (size, etc.) */
  style?: CSSProperties;
  /** Radius preset */
  rounded?: 'none' | 'sm' | 'md';
  /** Padding preset for interior content */
  padding?: 'none' | 'sm' | 'md';
  /**
   * Chrome treatment:
   *  - `inset` (default): recessed — dual-axis inset shadow, no outer drop.
   *  - `raised`: legacy — shallow inset + subtle outer drop shadow.
   */
  variant?: LCDVariant;
}

const roundedClass: Record<NonNullable<LCDScreenProps['rounded']>, string> = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
};

const paddingClass: Record<NonNullable<LCDScreenProps['padding']>, string> = {
  none: '',
  sm: 'p-1',
  md: 'p-2',
};

// Inset: deep dark shadow at top-left + warm highlight at bottom-right,
// both inset. Reads as "screen sits below bezel" on both axes. No outer
// shadow — the bezel is owned by whatever chrome wraps this screen.
const INSET_SHADOW = [
  'oklch(0 0 0 / 0.55) 2px 2px 6px inset',
  'oklch(0 0 0 / 0.35) 1px 1px 0 inset',
  'oklch(0.98 0.03 94.34 / 0.08) -2px -2px 6px inset',
  'oklch(0.98 0.03 94.34 / 0.05) -1px -1px 0 inset',
].join(', ');

// Raised: preserves the previous look — shallow inset sheen edge plus a
// subtle outer drop shadow so the panel reads as sitting *on* the surface.
const RAISED_SHADOW = [
  'oklch(0 0 0 / 0.15) 2px 2px 9.6px inset',
  'oklch(0.9780 0.0295 94.34 / 0.1) -2px -2px 9.6px inset',
  '0 1px 2px oklch(0 0 0 / 0.3)',
].join(', ');

export function LCDScreen({
  children,
  className = '',
  style,
  rounded = 'none',
  padding = 'md',
  variant = 'inset',
}: LCDScreenProps) {
  return (
    <div
      data-rdna="ctrl-lcd-screen"
      data-variant={variant}
      className={[
        'relative overflow-clip',
        roundedClass[rounded],
        paddingClass[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: 'var(--color-ctrl-lcd-substrate)',
        backgroundImage:
          'radial-gradient(ellipse 38% 69% at 26% 11% in oklab, oklab(100% 0 0 / 0.09) 0%, oklab(100% 0 0 / 0) 100%)',
        boxShadow: variant === 'raised' ? RAISED_SHADOW : INSET_SHADOW,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
