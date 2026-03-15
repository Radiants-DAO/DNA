import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react'
import {
  renderGradientDitherAuto,
  renderGradientToDataURL,
  resolveGradient,
  DEFAULT_CONFIG,
  isOrderedAlgorithm,
  type PartialDitherConfig,
  type DitherConfig,
  type OrderedAlgorithm,
  type DitherGradient,
  type DitherGradientType,
} from '@rdna/dithwather-core'
import { useDitherContext } from '../context/DitherContext'
import { useResizeObserver } from '../hooks/useResizeObserver'
import { useDitherAnimation } from '../hooks/useDitherAnimation'
import { useBayerTile } from '../hooks/useBayerTile'

// ============================================================================
// Types
// ============================================================================

export type DitherMode = 'background' | 'mask' | 'full'

export type InteractionState = 'idle' | 'hover' | 'focus' | 'active'

export interface DitherAnimateConfig {
  idle?: PartialDitherConfig
  hover?: PartialDitherConfig
  focus?: PartialDitherConfig
  active?: PartialDitherConfig
  transition?: number
}

export interface DitherBoxProps {
  // -- NEW: Gradient (primary path) --
  /** Gradient config. String shorthand or full object. */
  gradient?: DitherGradient | DitherGradientType
  /** Shorthand: gradient colors (evenly-spaced stops) */
  colors?: string[]
  /** Shorthand: gradient angle in degrees */
  angle?: number

  // -- Dither configuration --
  algorithm?: DitherConfig['algorithm']
  intensity?: number
  threshold?: number
  brightness?: number
  contrast?: number

  /** How to apply dithering */
  mode?: DitherMode

  /**
   * State-based animation config.
   * With the gradient API (gradient/colors/angle props): only `threshold` and `algorithm` changes are reflected.
   * With the legacy tile API: all DitherConfig properties (intensity, brightness, contrast, etc.) are animatable.
   */
  animate?: DitherAnimateConfig

  /** Pixel scale for Bayer tile rendering (default: 1, try 2-4 for visible patterns) */
  pixelScale?: number

  /** Stride offset for deliberate scanline glitch effect. Default: 0 (no glitch) */
  glitch?: number

  // -- Legacy tile path props --
  /** @deprecated Use `colors` (string[]) or `gradient.stops` instead */
  colorMode?: DitherConfig['colorMode']
  /** @deprecated Use `colors` (string[]) or `gradient.stops` instead */
  ditherColors?: DitherConfig['colors']

  /** Children */
  children?: ReactNode

  /** Container props */
  className?: string
  style?: CSSProperties

  /** For external control */
  config?: PartialDitherConfig
}

// ============================================================================
// Component
// ============================================================================

