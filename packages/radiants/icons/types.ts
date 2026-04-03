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
  /** Render size in CSS pixels. Generated assets come from the 16px or 24px sets. */
  size?: number;
  /** When true, renders at 24px using the 24px icon set. Default: 16px. */
  large?: boolean;
  /** Additional CSS classes */
  className?: string;
}
