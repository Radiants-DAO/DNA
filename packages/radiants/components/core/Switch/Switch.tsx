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
// Size presets
//
// Track uses p-[2px] for uniform inner padding.
// All math: content = trackWidth - 2(border) - 4(padding)
//           travel  = content - thumbSize
// ============================================================================

const sizes: Record<SwitchSize, { track: string; thumb: string; travel: number }> = {
  sm: {
    track: 'w-7',          // 28px → content 22px
    thumb: 'w-2.5 h-2.5',  // 10px → travel 12px
    travel: 12,
  },
  md: {
    track: 'w-9',          // 36px → content 30px
    thumb: 'w-3.5 h-3.5',  // 14px → travel 16px
    travel: 16,
  },
  lg: {
    track: 'w-11',          // 44px → content 38px
    thumb: 'w-[18px] h-[18px]', // 18px → travel 20px
    travel: 20,
  },
};

// ============================================================================
// Component
// ============================================================================

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
  const s = sizes[size];
  const switchId = id || `switch-${Math.random().toString(36).slice(2)}`;

  const handleClick = () => {
    if (!disabled) onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const track = (
    <button
      type="button"
      role="switch"
      id={switchId}
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        // layout
        'inline-flex items-center p-[2px]',
        s.track,
        // shape
        'rounded-xs border border-edge-primary',
        // depth — recessed slot
        'shadow-inset',
        // background
        checked ? 'bg-action-primary' : 'bg-surface-elevated',
        // motion
        'transition-colors duration-fast ease-default',
        // states
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        // focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1',
      ].join(' ')}
    >
      <span
        className={[
          s.thumb,
          'block rounded-xs',
          // thumb is always content-primary: ink in sun, cream in moon
          'bg-content-primary',
          // pixel-art raised shadow
          'shadow-resting',
          // motion
          'transition-transform duration-fast ease-default',
        ].join(' ')}
        style={{ transform: `translateX(${checked ? s.travel : 0}px)` }}
        aria-hidden="true"
      />
    </button>
  );

  if (!label) {
    return <div className={className}>{track}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {labelPosition === 'left' && (
        <label
          htmlFor={switchId}
          className={`font-sans text-base text-content-primary ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      )}
      {track}
      {labelPosition === 'right' && (
        <label
          htmlFor={switchId}
          className={`font-sans text-base text-content-primary ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
}

export default Switch;
