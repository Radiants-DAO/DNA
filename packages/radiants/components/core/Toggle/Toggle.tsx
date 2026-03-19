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
   pixel-rounded-xs cursor-pointer select-none
   transition-[background-color,color] duration-150 ease-out
   disabled:opacity-50 disabled:cursor-not-allowed
   focus-visible:outline-none`,
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
        className: 'bg-accent text-accent-inv',
      },
      // Default variant — not pressed
      {
        variant: 'default',
        pressed: false,
        className: 'bg-page text-main hover:bg-inv hover:text-accent',
      },
      // Outline variant — pressed
      {
        variant: 'outline',
        pressed: true,
        className: 'bg-accent text-accent-inv',
      },
      // Outline variant — not pressed
      {
        variant: 'outline',
        pressed: false,
        className: 'bg-transparent text-main hover:bg-inv hover:text-accent',
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
  return (
    <BaseToggle
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      disabled={disabled}
      value={value}
      aria-label={ariaLabel}
      data-slot="toggle"
      data-variant={variant}
      data-size={size}
      render={(props, state) => (
        <button
          {...props}
          data-rdna="toggle"
          className={toggleVariants({ size, variant, pressed: state.pressed, className })}
        />
      )}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </BaseToggle>
  );
}

export default Toggle;
