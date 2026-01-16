import React, { useState, useMemo } from 'react';

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

const sizeStyles: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-10 h-5',
    thumb: 'w-4 h-4',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-12 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-6',
  },
};

// Motion-aware styles using CSS custom properties
// Touch target ensures minimum interactive area for accessibility
// Transitions respect duration-scalar (instant in light mode, animated in dark mode)
const trackMotionStyles: React.CSSProperties = {
  minHeight: 'var(--touch-target-default)',
  transition: 'background-color var(--transition-fast), border-color var(--transition-fast)',
};

const thumbMotionStyles: React.CSSProperties = {
  transition: 'transform var(--transition-fast)',
};

// Focus ring styles using tokens
const focusRingStyle: React.CSSProperties = {
  outline: 'var(--focus-ring-width) solid var(--focus-ring-color)',
  outlineOffset: 'var(--focus-ring-offset)',
};

// ============================================================================
// Component
// ============================================================================

// Generate a stable ID (only once per component instance)
let idCounter = 0;

/**
 * Switch component - On/off toggle
 *
 * Features:
 * - Touch targets via min-height: var(--touch-target-default)
 * - Focus ring using tokens: --focus-ring-width, --focus-ring-offset, --focus-ring-color
 * - Motion tokens for transitions (respects duration-scalar)
 */
export function Switch({ checked, onChange, size = 'md', disabled = false, label, labelPosition = 'right', className = '', id }: SwitchProps) {
  const styles = sizeStyles[size];
  const switchId = React.useMemo(() => id || `switch-${++idCounter}`, [id]);
  const [isFocused, setIsFocused] = useState(false);

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

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Compute dynamic track styles with focus ring
  const trackDynamicStyles = useMemo((): React.CSSProperties => {
    if (isFocused && !disabled) {
      return {
        ...trackMotionStyles,
        ...focusRingStyle,
      };
    }
    return trackMotionStyles;
  }, [isFocused, disabled]);

  const switchElement = (
    <button
      type="button"
      role="switch"
      id={switchId}
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={trackDynamicStyles}
      className={`
        relative inline-flex items-center
        ${styles.track}
        rounded-full
        border border-edge-primary
        ${checked ? 'bg-surface-tertiary' : 'bg-surface-primary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none
      `.trim()}
    >
      {/* Thumb */}
      <span
        style={thumbMotionStyles}
        className={`
          ${styles.thumb}
          rounded-full
          bg-surface-secondary
          border border-edge-primary
          transform
          ${checked ? styles.translate : 'translate-x-0.5'}
        `.trim()}
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
            font-mondwest text-base text-content-primary
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
            font-mondwest text-base text-content-primary
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
export type { SwitchSize, SwitchProps };
