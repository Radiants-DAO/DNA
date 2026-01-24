/**
 * @rdna/radiants - useMotion Hook
 *
 * High-level animation hook that provides DNA-styled motion for Remotion compositions.
 * Supports both easing-based and spring-based animations.
 */

import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DURATION_MS, durationToFrames, type DurationToken } from './durations';
import { dnaEasing, type EasingToken } from './easing';
import { dnaSpring, type SpringPreset } from './springs';

/** Supported animation types */
export type MotionType =
  | 'fade'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'scaleUp';

/** Configuration for useMotion hook */
export interface UseMotionConfig {
  /** Animation type to apply */
  type: MotionType;
  /** Duration as DNA token or milliseconds (default: 'base') */
  duration?: DurationToken | number;
  /** Easing curve token (default: 'default') */
  easing?: EasingToken;
  /** Spring preset for physics-based motion */
  spring?: SpringPreset;
  /** Animation mode: 'easing' for bezier curves, 'spring' for physics (default: 'easing') */
  mode?: 'easing' | 'spring';
  /** Delay in frames before animation starts (default: 0) */
  delay?: number;
  /** Custom start frame (default: uses delay) */
  from?: number;
}

/** Return type for useMotion hook */
export interface UseMotionResult {
  /** Current opacity value (0-1) */
  opacity: number;
  /** Current transform string */
  transform: string;
  /** Combined style object ready for use */
  style: React.CSSProperties;
  /** Current animation progress (0-1) */
  progress: number;
  /** Whether animation has completed */
  isComplete: boolean;
}

/** Transform distances for slide animations */
const SLIDE_DISTANCE = 20;

/** Scale values for scale animations */
const SCALE_FROM = 0.95;

/**
 * High-level animation hook for DNA-styled motion in Remotion.
 *
 * Provides pre-configured animation patterns that match DNA motion guidelines.
 * Supports both easing-based (bezier curves) and spring-based (physics) animations.
 *
 * @example
 * ```tsx
 * // Simple fade animation
 * const { style } = useMotion({ type: 'fade' });
 * return <div style={style}>Content</div>;
 *
 * // Slide up with custom duration
 * const { style } = useMotion({
 *   type: 'slideUp',
 *   duration: 'slow',
 *   easing: 'out',
 * });
 *
 * // Spring-based scale animation
 * const { style } = useMotion({
 *   type: 'scale',
 *   mode: 'spring',
 *   spring: 'snappy',
 * });
 *
 * // Staggered list items
 * const delay = durationToFrames('fast', fps);
 * items.map((item, i) => (
 *   <Item style={useMotion({ type: 'slideUp', delay: i * delay }).style} />
 * ));
 * ```
 */
export function useMotion(config: UseMotionConfig): UseMotionResult {
  const {
    type,
    duration = 'base',
    easing = 'default',
    spring: springPreset = 'gentle',
    mode = 'easing',
    delay = 0,
    from,
  } = config;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = from ?? delay;
  const adjustedFrame = Math.max(0, frame - startFrame);

  let progress: number;

  if (mode === 'spring') {
    // Spring-based animation
    progress = spring({
      frame: adjustedFrame,
      fps,
      config: dnaSpring[springPreset],
    });
  } else {
    // Easing-based animation
    const durationFrames = durationToFrames(duration, fps);
    progress = interpolate(adjustedFrame, [0, durationFrames], [0, 1], {
      easing: dnaEasing[easing],
      extrapolateRight: 'clamp',
    });
  }

  // Calculate animation values based on type
  const { opacity, transform } = getAnimationValues(type, progress);

  const isComplete = progress >= 1;

  return {
    opacity,
    transform,
    style: {
      opacity,
      transform,
    },
    progress,
    isComplete,
  };
}

/**
 * Calculate opacity and transform values for a given animation type and progress.
 */
function getAnimationValues(
  type: MotionType,
  progress: number
): { opacity: number; transform: string } {
  switch (type) {
    case 'fade':
      return {
        opacity: progress,
        transform: 'none',
      };

    case 'slideUp':
      return {
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [SLIDE_DISTANCE, 0])}px)`,
      };

    case 'slideDown':
      return {
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [-SLIDE_DISTANCE, 0])}px)`,
      };

    case 'slideLeft':
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [SLIDE_DISTANCE, 0])}px)`,
      };

    case 'slideRight':
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-SLIDE_DISTANCE, 0])}px)`,
      };

    case 'scale':
      return {
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [SCALE_FROM, 1])})`,
      };

    case 'scaleUp':
      return {
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [SCALE_FROM, 1])}) translateY(${interpolate(progress, [0, 1], [SLIDE_DISTANCE / 2, 0])}px)`,
      };

    default:
      return {
        opacity: 1,
        transform: 'none',
      };
  }
}

/**
 * Create a stagger delay calculator for list animations.
 *
 * @param staggerMs - Delay between each item in milliseconds
 * @param fps - Frames per second
 * @returns Function that returns delay in frames for a given index
 *
 * @example
 * ```tsx
 * const getDelay = createStagger(50, fps);
 *
 * items.map((item, i) => (
 *   <Item style={useMotion({ type: 'slideUp', delay: getDelay(i) }).style} />
 * ));
 * ```
 */
export function createStagger(
  staggerMs: number,
  fps: number
): (index: number) => number {
  const staggerFrames = durationToFrames(staggerMs, fps);
  return (index: number) => index * staggerFrames;
}
