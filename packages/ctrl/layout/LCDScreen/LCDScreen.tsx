'use client';

import type { CSSProperties, ReactNode } from 'react';

// =============================================================================
// LCDScreen — Inset black display panel with radial sheen and yellow rim highlight.
//
// Used anywhere a device-style "LCD" surface is needed: track displays,
// level meters, effect racks. Children render inside the clipped, padded area.
// =============================================================================

interface LCDScreenProps {
  children?: ReactNode;
  /** Tailwind / custom className merged onto the screen shell */
  className?: string;
  /** Inline style overrides (size, etc.) */
  style?: CSSProperties;
  /** Radius preset */
  rounded?: 'none' | 'sm' | 'md';
  /** Padding preset for interior content (0 / 1 / 2 in units of 4px) */
  padding?: 'none' | 'sm' | 'md';
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

export function LCDScreen({
  children,
  className = '',
  style,
  rounded = 'none',
  padding = 'md',
}: LCDScreenProps) {
  return (
    <div
      data-rdna="ctrl-lcd-screen"
      className={[
        'relative overflow-clip',
        roundedClass[rounded],
        paddingClass[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-exact-lcd-black owner:rad-os expires:2026-12-31 issue:DNA-999
        backgroundColor: 'oklch(0 0 0)',
        backgroundImage:
          'radial-gradient(ellipse 38% 69% at 26% 11% in oklab, oklab(100% 0 0 / 0.09) 0%, oklab(100% 0 0 / 0) 100%)',
        boxShadow:
          'oklch(0 0 0 / 0.15) 2px 2px 9.6px inset, oklch(0.9780 0.0295 94.34 / 0.1) -2px -2px 9.6px inset',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
