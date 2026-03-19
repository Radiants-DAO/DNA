'use client';

import React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type ButtonVariant = 'solid' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'text';
type ButtonTone = 'accent' | 'danger' | 'success' | 'neutral';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  /** Structural variant */
  variant?: ButtonVariant;
  /** Color tone — sets data-color for CSS styling */
  tone?: ButtonTone;
  /** Size preset */
  size?: ButtonSize;
  /** Expand to fill container width */
  fullWidth?: boolean;
  /** Toggled active state (e.g. app is open) */
  active?: boolean;
  /** Square button showing only the icon */
  iconOnly?: boolean;
  /** Text-only button — suppresses icon slot and leader line */
  textOnly?: boolean;
  /** Icon slot — renders right of text with a leader line */
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
        solid: 'pixel-rounded-xs shadow-none',
        secondary: 'pixel-rounded-xs shadow-none',
        outline: 'pixel-rounded-xs shadow-none',
        ghost: 'shadow-none',
        text: `shadow-none no-underline font-[inherit] text-[length:inherit] tracking-[inherit] leading-[inherit]
               normal-case !h-auto !p-0`,
      },
      size: {
        sm: 'h-6 text-xs gap-1.5 [&_svg]:size-3.5',
        md: 'h-7 text-xs gap-1.5 [&_svg]:size-4.5',
        lg: 'h-8 text-sm gap-2 [&_svg]:size-5',
      },
      iconOnly: {
        true: 'px-0 py-0 justify-center',
        false: '',
      },
      fullWidth: { true: 'w-full', false: '' },
      disabled: { true: 'translate-y-0 shadow-none', false: '' },
    },
    compoundVariants: [
      { iconOnly: false, size: 'sm', className: 'px-1.5' },
      { iconOnly: false, size: 'md', className: 'px-2' },
      { iconOnly: false, size: 'lg', className: 'px-3' },
      { iconOnly: true, size: 'sm', className: 'w-6' },
      { iconOnly: true, size: 'md', className: 'w-7' },
      { iconOnly: true, size: 'lg', className: 'w-8' },
    ],
    defaultVariants: {
      variant: 'solid',
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
 * Default layout: text left + icon right with leader line.
 * Use iconOnly for square icon buttons, textOnly to suppress the icon slot.
 * `destructive` is an alias for variant="solid" tone="danger".
 */
export function Button({
  variant = 'solid',
  tone = 'accent',
  size = 'md',
  fullWidth = false,
  active = false,
  iconOnly = false,
  textOnly = false,
  icon,
  href,
  target,
  children,
  className = '',
  disabled,
  focusableWhenDisabled,
  ...props
}: ButtonProps) {
  // Resolve destructive alias
  const resolvedVariant = variant === 'destructive' ? 'solid' : variant;
  const resolvedTone = variant === 'destructive' ? 'danger' : tone;

  const isDisabled = Boolean(disabled);
  const rootClasses = buttonRootVariants({ fullWidth, disabled: isDisabled });
  const justifyClass = !iconOnly && fullWidth && icon && !textOnly ? 'justify-between' : iconOnly ? '' : 'justify-start';

  const faceClasses = buttonFaceVariants({
    variant: resolvedVariant,
    size,
    iconOnly,
    fullWidth,
    disabled: isDisabled,
    className: `${justifyClass} ${className}`.trim(),
  });

  // Content based on mode
  let content: React.ReactNode;
  if (iconOnly) {
    content = icon || children;
  } else if (textOnly || !icon) {
    content = children;
  } else {
    // Default: text left, icon right, leader line between
    content = (
      <>
        {children}
        {children && <span className="flex-1 h-px bg-current opacity-30" />}
        {icon}
      </>
    );
  }

  const face = (
    <span
      className={faceClasses}
      data-slot="button-face"
      data-variant={resolvedVariant}
      data-color={resolvedTone}
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

interface IconButtonOwnProps extends Omit<ButtonOwnProps, 'children' | 'icon' | 'iconOnly' | 'textOnly' | 'href' | 'target' | 'fullWidth'> {
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
 * Convenience wrapper — sets iconOnly on Button.
 */
export function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  return <Button variant={variant} size={size} iconOnly icon={icon} {...props} />;
}

export default Button;
