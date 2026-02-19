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
 * Left of thumb : transparent (background shows through).
 * Right of thumb: dense 2×2 dither dot pattern in black.
 * Thumb          : thin 2px vertical rule.
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
    const onMove = (e: PointerEvent) => onChange(getValueFromPosition(e.clientX));
    const onUp = () => setIsDragging(false);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
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
          {label && <span className="font-mondwest text-base text-content-primary">{label}</span>}
          {showValue && <span className="font-mondwest text-sm text-content-primary/60">{value}</span>}
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
          border border-black
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-1 focus:ring-black focus:ring-offset-1
        `.trim()}
      >
        {/* Left of thumb — transparent, background shows through */}

        {/* Right of thumb — dither pattern, hardcoded black dots */}
        <div
          className="absolute inset-y-0 right-0 pointer-events-none"
          style={{
            width: `${100 - percentage}%`,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%230f0e0c'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%230f0e0c'/%3E%3C/svg%3E")`,
            backgroundSize: '4px 4px',
          }}
        />

        {/* Thumb — 2px vertical rule */}
        <div
          className="absolute inset-y-0 w-[2px] bg-black pointer-events-none"
          style={{ left: `calc(${percentage}% - 1px)` }}
        />
      </div>
    </div>
  );
}

export default Slider;
