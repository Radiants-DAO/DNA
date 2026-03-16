import {
  useRef,
  useEffect,
  type CSSProperties,
} from 'react'
import {
  renderGradientDitherAuto,
  mixHex,
  type OrderedAlgorithm,
  type DitherGradientType,
  type ResolvedGradient,
} from '@rdna/dithwather-core'
import { useDitherContext } from '../context/DitherContext'
import { useResizeObserver } from '../hooks/useResizeObserver'
import { useReducedMotion } from '../hooks/useReducedMotion'

// ============================================================================
// Types
// ============================================================================

export interface DitherSkeletonProps {
  width?: string | number
  height?: number | string
  borderRadius?: number
  speed?: number
  bandWidth?: number
  easing?: 'linear' | 'ease-out' | 'ease-in-out'
  color?: string | string[]
  bgColor?: string
  opacity?: number
  colorOpacity?: number
  algorithm?: OrderedAlgorithm
  pixelScale?: number
  gradient?: DitherGradientType
  angle?: number
  wrap?: boolean
  blend?: boolean
  borderColor?: string
  borderOpacity?: number
  className?: string
  style?: CSSProperties
}

// ============================================================================
// Wrapping stops builder (skeleton-specific, not exported from core)
// ============================================================================

function buildWrappingStops(
  ringPos: number,
  bw: number,
  wrap: boolean,
  blend: boolean,
  bandColors: string[],
  bg: string,
  colorOpacity: number,
) {
  const colors =
    colorOpacity < 1
      ? bandColors.map((c) => mixHex(bg, c, colorOpacity))
      : [...bandColors]

  const n = colors.length
  const left = ringPos - bw
  const right = ringPos + bw
  const step = (2 * bw) / (n + 1)

  const innerStops = colors.map((color, i) => ({
    color,
    position: left + (i + 1) * step,
  }))

  // No wrapping needed (or wrapping disabled)
  if (!wrap || (left >= 0 && right <= 1)) {
    return [
      { color: bg, position: 0 },
      { color: bg, position: Math.max(0, left) },
      ...innerStops.map((s) => ({
        color: s.color,
        position: Math.max(0, Math.min(1, s.position)),
      })),
      { color: bg, position: Math.min(1, right) },
      { color: bg, position: 1 },
    ]
  }

  // Wraps right
  if (left >= 0) {
    const overflow = right - 1
    const nearest = colors[n - 1]
    const edgeColor = blend ? mixHex(bg, nearest, overflow / bw) : nearest
    return [
      { color: edgeColor, position: 0 },
      { color: bg, position: overflow },
      { color: bg, position: left },
      ...innerStops.filter((s) => s.position <= 1),
      { color: edgeColor, position: 1 },
    ]
  }

  // Wraps left
  if (right <= 1) {
    const overflow = -left
    const nearest = colors[0]
    const edgeColor = blend ? mixHex(bg, nearest, overflow / bw) : nearest
    return [
      { color: edgeColor, position: 0 },
      ...innerStops.filter((s) => s.position >= 0),
      { color: bg, position: right },
      { color: bg, position: 1 - overflow },
      { color: edgeColor, position: 1 },
    ]
  }

  // Wraps both sides
  return [
    { color: colors[n - 1], position: 0 },
    ...innerStops.filter((s) => s.position >= 0 && s.position <= 1),
    { color: colors[0], position: 1 },
  ]
}

// ============================================================================
// Component
// ============================================================================

export function DitherSkeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  speed = 2500,
  bandWidth = 0.25,
  easing = 'linear',
  color = '#ffffff',
  bgColor = '#0F0E0C',
  opacity = 0.2,
  colorOpacity = 1,
  algorithm = 'bayer4x4',
  pixelScale = 3,
  gradient = 'linear',
  angle = 90,
  wrap = true,
  blend = true,
  borderColor,
  borderOpacity,
  className,
  style,
}: DitherSkeletonProps) {
  const { renderer } = useDitherContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { width: containerWidth, height: containerHeight } = useResizeObserver(containerRef, 0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth <= 0 || containerHeight <= 0) return

    canvas.width = containerWidth
    canvas.height = containerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const bandColors = Array.isArray(color) ? color : [color]

    // Reduced motion: render single static frame at band center
    if (reducedMotion) {
      const stops = buildWrappingStops(0.5, bandWidth, wrap, blend, bandColors, bgColor, colorOpacity)
      const resolvedGradient: ResolvedGradient = {
        type: gradient,
        stops,
        angle,
        center: [0.5, 0.5],
        radius: 1,
        aspect: 1,
        startAngle: 0,
      }
      let cancelled = false
      renderGradientDitherAuto(
        { gradient: resolvedGradient, algorithm, width: containerWidth, height: containerHeight, pixelScale },
        renderer,
      ).then(imageData => {
        if (!cancelled) ctx.putImageData(imageData, 0, 0)
      })
      return () => { cancelled = true }
    }

    let frame: number
    let last = 0
    let pending = false
    let cleanedUp = false

    const animate = (time: number) => {
      frame = requestAnimationFrame(animate)

      if (time - last > 41 && !pending) {
        last = time
        pending = true

        let phase = (time / speed) % 1
        if (easing === 'ease-out') {
          phase = 1 - Math.pow(1 - phase, 3)
        } else if (easing === 'ease-in-out') {
          phase = phase < 0.5
            ? 4 * phase * phase * phase
            : 1 - Math.pow(-2 * phase + 2, 3) / 2
        }

        const stops = buildWrappingStops(phase, bandWidth, wrap, blend, bandColors, bgColor, colorOpacity)
        const resolvedGradient: ResolvedGradient = {
          type: gradient,
          stops,
          angle,
          center: [0.5, 0.5],
          radius: 1,
          aspect: 1,
          startAngle: 0,
        }

        const w = containerWidth
        const h = containerHeight
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
        }

        renderGradientDitherAuto(
          { gradient: resolvedGradient, algorithm, width: w, height: h, pixelScale },
          renderer,
        ).then(imageData => {
          if (!cleanedUp) ctx.putImageData(imageData, 0, 0)
          pending = false
        }).catch(() => {
          pending = false
        })
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cleanedUp = true
      cancelAnimationFrame(frame)
    }
  }, [
    containerWidth,
    containerHeight,
    reducedMotion,
    renderer,
    speed,
    bandWidth,
    easing,
    color,
    bgColor,
    colorOpacity,
    algorithm,
    pixelScale,
    gradient,
    angle,
    wrap,
    blend,
  ])

  const hasBorder = borderColor !== undefined && borderOpacity !== undefined && borderOpacity > 0

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        ...(hasBorder
          ? {
              border: `1px solid ${borderColor}${Math.round(borderOpacity! * 255)
                .toString(16)
                .padStart(2, '0')}`,
            }
          : undefined),
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', opacity, display: 'block' }}
      />
    </div>
  )
}
