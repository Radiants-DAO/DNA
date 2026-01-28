'use client';

import { useState, useEffect, useRef } from 'react';

const TARGET_DATE = new Date('2026-02-02T17:00:00Z').getTime();
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
const TEXT = 'HACKATHON';
const DISPLAY_TEXT_DURATION = 5000;
const DISPLAY_TIMER_DURATION = 8000;
const SCRAMBLE_DURATION = 800;
const SCRAMBLE_FPS = 20;

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

function getTimerString(): string {
  const now = Date.now();
  const total = Math.max(0, TARGET_DATE - now);

  if (total <= 0) return 'LIVE NOW!';

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return `${padZero(days)}${padZero(hours)}${padZero(minutes)}${padZero(seconds)}`;
}

function getRandomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

type Phase = 'text' | 'scramble-to-timer' | 'timer' | 'scramble-to-text';

export default function AnimatedSubtitle() {
  const [display, setDisplay] = useState(TEXT);
  const [phase, setPhase] = useState<Phase>('text');
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (phase === 'text') {
      setDisplay(TEXT);
      timeout = setTimeout(() => setPhase('scramble-to-timer'), DISPLAY_TEXT_DURATION);
    } else if (phase === 'timer') {
      const updateTimer = () => setDisplay(getTimerString());
      updateTimer();
      interval = setInterval(updateTimer, 1000);
      timeout = setTimeout(() => setPhase('scramble-to-text'), DISPLAY_TIMER_DURATION);
    } else if (phase === 'scramble-to-timer' || phase === 'scramble-to-text') {
      const target = phase === 'scramble-to-timer' ? getTimerString() : TEXT;
      const maxLen = Math.max(TEXT.length, 8);
      startTimeRef.current = Date.now();

      const scramble = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(1, elapsed / SCRAMBLE_DURATION);

        let result = '';
        for (let i = 0; i < maxLen; i++) {
          const charRevealPoint = i / maxLen;

          if (progress > charRevealPoint + 0.3) {
            // Character is revealed
            result += target[i] || '';
          } else {
            // Character is still scrambling
            result += getRandomChar();
          }
        }

        setDisplay(result);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(scramble);
        } else {
          setDisplay(target);
          setPhase(phase === 'scramble-to-timer' ? 'timer' : 'text');
        }
      };

      // Start with all random
      let initial = '';
      for (let i = 0; i < maxLen; i++) {
        initial += getRandomChar();
      }
      setDisplay(initial);

      // Use interval for more consistent frame rate
      interval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(1, elapsed / SCRAMBLE_DURATION);

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
          setPhase(phase === 'scramble-to-timer' ? 'timer' : 'text');
        }
      }, 1000 / SCRAMBLE_FPS);
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      cancelAnimationFrame(frameRef.current);
    };
  }, [phase]);

  return (
    <h4 className="monolith-sub animated-subtitle">
      {display}
    </h4>
  );
}
