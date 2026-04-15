'use client';

import { useState, useRef, useCallback } from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// Stepper — Decrement button | editable value | Increment button
// Supports 4 variants: Basic, With Presets, Auto/Keyword, Multi-Axis (via label)
// =============================================================================

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  formatValue?: (v: number) => string;
  parseValue?: (s: string) => number;
  suffix?: React.ReactNode;
  presets?: number[];
  keywordValue?: string;
  className?: string;
}

const buttonVariants = cva(
  'flex items-center justify-center font-mono outline-none transition-colors duration-fast',
  {
    variants: {
      size: {
        sm: 'size-5 text-xs',
        md: 'size-6 text-sm',
        lg: 'size-7 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled = false,
  size = 'md',
  formatValue,
  parseValue,
  suffix,
  presets,
  keywordValue,
  className = '',
}: StepperProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);
  const atMin = value <= min;
  const atMax = value >= max;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(displayValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    const parsed = parseValue ? parseValue(editText) : Number(editText);
    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed, min, max));
    }
  }, [editText, parseValue, onChange, min, max]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitEdit();
        inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditText(displayValue);
        inputRef.current?.blur();
      }
    },
    [commitEdit, displayValue],
  );

  const startEditing = useCallback(() => {
    if (keywordValue || disabled) return;
    setEditText(displayValue);
    setIsEditing(true);
    // Focus after React renders the input
    requestAnimationFrame(() => inputRef.current?.select());
  }, [keywordValue, disabled, displayValue]);

  const valueFontSize =
    size === 'sm' ? 'text-[0.625rem]' : size === 'lg' ? 'text-sm' : 'text-xs';

  const glowStyle = { textShadow: '0 0 8px var(--color-ctrl-glow)' };

  return (
    <div
      data-rdna="ctrl-stepper"
      className={[
        'inline-flex items-stretch gap-[--ctrl-cell-gap] select-none',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Label cell — axis label like X, Y, W, H, GAP */}
      {label && (
        <span
          className={[
            'flex items-center justify-center font-mono uppercase tracking-wider px-1.5 min-w-6',
            'bg-ctrl-cell-bg text-ctrl-text-active min-h-[--ctrl-row-height]',
            valueFontSize,
          ].join(' ')}
          style={glowStyle}
        >
          {label}
        </span>
      )}

      {/* Decrement button */}
      <button
        type="button"
        disabled={disabled || atMin}
        onClick={() => onChange(clamp(value - step, min, max))}
        aria-label="Decrease"
        className={[
          buttonVariants({ size }),
          'bg-ctrl-cell-bg text-ctrl-label hover:text-ctrl-value',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
          atMin && 'opacity-30 pointer-events-none',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        −
      </button>

      {/* Value field — editable input, or keyword display */}
      {keywordValue ? (
        <span
          className={[
            'flex-1 flex items-center justify-center font-mono uppercase tracking-wider px-2',
            'bg-ctrl-cell-bg text-ctrl-text-active min-h-[--ctrl-row-height]',
            valueFontSize,
          ].join(' ')}
          style={glowStyle}
        >
          {keywordValue}
        </span>
      ) : isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className={[
            'flex-1 min-w-8 text-center font-mono tabular-nums px-2 outline-none',
            'bg-ctrl-cell-bg text-ctrl-text-active min-h-[--ctrl-row-height]',
            valueFontSize,
          ].join(' ')}
          style={glowStyle}
        />
      ) : (
        <span
          role="textbox"
          tabIndex={0}
          onClick={startEditing}
          onFocus={startEditing}
          className={[
            'flex-1 flex items-center justify-center font-mono tabular-nums px-2 cursor-text',
            'bg-ctrl-cell-bg text-ctrl-text-active min-h-[--ctrl-row-height]',
            valueFontSize,
          ].join(' ')}
          style={glowStyle}
        >
          {displayValue}
        </span>
      )}

      {/* Increment button */}
      <button
        type="button"
        disabled={disabled || atMax}
        onClick={() => onChange(clamp(value + step, min, max))}
        aria-label="Increase"
        className={[
          buttonVariants({ size }),
          'bg-ctrl-cell-bg text-ctrl-label hover:text-ctrl-value',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
          atMax && 'opacity-30 pointer-events-none',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        +
      </button>

      {/* Suffix slot — unit dropdown or other trailing content */}
      {suffix}

      {/* Preset buttons */}
      {presets && presets.length > 0 && (
        <>
          {presets.map((preset) => {
            const isActive = value === preset;
            return (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                onClick={() => onChange(clamp(preset, min, max))}
                className={[
                  'flex items-center justify-center font-mono px-1.5',
                  'bg-ctrl-cell-bg min-h-[--ctrl-row-height] transition-colors duration-fast',
                  isActive ? 'text-ctrl-text-active' : 'text-ctrl-label hover:text-ctrl-value',
                  valueFontSize,
                ].join(' ')}
                style={isActive ? glowStyle : undefined}
              >
                {preset}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
