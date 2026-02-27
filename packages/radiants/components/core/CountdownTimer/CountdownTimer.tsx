'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

type CountdownVariant = 'default' | 'compact' | 'large';
type CountdownStatus = 'active' | 'ended' | 'upcoming';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface CountdownTimerProps {
  /** Target timestamp (Unix ms or Date) */
  endTime: number | Date;
  /** Optional start time for "upcoming" status */
  startTime?: number | Date;
  /** Visual variant */
  variant?: CountdownVariant;
  /** Label text shown above timer */
  label?: string;
  /** Callback when countdown reaches zero */
  onComplete?: () => void;
  /** Custom ended message */
  endedMessage?: string;
  /** Custom upcoming message */
  upcomingMessage?: string;
  /** Show days segment */
  showDays?: boolean;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  text-center
`;

const variantStyles: Record<CountdownVariant, {
  container: string;
  label: string;
  timer: string;
  segment: string;
  value: string;
  unit: string;
  separator: string;
}> = {
  default: {
    container: 'p-4 bg-surface-primary border border-edge-primary rounded-md',
    label: 'font-mono text-sm text-content-muted mb-2',
    timer: 'flex items-center justify-center gap-1',
    segment: 'flex flex-col items-center min-w-[3rem]',
    value: 'font-heading text-2xl text-content-primary tabular-nums',
    unit: 'font-mono text-xs text-content-muted uppercase mt-0.5',
    separator: 'font-heading text-xl text-content-muted self-start mt-1',
  },
  compact: {
    container: 'px-3 py-2 bg-surface-primary border border-edge-primary rounded-sm',
    label: 'font-mono text-xs text-content-muted mb-1',
    timer: 'flex items-center justify-center gap-0.5',
    segment: 'flex flex-col items-center min-w-[2rem]',
    value: 'font-heading text-sm text-content-primary tabular-nums',
    unit: 'font-mono text-xs text-content-muted uppercase',
    separator: 'font-heading text-sm text-content-muted self-start',
  },
  large: {
    container: 'p-6 bg-surface-primary border border-edge-primary rounded-md shadow-raised',
    label: 'font-mono text-sm text-content-muted mb-3',
    timer: 'flex items-center justify-center gap-2',
    segment: 'flex flex-col items-center min-w-[4rem] bg-surface-muted border border-edge-primary rounded-sm px-3 py-2',
    value: 'font-heading text-3xl text-content-primary tabular-nums',
    unit: 'font-mono text-sm text-content-muted uppercase mt-1',
    separator: 'font-heading text-2xl text-content-muted self-center',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getTimeRemaining(endTime: number | Date): TimeRemaining {
  const end = typeof endTime === 'number' ? endTime : endTime.getTime();
  const total = Math.max(0, end - Date.now());

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

function getStatus(
  endTime: number | Date,
  startTime?: number | Date
): CountdownStatus {
  const now = Date.now();
  const end = typeof endTime === 'number' ? endTime : endTime.getTime();
  const start = startTime
    ? typeof startTime === 'number'
      ? startTime
      : startTime.getTime()
    : now;

  if (now < start) return 'upcoming';
  if (now >= end) return 'ended';
  return 'active';
}

function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

// ============================================================================
// Component
// ============================================================================

/**
 * CountdownTimer component for auction countdowns
 *
 * Features:
 * - Live countdown with days/hours/mins/secs
 * - Three size variants (compact, default, large)
 * - Automatic status detection (active, ended, upcoming)
 * - Callback on completion
 */
export function CountdownTimer({
  endTime,
  startTime,
  variant = 'default',
  label,
  onComplete,
  endedMessage = 'Ended',
  upcomingMessage = 'Starting soon',
  showDays = true,
  className = '',
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    getTimeRemaining(endTime)
  );
  const [status, setStatus] = useState<CountdownStatus>(() =>
    getStatus(endTime, startTime)
  );

  const updateTime = useCallback(() => {
    const newTime = getTimeRemaining(endTime);
    const newStatus = getStatus(endTime, startTime);

    setTimeRemaining(newTime);
    setStatus(newStatus);

    if (newStatus === 'ended' && onComplete) {
      onComplete();
    }
  }, [endTime, startTime, onComplete]);

  useEffect(() => {
    updateTime();

    if (status === 'ended') return;

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime, status]);

  const styles = variantStyles[variant];

  // Render ended state
  if (status === 'ended') {
    return (
      <div className={`${baseStyles} ${styles.container} ${className}`}>
        {label && <p className={styles.label}>{label}</p>}
        <p className={`font-heading ${variant === 'large' ? 'text-xl' : variant === 'compact' ? 'text-sm' : 'text-lg'} text-content-muted`}>
          {endedMessage}
        </p>
      </div>
    );
  }

  // Render upcoming state
  if (status === 'upcoming' && startTime) {
    const startRemaining = getTimeRemaining(startTime);
    return (
      <div className={`${baseStyles} ${styles.container} ${className}`}>
        <p className={styles.label}>Starts in</p>
        <div className={styles.timer}>
          {showDays && startRemaining.days > 0 && (
            <>
              <div className={styles.segment}>
                <span className={styles.value}>{startRemaining.days}</span>
                <span className={styles.unit}>days</span>
              </div>
              <span className={styles.separator}>:</span>
            </>
          )}
          <div className={styles.segment}>
            <span className={styles.value}>{padZero(startRemaining.hours)}</span>
            <span className={styles.unit}>hrs</span>
          </div>
          <span className={styles.separator}>:</span>
          <div className={styles.segment}>
            <span className={styles.value}>{padZero(startRemaining.minutes)}</span>
            <span className={styles.unit}>min</span>
          </div>
          <span className={styles.separator}>:</span>
          <div className={styles.segment}>
            <span className={styles.value}>{padZero(startRemaining.seconds)}</span>
            <span className={styles.unit}>sec</span>
          </div>
        </div>
      </div>
    );
  }

  // Render active countdown
  return (
    <div className={`${baseStyles} ${styles.container} ${className}`}>
      {label && <p className={styles.label}>{label}</p>}
      <div className={styles.timer}>
        {showDays && timeRemaining.days > 0 && (
          <>
            <div className={styles.segment}>
              <span className={styles.value}>{timeRemaining.days}</span>
              <span className={styles.unit}>days</span>
            </div>
            <span className={styles.separator}>:</span>
          </>
        )}
        <div className={styles.segment}>
          <span className={styles.value}>{padZero(timeRemaining.hours)}</span>
          <span className={styles.unit}>hrs</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.segment}>
          <span className={styles.value}>{padZero(timeRemaining.minutes)}</span>
          <span className={styles.unit}>min</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.segment}>
          <span className={styles.value}>{padZero(timeRemaining.seconds)}</span>
          <span className={styles.unit}>sec</span>
        </div>
      </div>
    </div>
  );
}

export default CountdownTimer;
