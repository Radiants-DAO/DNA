'use client';

import React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Expand to fill container width */
  fullWidth?: boolean;
  /** Toggled active state (e.g. app is open) */
  active?: boolean;
  /** Icon slot — renders after text with a leader line */
  icon?: React.ReactNode;
  /** URL for navigation — renders as anchor element */
  href?: string;
  /** Target for link navigation */
  target?: string;
  /** Additional className applied to the face element */
  className?: string;
  children?: React.ReactNode;
}

type ButtonProps = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & {
    focusableWhenDisabled?: boolean;
  };

// ============================================================================
// CVA Variants
// ============================================================================

export const buttonRootVariants = cva(
  `group relative inline-flex select-none pixel-rounded-xs cursor-pointer overflow-visible
   focus-visible:outline-none`,
  {
    variants: {
      fullWidth: { true: 'w-full', false: '' },
      disabled: { true: 'opacity-50 cursor-not-allowed', false: '' },
    },
    defaultVariants: { fullWidth: false, disabled: false },
  }
);

export const buttonFaceVariants = cva(
  `inline-flex items-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
   transition-[border-color,background-color,color] duration-150 ease-out`,
  {
    variants: {
      variant: {
        primary: 'pixel-rounded-xs shadow-none',
        secondary: 'pixel-rounded-xs shadow-none',
        outline: 'pixel-rounded-xs shadow-none',
        ghost: 'shadow-none',
        destructive: 'pixel-rounded-xs shadow-none',
        text: `shadow-none no-underline font-[inherit] text-[length:inherit] tracking-[inherit] leading-[inherit]
               normal-case !h-auto !p-0`,
      },
      size: {
        sm: 'h-6 text-xs gap-2 [&_svg]:size-3.5',
        md: 'h-7 text-xs gap-2 [&_svg]:size-4.5',
        lg: 'h-8 text-sm gap-3 [&_svg]:size-5',
      },
      iconOnly: {
        true: 'p-0 justify-center',
        false: '',
      },
      fullWidth: { true: 'w-full', false: '' },
      disabled: { true: 'translate-y-0 shadow-none', false: '' },
    },
    compoundVariants: [
      { iconOnly: false, size: 'sm', className: 'px-2' },
      { iconOnly: false, size: 'md', className: 'px-3' },
      { iconOnly: false, size: 'lg', className: 'px-4' },
      { iconOnly: true, size: 'sm', className: 'size-6' },
      { iconOnly: true, size: 'md', className: 'size-7' },
      { iconOnly: true, size: 'lg', className: 'size-8' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
      fullWidth: false,
      disabled: false,
    },
  }
);

// ============================================================================
// Button
// ============================================================================

/**
 * Button with retro pixel-corner lift effect.
 * Built on Base UI Button primitive.
 *
 * - Without href: renders as <button> via Base UI (proper ARIA, keyboard)
 * - With href: renders as <a>
 * - Icon slot renders after text with a leader line separator
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  active = false,
  icon,
  href,
  target,
  children,
  className = '',
  disabled,
  focusableWhenDisabled,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled);
  const rootClasses = buttonRootVariants({ fullWidth, disabled: isDisabled });
  const justifyClass = fullWidth && icon ? 'justify-between' : 'justify-start';

  const faceClasses = buttonFaceVariants({
    variant,
    size,
    iconOnly: false,
    fullWidth,
    disabled: isDisabled,
    className: `${justifyClass} ${className}`.trim(),
  });

  const content = icon ? (
    <>
      {children}
      {children && <span className="flex-1 h-px bg-line opacity-30" />}
      {icon}
    </>
  ) : (
    children
  );

  const face = (
    <span
      className={faceClasses}
      data-slot="button-face"
      data-variant={variant}
      data-state={active ? 'selected' : 'default'}
      data-size={size}
    >
      {content}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={rootClasses}
        data-rdna="button"
        data-slot="button-root"
      >
        {face}
      </a>
    );
  }

  return (
    <BaseButton
      className={rootClasses}
      data-rdna="button"
      data-slot="button-root"
      disabled={isDisabled}
      focusableWhenDisabled={focusableWhenDisabled}
      {...props}
    >
      {face}
    </BaseButton>
  );
}

// ============================================================================
// IconButton — Convenience wrapper for icon-only buttons
// ============================================================================

interface IconButtonOwnProps extends Omit<ButtonOwnProps, 'children' | 'icon' | 'href' | 'target' | 'fullWidth'> {
  /** The icon to display */
  icon: React.ReactNode;
  /** Accessible label (required for icon-only buttons) */
  'aria-label': string;
}

type IconButtonProps = IconButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof IconButtonOwnProps> & {
    focusableWhenDisabled?: boolean;
  };

/**
 * A square button that shows only an icon.
 * Convenience wrapper — uses Base UI Button directly.
 */
export function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  active = false,
  className = '',
  'aria-label': ariaLabel,
  disabled,
  focusableWhenDisabled,
  ...props
}: IconButtonProps) {
  const isDisabled = Boolean(disabled);
  const rootClasses = buttonRootVariants({ fullWidth: false, disabled: isDisabled });

  const faceClasses = buttonFaceVariants({
    variant,
    size,
    iconOnly: true,
    fullWidth: false,
    disabled: isDisabled,
    className,
  });

  return (
    <BaseButton
      className={rootClasses}
      data-rdna="button"
      data-slot="button-root"
      disabled={isDisabled}
      focusableWhenDisabled={focusableWhenDisabled}
      aria-label={ariaLabel}
      {...props}
    >
      <span
        className={faceClasses}
        data-slot="button-face"
        data-variant={variant}
        data-state={active ? 'selected' : 'default'}
        data-size={size}
      >
        {icon}
      </span>
    </BaseButton>
  );
}

export default Button;
