'use client';

import React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import { Icon } from '../../../icons/Icon';
import { PixelBorder, type PixelBorderSize } from '../PixelBorder/PixelBorder';

// ============================================================================
// Types
// ============================================================================

type ButtonMode = 'solid' | 'flat' | 'text' | 'pattern';
type ButtonTone = 'accent' | 'danger' | 'success' | 'neutral' | 'cream' | 'white' | 'info' | 'tinted' | 'transparent';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonRounded = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

/**
 * Maps the Button `rounded` variant to the matching PixelBorder size preset.
 * `none` collapses to `null` — a sentinel meaning "skip the wrap entirely".
 */
const BUTTON_ROUNDED_TO_PIXEL_SIZE: Record<ButtonRounded, PixelBorderSize | null> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  none: null,
};

interface ButtonOwnProps {
  /** Visual mode — controls fill treatment. Defaults to 'solid'. */
  mode?: ButtonMode;
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
  /** Negative margins cancel padding so content aligns flush with surroundings */
  flush?: boolean;
  /** Transparent at rest — strips fill and border, re-applies on hover/active/selected */
  quiet?: boolean;
  /** Compact badge-like styling — uses mono font (PixelCode) instead of heading */
  compact?: boolean;
  /** Icon — RDNA icon name (string) or custom ReactNode */
  icon?: string | React.ReactNode;
  /** Additional className applied to the face element */
  className?: string;
  /** Applies disabled styling and disables button-mode interaction */
  disabled?: boolean;
  /** Keep button focusable while disabled — use for loading states */
  focusableWhenDisabled?: boolean;
  children?: React.ReactNode;
}

type ButtonButtonProps = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps | 'href' | 'target'> & {
    href?: undefined;
    target?: never;
  };

type ButtonAnchorProps = ButtonOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps> & {
    href: string;
  };

type ButtonProps = ButtonButtonProps | ButtonAnchorProps;

// ============================================================================
// CVA Variants
// ============================================================================

export const buttonRootVariants = cva(
  `group relative inline-flex select-none cursor-pointer overflow-visible
   focus-visible:outline-none focus-visible:shadow-focused`,
  {
    variants: {
      fullWidth: { true: 'w-full', false: '' },
      disabled: { true: 'cursor-not-allowed', false: '' },
    },
    defaultVariants: { fullWidth: false, disabled: false },
  }
);

