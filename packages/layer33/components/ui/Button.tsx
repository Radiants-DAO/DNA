'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Spinner } from './Progress';

// ============================================================================
// Types
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Expand to fill container width */
  fullWidth?: boolean;
  /** Square button with icon only (no text) */
  iconOnly?: boolean;
  /** Icon name (filename without .svg extension) */
  iconName?: string;
  /** Show loading spinner (only applies to buttons with icons) */
  loading?: boolean;
  /** Button content (optional when iconOnly is true) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface ButtonAsButtonProps extends BaseButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  /** URL for navigation - when provided, button can act as a link */
  href?: undefined;
}

interface ButtonAsLinkProps extends BaseButtonProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> {
  /** URL for navigation - renders as Next.js Link */
  href: string;
  /** Whether to render as Next.js Link (true) or use window.open (false) */
  asLink?: boolean;
  /** Target for link navigation (e.g., '_blank') */
  target?: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

// ============================================================================
// Styles
// ============================================================================

/**
 * Base styles applied to all buttons
 * Extracted from Webflow .button class styles
 * - Default: transparent bg, black border, no shadow
 * - Hover: neutral-1 bg, 3px shadow, lift up 2px
 * - Active: no shadow, push down 2px
 * - Sharp corners (rounded-none)
 * - 300ms ease-out transitions on bg-color, transform, and box-shadow
 * Note: justify-content is set per variant (justify-start for text, justify-center for icon-only, justify-between for icon+text)
 */
const baseStyles = `
  flex items-center
  font-alfacad uppercase
  whitespace-nowrap
  cursor-pointer select-none
  border border-black
  rounded-none
  shadow-none
  font-medium
  translate-y-0
  transition-[background-color,transform,border-color] duration-300 ease-btn
  hover:bg-neutral-neutral-1
  hover:text-black
  hover:shadow-[0_2px_0_0_var(--color-black)]
  hover:-translate-y-0.5
  active:shadow-none
  active:translate-y-0.5
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2
  disabled:cursor-not-allowed
  disabled:hover:translate-y-0 disabled:hover:shadow-none
`;

/**
 * Size presets
 * Default height: h-[2.5rem] (2.5rem = 40px) matching Webflow .button
 * Text sizes: sm=10px, md=16px (1rem), lg=14px
 * Padding: px-3 (0.75rem = 12px) matching Webflow .button
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[10px] gap-3',
  md: 'h-[2.5rem] px-3 text-base gap-3',
  lg: 'h-8 px-3 text-sm gap-3',
};

/**
 * Icon-only size presets (square buttons)
 * All buttons use w-8 h-8 (2rem) for consistency
 */
const iconOnlySizeStyles: Record<ButtonSize, string> = {
  sm: 'w-8 h-8 p-0',
  md: 'w-8 h-8 p-0',
  lg: 'w-8 h-8 p-0',
};

/**
 * Variant color schemes
 * - primary: green bg, black text (overrides base transparent bg)
 * - secondary: black bg, white text, inverts on hover (matches Webflow .button.is-secondary)
 * - outline: transparent bg, black border (matches base Webflow .button)
 * - ghost: no border, subtle hover bg
 * - text: text-only link style (matches Webflow .button.is-text)
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-white text-black
    border-black
    hover:bg-neutral-neutral-1 hover:text-black
    active:bg-neutral-neutral-1 active:text-black
    disabled:bg-neutral-neutral-2 disabled:text-neutral-neutral-3 disabled:border-neutral-neutral-3
  `,
  secondary: `
    bg-black text-white
    border-0
    hover:bg-neutral-neutral-1 hover:text-black
    active:bg-green active:text-black
    disabled:bg-neutral-neutral-4 disabled:text-neutral-neutral-3 disabled:border-neutral-neutral-3
  `,
  outline: `
    bg-transparent text-black
    border-black
    hover:bg-neutral-neutral-1 hover:text-black hover:shadow-none hover:translate-y-0
    active:bg-neutral-neutral-1 active:text-black
    disabled:text-neutral-neutral-3 disabled:border-neutral-neutral-3
  `,
  ghost: `
    bg-transparent text-black
    border-transparent
    shadow-none
    hover:bg-neutral-neutral-1 hover:border-black hover:text-black hover:shadow-none hover:translate-y-0
    active:bg-green active:text-black active:border-black active:translate-y-0
    disabled:text-neutral-neutral-3
  `,
  text: `
    bg-transparent text-black
    border-0 shadow-none
    px-0 pb-0 mb-0
    h-full
    justify-between gap-4
    hover:bg-transparent hover:text-white hover:shadow-none hover:translate-y-0
    active:bg-transparent active:text-white active:shadow-none active:translate-y-0
    disabled:bg-neutral-neutral-2 disabled:text-neutral-neutral-3 disabled:border-neutral-neutral-3
    disabled:hover:translate-y-0 disabled:hover:shadow-none
  `,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  iconOnly: boolean,
  fullWidth: boolean,
  className: string,
  hasIconAndText: boolean
): string {
  // Text variant doesn't use size styles (no padding, no fixed height)
  const sizeClass = variant === 'text' ? '' : (iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size]);
  // Base styles use justify-between for buttons with icon+text, center for icon-only, start for text-only
  const justifyClass = variant === 'text' ? '' : (iconOnly ? 'justify-center' : (hasIconAndText ? 'justify-between' : 'justify-start'));
  
  return [
    baseStyles,
    sizeClass,
    justifyClass,
    variantStyles[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// Component
// ============================================================================

/**
 * Button component with retro lift effect
 * 
 * Supports both button and link behaviors:
 * - Without href: renders as <button>
 * - With href + asLink=true (default): renders as Next.js <Link>
 * - With href + asLink=false: renders as <button> that opens URL via window.open
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'outline', // Default to 'outline' to match Webflow .button default (transparent bg, black border)
    size = 'md',
    fullWidth = false,
    iconOnly = false,
    iconName,
    loading = false,
    children,
    className = '',
    ...rest
  } = props;

  // Determine icon size based on button size
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  // Only show loading spinner for buttons with icons
  const hasIcon = Boolean(iconName || iconOnly);
  const showLoading: boolean = Boolean(loading && hasIcon);
  const hasIconAndText = Boolean(iconName && children && !iconOnly);

  const classes = getButtonClasses(variant, size, iconOnly, fullWidth, className, hasIconAndText);

  // Render content with optional icon or loading spinner
  // When there's both icon and text, icon goes on the right (after children)
  const content = showLoading ? (
    <>
      {!iconOnly && children}
      <Spinner size={iconSize} />
    </>
  ) : iconName && hasIconAndText ? (
    <>
      {children}
      <Icon name={iconName} size={iconSize} aria-hidden="true" />
    </>
  ) : iconName ? (
    <>
      <Icon name={iconName} size={iconSize} aria-hidden="true" />
      {!iconOnly && children}
    </>
  ) : (
    children
  );

  // Check if this is a link variant
  if ('href' in props && props.href) {
    const { href, asLink = true, target, ...linkRest } = rest as ButtonAsLinkProps;

    // Use Next.js Link for navigation
    if (asLink) {
      return (
        <Link 
          href={href} 
          target={target}
          className={classes}
          {...(linkRest as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'className'>)}
        >
          {content}
        </Link>
      );
    }

    // Use window.open via button click
    const linkButtonDisabled: boolean = showLoading || Boolean((linkRest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled);
    const { disabled: _, ...linkButtonRest } = linkRest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        type="button"
        className={classes}
        onClick={() => window.open(href, target || '_self')}
        disabled={linkButtonDisabled}
        {...linkButtonRest}
      >
        {content}
      </button>
    );
  }

  // Standard button
  const buttonProps = rest as ButtonAsButtonProps;

  // Disable button when loading
  const disabled: boolean = showLoading || Boolean(buttonProps.disabled);
  const { disabled: _, ...buttonPropsWithoutDisabled } = buttonProps;

  return (
    <button className={classes} {...buttonPropsWithoutDisabled} disabled={disabled}>
      {content}
    </button>
  );
}

export default Button;
