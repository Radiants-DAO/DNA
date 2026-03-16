import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { OrderedAlgorithm, ColorMode, DitherColors, DuotoneColors } from '@rdna/dithwather-core'
import { getTileBits, getTileDataURL, getTileSize, hexToRgb } from '@rdna/dithwather-core'

export interface BayerTileResult {
  /** CSS properties for the container element */
  containerStyle: CSSProperties
  /** CSS properties for the mask overlay layer */
  maskLayerStyle: CSSProperties
  /** Data URL for alpha-mask usage */
  maskTileDataURL: string
  /** The tile size in pixels */
  tileSize: number
  /** The tile data URL (for debugging/export) */
  tileDataURL: string
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function toRgba(color: string, alpha: number): string {
  const { r, g, b } = hexToRgb(color)
  return `rgba(${r}, ${g}, ${b}, ${clampUnit(alpha)})`
}

function createMaskTileDataURL(
  algorithm: OrderedAlgorithm,
  threshold: number,
  intensity: number
): string {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return ''
  }

  const normalizedIntensity = clampUnit(intensity)
  if (normalizedIntensity >= 1) {
    return getTileDataURL(algorithm, threshold)
  }

  const bits = getTileBits(algorithm, threshold)
  const size = getTileSize(algorithm)
  const offAlpha = Math.round((1 - normalizedIntensity) * 255)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const imageData = ctx.createImageData(size, size)
  const { data } = imageData

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bitIndex = y * size + x
      const isOn = ((bits >> BigInt(bitIndex)) & 1n) === 1n
      const i = (bitIndex) * 4

      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = isOn ? 255 : offAlpha
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Hook that returns CSS-ready styles for a Bayer tile pattern.
 *
 * Uses CSS mask-image for coloring:
 * - The tile is a white-on-transparent alpha mask
 * - background-color on the mask layer provides the fg color
 * - background-color on the container provides the bg color (duotone)
 */
export function useBayerTile(
  algorithm: OrderedAlgorithm,
  threshold: number,
  colorMode: ColorMode,
  colors: DitherColors,
  pixelScale: number = 1,
  intensity: number = 1
): BayerTileResult {
  const normalizedIntensity = clampUnit(intensity)
  const tileSize = getTileSize(algorithm)
  const displaySize = tileSize * pixelScale

  // Only recompute tile when algorithm or threshold changes
  const tileDataURL = useMemo(
    () => {
      if (typeof document === 'undefined') return ''
      return getTileDataURL(algorithm, threshold)
    },
    [algorithm, threshold]
  )

  const maskTileDataURL = useMemo(
    () => createMaskTileDataURL(algorithm, threshold, normalizedIntensity),
    [algorithm, threshold, normalizedIntensity]
  )

  const maskUrl = `url(${tileDataURL})`

  const bg = (colors as DuotoneColors).bg
  const containerStyle = useMemo((): CSSProperties => {
    if (colorMode === 'duotone') {
      return { backgroundColor: toRgba(bg, normalizedIntensity) }
    }
    return {}
  }, [colorMode, bg, normalizedIntensity])

  const maskLayerStyle = useMemo((): CSSProperties => {
    if (!tileDataURL) return { display: 'none' }

    return {
      position: 'absolute',
      inset: 0,
      backgroundColor: colors.fg,
      WebkitMaskImage: maskUrl,
      maskImage: maskUrl,
      WebkitMaskSize: `${displaySize}px ${displaySize}px`,
      maskSize: `${displaySize}px ${displaySize}px`,
      WebkitMaskRepeat: 'repeat',
      maskRepeat: 'repeat',
      imageRendering: 'pixelated',
      opacity: normalizedIntensity,
      pointerEvents: 'none',
    } as CSSProperties
  }, [tileDataURL, displaySize, colors.fg, maskUrl, normalizedIntensity])

  return { containerStyle, maskLayerStyle, maskTileDataURL, tileSize, tileDataURL }
}
