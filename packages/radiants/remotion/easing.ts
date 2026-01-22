/**
 * @dna/radiants - Remotion Easing Curves
 *
 * DNA easing curves implemented via Remotion's Easing.bezier().
 * Matches CSS custom properties: --easing-default, --easing-out, --easing-in
 */

import { Easing } from 'remotion';

/**
 * DNA easing curves for Remotion interpolations.
 *
 * These match the CSS custom properties defined in the DNA spec:
 * - default/out: cubic-bezier(0, 0, 0.2, 1) - ease-out curve for most animations
 * - in: cubic-bezier(0.4, 0, 1, 1) - ease-in for exit animations
 *
 * @example
 * ```ts
 * import { interpolate } from 'remotion';
 * import { dnaEasing } from '@dna/radiants/remotion';
 *
 * const opacity = interpolate(frame, [0, 30], [0, 1], {
 *   easing: dnaEasing.default,
 * });
 * ```
 */
export const dnaEasing = {
  /** Standard ease-out curve (--easing-default) */
  default: Easing.bezier(0, 0, 0.2, 1),

  /** Ease-out curve for enter animations (--easing-out) */
  out: Easing.bezier(0, 0, 0.2, 1),

  /** Ease-in curve for exit animations (--easing-in) */
  in: Easing.bezier(0.4, 0, 1, 1),

  /** Linear easing for constant-rate animations */
  linear: Easing.linear,
} as const;

export type EasingToken = keyof typeof dnaEasing;

/**
 * Get an easing function by token name.
 *
 * @param token - Easing token name
 * @returns Remotion easing function
 */
export function getEasing(token: EasingToken): (t: number) => number {
  return dnaEasing[token];
}
