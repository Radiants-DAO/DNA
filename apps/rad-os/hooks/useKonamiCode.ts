'use client';

import { useEffect, useRef, useCallback } from 'react';

// Konami Code sequence: Up Up Down Down Left Right Left Right
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
];

interface UseKonamiCodeOptions {
  /** Callback when Konami code is entered */
  onActivate: () => void;
  /** Timeout in ms to reset sequence (default: 2000) */
  timeout?: number;
}

/**
 * Hook that detects the Konami code sequence.
 *
 * Sequence: Up Up Down Down Left Right Left Right
 *
 * @example
 * function App() {
 *   const { toggleInvertMode } = usePreferencesStore();
 *
 *   useKonamiCode({
 *     onActivate: () => {
 *       toggleInvertMode();
 *       console.log('Konami code activated!');
 *     },
 *   });
 *
 *   return <div>...</div>;
 * }
 */
export function useKonamiCode({ onActivate, timeout = 2000 }: UseKonamiCodeOptions) {
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetSequence = useCallback(() => {
    sequenceRef.current = [];
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      sequenceRef.current.push(e.key);

      const currentLength = sequenceRef.current.length;
      const expectedSequence = KONAMI_CODE.slice(0, currentLength);
      const currentSequence = sequenceRef.current;

      const matches = currentSequence.every(
        (key, index) => key === expectedSequence[index]
      );

      if (!matches) {
        resetSequence();
        return;
      }

      if (currentLength === KONAMI_CODE.length) {
        onActivate();
        resetSequence();
        return;
      }

      timeoutRef.current = setTimeout(resetSequence, timeout);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onActivate, timeout, resetSequence]);
}
