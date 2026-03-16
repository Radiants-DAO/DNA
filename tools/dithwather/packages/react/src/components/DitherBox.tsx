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
  renderGradientDither,
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
  algorithm?: OrderedAlgorithm
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

function clampUnit(value: number | undefined): number {
  return Math.max(0, Math.min(1, value ?? 1))
}

function createCanvasDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

function createMaskImageData(
  imageData: ImageData,
  intensity: number
): ImageData {
  const data = new Uint8ClampedArray(imageData.data.length)
  const normalizedIntensity = clampUnit(intensity)

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i]
    const g = imageData.data[i + 1]
    const b = imageData.data[i + 2]
    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    const alpha = Math.round(255 - (255 - luminance) * normalizedIntensity)

    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
    data[i + 3] = alpha
  }

  return new ImageData(data, imageData.width, imageData.height)
}

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
  const effectOpacity = clampUnit(configToUse.intensity)
  const requestedAlgorithm = configToUse.algorithm ?? DEFAULT_CONFIG.algorithm
  const orderedAlgorithm = isOrderedAlgorithm(requestedAlgorithm)
    ? requestedAlgorithm
    : 'bayer4x4'
  const invalidAlgorithmWarningRef = useRef<string | null>(null)

  // NEW GRADIENT PATH
  const [gradientMaskURL, setGradientMaskURL] = useState<string | null>(null)
  const [gradientImageData, setGradientImageData] = useState<ImageData | null>(null)

  useEffect(() => {
    if (!resolvedGradient || width <= 0 || height <= 0) {
      setGradientMaskURL(null)
      setGradientImageData(null)
      return
    }

    if (!isOrderedAlgorithm(requestedAlgorithm) && invalidAlgorithmWarningRef.current !== requestedAlgorithm) {
      invalidAlgorithmWarningRef.current = requestedAlgorithm
      console.warn(
        `[DitherBox] Received unsupported algorithm "${requestedAlgorithm}". ` +
        'Falling back to "bayer4x4" because React components only support ordered Bayer rendering.'
      )
    } else if (isOrderedAlgorithm(requestedAlgorithm)) {
      invalidAlgorithmWarningRef.current = null
    }

    let cancelled = false

    const bias = configToUse.threshold !== undefined ? (configToUse.threshold - 0.5) * 2 : 0
    const opts = {
      gradient: resolvedGradient,
      algorithm: orderedAlgorithm,
      width,
      height,
      threshold: bias,
      pixelScale,
      glitch,
    }

    const commitImageData = (imageData: ImageData) => {
      if (cancelled) return

      if (mode === 'mask') {
        const maskImageData = createMaskImageData(imageData, effectOpacity)
        setGradientImageData(null)
        setGradientMaskURL(createCanvasDataURL(maskImageData))
        return
      }

      setGradientMaskURL(null)
      setGradientImageData(imageData)
    }

    renderGradientDitherAuto(opts, renderer)
      .then(commitImageData)
      .catch(() => {
        if (cancelled) return

        try {
          commitImageData(renderGradientDither(opts))
        } catch {
          setGradientMaskURL(null)
          setGradientImageData(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    resolvedGradient, requestedAlgorithm, orderedAlgorithm,
    configToUse.threshold, effectOpacity,
    width, height, pixelScale, glitch, renderer, mode,
  ])

  // LEGACY TILE PATH: Bayer + solid source (when not using new gradient API).
  const usesTilePath = !usesNewAPI
  const bayerTile = useBayerTile(
    orderedAlgorithm,
    configToUse.threshold ?? 0.5,
    configToUse.colorMode ?? 'duotone',
    configToUse.colors ?? { fg: '#ffffff', bg: '#000000' },
    pixelScale,
    effectOpacity
  )

  // Build styles based on mode
  const ditherStyles = useMemo((): CSSProperties => {
    // NEW GRADIENT API styles
    if (usesNewAPI && mode === 'mask' && gradientMaskURL) {
      return {
        maskImage: `url(${gradientMaskURL})`,
        WebkitMaskImage: `url(${gradientMaskURL})`,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskMode: 'alpha',
        WebkitMaskMode: 'alpha',
      } as CSSProperties
    }

    // LEGACY TILE PATH styles
    if (usesTilePath) {
      const tileUrl = bayerTile.tileDataURL ? `url(${bayerTile.tileDataURL})` : undefined
      const displaySize = bayerTile.tileSize * pixelScale

      if (mode === 'mask' && tileUrl) {
        return {
          ...bayerTile.containerStyle,
          WebkitMaskImage: `url(${bayerTile.maskTileDataURL})`,
          maskImage: `url(${bayerTile.maskTileDataURL})`,
          WebkitMaskSize: `${displaySize}px ${displaySize}px`,
          maskSize: `${displaySize}px ${displaySize}px`,
          WebkitMaskRepeat: 'repeat',
          maskRepeat: 'repeat',
          maskMode: 'alpha',
          WebkitMaskMode: 'alpha',
        } as CSSProperties
      }

      return bayerTile.containerStyle
    }

    return {}
  }, [usesNewAPI, mode, gradientMaskURL, usesTilePath, bayerTile.containerStyle, bayerTile.maskTileDataURL, bayerTile.tileDataURL, bayerTile.tileSize, pixelScale])

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
      {usesNewAPI && mode === 'background' && gradientImageData && (
        <GradientCanvasLayer imageData={gradientImageData} opacity={effectOpacity} zIndex={1} />
      )}

      {usesNewAPI && mode === 'full' && gradientImageData && (
        <GradientCanvasLayer imageData={gradientImageData} opacity={effectOpacity} zIndex={2} />
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
        zIndex:
          mode === 'full'
            ? 3
            : (usesTilePath || (usesNewAPI && mode === 'background' && gradientImageData))
              ? 2
              : undefined,
      }}>
        {children}
      </div>
    </div>
  )
}

interface GradientCanvasLayerProps {
  imageData: ImageData
  opacity: number
  zIndex: number
}

function GradientCanvasLayer({ imageData, opacity, zIndex }: GradientCanvasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = imageData.width
    canvas.height = imageData.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.putImageData(imageData, 0, 0)
  }, [imageData])

  return (
    <canvas
      aria-hidden="true"
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'pixelated',
        opacity,
        pointerEvents: 'none',
        zIndex,
      }}
    />
  )
}
