/**
 * Radiants Icon System
 *
 * Primary: Inline icon components generated from assets/icons/ SVGs
 *   import { Search, BarChart } from '@rdna/radiants/icons';
 *   <Search size={24} />
 *
 * Dynamic loader (fallback for runtime icon names):
 *   import { Icon } from '@rdna/radiants/icons';
 *   <Icon name="search" size={24} />
 *
 * Brand/special icons (non-SVG or runtime color props):
 *   import { RadMarkIcon, WordmarkLogo } from '@rdna/radiants/icons';
 */

// Types
export { type IconProps, ICON_SIZE, type IconSize } from './types';

// Dynamic SVG loader (fallback — sources from assets/icons/ at runtime)
export { Icon } from './Icon';

// Generated inline icon components (154 icons from assets/icons/)
export * from './generated';

// Brand & special icons (require runtime props or non-SVG rendering)
export {
  RadMarkIcon,
  RadSunLogo,
  WordmarkLogo,
  FontAaIcon,
} from './DesktopIcons';
