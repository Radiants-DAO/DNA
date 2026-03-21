'use client';

import React from 'react';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { buttonRootVariants, buttonFaceVariants } from '../Button/Button';
import { Icon } from '../../../icons/Icon';

// ============================================================================
// Types
// ============================================================================

type ToggleMode = 'solid' | 'flat' | 'pattern';
type ToggleTone = 'accent' | 'danger' | 'success' | 'neutral' | 'cream' | 'white' | 'info' | 'tinted';
type ToggleSize = 'sm' | 'md' | 'lg';
type ToggleRounded = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

interface ToggleProps {
  // ── Toggle-specific ──────────────────────────────────────────────────────
  /** Whether the toggle is currently pressed (controlled) */
  pressed?: boolean;
  /** Initial pressed state for uncontrolled usage */
  defaultPressed?: boolean;
  /** Callback fired when pressed state changes */
  onPressedChange?: (pressed: boolean) => void;
  /** Unique value for coordination inside a ToggleGroup */
  value?: string;

  // ── Button visual surface ─────────────────────────────────────────────────
  /** Visual mode — matches Button modes. Defaults to 'solid'. */
  mode?: ToggleMode;
  /** Color tone */
  tone?: ToggleTone;
  /** Size preset */
  size?: ToggleSize;
  /** Pixel-corner roundness */
  rounded?: ToggleRounded;
  /** Expand to fill container width */
  fullWidth?: boolean;
  /** Square button showing only the icon */
  iconOnly?: boolean;
  /** Suppress icon slot and leader line */
  textOnly?: boolean;
  /** Compact badge-like styling — uses mono font */
  compact?: boolean;
  /** Transparent at rest — fills on hover/selected */
  quiet?: boolean;
  /** Negative margins to align flush with surrounding text */
  flush?: boolean;
  /** Icon — RDNA icon name (string) or custom ReactNode */
  icon?: string | React.ReactNode;

  // ── Standard ─────────────────────────────────────────────────────────────
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * A two-state button that can be pressed (on) or not pressed (off).
 *
 * Renders using Button's visual system — inherits all modes, tones, sizes,
 * icon support, and lift effects. `pressed` maps to `data-state="selected"`,
 * which plugs into the same CSS as `Button active`.
 *
 * Uses Base UI Toggle for aria-pressed, keyboard handling, and ToggleGroup
 * coordination via the `value` prop.
 */
export function Toggle({
  pressed,
  defaultPressed = false,
  onPressedChange,
  value,
  mode = 'solid',
  tone = 'accent',
  size = 'md',
  rounded = 'xs',
  fullWidth = false,
  iconOnly = false,
  textOnly = false,
  compact = false,
  quiet = false,
  flush = false,
  icon,
  disabled = false,
  children,
  className = '',
  'aria-label': ariaLabel,
}: ToggleProps) {
  const resolvedIcon = typeof icon === 'string' ? <Icon name={icon} /> : icon;
  const isDisabled = Boolean(disabled);

  const rootClasses = buttonRootVariants({ fullWidth, disabled: isDisabled });

  const justifyClass =
    !iconOnly && fullWidth && resolvedIcon && !textOnly
      ? 'justify-between'
      : iconOnly
      ? ''
      : 'justify-start';

  const faceClasses = buttonFaceVariants({
    mode,
    rounded,
    size,
    compact,
    iconOnly,
    textOnly: textOnly || !resolvedIcon,
    fullWidth,
    className: `${justifyClass} ${className}`.trim(),
  });

  // Content construction — mirrors Button
  let content: React.ReactNode;
  if (iconOnly) {
    content = resolvedIcon || children;
  } else if (textOnly || !resolvedIcon) {
    content = children;
  } else {
    content = (
      <>
        {children}
        {children && <span className="flex-1 h-px bg-line opacity-30" />}
        {resolvedIcon}
      </>
    );
  }

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
            className={rootClasses}
            data-rdna="toggle"
            data-slot="button-root"
            data-color={tone}
            data-mode={mode}
            data-state={dataState}
            {...(quiet ? { 'data-quiet': '' } : {})}
          >
            <span
              className={faceClasses}
              data-slot="button-face"
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
          </button>
        );
      }}
    />
  );
}

export default Toggle;
