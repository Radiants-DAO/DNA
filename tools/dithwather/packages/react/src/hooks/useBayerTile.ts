import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { OrderedAlgorithm, ColorMode, DitherColors, DuotoneColors } from '@rdna/dithwather-core'
import { getTileDataURL, getTileSize } from '@rdna/dithwather-core'

export interface BayerTileResult {
  /** CSS properties for the container element */
  containerStyle: CSSProperties
  /** CSS properties for the mask overlay layer */
  maskLayerStyle: CSSProperties
  /** The tile size in pixels */
  tileSize: number
  /** The tile data URL (for debugging/export) */
  tileDataURL: string
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
  pixelScale: number = 1
): BayerTileResult {
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

  const maskUrl = `url(${tileDataURL})`

  const bg = (colors as DuotoneColors).bg
  const containerStyle = useMemo((): CSSProperties => {
    if (colorMode === 'duotone') {
      return { backgroundColor: bg }
    }
    return {}
  }, [colorMode, bg])

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
      pointerEvents: 'none',
    } as CSSProperties
  }, [tileDataURL, displaySize, colors.fg, maskUrl])

  return { containerStyle, maskLayerStyle, tileSize, tileDataURL }
}
