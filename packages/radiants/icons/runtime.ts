/**
 * Lean runtime icon entrypoint.
 *
 * Use this when you only need the dynamic `Icon` wrapper and brand/runtime
 * icons, without pulling the eager generated icon barrels. The exported
 * `IconProps` type matches the bitmap-backed public `Icon` surface.
 */

export { Icon } from './Icon';
export { type BrandIconProps, type IconProps, type IconSet } from './types';
export {
  RadMarkIcon,
  RadSunLogo,
  WordmarkLogo,
  FontAaIcon,
} from './DesktopIcons';
