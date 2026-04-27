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
export { buildMaskAsset, maskHostStyle } from './mask.js';
export { svgToGrid } from './import.js';
export {
  computeFlipOrder,
  interpolateFrame,
  animateTransition,
} from './transition.js';
export { mirrorForCorner, getCornerStyle, CORNER_POSITIONS } from './corners.js';
export {
  clampCornerRadii,
  CORNER_SETS,
  fitCornerRadii,
  generateShape,
  getCornerSet,
  listCornerShapeNames,
  materializeCornerRecipe,
  materializeCornerStyle,
  prepareCornerProfile,
  prepareCornerRecipe,
  registerCornerDefinition,
  corner,
  cornerMap,
  fixedCorner,
  flatCorner,
  themedCorner,
} from './corners.js';
export { PATTERN_REGISTRY, getPattern, preparePattern, preparePatterns } from './patterns.js';
export {
  bandDensity,
  bayerMatrix,
  bayerThresholdBits,
  defaultDitherSteps,
  ditherBands,
  ditherRampBits,
} from './dither.js';
export type {
  BayerMatrixSize,
  BayerThresholdOptions,
  DitherBand,
  DitherBandsOptions,
  DitherDirection,
  DitherRampOptions,
  PreparedDitherBands,
} from './dither.js';
export { generateCorner } from './generate.js';
export { generatePixelCornerBorder } from './corner-border.js';
export { concave } from './concave.js';
export type { ConcaveCornerConfig, ConcaveCornerProps } from './concave.js';
export type { ImportOptions, ImportReport } from './import.js';
export type {
  BuiltInCornerShapeName,
  CornerBinding,
  CornerDefinition,
  CornerDescriptor,
  CornerGeneratorDefinition,
  CornerMap,
  CornerOverrideDefinition,
  CornerRecipeDefinition,
  CornerRecipeMaterializeOptions,
  CornerStyleMaterializeOptions,
  CornerValue,
  CornerShapeName,
  CornerSize,
  EdgeFlags,
  FixedCornerBinding,
  NormalizedCornerRecipe,
  PxConfigCanonical,
  PreparedCornerAsset,
  PreparedCornerProfile,
  PreparedCornerRecipe,
  PreparedCornerRecipeEntry,
  RequiredCornerMap,
  ThemeCornerBinding,
} from './corners.js';
export type {
  PatternEntry,
  PatternGroup,
  PatternGroupDefinition,
  PatternName,
  PreparedPattern,
} from './patterns.js';
export { bitsToMergedRects, bitsToPath, bitsToMaskURI } from './path.js';
export type { MergedRect } from './path.js';
export type { MaskAsset, MaskHostStyle, MaskHostStyleOptions } from './mask.js';
export {
  BITMAP_ICONS_16,
  BITMAP_ICONS_24,
  BitmapIcon,
  bitmapIconSource,
  bitmapIconSource16,
  bitmapIconSource24,
  convertSvgIconToPixelGrid,
  getBitmapIcon,
  getPixelIconDefinition,
  pixelIconRegistry,
  preparePixelIcon,
  preparePixelIconRegistry,
} from './icons.ts';
export type {
  BitmapIconEntry,
  BitmapIconProps,
  ConvertedSvgIcon,
  PixelIconDefinition,
  PixelIconEntry,
  PixelIconName,
  PreparedPixelIcon,
  SvgIconConversionOptions,
} from './icons.ts';
export { px } from './px.js';
export type { PxProps, PxConfig, PxOptions } from './px.js';
