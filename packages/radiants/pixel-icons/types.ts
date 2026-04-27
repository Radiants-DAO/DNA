import type { PixelGrid } from '@rdna/pixel';
import type {
  PixelIconName,
  PreparedPixelIcon,
} from '@rdna/pixel/icons';

export type { PixelGrid } from '@rdna/pixel';
export type { PixelIconName } from '@rdna/pixel/icons';
export type PixelIconEntry = PreparedPixelIcon;

export type PixelIconSource = PixelGrid | PixelIconName;
