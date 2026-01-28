'use client';

import { useState, useEffect } from 'react';

// Target: February 2nd, 2026 17:00:00 UTC (5PM UTC)
const TARGET_DATE = new Date('2026-02-02T17:00:00Z').getTime();

type TimeFormat = 'numeric' | 'text';
type Placement = 'watermark' | 'above-button' | 'above-title';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(): TimeLeft {
  const now = Date.now();
  const total = Math.max(0, TARGET_DATE - now);

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

interface CountdownDisplayProps {
  timeLeft: TimeLeft;
  format: TimeFormat;
  placement: Placement;
}

function CountdownDisplay({ timeLeft, format, placement }: CountdownDisplayProps) {
  const isExpired = timeLeft.total <= 0;

  if (isExpired) {
    return <span className="countdown-expired">LIVE NOW</span>;
  }

  if (format === 'numeric') {
    const display = `${padZero(timeLeft.days)}:${padZero(timeLeft.hours)}:${padZero(timeLeft.minutes)}:${padZero(timeLeft.seconds)}`;
    return <span className={`countdown-numeric countdown-${placement}`}>{display}</span>;
  }

  // Text format
  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''}`);
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours} hour${timeLeft.hours !== 1 ? 's' : ''}`);
  if (timeLeft.minutes > 0 && timeLeft.days === 0) parts.push(`${timeLeft.minutes} min${timeLeft.minutes !== 1 ? 's' : ''}`);
  if (timeLeft.seconds > 0 && timeLeft.days === 0 && timeLeft.hours === 0) parts.push(`${timeLeft.seconds} sec`);

  return <span className={`countdown-text countdown-${placement}`}>{parts.join(', ')} remaining</span>;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
  const [format, setFormat] = useState<TimeFormat>('numeric');
  const [placement, setPlacement] = useState<Placement>('above-button');
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Watermark - always rendered when selected */}
      {placement === 'watermark' && (
        <div className="countdown-watermark">
          <CountdownDisplay timeLeft={timeLeft} format={format} placement="watermark" />
        </div>
      )}

      {/* Above title - rendered in the monolith_text container */}
      {placement === 'above-title' && (
        <div className="countdown-above-title">
          <CountdownDisplay timeLeft={timeLeft} format={format} placement="above-title" />
        </div>
      )}

      {/* Above button - rendered in the monolith_text container */}
      {placement === 'above-button' && (
        <div className="countdown-above-button">
          <CountdownDisplay timeLeft={timeLeft} format={format} placement="above-button" />
        </div>
      )}

      {/* Control Panel Toggle */}
      <button
        className="countdown-toggle"
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? '×' : '⏱'}
      </button>

      {/* Control Panel */}
      {showControls && (
        <div className="countdown-controls">
          <div className="countdown-controls-header">
            Countdown Settings
          </div>

          <div className="countdown-control-group">
            <label>Format</label>
            <div className="countdown-buttons">
              <button
                className={format === 'numeric' ? 'active' : ''}
                onClick={() => setFormat('numeric')}
              >
                DD:HH:MM:SS
              </button>
              <button
                className={format === 'text' ? 'active' : ''}
                onClick={() => setFormat('text')}
              >
                Text
              </button>
            </div>
          </div>

          <div className="countdown-control-group">
            <label>Placement</label>
            <div className="countdown-buttons">
              <button
                className={placement === 'watermark' ? 'active' : ''}
                onClick={() => setPlacement('watermark')}
              >
                Watermark
              </button>
              <button
                className={placement === 'above-title' ? 'active' : ''}
                onClick={() => setPlacement('above-title')}
              >
                Above Title
              </button>
              <button
                className={placement === 'above-button' ? 'active' : ''}
                onClick={() => setPlacement('above-button')}
              >
                Above Button
              </button>
            </div>
          </div>

          <div className="countdown-preview">
            <label>Preview</label>
            <div className="countdown-preview-box">
              <CountdownDisplay timeLeft={timeLeft} format={format} placement={placement} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export individual placement components for direct use
export function CountdownWatermark() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="countdown-watermark">
      <CountdownDisplay timeLeft={timeLeft} format="numeric" placement="watermark" />
    </div>
  );
}

export function CountdownAboveTitle({ format = 'numeric' as TimeFormat }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <CountdownDisplay timeLeft={timeLeft} format={format} placement="above-title" />;
}

export function CountdownAboveButton({ format = 'numeric' as TimeFormat }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <CountdownDisplay timeLeft={timeLeft} format={format} placement="above-button" />;
}

// Simple inline countdown - no colons, matches HACKATHON style
export function CountdownInline() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft.total <= 0) {
    return <span className="countdown-inline">LIVE NOW</span>;
  }

  const display = `${padZero(timeLeft.days)}${padZero(timeLeft.hours)}${padZero(timeLeft.minutes)}${padZero(timeLeft.seconds)}`;
  return <span className="countdown-inline">{display}</span>;
}
