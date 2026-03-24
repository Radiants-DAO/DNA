/**
 * Radiants Icon System Types
 *
 * Dual-size icon system: 16px pixel-art icons and 24px detailed icons.
 * All icons use currentColor for theming.
 */

import type { SVGProps } from 'react';

/** The two icon sets available */
export type IconSet = 16 | 24;

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Render size in pixels (applies to both width and height) */
  size?: number | string;
  /** Additional CSS classes */
  className?: string;
}

export const ICON_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export type IconSize = keyof typeof ICON_SIZE;
