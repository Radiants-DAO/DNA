/**
 * Canvas Renderer
 *
 * Renders dithered output to a canvas element.
 */

import type {
  DitherConfig,
  RenderOptions,
  RenderResult,
  DuotoneColors,
  MonoColors,
} from '../types'
import { DEFAULT_CONFIG } from '../types'
import { applyDither } from '../algorithms'
import { hexToRgb } from '../utils/color'

const CANVAS_API_ERROR =
  'renderToCanvas requires browser-like canvas APIs'
const OFFSCREEN_TO_DATA_URL_ERROR =
  'renderToCanvas().toDataURL requires DOM canvas APIs when OffscreenCanvas is used'

// ============================================================================
// Canvas Creation
// ============================================================================

/**
 * Create a canvas (works in browser and with OffscreenCanvas)
 */
function createCanvas(
  width: number,
  height: number
): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    throw new Error(CANVAS_API_ERROR)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function isHTMLCanvasElement(
  canvas: HTMLCanvasElement | OffscreenCanvas
): canvas is HTMLCanvasElement {
  return typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement
}

/**
 * Get 2D context from canvas
 */
function getContext(
  canvas: HTMLCanvasElement | OffscreenCanvas
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas')
  }
  return ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
}

// ============================================================================
// Preprocessing
// ============================================================================

/**
 * Apply brightness and contrast adjustments to image data
 */
function applyAdjustments(
  imageData: ImageData,
  brightness: number,
  contrast: number
): void {
  if (brightness === 0 && contrast === 0) return

  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // Apply brightness
    if (brightness !== 0) {
      const adjust = brightness * 255
      r = Math.max(0, Math.min(255, r + adjust))
      g = Math.max(0, Math.min(255, g + adjust))
      b = Math.max(0, Math.min(255, b + adjust))
    }

    // Apply contrast
    if (contrast !== 0) {
      const factor = (1 + contrast) / (1 - contrast * 0.99)
      r = Math.max(0, Math.min(255, factor * (r - 128) + 128))
      g = Math.max(0, Math.min(255, factor * (g - 128) + 128))
      b = Math.max(0, Math.min(255, factor * (b - 128) + 128))
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}

// ============================================================================
// Color Mapping
// ============================================================================

/**
 * Map dithered grayscale to duotone colors
 */
function applyDuotoneColors(
  imageData: ImageData,
  colors: DuotoneColors
): void {
  const { data } = imageData
  const fg = hexToRgb(colors.fg)
  const bg = hexToRgb(colors.bg)

  for (let i = 0; i < data.length; i += 4) {
    // Dithered output is either 0 or 255
    const isLight = data[i] > 127

    if (isLight) {
      data[i] = fg.r
      data[i + 1] = fg.g
      data[i + 2] = fg.b
    } else {
      data[i] = bg.r
      data[i + 1] = bg.g
      data[i + 2] = bg.b
    }
  }
}

/**
 * Map dithered grayscale to mono (fg on transparent)
 */
function applyMonoColors(imageData: ImageData, colors: MonoColors): void {
  const { data } = imageData
  const fg = hexToRgb(colors.fg)

  for (let i = 0; i < data.length; i += 4) {
    const isLight = data[i] > 127

    if (isLight) {
      data[i] = fg.r
      data[i + 1] = fg.g
      data[i + 2] = fg.b
      data[i + 3] = 255
    } else {
      // Transparent
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 0
    }
  }
}

function blendWithOriginal(
  imageData: ImageData,
  originalData: Uint8ClampedArray,
  intensity: number
): void {
  const amount = Math.max(0, Math.min(1, intensity))
  if (amount >= 1) return

  const keepOriginal = 1 - amount
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(originalData[i] * keepOriginal + data[i] * amount)
    data[i + 1] = Math.round(originalData[i + 1] * keepOriginal + data[i + 1] * amount)
    data[i + 2] = Math.round(originalData[i + 2] * keepOriginal + data[i + 2] * amount)
    data[i + 3] = Math.round(originalData[i + 3] * keepOriginal + data[i + 3] * amount)
  }
}

// ============================================================================
// Main Renderer
// ============================================================================

export interface CanvasRendererOptions extends RenderOptions {
  /** Source to dither (gradient, solid color, or image) */
  source?:
    | { type: 'solid'; color: string }
    | { type: 'gradient'; colors: string[]; angle?: number }
    | { type: 'image'; image: HTMLImageElement | ImageBitmap }
}

/**
 * Render dithered output to canvas
 */
export function renderToCanvas(
  config: Partial<DitherConfig>,
  options: CanvasRendererOptions
): RenderResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const { width, height, pixelRatio = 1, source } = options

  const canvasWidth = Math.round(width * pixelRatio)
  const canvasHeight = Math.round(height * pixelRatio)

  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = getContext(canvas)

  // Fill source
  if (!source) {
    // Default: gray gradient for visible dithering
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
    gradient.addColorStop(0, '#000000')
    gradient.addColorStop(1, '#ffffff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  } else if (source.type === 'solid') {
    ctx.fillStyle = source.color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  } else if (source.type === 'gradient') {
    const angle = source.angle ?? 45
    const rad = (angle * Math.PI) / 180
    const x1 = canvasWidth / 2 - (Math.cos(rad) * canvasWidth) / 2
    const y1 = canvasHeight / 2 - (Math.sin(rad) * canvasHeight) / 2
    const x2 = canvasWidth / 2 + (Math.cos(rad) * canvasWidth) / 2
    const y2 = canvasHeight / 2 + (Math.sin(rad) * canvasHeight) / 2

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    source.colors.forEach((color, i) => {
      gradient.addColorStop(i / (source.colors.length - 1), color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  } else if (source.type === 'image') {
    ctx.drawImage(source.image, 0, 0, canvasWidth, canvasHeight)
  }

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const originalData = new Uint8ClampedArray(imageData.data)

  // Apply adjustments
  applyAdjustments(imageData, fullConfig.brightness, fullConfig.contrast)

  // Apply dithering algorithm
  applyDither(imageData, fullConfig.algorithm, fullConfig.threshold)

  // Apply color mapping
  if (fullConfig.colorMode === 'mono') {
    applyMonoColors(imageData, fullConfig.colors as MonoColors)
  } else {
    applyDuotoneColors(imageData, fullConfig.colors as DuotoneColors)
  }

  // Blend between the original source and the dithered result.
  blendWithOriginal(imageData, originalData, fullConfig.intensity)

  // Put back to canvas
  ctx.putImageData(imageData, 0, 0)

  return {
    canvas,
    imageData,
    toDataURL: (type = 'image/png', quality = 1) => {
      if (isHTMLCanvasElement(canvas)) {
        return canvas.toDataURL(type, quality)
      }
      if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
        throw new Error(OFFSCREEN_TO_DATA_URL_ERROR)
      }

      const temp = document.createElement('canvas')
      temp.width = canvasWidth
      temp.height = canvasHeight
      const tempCtx = temp.getContext('2d')!
      tempCtx.putImageData(imageData, 0, 0)
      return temp.toDataURL(type, quality)
    },
  }
}

/**
 * Render to data URL directly
 */
export function renderToDataURL(
  config: Partial<DitherConfig>,
  options: CanvasRendererOptions
): string {
  return renderToCanvas(config, options).toDataURL()
}
