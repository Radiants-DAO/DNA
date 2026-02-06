'use client';

import React, { useState, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export type TimeFormat = 'numeric' | 'text';
export type Placement = 'watermark' | 'inline' | 'block';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export interface CountdownTimerProps {
  /** Target date to count down to (ISO string or timestamp) */
  targetDate: string | number;
  /** Display format */
  format?: TimeFormat;
  /** Visual placement style */
  placement?: Placement;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Label to show before the countdown */
  label?: string;
  /** Text to show when countdown expires */
  expiredText?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Utilities
// =============================================================================

function getTimeLeft(targetDate: number): TimeLeft {
  const now = Date.now();
  const total = Math.max(0, targetDate - now);

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

// =============================================================================
// Styles
// =============================================================================

const baseStyles = `
  font-ui uppercase tracking-wider
`;

const sizeStyles = {
  sm: 'text-[0.75em]',
  md: 'text-[1em]',
  lg: 'text-[1.5em]',
};

const placementStyles = {
  watermark: `
    fixed bottom-[1em] right-[1em] z-50
    text-content-tertiary/50
    text-[2em] font-heading
  `,
  inline: `
    inline-flex items-center gap-[0.5em]
    text-content-secondary
  `,
  block: `
    flex flex-col items-center gap-[0.25em]
    text-content-primary
  `,
};

// =============================================================================
// CountdownDisplay Component
// =============================================================================

interface CountdownDisplayProps {
  timeLeft: TimeLeft;
  format: TimeFormat;
  size: 'sm' | 'md' | 'lg';
  expiredText: string;
}

function CountdownDisplay({ timeLeft, format, size, expiredText }: CountdownDisplayProps) {
  const isExpired = timeLeft.total <= 0;

  if (isExpired) {
    return <span className="text-action-primary animate-pulse">{expiredText}</span>;
  }

  if (format === 'numeric') {
    const display = `${padZero(timeLeft.days)}:${padZero(timeLeft.hours)}:${padZero(timeLeft.minutes)}:${padZero(timeLeft.seconds)}`;
    return (
      <span className={`tabular-nums ${sizeStyles[size]}`}>
        {display}
      </span>
    );
  }

  // Text format
  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
  if (timeLeft.minutes > 0 && timeLeft.days === 0) parts.push(`${timeLeft.minutes}m`);
  if (timeLeft.seconds > 0 && timeLeft.days === 0 && timeLeft.hours === 0) parts.push(`${timeLeft.seconds}s`);

  return (
    <span className={sizeStyles[size]}>
      {parts.join(' ')} remaining
    </span>
  );
}

// =============================================================================
// CountdownTimer Component
// =============================================================================

export function CountdownTimer({
  targetDate,
  format = 'numeric',
  placement = 'inline',
  size = 'md',
  label,
  expiredText = 'EXPIRED',
  className = '',
}: CountdownTimerProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate).getTime() : targetDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const styles = [
    baseStyles,
    placementStyles[placement],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles}>
      {label && (
        <span className="text-content-tertiary text-[0.75em] mr-[0.5em]">
          {label}
        </span>
      )}
      <CountdownDisplay
        timeLeft={timeLeft}
        format={format}
        size={size}
        expiredText={expiredText}
      />
    </div>
  );
}

export default CountdownTimer;
