/**
 * @rdna/radiants - Remotion Duration Utilities
 *
 * Maps DNA motion tokens to Remotion frame counts.
 * Aligns with CSS duration tokens from animations.css.
 */

/** Duration tokens in milliseconds, matching DNA motion spec */
export const DURATION_MS = {
  instant: 0,
  fast: 100,
  base: 150,
  moderate: 200,
  slow: 300,
} as const;

export type DurationToken = keyof typeof DURATION_MS;

/**
 * Convert a DNA duration token to frame count for Remotion.
 *
 * @param token - DNA duration token or milliseconds
 * @param fps - Frames per second (default: 30)
 * @returns Number of frames
 *
 * @example
 * ```ts
 * durationToFrames('fast', 30);     // 3 frames
 * durationToFrames('base', 60);     // 9 frames
 * durationToFrames(200, 30);        // 6 frames (raw ms)
 * ```
 */
export function durationToFrames(
  token: DurationToken | number,
  fps: number = 30
): number {
  const ms = typeof token === 'number' ? token : DURATION_MS[token];
  return Math.round((ms / 1000) * fps);
}

/**
 * Convert frame count back to milliseconds.
 *
 * @param frames - Number of frames
 * @param fps - Frames per second (default: 30)
 * @returns Duration in milliseconds
 */
export function framesToMs(frames: number, fps: number = 30): number {
  return Math.round((frames / fps) * 1000);
}

/**
 * Get the closest DNA duration token for a given millisecond value.
 *
 * @param ms - Duration in milliseconds
 * @returns Closest DNA duration token
 */
export function msToToken(ms: number): DurationToken {
  const tokens = Object.entries(DURATION_MS) as [DurationToken, number][];
  let closest = tokens[0];

  for (const [token, value] of tokens) {
    if (Math.abs(value - ms) < Math.abs(closest[1] - ms)) {
      closest = [token, value];
    }
  }

  return closest[0];
}
