import type { SVGProps } from 'react';

/**
 * Radiants Icon System Types
 *
 * Dual-size SVG icon system: 16px authored SVG icons and 24px authored SVG
 * icons resolved through the prepared manifest.
 */

/** The two icon sets available */
export type IconSet = 16 | 24;

export interface PreparedSvgIcon {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly availableSets: readonly IconSet[];
  readonly importerKeys: Readonly<Partial<Record<IconSet, string>>>;
  readonly preferredLargeName?: string;
  readonly preferredSmallName?: string;
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  /** SVG icon name (canonical name, alias, or preferred large/small name). */
  name: string;
  /** Render size in CSS pixels. Resolved icons still snap to the 16px or 24px sets. */
  size?: number;
  /** When true, renders at 24px using the 24px icon set. Default: 16px. */
  large?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Deprecated no-op compatibility prop from the old fetched-SVG path. */
  basePath?: string;
}

/**
 * Shared sizing props for the inline brand/text helpers in this folder.
 */
export interface BrandIconProps {
  /** Render size in CSS pixels. */
  size?: number;
  /** When true, renders at 24px. Default: 16px. */
  large?: boolean;
  /** Additional CSS classes */
  className?: string;
}
