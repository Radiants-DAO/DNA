'use client';

import type { ComponentType } from 'react';
import { PixelPlayground, type PixelMode } from '@/components/apps/pixel-playground';

type LockedPixelPlaygroundProps = {
  initialMode: PixelMode;
  lockedMode?: boolean;
};

const LockedPixelPlayground =
  PixelPlayground as ComponentType<LockedPixelPlaygroundProps>;

export function PatternsTab() {
  // PixelPlayground owns the pattern editor/review layout: tools on the left,
  // canvas centered, and repeat preview/output on the right.
  return <LockedPixelPlayground initialMode="patterns" lockedMode />;
}

export default PatternsTab;
