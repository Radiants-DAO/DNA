/**
 * Icon System
 *
 * Two types of icons:
 * 1. Dynamic Icon loader - loads SVGs from public/assets/icons/
 * 2. Static Desktop Icons - pixel-art React components for RadOS UI
 *
 * Usage:
 *   // Dynamic loader (for custom icons)
 *   import { Icon } from '@/components/icons';
 *   <Icon name="arrow-left" size={24} className="text-blue-500" />
 *
 *   // Static pixel-art icons (for desktop UI - only RadMarkIcon, TreeIcon, etc.)
 *   import { RadMarkIcon, TreeIcon } from '@/components/icons';
 *   <RadMarkIcon size={16} />
 *   
 *   // Most icons now use the dynamic Icon loader
 *   <Icon name="home" size={16} />
 */

// Dynamic SVG loader
export { Icon } from './Icon';

// Static pixel-art icon components
export {
  // Standard sizes
  ICON_SIZE,
  type IconSize,
  // Brand
  RadMarkIcon,
  WordmarkLogo,
  RadSunLogo,
  // Navigation/App icons
  TreeIcon, // Keep TreeIcon as no SVG equivalent exists
  // UI icons
  DarkModeIcon,
  FontAaIcon,
  RobotIcon,
  ColorSwatchIcon,
  // Social icons
  TwitterIcon,
  DiscordIcon,
} from './DesktopIcons';

// Utility icons (using dynamic Icon loader)
export { CloseIcon, CopyIcon, CopiedIcon, HelpIcon, ComponentsIcon } from './UtilityIcons';
