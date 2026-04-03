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
export type { ImportOptions, ImportReport } from './import.js';
