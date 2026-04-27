'use client';

import type { ReactNode } from 'react';

// =============================================================================
// ActionButton — Cell-chrome action trigger for control panels.
//
// Paired with Section / PropertyRow. Uses the same dark cell background,
// 1px border, and mono caps typography as the rest of @rdna/ctrl. Intended
// for primary/secondary actions at the bottom of a panel (Copy, Download,
// Clear, Undo, etc.) where an RDNA Button would look out of place in the
// skeuomorphic chrome.
// =============================================================================

interface ActionButtonProps {
  label: string;
  /** Optional leading icon node. */
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Border treatment. `flush` is for 1px-gap cell groups inside rails. */
  chrome?: 'bordered' | 'flush';
  size?: 'md' | 'xl';
  /** Make the button stretch to fill its parent flex row. Default true. */
  stretch?: boolean;
  /** Accessible label override — defaults to `label`. */
  ariaLabel?: string;
  className?: string;
}

export function ActionButton({
  label,
  icon,
  onClick,
  disabled = false,
  chrome = 'bordered',
  size = 'md',
  stretch = true,
  ariaLabel,
  className = '',
}: ActionButtonProps) {
  const isFlush = chrome === 'flush';

  return (
    <button
      type="button"
      data-rdna="ctrl-action-button"
      data-chrome={chrome}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={onClick}
      className={[
        'group relative inline-flex items-center justify-center gap-1.5',
        stretch && 'flex-1',
        isFlush
          ? size === 'xl'
            ? 'min-h-10 max-h-10 px-2 border-0'
            : 'min-h-5 max-h-5 px-2 border-0'
          : 'min-h-[--ctrl-row-height] px-2 border border-ctrl-border-inactive',
        'bg-ctrl-cell-bg',
        'font-mono uppercase tracking-wider text-[0.625rem]',
        'text-main active:bg-ink active:text-flip',
        'focus-visible:outline-2 focus-visible:outline-ctrl-glow',
        'transition-colors duration-fast',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden group-hover:block group-active:hidden"
        style={{
          backgroundColor: 'var(--color-ctrl-label)',
          WebkitMaskImage: 'var(--pat-diagonal)',
          maskImage: 'var(--pat-diagonal)',
          WebkitMaskSize: '8px 8px',
          maskSize: '8px 8px',
          WebkitMaskRepeat: 'repeat',
          maskRepeat: 'repeat',
        }}
      />
      <span className="relative inline-flex items-center gap-1.5">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}
