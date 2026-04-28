'use client';

import React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

export interface CompactRowButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Marks the row as the current selected item. */
  selected?: boolean;
  /** Dense content before the main row label. */
  leading?: React.ReactNode;
  /** Dense content after the main row label. */
  trailing?: React.ReactNode;
  /** Additional className applied to the interactive row. */
  className?: string;
}

export const compactRowButtonVariants = cva(
  `pixel-rounded-4 flex w-full min-w-0 items-center gap-2 px-2 py-1
   text-left font-sans text-xs leading-tight text-flip
   cursor-pointer select-none bg-transparent
   transition-[background-color,color] duration-[var(--duration-base)] ease-out
   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus
   disabled:cursor-not-allowed disabled:text-mute
   [&_svg]:size-4`,
);

/**
 * Compact interactive row for dense lists, sidebars, and inspector rails.
 * Provides button semantics with optional leading/trailing slots and a
 * selected state that maps to RDNA button-face theme selectors.
 */
export function CompactRowButton({
  selected = false,
  leading,
  trailing,
  children,
  className = '',
  type = 'button',
  ...buttonProps
}: CompactRowButtonProps) {
  return (
    <BaseButton
      type={type}
      className={compactRowButtonVariants({ className })}
      data-rdna="compact-row"
      data-slot="button-face"
      data-quiet
      data-color="accent"
      data-state={selected ? 'selected' : 'default'}
      aria-pressed={selected || undefined}
      {...buttonProps}
    >
      {leading ? (
        <span
          aria-hidden="true"
          data-slot="compact-row-leading"
          className="flex shrink-0 items-center"
        >
          {leading}
        </span>
      ) : null}
      <span data-slot="compact-row-content" className="min-w-0 flex-1 truncate">
        {children}
      </span>
      {trailing ? (
        <span
          aria-hidden="true"
          data-slot="compact-row-trailing"
          className="flex shrink-0 items-center"
        >
          {trailing}
        </span>
      ) : null}
    </BaseButton>
  );
}
