export {
  getPixelIconDefinition,
  pixelIconRegistry,
} from './icons/registry.ts';
export {
  preparePixelIcon,
  preparePixelIconRegistry,
} from './icons/prepare.ts';
export { convertSvgIconToPixelGrid } from './icons/convert.ts';
export {
  BITMAP_ICONS_16,
  BITMAP_ICONS_24,
  getBitmapIcon,
} from './icons/generated-registry.ts';
export {
  bitmapIconSource,
  bitmapIconSource16,
  bitmapIconSource24,
} from './icons/source.ts';
export type { BitmapIconEntry } from './icons/generated-registry.ts';
export { BitmapIcon } from './icons/BitmapIcon.tsx';
export type { BitmapIconProps } from './icons/BitmapIcon.tsx';
export type {
  PixelIconEntry,
  PixelIconName,
} from './icons/registry.ts';
export type {
  ConvertedSvgIcon,
  PixelIconDefinition,
  PreparedPixelIcon,
  SvgIconConversionOptions,
} from './icons/types.ts';
