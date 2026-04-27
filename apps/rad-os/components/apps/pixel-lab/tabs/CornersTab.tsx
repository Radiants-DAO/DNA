'use client';

import type { ComponentType } from 'react';
import { PixelPlayground } from '@/components/apps/pixel-playground';

type LockedCornerPlaygroundProps = {
  initialMode: 'corners';
  lockedMode: true;
};

const LockedCornerPlayground =
  PixelPlayground as ComponentType<LockedCornerPlaygroundProps>;

export function CornersTab() {
  return <LockedCornerPlayground initialMode="corners" lockedMode />;
}

export default CornersTab;
