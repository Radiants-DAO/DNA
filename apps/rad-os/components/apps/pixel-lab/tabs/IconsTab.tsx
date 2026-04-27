'use client';

import type { ComponentType } from 'react';
import { PixelPlayground } from '@/components/apps/pixel-playground';
import type { PixelMode } from '@/components/apps/pixel-playground';

interface LockedPixelPlaygroundProps {
  initialMode: PixelMode;
  lockedMode: boolean;
}

const LockedPixelPlayground =
  PixelPlayground as ComponentType<LockedPixelPlaygroundProps>;

export function IconsTab() {
  // Icons delegates to the Pixel Playground editor/review surface so the
  // registry explorer, authoring canvas, generated output, and 16px/24px
  // runtime preview stay in one implementation.
  return <LockedPixelPlayground initialMode="icons" lockedMode />;
}

export default IconsTab;
