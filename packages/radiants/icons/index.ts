/**
 * Radiants Icon System
 *
 * Dual-size icon system: 16px pixel-art icons and 24px detailed icons.
 *
 * 16px inline components (primary, direct imports):
 *   import { Search, Home, Trash } from '@rdna/radiants/icons';
 *   <Search size={16} />
 *
 * 24px inline components (namespaced to avoid collisions):
 *   import { icons24 } from '@rdna/radiants/icons';
 *   <icons24.InterfaceEssentialSearch1 size={24} />
 *
 * 24px lookup map:
 *   import { ICON_24_BY_NAME } from '@rdna/radiants/icons';
 *   const SearchIcon24 = ICON_24_BY_NAME['interface-essential-search-1'];
 *
 * Dynamic loader (lean runtime entrypoint, supports both sizes):
 *   import { Icon } from '@rdna/radiants/icons/runtime';
 *   <Icon name="search" size={16} />   // loads 16px variant
 *   <Icon name="search" size={24} />   // loads 24px variant
 *
 * Brand/special icons (non-SVG or runtime color props):
 *   import { RadMarkIcon, WordmarkLogo } from '@rdna/radiants/icons/runtime';
 */

// Types
export { type IconProps, type IconSet } from './types';

// Size mapping between 16px and 24px icon sets
export { ICON_16_TO_24, ICON_24_TO_16 } from './size-map';

// Dynamic SVG loader (supports both 16px and 24px sets)
export { Icon } from './runtime';

// Generated inline 16px icon components (direct exports)
export * from './generated';
export {
  Close as CloseIcon,
  CopyToClipboard as CopyIcon,
  CommentsBlank as HelpIcon,
  Grid3X3 as ComponentsIcon,
} from './generated';

// Generated inline 24px icon components (namespaced to avoid collisions)
export * as icons24 from './generated-24';

// Re-export the 24px lookup map for programmatic access
export { ICON_24_BY_NAME, GENERATED_24_ICON_NAMES } from './generated-24';
export type { Generated24IconName } from './generated-24';

// Brand & special icons (require runtime props or non-SVG rendering)
export {
  RadMarkIcon,
  RadSunLogo,
  WordmarkLogo,
  FontAaIcon,
} from './runtime';
