'use client';

import React, { useState } from 'react';

// =============================================================================
// Section — Collapsible panel section with rule-ornament header
//
// Paper ref: 02 — Section Header
// Rule ornaments flank the title. Optional trailing controls (badge, collapse).
// No Base UI dependency — uses data-[open] for CSS.
// =============================================================================

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  /** Optional count badge shown after the trailing rule */
  count?: number;
  /** Inline controls rendered between the rule and collapse label */
  headerControls?: React.ReactNode;
  /** Footer label text (e.g. "Show CSS") — renders a bottom ornament row */
  footer?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  defaultOpen = true,
  count,
  headerControls,
  footer,
  children,
  className = '',
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      data-rdna="ctrl-section"
      data-open={open || undefined}
      className={['flex flex-col', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={[
          'flex items-end gap-1 h-6 w-full text-left shrink-0 cursor-pointer outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow focus-visible:ring-offset-1',
          'group',
        ].join(' ')}
      >
        {/* Left bracket ⌐ — L-shape: border-left + border-top */}
        <div
          className="shrink-0"
          style={{
            width: 4,
            height: 'round(50%, 1px)',
            borderLeft: '1px solid var(--color-ctrl-border-inactive)',
            borderTop: '1px solid var(--color-ctrl-border-inactive)',
          }}
        />

        {/* Title — cream text with 3-layer glow */}
        <span
          className="self-stretch flex items-center shrink-0 text-xs leading-4 uppercase"
          style={{
            color: 'var(--color-main)',
            textShadow:
              'var(--color-ctrl-glow) 0 0 0.5px, var(--color-ctrl-glow) 0 0 3px, var(--color-main) 0 0 10px',
          }}
        >
          {title}
        </span>

        {/* Rule line */}
        <div
          className="flex-1 relative"
          style={{
            height: 'round(50%, 1px)',
            borderTop: '1px solid var(--color-ctrl-border-inactive)',
          }}
        />

        {/* Count badge */}
        {count != null && (
          <span className="font-mono text-ctrl-label text-[0.5rem] tracking-wider shrink-0 ml-1 mr-1">
            {count} found
          </span>
        )}

        {/* Header controls slot + short right rule */}
        {headerControls && (
          <>
            <div>{headerControls}</div>
            <div
              className="shrink-0 relative"
              style={{
                width: 12,
                height: 'round(50%, 1px)',
                borderTop: '1px solid var(--color-ctrl-border-inactive)',
              }}
            />
          </>
        )}

        {/* Collapse/Expand label */}
        <span
          style={{ fontSize: 8, lineHeight: '10px' }}
          className="uppercase shrink-0 group-hover:text-ctrl-text-active transition-colors duration-fast"
        >
          {open ? 'Collapse' : 'Expand'}
        </span>

        {/* Right bracket ¬ — mirror L-shape: border-right + border-top */}
        <div
          className="shrink-0"
          style={{
            width: 4,
            height: 'round(50%, 1px)',
            borderRight: '1px solid var(--color-ctrl-border-inactive)',
            borderTop: '1px solid var(--color-ctrl-border-inactive)',
          }}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-[--ctrl-cell-gap] py-1">
          {children}
        </div>
      )}

      {/* Footer ornament */}
      {footer && (
        <div className="flex items-start gap-1 h-6 shrink-0">
          {/* Left L-bracket (bottom-left corner) */}
          <div
            className="flex-1 relative"
            style={{
              height: 'round(50%, 1px)',
              borderBottom: '1px solid var(--color-ctrl-border-inactive)',
              borderLeft: '1px solid var(--color-ctrl-border-inactive)',
            }}
          />

          {/* Centered label */}
          <span
            style={{ fontSize: 8, lineHeight: '10px' }}
            className="uppercase"
          >
            {footer}
          </span>

          {/* Right L-bracket (bottom-right corner) */}
          <div
            className="flex-1 relative"
            style={{
              height: 'round(50%, 1px)',
              borderBottom: '1px solid var(--color-ctrl-border-inactive)',
              borderRight: '1px solid var(--color-ctrl-border-inactive)',
            }}
          />
        </div>
      )}
    </div>
  );
}
