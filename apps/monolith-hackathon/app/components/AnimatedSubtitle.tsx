'use client';

import { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
const LINES = ['LIVE NOW', 'FEB 2 – MAR 9', '$125K+ IN PRIZES'];
const DISPLAY_DURATION = 4000;
const SCRAMBLE_DURATION = 800;
const SCRAMBLE_FPS = 20;

function getRandomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

type Phase = 'display' | 'scramble';

export default function AnimatedSubtitle() {
  const [display, setDisplay] = useState(LINES[0]);
  const [phase, setPhase] = useState<Phase>('display');
  const indexRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (phase === 'display') {
      setDisplay(LINES[indexRef.current]);
      timeout = setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % LINES.length;
        setPhase('scramble');
      }, DISPLAY_DURATION);
    } else {
      const target = LINES[indexRef.current];
      const maxLen = Math.max(...LINES.map(l => l.length));
      startTimeRef.current = Date.now();

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
          setPhase('display');
        }
      }, 1000 / SCRAMBLE_FPS);
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [phase]);

  return (
    <h4 className="monolith-sub animated-subtitle">
      {display}
    </h4>
  );
}
