/**
 * @dna/radiants - Remotion Spring Presets
 *
 * Pre-configured spring configurations for physics-based animations.
 * These provide natural motion that aligns with DNA timing guidelines.
 */

import type { SpringConfig } from 'remotion';

/**
 * DNA spring presets for Remotion's spring() function.
 *
 * Each preset is tuned to approximate DNA duration tokens:
 * - snappy: ~100-150ms feel, for quick micro-interactions
 * - gentle: ~150-200ms feel, for standard UI transitions
 * - stiff: ~200-300ms feel, for deliberate/heavy elements
 *
 * @example
 * ```ts
 * import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
 * import { dnaSpring } from '@dna/radiants/remotion';
 *
 * const { fps } = useVideoConfig();
 * const frame = useCurrentFrame();
 *
 * const scale = spring({
 *   frame,
 *   fps,
 *   config: dnaSpring.snappy,
 * });
 * ```
 */
export const dnaSpring = {
  /** Fast, responsive spring (~100-150ms) for micro-interactions */
  snappy: {
    damping: 20,
    mass: 0.5,
    stiffness: 400,
  } satisfies SpringConfig,

  /** Balanced spring (~150-200ms) for standard transitions */
  gentle: {
    damping: 25,
    mass: 1,
    stiffness: 200,
  } satisfies SpringConfig,

  /** Slower spring (~200-300ms) for deliberate, weighty motion */
  stiff: {
    damping: 30,
    mass: 1.2,
    stiffness: 150,
  } satisfies SpringConfig,

  /** Bouncy spring for playful, attention-grabbing animations */
  bouncy: {
    damping: 12,
    mass: 0.8,
    stiffness: 300,
  } satisfies SpringConfig,
} as const;

export type SpringPreset = keyof typeof dnaSpring;

/**
 * Get a spring configuration by preset name.
 *
 * @param preset - Spring preset name
 * @returns Remotion SpringConfig object
 */
export function getSpringConfig(preset: SpringPreset): SpringConfig {
  return dnaSpring[preset];
}
