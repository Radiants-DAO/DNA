'use client';

import React from 'react';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { cva } from 'class-variance-authority';

import { Icon } from '../../../icons/Icon';

// ============================================================================
// Types
// ============================================================================

export type ToggleTone = 'accent' | 'danger' | 'success' | 'neutral' | 'cream' | 'white' | 'info' | 'tinted';
export type ToggleSize = 'xs' | 'sm' | 'md' | 'lg';
export type ToggleRounded = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'none';

const TOGGLE_ROUNDED_TO_PIXEL_CLASS: Record<ToggleRounded, string | null> = {
  xs: 'pixel-rounded-4',
  sm: 'pixel-rounded-6',
  md: 'pixel-rounded-8',
  lg: 'pixel-rounded-12',
  xl: 'pixel-rounded-20',
  full: 'pixel-rounded-full',
  none: null,
};

interface ToggleProps {
  /** Controlled pressed state */
  pressed?: boolean;
  /** Initial pressed state for uncontrolled usage */
  defaultPressed?: boolean;
  /** Callback fired when pressed state changes */
  onPressedChange?: (pressed: boolean) => void;
  /** Unique value for coordination inside a ToggleGroup */
  value?: string;

  /** Color tone — drives data-color for themeable CSS */
  tone?: ToggleTone;
  /** Size preset */
  size?: ToggleSize;
  /** Pixel-corner roundness */
  rounded?: ToggleRounded;

  /** Icon — RDNA icon name (string) or custom ReactNode */
  icon?: string | React.ReactNode;
  /** Square button showing only the icon */
  iconOnly?: boolean;

  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

// ============================================================================
// CVA — collapsed toggle (root + face merged to a single node)
// ============================================================================

export const toggleVariants = cva(
  `group inline-flex items-center justify-center whitespace-nowrap select-none
   font-mono uppercase tracking-tight leading-none cursor-pointer
   transition-colors duration-[var(--duration-base)] ease-out
   bg-depth text-sub hover:text-main outline-none
   focus-visible:shadow-focused
   disabled:cursor-not-allowed disabled:opacity-50
   data-[state=selected]:bg-[var(--btn-fill)] data-[state=selected]:text-[var(--btn-text)]`,
  {
    variants: {
      size: {
        xs: 'h-5 text-xs gap-1 px-1.5 [&_svg]:size-3',
        sm: 'h-6 text-sm gap-1 px-2 [&_svg]:size-3.5',
        md: 'h-7 text-sm gap-1 px-2.5 [&_svg]:size-4',
        lg: 'h-8 text-base gap-1.5 px-3 [&_svg]:size-4',
      },
      iconOnly: {
        true: 'px-0',
        false: '',
      },
    },
    compoundVariants: [
      { iconOnly: true, size: 'xs', className: 'w-5' },
      { iconOnly: true, size: 'sm', className: 'w-6' },
      { iconOnly: true, size: 'md', className: 'w-7' },
      { iconOnly: true, size: 'lg', className: 'w-8' },
    ],
    defaultVariants: {
      size: 'xs',
      iconOnly: false,
    },
  }
);

// ============================================================================
// Component
// ============================================================================

/**
 * A two-state chip-style button that holds a pressed (on) / unpressed (off) state.
 *
 * One look: uppercase caps, size `xs`, pixel-rounded `xs`, chip fill that flips
 * on press. Coordinates with ToggleGroup via `value`.
 */
export function Toggle({
  pressed,
  defaultPressed = false,
  onPressedChange,
  value,
  tone = 'neutral',
  size = 'xs',
  rounded = 'xs',
  icon,
  iconOnly = false,
  disabled = false,
  children,
  className = '',
  'aria-label': ariaLabel,
}: ToggleProps) {
  const resolvedIcon = typeof icon === 'string' ? <Icon name={icon} /> : icon;
  const pixelClass = TOGGLE_ROUNDED_TO_PIXEL_CLASS[rounded];

  const classes = toggleVariants({
    size,
    iconOnly,
    className: `${pixelClass ?? ''} ${className}`.trim().replace(/\s+/g, ' '),
  });

  const content: React.ReactNode = iconOnly
    ? (resolvedIcon ?? children)
    : resolvedIcon
      ? (<>{resolvedIcon}{children}</>)
      : children;

  return (
    <BaseToggle
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      disabled={disabled}
      value={value}
      aria-label={ariaLabel}
      render={(toggleProps, state) => {
        const dataState = state.pressed ? 'selected' : 'default';
        return (
          <button
            {...toggleProps}
            data-rdna="toggle"
            data-slot="toggle-face"
            data-state={dataState}
            data-color={tone}
            data-size={size}
            {...(iconOnly ? { 'data-icon-only': '' } : {})}
            className={classes}
          >
            {content}
          </button>
        );
      }}
    />
  );
}
