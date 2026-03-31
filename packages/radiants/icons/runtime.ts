/**
 * Lean runtime icon entrypoint.
 *
 * Use this when you only need the dynamic `Icon` wrapper and brand/runtime
 * icons, without pulling the eager generated icon barrels.
 */

export { type IconProps, type IconSet } from './types';
export { Icon } from './Icon';
export {
  RadMarkIcon,
  RadSunLogo,
  WordmarkLogo,
  FontAaIcon,
} from './DesktopIcons';
