'use client';

import { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';

function getRandomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

type Phase = 'display' | 'scramble';

export interface AnimatedSubtitleProps {
  /** Array of text lines to cycle through */
  lines?: string[];
  /** Duration to display each line (ms) */
  displayDuration?: number;
  /** Duration of scramble transition (ms) */
  scrambleDuration?: number;
  /** Frames per second for scramble animation */
  scrambleFps?: number;
  /** Additional CSS classes */
  className?: string;
}

const DEFAULT_LINES = ['LIVE NOW', 'FEB 2 – MAR 9', '$125K+ IN PRIZES'];

export function AnimatedSubtitle({
  lines = DEFAULT_LINES,
  displayDuration = 4000,
  scrambleDuration = 800,
  scrambleFps = 20,
  className = '',
}: AnimatedSubtitleProps) {
  const [display, setDisplay] = useState(lines[0]);
  const [phase, setPhase] = useState<Phase>('display');
  const indexRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (phase === 'display') {
      setDisplay(lines[indexRef.current]);
      timeout = setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % lines.length;
        setPhase('scramble');
      }, displayDuration);
    } else {
      const target = lines[indexRef.current];
      const maxLen = Math.max(...lines.map((l) => l.length));
      startTimeRef.current = Date.now();

      interval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(1, elapsed / scrambleDuration);

        let result = '';
        for (let i = 0; i < maxLen; i++) {
          const charRevealPoint = i / maxLen;
          if (progress > charRevealPoint + 0.2) {
            result += target[i] || '';
          } else {
            result += getRandomChar();
          }
        }

        setDisplay(result);

        if (progress >= 1) {
          clearInterval(interval);
          setDisplay(target);
          setPhase('display');
        }
      }, 1000 / scrambleFps);
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [phase, lines, displayDuration, scrambleDuration, scrambleFps]);

  const baseStyles = `
    font-ui uppercase tracking-wider
    text-content-secondary
    text-[0.875em]
  `;

  return <h4 className={`${baseStyles} ${className}`.trim()}>{display}</h4>;
}

export default AnimatedSubtitle;
