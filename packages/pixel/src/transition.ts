import { diffBits } from './core.js';
import type { TransitionMode } from './types.js';

export function computeFlipOrder(
  from: string,
  to: string,
  mode: TransitionMode,
  width: number,
  height: number,
): number[] {
  const diffs = diffBits(from, to);
  if (diffs.length === 0) {
    return [];
  }

  switch (mode) {
    case 'scanline':
      return diffs;

    case 'radial': {
      const cx = (width - 1) / 2;
      const cy = (height - 1) / 2;

      return [...diffs].sort((a, b) => {
        const ax = a % width;
        const ay = Math.floor(a / width);
        const bx = b % width;
        const by = Math.floor(b / width);
        const da = (ax - cx) ** 2 + (ay - cy) ** 2;
        const db = (bx - cx) ** 2 + (by - cy) ** 2;

        return da - db;
      });
    }

    case 'scatter': {
      const sorted = [...diffs].sort((a, b) => a - b);
      const result: number[] = [];
      const stride = Math.max(2, Math.floor(sorted.length / 8));

      for (let offset = 0; offset < stride; offset++) {
        for (let i = offset; i < sorted.length; i += stride) {
          result.push(sorted[i]);
        }
      }

      return result;
    }

    case 'random':
    default: {
      const shuffled = [...diffs];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled;
    }
  }
}

export function interpolateFrame(
  from: string,
  to: string,
  flipOrder: number[],
  progress: number,
): string {
  if (progress <= 0) {
    return from;
  }

  if (progress >= 1) {
    return to;
  }

  const flipsToApply = Math.round(flipOrder.length * progress);
  const frame = from.split('');

  for (let i = 0; i < flipsToApply; i++) {
    const index = flipOrder[i];
    frame[index] = to[index];
  }

  return frame.join('');
}

export function animateTransition(
  from: string,
  to: string,
  flipOrder: number[],
  duration: number,
  onFrame: (bits: string) => void,
): () => void {
  let startTime: number | null = null;
  let rafId = 0;
  let cancelled = false;

  const tick = (timestamp: number): void => {
    if (cancelled) {
      return;
    }

    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = duration <= 0 ? 1 : Math.min(elapsed / duration, 1);

    onFrame(interpolateFrame(from, to, flipOrder, progress));

    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
