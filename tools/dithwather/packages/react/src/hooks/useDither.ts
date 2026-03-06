import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import {
  renderToCanvas,
  renderToDataURL,
  DEFAULT_CONFIG,
  type DitherConfig,
  type PartialDitherConfig,
  type RenderResult,
} from '@rdna/dithwather-core'
import { useDitherContext } from '../context/DitherContext'

// ============================================================================
// Types
// ============================================================================

export interface UseDitherOptions {
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Device pixel ratio (default: window.devicePixelRatio or 1) */
  pixelRatio?: number
  /** Disable automatic rendering */
  manual?: boolean
}

export interface UseDitherResult {
  /** Ref to attach to a canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement>
  /** Current configuration */
  config: DitherConfig
  /** Update configuration */
  setConfig: (config: PartialDitherConfig) => void
  /** Manually trigger render */
  render: () => RenderResult | null
  /** Get current render as data URL */
  toDataURL: () => string
  /** Whether the canvas has been rendered */
  isRendered: boolean
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Low-level hook for dithering to a canvas
 */
export function useDither(
  initialConfig: PartialDitherConfig,
  options: UseDitherOptions
): UseDitherResult {
  const { defaults } = useDitherContext()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRendered, setIsRendered] = useState(false)

  const {
    width,
    height,
    pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    manual = false,
  } = options

  // Merge configs: defaults < initial
  const [localConfig, setLocalConfig] = useState<PartialDitherConfig>(initialConfig)

  const config: DitherConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...defaults,
      ...localConfig,
    }),
    [defaults, localConfig]
  )

  const setConfig = useCallback((newConfig: PartialDitherConfig) => {
    setLocalConfig((prev) => ({ ...prev, ...newConfig }))
  }, [])

  const render = useCallback((): RenderResult | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const result = renderToCanvas(config, {
      width,
      height,
      pixelRatio,
    })

    // Copy to our canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      ctx.putImageData(result.imageData, 0, 0)
    }

    setIsRendered(true)
    return result
  }, [config, width, height, pixelRatio])

  const toDataURL = useCallback((): string => {
    return renderToDataURL(config, {
      width,
      height,
      pixelRatio,
    })
  }, [config, width, height, pixelRatio])

  // Auto-render when config or dimensions change
  useEffect(() => {
    if (!manual && width > 0 && height > 0) {
      render()
    }
  }, [render, manual, width, height])

  return {
    canvasRef,
    config,
    setConfig,
    render,
    toDataURL,
    isRendered,
  }
}
