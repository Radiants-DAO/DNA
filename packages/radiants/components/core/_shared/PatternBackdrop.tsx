'use client';

import React from 'react';

// ============================================================================
// PatternBackdrop — shared checkerboard-masked backdrop for modal-family primitives
// ============================================================================
//
// Renders the pattern-masked fade layer used by Dialog, AlertDialog, Sheet, and
// Drawer. Each modal supplies its own Base UI Backdrop component via the
// `render` prop so Base UI's data-state machinery (data-starting-style /
// data-ending-style) wires up correctly.
//
// Style surface: `fixed inset-0 z-50` + pattern-masked surface-main background
// with a transition-opacity fade. Only the duration token varies between
// modal archetypes.
// ============================================================================

/**
 * Modal-family duration tokens. Centralised here so Drawer can't drift back
 * to a raw `duration-200` literal (see audit F10).
 *
 * - `base`: Dialog / AlertDialog (centered dialogs) — quick fade.
 * - `moderate`: Sheet / Drawer (edge sheets) — slightly longer to match slide.
 */
export type BackdropDuration = 'base' | 'moderate';

const durationClass: Record<BackdropDuration, string> = {
  base: 'duration-[var(--duration-base)]',
  moderate: 'duration-[var(--duration-moderate)]',
};

const BACKDROP_STYLE: React.CSSProperties = {
  background: 'var(--color-main)',
  maskImage: 'var(--pat-checkerboard)',
  WebkitMaskImage: 'var(--pat-checkerboard)',
  maskSize: '8px 8px',
  WebkitMaskSize: '8px 8px',
  imageRendering: 'pixelated',
};

// Base-UI Backdrop components share this ClassName/style prop shape across
// Dialog / AlertDialog / Drawer. A permissive component type is fine here —
// each modal passes its concrete primitive directly.
type BackdropComponent = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

export interface PatternBackdropProps {
  /**
   * The Base UI Backdrop component to render — e.g. `BaseDialog.Backdrop`,
   * `BaseAlertDialog.Backdrop`, `BaseDrawer.Backdrop`.
   */
  as: BackdropComponent;
  /**
   * Transition duration token. Defaults to `base` (Dialog/AlertDialog); pass
   * `moderate` for Sheet/Drawer.
   */
  duration?: BackdropDuration;
  /** Extra classes appended to the backdrop. */
  className?: string;
}

export function PatternBackdrop({
  as: Backdrop,
  duration = 'base',
  className = '',
}: PatternBackdropProps): React.ReactNode {
  const cls = [
    'pattern-backdrop',
    'fixed inset-0 z-50 transition-opacity ease-out',
    durationClass[duration],
    'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
    className,
  ].filter(Boolean).join(' ').trim();

  return <Backdrop className={cls} style={BACKDROP_STYLE} />;
}
