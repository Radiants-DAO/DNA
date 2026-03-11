'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';

// ============================================================================
// Types
// ============================================================================

type ToggleSize = 'sm' | 'md' | 'lg';
type ToggleVariant = 'default' | 'outline';

interface ToggleProps {
  /** Whether the toggle is currently pressed */
  pressed?: boolean;
  /** Initial pressed state for uncontrolled usage */
  defaultPressed?: boolean;
  /** Callback fired when the pressed state changes */
  onPressedChange?: (pressed: boolean) => void;
  /** Whether the toggle should ignore user interaction */
  disabled?: boolean;
  /** Size preset */
  size?: ToggleSize;
  /** Visual variant */
  variant?: ToggleVariant;
  /** A unique string identifier when used inside a ToggleGroup */
  value?: string;
  /** Toggle content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const toggleVariants = cva(
  `inline-flex items-center justify-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
   rounded-xs border cursor-pointer select-none
   transition-[border-color,background-color,color] duration-150 ease-out
   disabled:opacity-50 disabled:cursor-not-allowed
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1`,
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs gap-2 [&_svg]:size-3.5',
        md: 'h-7 px-3 text-xs gap-2 [&_svg]:size-4.5',
        lg: 'h-8 px-4 text-sm gap-3 [&_svg]:size-5',
      },
      variant: {
        default: '',
        outline: '',
      },
      pressed: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Default variant — pressed
      {
        variant: 'default',
        pressed: true,
        className: 'bg-action-primary text-content-inverted border-action-primary',
      },
      // Default variant — not pressed
      {
        variant: 'default',
        pressed: false,
        className: 'bg-surface-primary text-content-primary border-edge-primary hover:bg-surface-secondary',
      },
      // Outline variant — pressed
      {
        variant: 'outline',
        pressed: true,
        className: 'bg-action-primary text-content-inverted border-action-primary',
      },
      // Outline variant — not pressed
      {
        variant: 'outline',
        pressed: false,
        className: 'bg-transparent text-content-primary border-edge-primary hover:bg-surface-secondary',
      },
    ],
    defaultVariants: {
      size: 'md',
      variant: 'default',
      pressed: false,
    },
  }
);

// ============================================================================
// Component
// ============================================================================

/**
 * A two-state toggle button that can be on (pressed) or off.
 *
 * Uses Base UI Toggle internally for accessibility, keyboard support,
 * and integration with ToggleGroup.
 */
export function Toggle({
  pressed,
  defaultPressed = false,
  onPressedChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  value,
  children,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}: ToggleProps) {
  // For controlled usage, use the pressed prop directly.
  // For uncontrolled, Base UI handles the internal state via defaultPressed.
  const isPressed = pressed ?? defaultPressed;

  const classes = toggleVariants({
    size,
    variant,
    pressed: isPressed,
    className,
  });

  return (
    <BaseToggle
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={(newPressed) => onPressedChange?.(newPressed)}
      disabled={disabled}
      value={value}
      className={classes}
      aria-label={ariaLabel}
      data-slot="toggle"
      data-variant={variant}
      data-size={size}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </BaseToggle>
  );
}

export default Toggle;
