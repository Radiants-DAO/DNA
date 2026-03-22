/**
 * Compatibility re-exports — consumers should migrate to:
 *   import { ... } from '@/lib/windowSizing';
 *   import { ... } from '@/lib/apps';
 */

// Window sizing utilities
export { WINDOW_SIZES, resolveWindowSize, remToPx } from '@/lib/windowSizing';
export type { WindowSize, WindowSizeTier } from '@/lib/windowSizing';

// App types
export type { AppProps } from '@/lib/apps';

// Catalog selectors (compat shims — callers should migrate to @/lib/apps)
export {
  APP_CATALOG,
  getApp,
  isValidAppId,
  getDesktopLaunchers,
  getStartMenuSections,
  getWindowChrome,
  supportsAmbientWidget,
  getActiveAmbientApp,
} from '@/lib/apps';

// Default window configurations
export const DEFAULT_CASCADE_OFFSET = 30;
export const DEFAULT_WINDOW_POSITION = { x: 50, y: 50 };
export const MAX_WINDOWS_WARNING = 5;
