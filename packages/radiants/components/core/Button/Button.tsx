'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Expand to fill container width */
  fullWidth?: boolean;
  /** @deprecated Use IconButton component instead */
  iconOnly?: boolean;
  /** @deprecated Use LoadingButton component instead */
  loading?: boolean;
  /** Button content (optional when iconOnly is true) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Icon slot - render your icon component here */
  icon?: React.ReactNode;
  /** Loading indicator slot - render your spinner here */
  loadingIndicator?: React.ReactNode;
}

interface ButtonAsButtonProps extends BaseButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  /** URL for navigation - when provided, button can act as a link */
  href?: undefined;
}

interface ButtonAsLinkProps extends BaseButtonProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> {
  /** URL for navigation - renders as anchor element */
  href: string;
  /** Whether to render as anchor (true) or use window.open (false) */
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
 * - Retro lift effect with box-shadow
 * - NO transitions (instant state changes)
 */
const baseStyles = `
  inline-flex items-center
  font-heading uppercase
  whitespace-nowrap
  cursor-pointer select-none
  rounded-sm
  shadow-btn
  hover:-translate-y-0.5
  hover:shadow-btn-hover
  active:translate-y-0.5
  active:shadow-none
  disabled:opacity-50 disabled:cursor-not-allowed
  disabled:hover:translate-y-0 disabled:hover:shadow-btn
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
`;

/**
 * Size presets
 * All buttons use h-8 (2rem) height for consistency
 * Text sizes: sm=12px, md=12px, lg=14px
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-3',
  md: 'h-8 px-3 text-xs gap-3',
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
 * Variant color schemes using semantic tokens
 * - primary: action background, primary text
 * - secondary: secondary surface, inverted text, inverts on hover
 * - outline: transparent background, primary border, fills on hover
 * - ghost: no border, subtle hover effect
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    border border-edge-primary
    bg-action-primary text-action-secondary
    hover:bg-action-primary
    active:bg-action-primary
  `,
  secondary: `
    border border-edge-primary
    bg-surface-secondary text-content-inverted
    hover:bg-surface-primary hover:text-content-primary
    active:bg-action-primary active:text-content-primary
  `,
  outline: `
    border border-edge-primary
    bg-transparent text-content-primary
    shadow-none
    hover:bg-surface-muted hover:!translate-y-0 hover:shadow-none
    active:bg-action-primary active:!translate-y-0 active:shadow-none
  `,
  ghost: `
    border border-edge-primary
    bg-surface-primary text-content-heading
    shadow-none
    hover:bg-sun-yellow hover:text-content-heading hover:shadow-none hover:translate-y-0
    active:bg-action-primary active:text-content-heading active:translate-y-0 active:shadow-none
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
  hasIcon: boolean
): string {
  // Determine justify class:
  // - iconOnly: always center
  // - fullWidth with icon: justify-between (spread text and icon)
  // - fullWidth without icon: justify-start
  // - regular button: justify-start
  let justifyClass = 'justify-start';
  if (iconOnly) {
    justifyClass = 'justify-center';
  } else if (fullWidth && hasIcon) {
    justifyClass = 'justify-between';
  }

  return [
    baseStyles,
    iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size],
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
 * - With href + asLink=true (default): renders as <a>
 * - With href + asLink=false: renders as <button> that opens URL via window.open
 *
 * Icon and loading indicator are provided via slots:
 * - icon: Pass your icon component (renders on the right)
 * - loadingIndicator: Pass your spinner component (replaces icon when loading)
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    iconOnly = false,
    icon,
    loadingIndicator,
    loading = false,
    children,
    className = '',
    ...rest
  } = props;

  // Only show loading indicator for buttons with icons
  const hasIcon = Boolean(icon || iconOnly);
  const showLoading: boolean = Boolean(loading && hasIcon && loadingIndicator);

  const classes = getButtonClasses(variant, size, iconOnly, fullWidth, className, hasIcon);

  // Render content with optional icon or loading indicator
  // Icons appear on the right side of the button text
  const content = showLoading ? (
    <>
      {!iconOnly && children}
      {loadingIndicator}
    </>
  ) : icon ? (
    <>
      {!iconOnly && children}
      {icon}
    </>
  ) : (
    children
  );

  // Check if this is a link variant
  if ('href' in props && props.href) {
    const { href, asLink = true, target, ...linkRest } = rest as ButtonAsLinkProps;

    // Use anchor element for navigation
    if (asLink) {
      return (
        <a
          href={href}
          target={target}
          className={classes}
          {...(linkRest as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'className'>)}
        >
          {content}
        </a>
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

// ============================================================================
// IconButton — Explicit variant for icon-only buttons
// ============================================================================

interface IconButtonProps extends Omit<BaseButtonProps, 'iconOnly' | 'children'>, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  /** The icon to display */
  icon: React.ReactNode;
  /** Accessible label (required for icon-only buttons) */
  'aria-label': string;
}

/**
 * IconButton — A square button that shows only an icon.
 * Explicit variant of Button for icon-only use cases.
 */
export function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: IconButtonProps) {
  const sizeClasses: Record<string, string> = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${sizeClasses[size]} p-0 flex items-center justify-center ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </Button>
  );
}

// ============================================================================
// LoadingButton — Explicit variant for async action buttons
// ============================================================================

interface LoadingButtonProps extends Omit<BaseButtonProps, 'loading' | 'disabled' | 'loadingIndicator'> {
  /** Whether the async action is in progress */
  isLoading: boolean;
  /** Text shown during loading (defaults to children) */
  loadingText?: React.ReactNode;
  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;
}

/**
 * LoadingButton — A button with built-in loading state.
 * Explicit variant of Button for async actions.
 */
export function LoadingButton({
  isLoading,
  loadingText,
  loadingIndicator,
  children,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={isLoading}
      aria-busy={isLoading}
      className={`relative ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          {loadingIndicator || (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
        </span>
      )}
      <span className={isLoading ? 'invisible' : ''}>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </Button>
  );
}

export default Button;
