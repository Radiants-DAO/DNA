'use client';

import React, { useState } from 'react';

// =============================================================================
// Section — Collapsible panel section with rule-line header
//
// No Base UI dependency — uses data-[open] for CSS animation. Keeps ctrl
// independent from @base-ui/react.
// =============================================================================

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  defaultOpen = true,
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
          'flex items-center gap-2 py-1 w-full text-left outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow focus-visible:ring-offset-1',
          'group',
        ].join(' ')}
      >
        {/* Collapse indicator */}
        <span className={[
          'text-ctrl-label text-[0.5rem] transition-transform duration-fast',
          open ? 'rotate-90' : '',
        ].join(' ')}>
          ▶
        </span>

        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {title}
        </span>

        {/* Rule line */}
        <span className="flex-1 h-px bg-ctrl-track" />
      </button>

      {open && (
        <div className="flex flex-col gap-2 py-1 pl-3">
          {children}
        </div>
      )}
    </div>
  );
}
