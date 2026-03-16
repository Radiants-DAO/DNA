/**
 * Radiants Icon System
 *
 * Primary: Dynamic Icon loader — loads SVGs at runtime from assets/icons/
 *   import { Icon } from '@rdna/radiants/icons';
 *   <Icon name="search" size={24} />
 *
 * Secondary: Named inline components (kept subset for high-frequency or special icons)
 *   import { RadMarkIcon, Grid3X3 } from '@rdna/radiants/icons';
 */

// Types
export { type IconProps, ICON_SIZE, type IconSize } from './types';

// Dynamic SVG loader (primary — sources from assets/icons/)
export { Icon } from './Icon';

// Inline icon components (kept subset)
export {
  Grid3X3,
  GripHorizontal,
  GripVertical,
  MoreHorizontal,
  MoreVertical,
  Sparkles,
} from './CoreIcons';

// Brand & special icons (require runtime props or non-SVG rendering)
export {
  RadMarkIcon,
  RadSunLogo,
  WordmarkLogo,
  FontAaIcon,
} from './DesktopIcons';
