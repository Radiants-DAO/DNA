'use client';

import { useState, useEffect, useRef } from 'react';

const TYPING_SPEED = 60;
const DELETE_SPEED = 18;
const PAUSE_AFTER_TYPE = 2400;
const PAUSE_AFTER_DELETE = 400;

type Phase = 'typing' | 'paused' | 'deleting' | 'waiting';

export function useTypewriter(messages: string[]) {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const indexRef = useRef(0);
  const phaseRef = useRef<Phase>('typing');
  const charRef = useRef(0);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Typing engine
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const phase = phaseRef.current;
      const msg = messages[indexRef.current];

      if (phase === 'typing') {
        charRef.current++;
        setDisplayed(msg.slice(0, charRef.current));
        if (charRef.current >= msg.length) {
          phaseRef.current = 'paused';
          timer = setTimeout(tick, PAUSE_AFTER_TYPE);
        } else {
          timer = setTimeout(tick, TYPING_SPEED);
        }
      } else if (phase === 'paused') {
        phaseRef.current = 'deleting';
        timer = setTimeout(tick, DELETE_SPEED);
      } else if (phase === 'deleting') {
        charRef.current--;
        setDisplayed(msg.slice(0, charRef.current));
        if (charRef.current <= 0) {
          phaseRef.current = 'waiting';
          timer = setTimeout(tick, PAUSE_AFTER_DELETE);
        } else {
          timer = setTimeout(tick, DELETE_SPEED);
        }
      } else {
        // waiting — advance to next message
        indexRef.current = (indexRef.current + 1) % messages.length;
        charRef.current = 0;
        phaseRef.current = 'typing';
        timer = setTimeout(tick, TYPING_SPEED);
      }
    }

    timer = setTimeout(tick, TYPING_SPEED);
    return () => clearTimeout(timer);
  }, [messages]);

  return { displayed, cursorVisible };
}
