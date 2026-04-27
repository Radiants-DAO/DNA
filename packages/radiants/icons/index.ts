/**
 * Radiants Icon System
 *
 * One dynamic `<Icon>` component backed by generated SVG importers. Two sizes
 * available: 16px and 24px.
 *
 * Dynamic loader:
 *   import { Icon } from '@rdna/radiants/icons';
 *   <Icon name="search" />           // 16px (default)
 *   <Icon name="search" large />     // 24px
 *   <Icon name="search" size={24} /> // also 24px
 *
 * Brand/special icons (non-bitmap, runtime color props):
 *   import { RadMarkIcon, WordmarkLogo } from '@rdna/radiants/icons';
 */

// Types
export { type BrandIconProps, type IconProps, type IconSet } from './types';

// Size mapping between 16px and 24px icon sets
export { ICON_16_TO_24, ICON_24_TO_16 } from './size-map';

// Dynamic icon loader + brand/special icons
export {
  Icon,
  RadMarkIcon,
  RadSunLogo,
  WordmarkLogo,
  FontAaIcon,
} from './runtime';
