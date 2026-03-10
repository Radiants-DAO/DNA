'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cva } from 'class-variance-authority';

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
// CVA Variants (multi-slot)
// ============================================================================

const containerVariants = cva('text-center', {
  variants: {
    variant: {
      default: 'p-4 bg-surface-primary border border-edge-primary rounded-md',
      compact: 'px-3 py-2 bg-surface-primary border border-edge-primary rounded-sm',
      large: 'p-6 bg-surface-primary border border-edge-primary rounded-md shadow-raised',
    },
  },
  defaultVariants: { variant: 'default' },
});

const labelVariants = cva('font-mono text-content-muted', {
  variants: {
    variant: {
      default: 'text-sm mb-2',
      compact: 'text-xs mb-1',
      large: 'text-sm mb-3',
    },
  },
  defaultVariants: { variant: 'default' },
});

const timerVariants = cva('flex items-center justify-center', {
  variants: {
    variant: {
      default: 'gap-1',
      compact: 'gap-0.5',
      large: 'gap-2',
    },
  },
  defaultVariants: { variant: 'default' },
});

const segmentVariants = cva('flex flex-col items-center', {
  variants: {
    variant: {
      default: 'min-w-[3rem]',
      compact: 'min-w-[2rem]',
      large: 'min-w-[4rem] bg-surface-muted border border-edge-primary rounded-sm px-3 py-2',
    },
  },
  defaultVariants: { variant: 'default' },
});

const valueVariants = cva('font-heading text-content-primary tabular-nums', {
  variants: {
    variant: {
      default: 'text-2xl',
      compact: 'text-sm',
      large: 'text-3xl',
    },
  },
  defaultVariants: { variant: 'default' },
});

const unitVariants = cva('font-mono text-content-muted uppercase', {
  variants: {
    variant: {
      default: 'text-xs mt-0.5',
      compact: 'text-xs',
      large: 'text-sm mt-1',
    },
  },
  defaultVariants: { variant: 'default' },
});

const separatorVariants = cva('font-heading text-content-muted', {
  variants: {
    variant: {
      default: 'text-xl self-start mt-1',
      compact: 'text-sm self-start',
      large: 'text-2xl self-center',
    },
  },
  defaultVariants: { variant: 'default' },
});

const endedMessageVariants = cva('font-heading text-content-muted', {
  variants: {
    variant: {
      default: 'text-lg',
      compact: 'text-sm',
      large: 'text-xl',
    },
  },
  defaultVariants: { variant: 'default' },
});

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

  // Render ended state
  if (status === 'ended') {
    return (
      <div className={containerVariants({ variant, className })}>
        {label && <p className={labelVariants({ variant })}>{label}</p>}
        <p className={endedMessageVariants({ variant })}>
          {endedMessage}
        </p>
      </div>
    );
  }

  // Render upcoming state
  if (status === 'upcoming' && startTime) {
    const startRemaining = getTimeRemaining(startTime);
    return (
      <div className={containerVariants({ variant, className })}>
        <p className={labelVariants({ variant })}>Starts in</p>
        <div className={timerVariants({ variant })}>
          {showDays && startRemaining.days > 0 && (
            <>
              <div className={segmentVariants({ variant })}>
                <span className={valueVariants({ variant })}>{startRemaining.days}</span>
                <span className={unitVariants({ variant })}>days</span>
              </div>
              <span className={separatorVariants({ variant })}>:</span>
            </>
          )}
          <div className={segmentVariants({ variant })}>
            <span className={valueVariants({ variant })}>{padZero(startRemaining.hours)}</span>
            <span className={unitVariants({ variant })}>hrs</span>
          </div>
          <span className={separatorVariants({ variant })}>:</span>
          <div className={segmentVariants({ variant })}>
            <span className={valueVariants({ variant })}>{padZero(startRemaining.minutes)}</span>
            <span className={unitVariants({ variant })}>min</span>
          </div>
          <span className={separatorVariants({ variant })}>:</span>
          <div className={segmentVariants({ variant })}>
            <span className={valueVariants({ variant })}>{padZero(startRemaining.seconds)}</span>
            <span className={unitVariants({ variant })}>sec</span>
          </div>
        </div>
      </div>
    );
  }

  // Render active countdown
  return (
    <div className={containerVariants({ variant, className })}>
      {label && <p className={labelVariants({ variant })}>{label}</p>}
      <div className={timerVariants({ variant })}>
        {showDays && timeRemaining.days > 0 && (
          <>
            <div className={segmentVariants({ variant })}>
              <span className={valueVariants({ variant })}>{timeRemaining.days}</span>
              <span className={unitVariants({ variant })}>days</span>
            </div>
            <span className={separatorVariants({ variant })}>:</span>
          </>
        )}
        <div className={segmentVariants({ variant })}>
          <span className={valueVariants({ variant })}>{padZero(timeRemaining.hours)}</span>
          <span className={unitVariants({ variant })}>hrs</span>
        </div>
        <span className={separatorVariants({ variant })}>:</span>
        <div className={segmentVariants({ variant })}>
          <span className={valueVariants({ variant })}>{padZero(timeRemaining.minutes)}</span>
          <span className={unitVariants({ variant })}>min</span>
        </div>
        <span className={separatorVariants({ variant })}>:</span>
        <div className={segmentVariants({ variant })}>
          <span className={valueVariants({ variant })}>{padZero(timeRemaining.seconds)}</span>
          <span className={unitVariants({ variant })}>sec</span>
        </div>
      </div>
    </div>
  );
}

export default CountdownTimer;