export const buttonFaceVariants = cva(
  `inline-flex items-center uppercase tracking-tight leading-none whitespace-nowrap shadow-none
   transition-[border-color,background-color,color] duration-150 ease-out`,
  {
    variants: {
      mode: {
        solid: '',
        flat: '',
        text: 'no-underline font-[inherit] text-[length:inherit] tracking-[inherit] leading-[inherit] normal-case !h-auto !p-0',
        pattern: '',
      },
      // Geometry is now handled by the `<PixelBorder>` wrapper (see
      // Button render body). This variant stays in the cva signature so
      // compound variants that key on `rounded` keep type-checking, but it
      // no longer contributes classes to the face element.
      rounded: {
        none: '',
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      size: {
        sm: 'h-6 text-xs gap-0.5 [&_svg]:size-4',
        md: 'h-7 text-xs gap-0.5 [&_svg]:size-4',
        lg: 'h-8 text-sm gap-1 [&_svg]:size-4',
        xl: 'h-10 text-sm gap-1.5 [&_svg]:size-6',
      },
      iconOnly: {
        true: 'px-0 py-0 justify-center',
        false: '',
      },
      compact: {
        true: 'font-mono',
        false: 'font-heading',
      },
      textOnly: { true: '', false: '' },
      fullWidth: { true: 'w-full', false: '' },
    },
    compoundVariants: [
      // Text-only: equal padding (symmetric)
      { iconOnly: false, textOnly: true, size: 'sm', className: 'pl-1.5 pr-1.5' },
      { iconOnly: false, textOnly: true, size: 'md', className: 'pl-2 pr-2' },
      { iconOnly: false, textOnly: true, size: 'lg', className: 'pl-3 pr-3' },
      { iconOnly: false, textOnly: true, size: 'xl', className: 'pl-4 pr-4' },
      // Default: full left padding, half right (icon takes up right side)
      { iconOnly: false, textOnly: false, size: 'sm', className: 'pl-1.5 pr-0.5' },
      { iconOnly: false, textOnly: false, size: 'md', className: 'pl-2 pr-1' },
      { iconOnly: false, textOnly: false, size: 'lg', className: 'pl-3 pr-1.5' },
      { iconOnly: false, textOnly: false, size: 'xl', className: 'pl-4 pr-2' },
      // Icon-only: square
      { iconOnly: true, size: 'sm', className: 'w-6' },
      { iconOnly: true, size: 'md', className: 'w-7' },
      { iconOnly: true, size: 'lg', className: 'w-8' },
      { iconOnly: true, size: 'xl', className: 'w-10' },
    ],
    defaultVariants: {
      mode: 'solid',
      rounded: 'xs',
      size: 'md',
      compact: false,
      iconOnly: false,
      textOnly: false,
      fullWidth: false,
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
 * For destructive actions, use mode="solid" tone="danger".
 */
export function Button({
  mode = 'solid',
  tone = 'accent',
  size = 'md',
  rounded = 'xs',
  fullWidth = false,
  active = false,
  iconOnly = false,
  textOnly = false,
  compact = false,
  flush = false,
  quiet = false,
  icon,
  children,
  className = '',
  disabled = false,
  focusableWhenDisabled,
  ...elementProps
}: ButtonProps) {
  const dataState = active ? 'selected' : 'default';

  // Resolve string icon names to RDNA Icon component
  const resolvedIcon = typeof icon === 'string' ? <Icon name={icon} /> : icon;

  const isDisabled = Boolean(disabled);
  const rootClasses = buttonRootVariants({ fullWidth, disabled: isDisabled });
  const justifyClass = !iconOnly && fullWidth && resolvedIcon && !textOnly ? 'justify-between' : iconOnly ? '' : 'justify-start';

  // Modes without pixel-corner borders (text / flat / pattern) force `none`.
  const effectiveRounded: ButtonRounded =
    mode === 'text' || mode === 'flat' || mode === 'pattern' ? 'none' : rounded;

  const faceClasses = buttonFaceVariants({
    mode,
    rounded: effectiveRounded,
    size,
    compact,
    iconOnly,
    textOnly: textOnly || !resolvedIcon,
    fullWidth,
    className: `${justifyClass} ${className}`.trim(),
  });

  // When the button has pixel-art corners, wrap the face span in a
  // <PixelBorder>. The map collapses `none` to `null`, in which case the
  // face renders bare. The face's pseudo-element overlays
  // (::before / ::after) stay within the wrapped clipper so they still
  // mask to the staircase polygon — matching the legacy behaviour.
  const pixelBorderSize = BUTTON_ROUNDED_TO_PIXEL_SIZE[effectiveRounded];

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
        {children && <span className="flex-1 h-px bg-line opacity-30" />}
        {resolvedIcon}
      </>
    );
  }

  const faceSpan = (
    <span
      className={faceClasses}
      data-slot="button-face"
      data-variant={mode}
      data-mode={mode}
      data-color={tone}
      data-state={dataState}
      data-size={size}
      {...(iconOnly ? { 'data-icon-only': '' } : {})}
      {...(flush ? { 'data-flush': '' } : {})}
      {...(quiet ? { 'data-quiet': '' } : {})}
    >
      {content}
    </span>
  );

  const face =
    pixelBorderSize !== null ? (
      <PixelBorder
        size={pixelBorderSize}
        className={fullWidth ? 'w-full inline-flex' : 'inline-flex'}
      >
        {faceSpan}
      </PixelBorder>
    ) : (
      faceSpan
    );

  if ('href' in elementProps && typeof elementProps.href === 'string') {
    const { href, target, ...anchorProps } = elementProps;

    return (
      <a
        href={href}
        target={target}
        {...anchorProps}
        className={rootClasses}
        data-rdna="button"
        data-slot="button-root"
        data-variant={mode}
        data-color={tone}
        data-mode={mode}
        data-state={dataState}
        {...(quiet ? { 'data-quiet': '' } : {})}
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
      data-variant={mode}
      data-color={tone}
      data-mode={mode}
      data-state={dataState}
      {...(quiet ? { 'data-quiet': '' } : {})}
      disabled={isDisabled}
      focusableWhenDisabled={focusableWhenDisabled}
      {...elementProps}
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

type IconButtonProps = Omit<
  ButtonButtonProps,
  'children' | 'icon' | 'iconOnly' | 'textOnly' | 'fullWidth' | 'href' | 'target'
> &
  IconButtonOwnProps;

/**
 * A square button that shows only an icon.
 * Convenience wrapper — sets iconOnly on Button.
 */
export function IconButton({
  icon,
  size = 'md',
  quiet = true,
  ...props
}: IconButtonProps) {
  return <Button size={size} quiet={quiet} iconOnly icon={icon} {...props} />;
}

export default Button;
