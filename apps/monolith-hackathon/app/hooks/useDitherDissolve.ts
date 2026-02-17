'use client';

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { getTileDataURL, getTileSize } from '../lib/bayer-tiles';
import type { OrderedAlgorithm } from '../lib/bayer-tiles';

interface DitherDissolveOptions {
  algorithm?: OrderedAlgorithm;
  pixelScale?: number;
  duration?: number;
}

/**
 * Animates a Bayer dither dissolve on a DOM element via CSS mask-image.
 * When `dissolving` flips to true, threshold animates 1 → 0 (visible → gone).
 * Returns inline styles to spread onto the target element.
 */
export function useDitherDissolve(
  dissolving: boolean,
  options: DitherDissolveOptions = {}
): CSSProperties {
  const {
    algorithm = 'bayer8x8',
    pixelScale = 3,
    duration = 800,
  } = options;

  const [threshold, setThreshold] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!dissolving) {
      setThreshold(1);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    const start = performance.now();
    // ease-out cubic
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const raw = Math.min((now - start) / duration, 1);
      setThreshold(1 - ease(raw));
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [dissolving, duration]);

  // No mask needed when fully visible
  if (threshold >= 1) return {};

  // Fully dissolved — hide entirely
  if (threshold <= 0) return { opacity: 0 };

  const tileSize = getTileSize(algorithm);
  const displaySize = tileSize * pixelScale;
  const tileUrl = getTileDataURL(algorithm, threshold);
  const mask = `url(${tileUrl})`;

  return {
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: `${displaySize}px ${displaySize}px`,
    maskSize: `${displaySize}px ${displaySize}px`,
    WebkitMaskRepeat: 'repeat',
    maskRepeat: 'repeat',
  } as CSSProperties;
}
