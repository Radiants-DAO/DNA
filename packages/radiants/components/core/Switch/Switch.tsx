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
    >
      <span aria-hidden="true" />
    </button>
  );

  if (!label) {
    return <div className={className}>{switchElement}</div>;
  }

  return (
    <div className={className}>
      {labelPosition === 'left' && (
        <label htmlFor={switchId}>{label}</label>
      )}
      {switchElement}
      {labelPosition === 'right' && (
        <label htmlFor={switchId}>{label}</label>
      )}
    </div>
  );
}

export default Switch;
