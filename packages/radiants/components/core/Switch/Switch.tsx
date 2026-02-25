'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  /** Checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Size preset */
  size?: SwitchSize;
  /** Disabled state */
  disabled?: boolean;
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Additional className */
  className?: string;
  /** ID for accessibility */
  id?: string;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<SwitchSize, { track: string; thumb: string; thumbSize: number; trackPadding: number; travel: number }> = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-3.5 h-3.5',
    thumbSize: 14,
    trackPadding: 3,
    travel: 16,
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-4 h-4',
    thumbSize: 16,
    trackPadding: 4,
    travel: 20,
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-5 h-5',
    thumbSize: 20,
    trackPadding: 4,
    travel: 24,
  },
};

// ============================================================================
// Component
// ============================================================================

/**
 * Pixel-art switch component - square corners, clear states
 */
export function Switch({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  label,
  labelPosition = 'right',
  className = '',
  id,
}: SwitchProps) {
  const styles = sizeStyles[size];
  const switchId = id || `switch-${Math.random().toString(36).slice(2)}`;

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      id={switchId}
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex items-center
        ${styles.track}
        rounded-xs
        border border-edge-primary
        transition-colors
        ${checked
          ? 'bg-action-primary'
          : 'bg-surface-muted dark:bg-surface-elevated'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-2
      `.trim()}
    >
      {/* Thumb */}
      <span
        className={`
          ${styles.thumb}
          rounded-xs
          border border-edge-primary
          transition-transform
          ${checked
            ? 'bg-ink dark:bg-cream'
            : 'bg-cream dark:bg-content-muted'
          }
        `.trim()}
        style={{
          transform: checked
            ? `translateX(${styles.travel}px)`
            : `translateX(${styles.trackPadding}px)`,
        }}
        aria-hidden="true"
      />
    </button>
  );

  if (!label) {
    return <div className={className}>{switchElement}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      {labelPosition === 'left' && (
        <label
          htmlFor={switchId}
          className={`
            font-sans text-base text-content-primary
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `.trim()}
        >
          {label}
        </label>
      )}

      {switchElement}

      {labelPosition === 'right' && (
        <label
          htmlFor={switchId}
          className={`
            font-sans text-base text-content-primary
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `.trim()}
        >
          {label}
        </label>
      )}
    </div>
  );
}

export default Switch;
