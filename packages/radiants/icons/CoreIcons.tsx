/**
 * Radiants Core Icons (kept subset)
 *
 * Most icons now live as SVGs in assets/icons/ and are loaded
 * via the dynamic <Icon name="..." /> component.
 *
 * These inline components remain for icons with no asset equivalent
 * or high-frequency usage where inline rendering is preferred.
 */

import type { IconProps } from './types';

function createIcon(
  displayName: string,
  path: string,
  viewBox = '0 0 16 16'
) {
  const Icon = ({ size = 16, className = '', ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d={path} />
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

// ---------------------------------------------------------------------------
// Grid & Layout
// ---------------------------------------------------------------------------

export const Grid3X3 = createIcon(
  'Grid3X3',
  'M2,2H5V5H2V2ZM2,6H5V10H2V6ZM2,11H5V14H2V11ZM6,2H10V5H6V2ZM6,6H10V10H6V6ZM6,11H10V14H6V11ZM11,2H14V5H11V2ZM11,6H14V10H11V6ZM11,11H14V14H11V11Z'
);

export const GripHorizontal = createIcon(
  'GripHorizontal',
  'M3,5H5V7H3V5ZM7,5H9V7H7V5ZM11,5H13V7H11V5ZM3,9H5V11H3V9ZM7,9H9V11H7V9ZM11,9H13V11H11V9Z'
);

export const GripVertical = createIcon(
  'GripVertical',
  'M5,3H7V5H5V3ZM9,3H11V5H9V3ZM5,7H7V9H5V7ZM9,7H11V9H9V7ZM5,11H7V13H5V11ZM9,11H11V13H9V11Z'
);

// ---------------------------------------------------------------------------
// UI Elements
// ---------------------------------------------------------------------------

export const MoreHorizontal = createIcon(
  'MoreHorizontal',
  'M2,7H4V9H2V7ZM7,7H9V9H7V7ZM12,7H14V9H12V7Z'
);

export const MoreVertical = createIcon(
  'MoreVertical',
  'M7,2H9V4H7V2ZM7,7H9V9H7V7ZM7,12H9V14H7V12Z'
);

// ---------------------------------------------------------------------------
// Design Tools
// ---------------------------------------------------------------------------

/** Wand / Sparkles icon */
const Wand2 = createIcon(
  'Wand2',
  'M4,7H5V5H6V3H7V2H12V4H11V5H10V6H9V7H12V9H11V10H10V11H9V12H8V13H7V14H6V12H7V10H8V9H4V7Z'
);

export { Wand2 };
export const Sparkles = Wand2;
