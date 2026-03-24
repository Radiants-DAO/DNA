/**
 * Radiants Icon System
 *
 * Dual-size icon system: 16px pixel-art icons and 24px detailed icons.
 *
 * 16px inline components (primary):
 *   import { Search, BarChart } from '@rdna/radiants/icons';
 *   <Search size={16} />
 *
 * 24px inline components:
 *   import { InterfaceEssentialSearch1 } from '@rdna/radiants/icons';
 *   <InterfaceEssentialSearch1 size={24} />
 *
 * Dynamic loader (supports both sizes, auto-switches based on size):
 *   import { Icon } from '@rdna/radiants/icons';
 *   <Icon name="search" size={16} />   // loads 16px variant
 *   <Icon name="search" size={24} />   // loads 24px variant
 *
 * Brand/special icons (non-SVG or runtime color props):
 *   import { RadMarkIcon, WordmarkLogo } from '@rdna/radiants/icons';
 */

// Types
export { type IconProps, type IconSet, ICON_SIZE, type IconSize } from './types';

// Size mapping between 16px and 24px icon sets
export { ICON_16_TO_24, ICON_24_TO_16 } from './size-map';

// Dynamic SVG loader (supports both 16px and 24px sets)
export { Icon } from './Icon';

// Generated inline 16px icon components
export * from './generated';

// Generated inline 24px icon components
export * from './generated-24';

// Brand & special icons (require runtime props or non-SVG rendering)
export {
  RadMarkIcon,
  RadSunLogo,
  WordmarkLogo,
  FontAaIcon,
} from './DesktopIcons';
