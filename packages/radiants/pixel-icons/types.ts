import type { PixelGrid } from '@rdna/pixel';
import type { PixelIconName } from './source';

export type { PixelGrid } from '@rdna/pixel';
export type { PixelIconName } from './source';

export interface PixelIconEntry extends PixelGrid {
  readonly maskImage: string;
}

export type PixelIconSource = PixelGrid | PixelIconName;
