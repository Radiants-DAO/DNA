import {
  BITMAP_ICONS_16,
  BITMAP_ICONS_24,
} from './generated-registry.ts';
import type { BitmapIconEntry } from './generated-registry.ts';

export const bitmapIconSource16 = Object.freeze(
  Object.values(BITMAP_ICONS_16),
) as readonly BitmapIconEntry[];

export const bitmapIconSource24 = Object.freeze(
  Object.values(BITMAP_ICONS_24),
) as readonly BitmapIconEntry[];

export const bitmapIconSource = Object.freeze([
  ...bitmapIconSource16,
  ...bitmapIconSource24,
]) as readonly BitmapIconEntry[];
