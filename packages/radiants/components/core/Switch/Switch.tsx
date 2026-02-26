'use client';

import React, { useEffect, useId, useState } from 'react';

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
// Dark mode detection hook
// ============================================================================

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const update = () => {
      setIsDark(
        el.classList.contains('dark') ||
        (!el.classList.contains('light') && mq.matches)
      );
    };

    update();
    mq.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });

    return () => {
      mq.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return isDark;
}

// ============================================================================
// Easing
// ============================================================================

const ease = 'cubic-bezier(0, 0, 0.2, 1)';

// ============================================================================
// Component
//
// Adapted from Uiverse.io (Voxybuns) with RDNA semantic tokens.
//
// Sun Mode:  Thumb sits above the track with a pixel-art drop shadow.
//            On hover, the thumb raises higher.
// Moon Mode: Thumb stays flat. On hover, gains ambient glow + yellow border.
//            Matches the atmospheric dark-mode interaction pattern.
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
  const reactId = useId();
  const switchId = id || reactId;
  const active = hovered && !disabled;
  const isDark = useDarkMode();

  const fs = fontSizes[size];

  // Sun Mode: flat at rest, raise on hover
  // Moon Mode: always flat (glow replaces raise)
  const raise = !isDark && active ? 0.25 : 0;

  // -- Thumb styles per mode --------------------------------------------------

  const thumbBorder = isDark
    ? active
      ? 'var(--color-edge-focus)'    // yellow border on hover
      : 'var(--color-edge-primary)'  // subtle cream@20% at rest
    : 'var(--color-ink)';            // solid ink in Sun Mode

  const thumbShadow = isDark
    ? active
      ? '0 0 8px rgba(252, 225, 132, 0.3), 0 0 16px rgba(252, 225, 132, 0.15)'
      : 'none'
    : `0 ${raise}em 0 var(--color-ink)`;

  // -- Track styles per mode --------------------------------------------------

  const trackShadow = isDark && checked && active
    ? '0 0 6px rgba(252, 225, 132, 0.2)'
    : 'none';

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

      <label
        htmlFor={switchId}
        className={`relative inline-block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ fontSize: fs, width: '2em', height: '1em', marginBottom: '0.35em' }}
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
          className={`absolute inset-0 rounded-xs border ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          style={{
            backgroundColor: checked
              ? 'var(--color-action-primary)'
              : 'var(--color-ink)',
            borderColor: 'var(--color-edge-primary)',
            boxShadow: trackShadow,
            transition: `background-color 150ms ${ease}, box-shadow 150ms ${ease}`,
          }}
        />

        {/* Focus ring on track */}
        <div className="absolute inset-0 rounded-xs peer-focus-visible:ring-2 peer-focus-visible:ring-edge-focus peer-focus-visible:ring-offset-1 pointer-events-none" />

        {/* Thumb */}
        <div
          className="absolute rounded-xs border pointer-events-none"
          style={{
            width: '1em',
            height: '1em',
            left: 0,
            bottom: 1,
            backgroundColor: 'var(--color-cream)',
            borderColor: thumbBorder,
            transform: [
              checked ? 'translateX(1em)' : 'translateX(0)',
              `translateY(-${raise}em)`,
            ].join(' '),
            boxShadow: thumbShadow,
            transition: `transform 150ms ${ease}, box-shadow 150ms ${ease}, border-color 150ms ${ease}`,
          }}
        />

        {/* Disabled overlay */}
        {disabled && (
          <div className="absolute inset-0 rounded-xs opacity-50 bg-surface-muted" />
        )}
      </label>

      {labelPosition === 'right' && labelEl}
    </div>
  );
}

export default Switch;
