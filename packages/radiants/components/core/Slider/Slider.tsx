'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

type SliderSize = 'sm' | 'md' | 'lg';

interface SliderProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Size preset */
  size?: SliderSize;
  /** Disabled state */
  disabled?: boolean;
  /** Show value label */
  showValue?: boolean;
  /** Label text */
  label?: string;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Dither SVG pattern (2×2 checkerboard → ordered dither look)
// ============================================================================

const DITHER_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='currentColor'/%3E%3Crect x='2' y='2' width='2' height='2' fill='currentColor'/%3E%3C/svg%3E")`;

// ============================================================================
// Size map
// ============================================================================

const sizeStyles: Record<SliderSize, { track: string }> = {
  sm: { track: 'h-5' },
  md: { track: 'h-6' },
  lg: { track: 'h-8' },
};

// ============================================================================
// Component
// ============================================================================

/**
 * Slider — retro hardware style.
 * Left of thumb: solid filled. Right of thumb: dithered dot pattern.
 * Thumb: thin vertical rule.
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
  const styles = sizeStyles[size];

  const percentage = ((value - min) / (max - min)) * 100;

  const snapToStep = useCallback((val: number) => {
    const stepped = Math.round((val - min) / step) * step + min;
    return Math.max(min, Math.min(max, stepped));
  }, [min, max, step]);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snapToStep(min + percent * (max - min));
  }, [min, max, value, snapToStep]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    onChange(getValueFromPosition(e.clientX));
  }, [disabled, getValueFromPosition, onChange]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (e: PointerEvent) => onChange(getValueFromPosition(e.clientX));
    const handlePointerUp = () => setIsDragging(false);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, getValueFromPosition, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let newValue = value;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp':   newValue = Math.min(max, value + step); break;
      case 'ArrowLeft':  case 'ArrowDown': newValue = Math.max(min, value - step); break;
      case 'Home': newValue = min; break;
      case 'End':  newValue = max; break;
      default: return;
    }
    e.preventDefault();
    onChange(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {/* Label & Value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="font-mondwest text-base text-content-primary">{label}</span>
          )}
          {showValue && (
            <span className="font-mondwest text-sm text-content-primary/60">{value}</span>
          )}
        </div>
      )}

      {/* Track */}
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
        className={`
          relative w-full overflow-hidden
          ${styles.track}
          border border-edge-primary
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-1 focus:ring-edge-focus
        `.trim()}
      >
        {/* Filled portion — solid */}
        <div
          className="absolute inset-y-0 left-0 bg-action-primary pointer-events-none"
          style={{ width: `${percentage}%` }}
        />

        {/* Unfilled portion — dither pattern */}
        <div
          className="absolute inset-y-0 right-0 text-edge-primary/30 pointer-events-none"
          style={{
            width: `${100 - percentage}%`,
            backgroundImage: DITHER_PATTERN,
            backgroundSize: '4px 4px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Thumb — thin vertical rule */}
        <div
          className="absolute inset-y-0 w-[2px] bg-edge-primary pointer-events-none"
          style={{ left: `calc(${percentage}% - 1px)` }}
        />
      </div>
    </div>
  );
}

export default Slider;
