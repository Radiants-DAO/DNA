/**
 * Dithwather Core Types
 */

// ============================================================================
// Algorithm Types
// ============================================================================

export type OrderedAlgorithm = 'bayer2x2' | 'bayer4x4' | 'bayer8x8'
export type ErrorDiffusionAlgorithm = 'floyd-steinberg'
export type DitherAlgorithm = OrderedAlgorithm | ErrorDiffusionAlgorithm

// ============================================================================
// Color Types
// ============================================================================

export interface RGB {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

export interface RGBA extends RGB {
  a: number // 0-255
}

export type ColorMode = 'mono' | 'duotone'

export interface MonoColors {
  fg: string // hex color for foreground
}

export interface DuotoneColors {
  fg: string // hex color for light pixels
  bg: string // hex color for dark pixels
}

export type DitherColors = MonoColors | DuotoneColors

// ============================================================================
// Configuration
// ============================================================================

export interface DitherConfig {
  /** Dithering algorithm to use */
  algorithm: DitherAlgorithm

  /** Color mode */
  colorMode: ColorMode

  /** Colors for dithering output */
  colors: DitherColors

  /** Blend between original (0) and dithered (1) */
  intensity: number

  /** Brightness threshold for mono/duotone (0-1) */
  threshold: number

  /** Brightness adjustment (-1 to 1) */
  brightness: number

  /** Contrast adjustment (-1 to 1) */
  contrast: number
}

export type PartialDitherConfig = Partial<DitherConfig>

// ============================================================================
// Renderer Types
// ============================================================================

export interface RenderOptions {
  /** Width in pixels */
  width: number

  /** Height in pixels */
  height: number

  /** Device pixel ratio (default: 1) */
  pixelRatio?: number
}

export interface RenderResult {
  /** The rendered canvas */
  canvas: HTMLCanvasElement | OffscreenCanvas

  /** Data URL of the rendered image */
  toDataURL: (type?: string, quality?: number) => string

  /** ImageData of the rendered result */
  imageData: ImageData
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_CONFIG: DitherConfig = {
  algorithm: 'bayer4x4',
  colorMode: 'duotone',
  colors: { fg: '#ffffff', bg: '#000000' },
  intensity: 1,
  threshold: 0.5,
  brightness: 0,
  contrast: 0,
}
