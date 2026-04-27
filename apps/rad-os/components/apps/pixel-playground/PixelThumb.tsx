import type { PixelGrid } from '@rdna/pixel';
import { bitsToPath } from '@rdna/pixel';

interface PixelThumbProps {
  grid: PixelGrid;
  size?: number;
  bg?: string;
  className?: string;
}

export function PixelThumb({
  grid,
  size = 40,
  bg = 'var(--color-page)',
  className = '',
}: PixelThumbProps) {
  const d = bitsToPath(grid.bits, grid.width, grid.height);
  return (
    <svg
      className={`text-main ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${grid.width} ${grid.height}`}
      aria-hidden
      style={{ imageRendering: 'pixelated' }}
    >
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:pixel-thumb-preview-surface owner:logo-maker expires:2027-01-01 issue:DNA-001 */}
      <rect width={grid.width} height={grid.height} fill={bg} />
      <path d={d} fill="currentColor" />
    </svg>
  );
}
