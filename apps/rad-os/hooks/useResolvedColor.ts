'use client';

import { useMemo } from 'react';
import { usePreferencesStore } from '@/store';

/**
 * Resolve a CSS custom property (e.g. `--color-ink`) to its literal computed
 * value. Dotting writes `ctx.fillStyle = pixel.color` directly on a 2D canvas,
 * which can't resolve `var(--*)` strings, so we re-read whenever `darkMode`
 * flips.
 */
export function useResolvedColor(token: string, fallback: string): string {
  const { darkMode } = usePreferencesStore();
  return useMemo(() => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim();
    return value || fallback;
    // darkMode flip toggles `.dark` on the root, swapping the resolved value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, darkMode, fallback]);
}
