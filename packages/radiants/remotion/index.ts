/**
 * @dna/radiants - Remotion Adapter
 *
 * Bridges DNA's CSS motion tokens to Remotion's frame-based animation primitives.
 * Provides consistent motion across CSS and programmatic video animations.
 *
 * @example
 * ```tsx
 * import { useMotion, dnaEasing, dnaSpring, durationToFrames } from '@dna/radiants/remotion';
 *
 * // High-level: useMotion hook
 * const { style } = useMotion({ type: 'slideUp', duration: 'base' });
 *
 * // Low-level: manual interpolation
 * const opacity = interpolate(frame, [0, durationToFrames('slow', fps)], [0, 1], {
 *   easing: dnaEasing.default,
 * });
 * ```
 */

// Duration utilities
export {
  DURATION_MS,
  durationToFrames,
  framesToMs,
  msToToken,
  type DurationToken,
} from './durations';

// Easing curves
export { dnaEasing, getEasing, type EasingToken } from './easing';

// Spring presets
export { dnaSpring, getSpringConfig, type SpringPreset } from './springs';

// Animation hook
export {
  useMotion,
  createStagger,
  type MotionType,
  type UseMotionConfig,
  type UseMotionResult,
} from './useMotion';
