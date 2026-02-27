'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

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
// CVA Variants
// ============================================================================

export const buttonVariants = cva(
  `inline-flex items-center font-heading uppercase whitespace-nowrap cursor-pointer select-none
   rounded-sm
   disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:hover:shadow-none
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1`,
  {
    variants: {
      variant: {
        primary: `border border-edge-primary bg-action-primary text-action-secondary shadow-none
                  hover:-translate-y-1 hover:shadow-lifted active:-translate-y-0.5 active:shadow-resting`,
        secondary: `border border-edge-primary bg-surface-primary text-content-primary shadow-none
                    hover:-translate-y-1 hover:shadow-lifted
                    active:-translate-y-0.5 active:shadow-resting`,
        outline: `border border-edge-primary bg-transparent text-content-primary shadow-none
                  hover:-translate-y-0.5 hover:shadow-resting hover:bg-surface-muted
                  active:translate-y-0 active:shadow-none active:bg-action-primary`,
        ghost: `border border-transparent bg-transparent text-content-heading shadow-none
                hover:border-edge-primary hover:-translate-y-0.5 hover:shadow-resting hover:bg-action-primary
                active:translate-y-0 active:shadow-none active:bg-action-primary`,
      },
      size: {
        sm: 'h-6 text-xs gap-2',
        md: 'h-8 text-sm gap-3',
        lg: 'h-10 text-base gap-3',
      },
      iconOnly: {
        true: 'p-0 justify-center',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      { iconOnly: false, size: 'sm', className: 'px-2' },
      { iconOnly: false, size: 'md', className: 'px-3' },
      { iconOnly: false, size: 'lg', className: 'px-4' },
      { iconOnly: true, size: 'sm', className: 'w-6' },
      { iconOnly: true, size: 'md', className: 'w-8' },
      { iconOnly: true, size: 'lg', className: 'w-10' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
      fullWidth: false,
    },
  }
);

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

  // Determine justify class:
  // - iconOnly: handled by compoundVariants (justify-center)
  // - fullWidth with icon: justify-between (spread text and icon)
  // - fullWidth without icon: justify-start
  // - regular button: justify-start
  let justifyClass = 'justify-start';
  if (iconOnly) {
    justifyClass = '';
  } else if (fullWidth && hasIcon) {
    justifyClass = 'justify-between';
  }

  const classes = buttonVariants({
    variant,
    size,
    iconOnly: iconOnly || false,
    fullWidth,
    className: `${justifyClass} ${className}`.trim(),
  });

  // Render content with optional icon or loading indicator
  // With icon: text → leader line → icon (menubar pattern)
  const content = showLoading ? (
    <>
      {!iconOnly && children}
      {!iconOnly && <span className="flex-1 h-px bg-edge-primary opacity-30" />}
      {loadingIndicator}
    </>
  ) : icon ? (
    <>
      {!iconOnly && children}
      {!iconOnly && <span className="flex-1 h-px bg-edge-primary opacity-30" />}
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
          data-variant={variant}
          data-size={size}
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
        data-variant={variant}
        data-size={size}
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
    <button className={classes} data-variant={variant} data-size={size} {...buttonPropsWithoutDisabled} disabled={disabled}>
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
  return (
    <Button variant={variant} size={size} iconOnly className={className} aria-label={ariaLabel} {...props}>
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
