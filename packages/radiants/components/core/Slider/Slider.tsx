'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

type SliderSize = 'sm' | 'md' | 'lg';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  disabled?: boolean;
  showValue?: boolean;
  label?: string;
  className?: string;
}

// ============================================================================
// Size map
// ============================================================================

const sizeStyles: Record<SliderSize, string> = {
  sm: 'h-9',
  md: 'h-10',
  lg: 'h-12',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Slider — Poolsuite-style retro hardware.
 *
 * Left of handle  : raised cream block (border-bottom 2px → depth/press effect).
 * Right of handle : dithered black dot pattern.
 * Thumb           : hidden — position shown by where the fill ends.
 */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = 'md',
  disabled = false,
  showValue = false,
  label,
  className = '',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const trackClass = sizeStyles[size];

  const percentage = ((value - min) / (max - min)) * 100;

  const snapToStep = useCallback((val: number) => {
    const stepped = Math.round((val - min) / step) * step + min;
    return Math.max(min, Math.min(max, stepped));
  }, [min, max, step]);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snapToStep(min + pct * (max - min));
  }, [min, max, value, snapToStep]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    onChange(getValueFromPosition(e.clientX));
  }, [disabled, getValueFromPosition, onChange]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => onChange(getValueFromPosition(e.clientX));
    const onUp   = () => setIsDragging(false);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
  }, [isDragging, getValueFromPosition, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let v = value;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp':   v = Math.min(max, v + step); break;
      case 'ArrowLeft':  case 'ArrowDown': v = Math.max(min, v - step); break;
      case 'Home': v = min; break;
      case 'End':  v = max; break;
      default: return;
    }
    e.preventDefault();
    onChange(v);
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label    && <span className="font-sans text-base text-content-primary">{label}</span>}
          {showValue && <span className="font-sans text-sm text-content-muted">{value}</span>}
        </div>
      )}

      {/* ── Track — flex row, same pattern as scrollbar thumb ── */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        className={[
          'relative w-full slider-track',
          trackClass,
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-edge-focus focus-visible:ring-offset-1',
        ].join(' ')}
      >
        {/* Handle — scales from left, exact scrollbar thumb styles */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none rounded"
          style={{
            width: `max(${percentage}%, 2.25rem)`,
            background: 'var(--color-surface-primary)',
            margin: '0.375rem 0',
            boxShadow: 'inset 0 0 0 1px var(--color-edge-primary)',
          }}
        />
      </div>
    </div>
  );
}

export default Slider;
