'use client';

import PixelArtEditor from '@/components/apps/studio/PixelArtEditor';

export function RadiantsTab() {
  // Radiants is the Studio-locked canvas surface inside Pixel Lab: 32x32,
  // constrained palette, tools/paint on the left, layers/export on the right,
  // and status/history/Radnom controls in the bottom drawer.
  return <PixelArtEditor />;
}

export default RadiantsTab;
