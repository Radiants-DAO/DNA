'use client';

import React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import { Icon } from '../../../icons/Icon';

// ============================================================================
// Types
// ============================================================================

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'text';
type ButtonTone = 'accent' | 'danger' | 'success' | 'neutral';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonRounded = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

interface ButtonOwnProps {
  /** Structural variant */
  variant?: ButtonVariant;
  /** Color tone — sets data-color for CSS styling */
  tone?: ButtonTone;
  /** Size preset */
  size?: ButtonSize;
  /** Pixel-corner roundness */
  rounded?: ButtonRounded;
  /** Expand to fill container width */
  fullWidth?: boolean;
  /** Toggled active state (e.g. app is open) */
  active?: boolean;
  /** Square button showing only the icon */
  iconOnly?: boolean;
  /** Text-only button — suppresses icon slot and leader line */
  textOnly?: boolean;
  /** Icon — RDNA icon name (string) or custom ReactNode */
  icon?: string | React.ReactNode;
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
  `group relative inline-flex select-none cursor-pointer overflow-visible
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
        solid: 'shadow-none',
        outline: 'shadow-none',
        ghost: 'shadow-none',
        text: `shadow-none no-underline font-[inherit] text-[length:inherit] tracking-[inherit] leading-[inherit]
               normal-case !h-auto !p-0`,
      },
      rounded: {
        none: '',
        xs: 'pixel-rounded-xs',
        sm: 'pixel-rounded-sm',
        md: 'pixel-rounded-md',
        lg: 'pixel-rounded-lg',
        xl: 'pixel-rounded-xl',
      },
      size: {
        sm: 'h-6 text-xs gap-0.5 [&_svg]:size-4',
        md: 'h-7 text-xs gap-0.5 [&_svg]:size-4',
        lg: 'h-8 text-sm gap-1 [&_svg]:size-5',
      },
      iconOnly: {
        true: 'px-0 py-0 justify-center',
        false: '',
      },
      textOnly: { true: '', false: '' },
      fullWidth: { true: 'w-full', false: '' },
      disabled: { true: 'translate-y-0 shadow-none', false: '' },
    },
    compoundVariants: [
      // Text-only: equal padding (symmetric)
      { iconOnly: false, textOnly: true, size: 'sm', className: 'pl-1.5 pr-1.5' },
      { iconOnly: false, textOnly: true, size: 'md', className: 'pl-2 pr-2' },
      { iconOnly: false, textOnly: true, size: 'lg', className: 'pl-3 pr-3' },
      // Default: full left padding, half right (icon takes up right side)
      { iconOnly: false, textOnly: false, size: 'sm', className: 'pl-1.5 pr-0.5' },
      { iconOnly: false, textOnly: false, size: 'md', className: 'pl-2 pr-1' },
      { iconOnly: false, textOnly: false, size: 'lg', className: 'pl-3 pr-1.5' },
      // Icon-only: square
      { iconOnly: true, size: 'sm', className: 'w-6' },
      { iconOnly: true, size: 'md', className: 'w-7' },
      { iconOnly: true, size: 'lg', className: 'w-8' },
    ],
    defaultVariants: {
      variant: 'solid',
      rounded: 'xs',
      size: 'md',
      iconOnly: false,
      textOnly: false,
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
 * For destructive actions, use variant="solid" tone="danger".
 */
export function Button({
  variant = 'solid',
  tone = 'accent',
  size = 'md',
  rounded = 'xs',
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
  const resolvedVariant = variant;
  const resolvedTone = tone;

  // Resolve string icon names to RDNA Icon component
  const resolvedIcon = typeof icon === 'string' ? <Icon name={icon} /> : icon;

  const isDisabled = Boolean(disabled);
  const rootClasses = buttonRootVariants({ fullWidth, disabled: isDisabled });
  const justifyClass = !iconOnly && fullWidth && resolvedIcon && !textOnly ? 'justify-between' : iconOnly ? '' : 'justify-start';

  const faceClasses = buttonFaceVariants({
    variant: resolvedVariant,
    rounded: variant === 'text' ? 'none' : rounded,
    size,
    iconOnly,
    textOnly: textOnly || !resolvedIcon,
    fullWidth,
    disabled: isDisabled,
    className: `${justifyClass} ${className}`.trim(),
  });

  // Content based on mode
  let content: React.ReactNode;
  if (iconOnly) {
    content = resolvedIcon || children;
  } else if (textOnly || !resolvedIcon) {
    content = children;
  } else {
    // Default: text left, icon right, leader line between
    content = (
      <>
        {children}
        {children && <span className="flex-1 h-px bg-current opacity-30" />}
        {resolvedIcon}
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
      {...(iconOnly ? { 'data-icon-only': '' } : {})}
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
        data-color={resolvedTone}
        data-variant={resolvedVariant}
        data-state={active ? 'selected' : 'default'}
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
      data-color={resolvedTone}
      data-variant={resolvedVariant}
      data-state={active ? 'selected' : 'default'}
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
  /** The icon — RDNA icon name (string) or custom ReactNode */
  icon: string | React.ReactNode;
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
