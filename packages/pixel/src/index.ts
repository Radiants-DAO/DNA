export type {
  PixelGrid,
  PixelCornerSet,
  TransitionMode,
  TransitionConfig,
  PixelAnimation,
  CornerPosition,
} from './types.js';

export {
  parseBits,
  validateGrid,
  bitsToGrid,
  gridFromHex,
  mirrorH,
  mirrorV,
  diffBits,
} from './core.js';

export { paintGrid, paintTiledGrid, createGridCanvas } from './renderer.js';
export { listFilledRects } from './svg.js';
export { svgToGrid } from './import.js';
export {
  computeFlipOrder,
  interpolateFrame,
  animateTransition,
} from './transition.js';
export { mirrorForCorner, getCornerStyle, CORNER_POSITIONS } from './corners.js';
export { PATTERN_REGISTRY, getPattern } from './patterns.js';
export { CORNER_SETS, getCornerSet } from './corner-sets.js';
export type { CornerSize } from './corner-sets.js';
export { generateCorner } from './generate.js';
export { generatePixelCornerBorder } from './corner-border.js';
export type { ImportOptions, ImportReport } from './import.js';
export type { PatternEntry, PatternName } from './patterns.js';
