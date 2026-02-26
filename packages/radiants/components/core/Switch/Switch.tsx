'use client';

import React, { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  className?: string;
  id?: string;
}

// ============================================================================
// Font size drives all em-based internal sizing
// ============================================================================

const fontSizes: Record<SwitchSize, number> = {
  sm: 14,
  md: 17,
  lg: 21,
};

// ============================================================================
// Component
//
// Adapted from Uiverse.io (Voxybuns) with RDNA semantic tokens.
// Thumb sits above the track with a pixel-art drop shadow.
// On hover, the thumb raises higher. On check, it slides right.
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
  const [hovered, setHovered] = useState(false);
  const switchId = id || `switch-${Math.random().toString(36).slice(2)}`;
  const active = hovered && !disabled;

  const fs = fontSizes[size];

  // Raise amount in em
  const raise = active ? 0.3 : 0.2;

  const labelEl = label ? (
    <label
      htmlFor={switchId}
      className={`font-sans text-base text-content-primary select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </label>
  ) : null;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {labelPosition === 'left' && labelEl}

      <div
        className="relative inline-block"
        style={{ fontSize: fs, width: '2em', height: '1em' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hidden input for accessibility */}
        <input
          type="checkbox"
          id={switchId}
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange(!checked)}
          className="absolute opacity-0 w-0 h-0 peer"
        />

        {/* Track */}
        <div
          className="absolute inset-0 rounded-xs border border-edge-primary cursor-pointer"
          style={{
            backgroundColor: checked
              ? 'var(--color-action-primary)'
              : 'var(--color-surface-elevated)',
            transition: 'background-color 150ms cubic-bezier(0, 0, 0.2, 1)',
          }}
        />

        {/* Focus ring on track */}
        <div className="absolute inset-0 rounded-xs peer-focus-visible:ring-2 peer-focus-visible:ring-edge-focus peer-focus-visible:ring-offset-1 pointer-events-none" />

        {/* Thumb — sits above track with drop shadow */}
        <div
          className="absolute rounded-xs border border-edge-primary pointer-events-none"
          style={{
            width: '1em',
            height: '1em',
            left: -1,
            bottom: -1,
            backgroundColor: 'var(--color-surface-secondary)',
            transform: [
              checked ? 'translateX(1em)' : 'translateX(0)',
              `translateY(-${raise}em)`,
            ].join(' '),
            boxShadow: `0 ${raise}em 0 var(--color-edge-primary)`,
            transition: 'transform 150ms cubic-bezier(0, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0, 0, 0.2, 1)',
          }}
        />

        {/* Disabled overlay */}
        {disabled && (
          <div className="absolute inset-0 rounded-xs opacity-50 bg-surface-muted cursor-not-allowed" />
        )}
      </div>

      {labelPosition === 'right' && labelEl}
    </div>
  );
}

export default Switch;
