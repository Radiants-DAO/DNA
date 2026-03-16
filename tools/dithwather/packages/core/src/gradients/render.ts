import type { ResolvedGradient, StopSegment } from './types'
import type { OrderedAlgorithm } from '../types'
import { findStopSegment } from './types'
import { gradientValue } from './distance'
import { BAYER_MATRICES } from '../algorithms/bayer'
import { hexToRgb } from '../utils/color'
import type { RGB } from '../types'

const DATA_URL_DOM_ERROR =
  'renderGradientToDataURL requires browser-like DOM canvas APIs'
const OBJECT_URL_DOM_ERROR =
  'renderGradientToObjectURL requires browser-like DOM canvas APIs'

class ImageDataShim {
  readonly colorSpace = 'srgb'
  readonly data: Uint8ClampedArray
  readonly height: number
  readonly width: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.data = new Uint8ClampedArray(width * height * 4)
  }
}

function createImageData(width: number, height: number): ImageData {
  if (typeof ImageData !== 'undefined') {
    return new ImageData(width, height)
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    return ctx.createImageData(width, height)
  }
  return new ImageDataShim(width, height) as ImageData
}

function normalizeGlitchOffset(
  row: number,
  glitch: number,
  width: number
): number {
  if (glitch <= 0 || width <= 0) return 0
  const rawOffset = Math.round(row * glitch)
  return ((rawOffset % width) + width) % width
}

export interface GradientDitherOptions {
  gradient: ResolvedGradient
  algorithm: OrderedAlgorithm
  width: number
  height: number
  /** Global threshold bias. Shifts all transitions. Typical range: -1 to 1. Default: 0 */
  threshold?: number
  /** Pixel scale — each logical pixel maps to a scale*scale block. Default: 1 */
  pixelScale?: number
  /** Stride offset for deliberate scanline glitch effect. Default: 0 (no glitch) */
  glitch?: number
}

/**
 * Render a dithered gradient to ImageData using per-pixel Bayer comparison.
 * Zero banding — continuous threshold comparison, no tile quantization.
 */
export function renderGradientDither(options: GradientDitherOptions): ImageData {
  const {
    gradient,
    algorithm,
    width: rawWidth,
    height: rawHeight,
    threshold: bias = 0,
    pixelScale: rawPixelScale = 1,
    glitch = 0,
  } = options

  // Round fractional dimensions to prevent stride mismatch with ImageData
  const width = Math.round(rawWidth)
  const height = Math.round(rawHeight)

  const pixelScale = Math.max(1, Math.round(rawPixelScale))

  const matrix = BAYER_MATRICES[algorithm]
  if (!matrix) throw new Error(`Unknown algorithm: ${algorithm}`)

  const matrixSize = matrix.length

  // Create ImageData via canvas context (works in both browser and jsdom)
  const imageData = createImageData(width, height)
  const data = imageData.data

  // Pre-resolve center/radius to pixel coordinates
  const cx = gradient.center[0] * width
  const cy = gradient.center[1] * height
  const maxDim = Math.sqrt(width * width + height * height) / 2
  const rx = gradient.radius * maxDim * (1 / gradient.aspect)
  const ry = gradient.radius * maxDim

  // Pre-parse stop colors to RGB, keyed by color string for dedup
  const colorCache = new Map<string, RGB>()
  for (const stop of gradient.stops) {
    if (!colorCache.has(stop.color)) {
      colorCache.set(stop.color, hexToRgb(stop.color))
    }
  }

  // Pre-allocate a single StopSegment to reuse across all pixels
  const seg: StopSegment = { colorA: '', colorB: '', localT: 0 }

  for (let py = 0; py < height; py++) {
    const rowOffset = normalizeGlitchOffset(py, glitch, width)

    for (let px = 0; px < width; px++) {
      const outX = rowOffset === 0 ? px : (px + rowOffset) % width
      const i = (py * width + outX) * 4

      // Logical pixel position (for Bayer matrix lookup with pixelScale)
      const lx = Math.floor(px / pixelScale)
      const ly = Math.floor(py / pixelScale)

      // 1. Evaluate gradient distance function.
      //    Sample at block center so all pixels in a scaled block get the
      //    same t value — prevents partial-block clipping at thresholds.
      const sampleX = lx * pixelScale + pixelScale * 0.5
      const sampleY = ly * pixelScale + pixelScale * 0.5
      const t = gradientValue(
        sampleX, sampleY, width, height,
        gradient.type, gradient.angle,
        cx, cy, rx, ry, gradient.startAngle
      )

      // 2. Find stop segment (reuses pre-allocated seg object)
      findStopSegment(t, gradient.stops, seg)

      // 3. Get Bayer threshold at this logical pixel
      const bayerThreshold = matrix[ly % matrixSize][lx % matrixSize]

      // 4. Compare local threshold (with bias) against Bayer value
      const useColorB = (seg.localT + bias) > bayerThreshold

      // 5. Pick color
      const rgb = colorCache.get(useColorB ? seg.colorB : seg.colorA)!
      data[i] = rgb.r
      data[i + 1] = rgb.g
      data[i + 2] = rgb.b
      data[i + 3] = 255
    }
  }

  return imageData
}

/**
 * Render a dithered gradient to a data URL.
 * Requires DOM (document.createElement).
 */
export function renderGradientToDataURL(options: GradientDitherOptions): string {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    throw new Error(DATA_URL_DOM_ERROR)
  }

  const imageData = renderGradientDither(options)
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

/**
 * Render a dithered gradient to a blob object URL.
 * Faster than toDataURL (avoids base64 encoding overhead).
 * Caller must call URL.revokeObjectURL() when done.
 */
export function renderGradientToObjectURL(
  options: GradientDitherOptions,
  callback: (url: string) => void
): void {
  if (
    typeof document === 'undefined' ||
    typeof document.createElement !== 'function' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    throw new Error(OBJECT_URL_DOM_ERROR)
  }

  const imageData = renderGradientDither(options)
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  if (typeof canvas.toBlob !== 'function') {
    throw new Error(OBJECT_URL_DOM_ERROR)
  }
  canvas.toBlob((blob) => {
    if (blob) {
      callback(URL.createObjectURL(blob))
    }
  })
}
