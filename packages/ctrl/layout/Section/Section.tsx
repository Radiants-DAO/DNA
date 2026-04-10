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
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  defaultOpen = true,
  count,
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
          'flex items-center gap-[--ctrl-cell-gap] w-full text-left outline-none',
          'min-h-[--ctrl-row-height]',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow focus-visible:ring-offset-1',
          'group',
        ].join(' ')}
      >
        {/* Left ornament bracket */}
        <span className="w-1 h-3 border-l border-t border-b border-ctrl-rule shrink-0" />

        {/* Title */}
        <span className="font-mono text-ctrl-text-active text-[0.625rem] uppercase tracking-wider shrink-0"
          style={{ textShadow: '0 0 8px var(--glow-sun-yellow)' }}
        >
          {title}
        </span>

        {/* Rule line */}
        <span className="flex-1 h-px bg-ctrl-rule" />

        {/* Count badge */}
        {count != null && (
          <span className="font-mono text-ctrl-label text-[0.5rem] tracking-wider shrink-0">
            {count} found
          </span>
        )}

        {/* Collapse label */}
        <span className="font-mono text-ctrl-label text-[0.5rem] uppercase tracking-wider shrink-0 group-hover:text-ctrl-text-active transition-colors duration-fast">
          {open ? 'collapse' : 'expand'}
        </span>

        {/* Right ornament bracket */}
        <span className="w-1 h-3 border-r border-t border-b border-ctrl-rule shrink-0" />
      </button>

      {open && (
        <div className="flex flex-col gap-[--ctrl-cell-gap] py-1">
          {children}
        </div>
      )}
    </div>
  );
}
