/**
 * Radiants Icon System Types
 *
 * Pixel-art icons for the radiants design system.
 * All icons use a 16x16 grid with currentColor for theming.
 */

import type { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Icon size in pixels (applies to both width and height) */
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
