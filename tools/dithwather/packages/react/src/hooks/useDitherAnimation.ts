import { useState, useEffect, useRef, useCallback } from 'react'
import type { PartialDitherConfig, DitherConfig } from '@rdna/dithwather-core'
import { DEFAULT_CONFIG, lerpColor, hexToRgb, rgbToHex } from '@rdna/dithwather-core'
import { useReducedMotion } from './useReducedMotion'

// ============================================================================
// Types
// ============================================================================

export type EasingFunction = (t: number) => number

export interface AnimationOptions {
  /** Duration in milliseconds */
  duration?: number
  /** Easing function or preset name */
  easing?: 'linear' | 'ease-out' | 'ease-in' | 'ease-in-out' | EasingFunction
}

export interface UseDitherAnimationResult {
  /** Current animated config */
  config: DitherConfig
  /** Whether animation is in progress */
  isAnimating: boolean
  /** Animation progress (0-1) */
  progress: number
  /** Animate to a new config */
  animateTo: (target: PartialDitherConfig, options?: AnimationOptions) => void
  /** Stop current animation */
  stop: () => void
}

// ============================================================================
// Easing Functions
// ============================================================================

const EASINGS: Record<string, EasingFunction> = {
  linear: (t) => t,
  'ease-out': (t) => 1 - Math.pow(1 - t, 3),
  'ease-in': (t) => t * t * t,
  'ease-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
}

function getEasing(easing: AnimationOptions['easing']): EasingFunction {
  if (typeof easing === 'function') return easing
  return EASINGS[easing ?? 'ease-out']
}

// ============================================================================
// Interpolation
// ============================================================================

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function getBgColor(config: DitherConfig, fallback: string): string {
  return 'bg' in config.colors ? config.colors.bg : fallback
}

function lerpConfig(
  from: DitherConfig,
  to: DitherConfig,
  t: number
): DitherConfig {
  // Interpolate numeric values
  const intensity = lerpNumber(from.intensity, to.intensity, t)
  const threshold = lerpNumber(from.threshold, to.threshold, t)
  const brightness = lerpNumber(from.brightness, to.brightness, t)
  const contrast = lerpNumber(from.contrast, to.contrast, t)

  // Interpolate colors
  const fromFg = hexToRgb((from.colors as { fg: string }).fg)
  const toFg = hexToRgb((to.colors as { fg: string }).fg)
  const fg = rgbToHex(lerpColor(fromFg, toFg, t))

  // Non-interpolatable values snap at halfway
  const algorithm = t < 0.5 ? from.algorithm : to.algorithm
  const colorMode = t < 0.5 ? from.colorMode : to.colorMode
  const fallbackBg = (DEFAULT_CONFIG.colors as { bg: string }).bg

  const colors: DitherConfig['colors'] = colorMode === 'mono'
    ? { fg }
    : {
        fg,
        bg: rgbToHex(
          lerpColor(
            hexToRgb(getBgColor(from, getBgColor(to, fallbackBg))),
            hexToRgb(getBgColor(to, getBgColor(from, fallbackBg))),
            t
          )
        ),
      }

  return {
    algorithm,
    colorMode,
    colors,
    intensity,
    threshold,
    brightness,
    contrast,
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for animating between dither configurations
 */
export function useDitherAnimation(
  initialConfig: PartialDitherConfig,
  defaultOptions: AnimationOptions = {}
): UseDitherAnimationResult {
  const [config, setConfig] = useState<DitherConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  })
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  const animationRef = useRef<number | null>(null)
  const configRef = useRef<DitherConfig>(config)
  const fromConfigRef = useRef<DitherConfig>(config)
  const toConfigRef = useRef<DitherConfig>(config)

  // Keep configRef in sync with the latest config state
  configRef.current = config

  const stop = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setIsAnimating(false)
  }, [])

  const animateTo = useCallback(
    (target: PartialDitherConfig, options: AnimationOptions = {}) => {
      const { duration = defaultOptions.duration ?? 200, easing = defaultOptions.easing ?? 'ease-out' } = options

      // Stop any existing animation
      stop()

      // Read the current config from the ref to avoid stale closures
      const currentConfig = configRef.current

      if (prefersReducedMotion) {
        const finalConfig = { ...currentConfig, ...target }
        setConfig(finalConfig)
        configRef.current = finalConfig
        setProgress(1)
        return
      }
      fromConfigRef.current = currentConfig
      toConfigRef.current = { ...currentConfig, ...target }

      const easingFn = getEasing(easing)
      const startTime = performance.now()

      setIsAnimating(true)

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const rawProgress = Math.min(elapsed / duration, 1)
        const easedProgress = easingFn(rawProgress)

        setProgress(rawProgress)
        setConfig(lerpConfig(fromConfigRef.current, toConfigRef.current, easedProgress))

        if (rawProgress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          animationRef.current = null
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [stop, defaultOptions.duration, defaultOptions.easing, prefersReducedMotion]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return {
    config,
    isAnimating,
    progress,
    animateTo,
    stop,
  }
}