export function DitherBox({
  // New gradient API
  gradient,
  colors,
  angle,
  // Dither config
  algorithm,
  intensity,
  threshold,
  brightness,
  contrast,
  mode = 'background',
  animate,
  pixelScale = 1,
  glitch,
  // Legacy tile path props
  colorMode,
  ditherColors,
  // Container
  children,
  className,
  style,
  config: externalConfig,
}: DitherBoxProps) {
  const { defaults, renderer } = useDitherContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useResizeObserver(containerRef)

  // Detect which API is in use.
  // `angle` alone doesn't define a gradient, so it doesn't trigger the new API.
  const usesNewAPI = gradient !== undefined || colors !== undefined

  // Resolve gradient from props (new API only)
  const resolvedGradient = useMemo(() => {
    if (!usesNewAPI) return null
    return resolveGradient(gradient, colors, angle)
  }, [usesNewAPI, gradient, colors, angle])

  // Build base config from props (for animation / legacy paths)
  const baseConfig: PartialDitherConfig = useMemo(
    () => ({
      ...defaults,
      ...(algorithm && { algorithm }),
      ...(colorMode && { colorMode }),
      ...(ditherColors && { colors: ditherColors }),
      ...(intensity !== undefined && { intensity }),
      ...(threshold !== undefined && { threshold }),
      ...(brightness !== undefined && { brightness }),
      ...(contrast !== undefined && { contrast }),
      ...externalConfig,
    }),
    [defaults, algorithm, colorMode, ditherColors, intensity, threshold, brightness, contrast, externalConfig]
  )

  // Interaction tracking (independent booleans, derived state with priority)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Derive interaction state: active > focus > hover > idle
  const interactionState: InteractionState =
    isActive && animate?.active ? 'active' :
    isFocused && animate?.focus ? 'focus' :
    isHovered && animate?.hover ? 'hover' :
    'idle'

  // Animation
  const {
    config: animatedConfig,
    animateTo,
  } = useDitherAnimation(
    { ...DEFAULT_CONFIG, ...baseConfig, ...animate?.idle },
    { duration: animate?.transition ?? 200 }
  )

  // Handle state changes
  useEffect(() => {
    if (!animate) return

    const targetConfig = animate[interactionState] ?? animate.idle ?? {}
    animateTo({ ...baseConfig, ...targetConfig })
  }, [interactionState, animate, baseConfig, animateTo])

  // Interaction handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => { setIsHovered(false); setIsActive(false) }, [])
  const handleFocus = useCallback(() => setIsFocused(true), [])
  const handleBlur = useCallback(() => setIsFocused(false), [])
  const handleMouseDown = useCallback(() => setIsActive(true), [])
  const handleMouseUp = useCallback(() => setIsActive(false), [])

  // Determine which pipeline to use
  const configToUse = animate ? animatedConfig : { ...DEFAULT_CONFIG, ...baseConfig }

  // NEW GRADIENT PATH
  const [gradientDataURL, setGradientDataURL] = useState<string | null>(null)

  useEffect(() => {
    if (!resolvedGradient) return
    if (width <= 0 || height <= 0) return

    const alg = (algorithm ?? configToUse.algorithm ?? 'bayer4x4')
    if (!isOrderedAlgorithm(alg)) {
      console.warn(
        `[DitherBox] The gradient API requires an ordered (Bayer) algorithm, but received "${alg}". ` +
        'Nothing will render. Use algorithm="bayer4x4" (or similar) with gradient props.'
      )
      return
    }

    let cancelled = false

    const bias = configToUse.threshold !== undefined ? (configToUse.threshold - 0.5) * 2 : 0
    const opts = {
      gradient: resolvedGradient,
      algorithm: alg as OrderedAlgorithm,
      width,
      height,
      threshold: bias,
      pixelScale,
      glitch,
    }

    renderGradientDitherAuto(opts, renderer).then(imageData => {
      if (cancelled) return
      const offscreen = document.createElement('canvas')
      offscreen.width = imageData.width
      offscreen.height = imageData.height
      offscreen.getContext('2d')!.putImageData(imageData, 0, 0)
      setGradientDataURL(offscreen.toDataURL())
    }).catch(() => {
      if (cancelled) return
      setGradientDataURL(renderGradientToDataURL(opts))
    })

    return () => {
      cancelled = true
    }
  }, [
    resolvedGradient, algorithm, configToUse.algorithm,
    configToUse.threshold,
    width, height, pixelScale, glitch, renderer,
  ])

  // LEGACY TILE PATH: Bayer + solid source (when not using new gradient API).
  const usesTilePath = !usesNewAPI && isOrderedAlgorithm(configToUse.algorithm)

  // useBayerTile must be called unconditionally (React hooks rules), so when the
  // algorithm isn't ordered we pass a safe fallback.
  const bayerTile = useBayerTile(
    isOrderedAlgorithm(configToUse.algorithm) ? configToUse.algorithm : 'bayer4x4',
    configToUse.threshold ?? 0.5,
    configToUse.colorMode ?? 'duotone',
    configToUse.colors ?? { fg: '#ffffff', bg: '#000000' },
    pixelScale
  )

  // Build styles based on mode
  const ditherStyles = useMemo((): CSSProperties => {
    // NEW GRADIENT API styles
    if (usesNewAPI && gradientDataURL) {
      switch (mode) {
        case 'background':
          return {
            backgroundImage: `url(${gradientDataURL})`,
            backgroundSize: '100% 100%',
          }
        case 'mask':
          return {
            maskImage: `url(${gradientDataURL})`,
            WebkitMaskImage: `url(${gradientDataURL})`,
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
            maskMode: 'luminance',
            WebkitMaskMode: 'luminance',
          } as CSSProperties
        case 'full':
          return {}
      }
    }

    // LEGACY TILE PATH styles
    if (usesTilePath) {
      const tileUrl = bayerTile.tileDataURL ? `url(${bayerTile.tileDataURL})` : undefined
      const displaySize = bayerTile.tileSize * pixelScale

      if (mode === 'mask' && tileUrl) {
        return {
          ...bayerTile.containerStyle,
          WebkitMaskImage: tileUrl,
          maskImage: tileUrl,
          WebkitMaskSize: `${displaySize}px ${displaySize}px`,
          maskSize: `${displaySize}px ${displaySize}px`,
          WebkitMaskRepeat: 'repeat',
          maskRepeat: 'repeat',
          maskMode: 'luminance',
          WebkitMaskMode: 'luminance',
        } as CSSProperties
      }

      return bayerTile.containerStyle
    }

    return {}
  }, [usesNewAPI, gradientDataURL, usesTilePath, bayerTile.containerStyle, bayerTile.tileDataURL, bayerTile.tileSize, pixelScale, mode])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        ...ditherStyles,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* NEW GRADIENT API: full mode overlay */}
      {usesNewAPI && mode === 'full' && gradientDataURL && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${gradientDataURL})`,
            backgroundSize: '100% 100%',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      {/* LEGACY TILE PATH: colored mask layer (background + full modes only) */}
      {!usesNewAPI && usesTilePath && mode !== 'mask' && bayerTile.tileDataURL && (
        <div style={{
          ...bayerTile.maskLayerStyle,
          zIndex: mode === 'full' ? 2 : 1,
        }} />
      )}

      <div style={{
        position: 'relative',
        zIndex: mode === 'full' ? 3 : (usesTilePath && mode === 'background') ? 2 : undefined,
      }}>
        {children}
      </div>
    </div>
  )
}
