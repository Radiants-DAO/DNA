/**
 * @dithwather/core
 *
 * Pure JS dithering engine with classic algorithms
 */

// Types
export type {
  DitherAlgorithm,
  OrderedAlgorithm,
  ErrorDiffusionAlgorithm,
  ColorMode,
  RGB,
  RGBA,
  MonoColors,
  DuotoneColors,
  DitherColors,
  DitherConfig,
  PartialDitherConfig,
  RenderOptions,
  RenderResult,
} from './types'

export { DEFAULT_CONFIG } from './types'

// Algorithms
export {
  applyDither,
  applyBayerDither,
  applyFloydSteinbergDither,
  getBayerMatrix,
  isOrderedAlgorithm,
  BAYER_2X2,
  BAYER_4X4,
  BAYER_8X8,
  BAYER_MATRICES,
  type BayerMatrix,
  type BayerOptions,
  type FloydSteinbergOptions,
} from './algorithms'

// Renderer
export {
  renderToCanvas,
  renderToDataURL,
  type CanvasRendererOptions,
} from './renderer'

// Tiles
export {
  TILE_BITS,
  thresholdToLevel,
  getTileBits,
  getTileSize,
  getTileDataURL,
  clearTileCache,
} from './tiles'

// Gradients
export {
  type DitherGradientType,
  type DitherGradientStop,
  type DitherGradient,
  type ResolvedGradient,
  type StopSegment,
  type GradientDitherOptions,
  resolveStops,
  resolveGradient,
  findStopSegment,
  linearGradientValue,
  radialGradientValue,
  conicGradientValue,
  diamondGradientValue,
  reflectedGradientValue,
  gradientValue,
  renderGradientDither,
  renderGradientToDataURL,
  renderGradientToObjectURL,
} from './gradients'

// Utils
export {
  hexToRgb,
  rgbToHex,
  adjustBrightness,
  adjustContrast,
  luminance,
  lerpColor,
  mixHex,
} from './utils/color'
