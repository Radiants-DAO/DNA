'use client';

import React, { forwardRef } from 'react';

// ============================================================================
// Types
// ============================================================================

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Additional classes for container */
  className?: string;
}

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Additional classes for container */
  className?: string;
}

// ============================================================================
// Checkmark Icon (inline SVG)
// ============================================================================

function CheckmarkIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13.5 4.5L6 12L2.5 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// Checkbox Component
// ============================================================================

/**
 * Retro-styled checkbox
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = '', disabled, ...props },
  ref
) {
  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className="relative">
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        {/* Custom checkbox visual */}
        <div
          className={`
            w-5 h-5
            bg-warm-cloud
            border border-black
            rounded-xs
            peer-checked:bg-sun-yellow
            peer-focus:ring-2 peer-focus:ring-sun-yellow peer-focus:ring-offset-1
            flex items-center justify-center
          `}
        />
        {/* Checkmark - visible when checkbox is checked */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
          <CheckmarkIcon className="text-black" />
        </div>
      </div>
      {label && (
        <span className="font-mondwest text-base text-black select-none">
          {label}
        </span>
      )}
    </label>
  );
});

// ============================================================================
// Radio Component
// ============================================================================

/**
 * Retro-styled radio button
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className = '', disabled, ...props },
  ref
) {
  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className="relative">
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        {/* Custom radio visual */}
        <div
          className={`
            w-5 h-5
            bg-warm-cloud
            border border-black
            rounded-full
            peer-checked:bg-sun-yellow
            peer-focus:ring-2 peer-focus:ring-sun-yellow peer-focus:ring-offset-1
            flex items-center justify-center
          `}
        >
          {/* Inner dot placeholder */}
        </div>
        {/* Inner dot when checked */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full opacity-0 peer-checked:opacity-100 pointer-events-none"
        />
      </div>
      {label && (
        <span className="font-mondwest text-base text-black select-none">
          {label}
        </span>
      )}
    </label>
  );
});

export default Checkbox;
