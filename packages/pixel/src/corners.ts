import { mirrorH, mirrorV } from './core.js';
import type { CornerPosition, PixelGrid } from './types.js';

export { prepareCornerProfile, prepareCornerRecipe } from './corners/prepare.js';
export {
  clampCornerRadii,
  fitCornerRadii,
  materializeCornerRecipe,
  materializeCornerStyle,
} from './corners/runtime.js';
export {
  generateShape,
  listCornerShapeNames,
  registerCornerDefinition,
} from './corners/registry.js';
export {
  CORNER_SETS,
  getCornerSet,
} from './corners/authoring/presets.js';
export { corner, cornerMap, fixedCorner, flatCorner, themedCorner } from './corners/helpers.js';
export { concave } from './concave.js';
export type { CornerSize } from './corners/authoring/presets.js';
export type { ConcaveCornerConfig, ConcaveCornerProps } from './concave.js';
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
  CornerShapeName,
  CornerStyleMaterializeOptions,
  CornerValue,
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
} from './corners/types.js';

export function mirrorForCorner(
  tl: PixelGrid,
  position: CornerPosition,
): PixelGrid {
  switch (position) {
    case 'tl':
      return tl;
    case 'tr':
      return mirrorH(tl);
    case 'bl':
      return mirrorV(tl);
    case 'br':
      return mirrorH(mirrorV(tl));
  }
}

export function getCornerStyle(
  position: CornerPosition,
  gridSize: number,
  pixelSize: number,
): Record<string, string | number> {
  const size = gridSize * pixelSize;
  const base: Record<string, string | number> = {
    position: 'absolute',
    width: size,
    height: size,
  };

  switch (position) {
    case 'tl':
      return { ...base, top: 0, left: 0 };
    case 'tr':
      return { ...base, top: 0, right: 0 };
    case 'bl':
      return { ...base, bottom: 0, left: 0 };
    case 'br':
      return { ...base, bottom: 0, right: 0 };
  }
}

export const CORNER_POSITIONS: CornerPosition[] = ['tl', 'tr', 'bl', 'br'];
