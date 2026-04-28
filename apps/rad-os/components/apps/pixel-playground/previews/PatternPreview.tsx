'use client';

import { useId, useMemo } from 'react';
import { bitsToMergedRects, type PixelGrid } from '@rdna/pixel';

interface PatternPreviewProps {
  grid: PixelGrid | null;
}

/**
 * Shows the authored pattern tiled across a rectangle so the user can see how
 * it reads at in-use scale. Uses an SVG `<pattern>` def with merged rects, so
 * the same bits that ship in the registry are what render here.
 */
export function PatternPreview({ grid }: PatternPreviewProps) {
  const patternId = useId();

  const rects = useMemo(
    () => (grid ? bitsToMergedRects(grid.bits, grid.width, grid.height) : []),
    [grid],
  );

  return (
    <>
      {grid ? (
        <div
          data-rdna-brand-primitive
          className="h-full min-h-0 w-full"
          style={{
            /* The preview surface IS the authored asset — brand primitives are
             * intentional here so the tile is mode-stable. */
            backgroundColor: 'var(--color-cream)',
            imageRendering: 'pixelated',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${grid.width * 8} ${grid.height * 8}`}
            preserveAspectRatio="xMidYMid slice"
            shapeRendering="crispEdges"
            className="block w-full h-full"
            aria-label="Pattern preview"
          >
            <defs>
              <pattern
                id={patternId}
                patternUnits="userSpaceOnUse"
                width={grid.width}
                height={grid.height}
              >
                {rects.map((r, i) => (
                  <rect
                    data-rdna-brand-primitive
                    key={i}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill="var(--color-ink)"
                  />
                ))}
              </pattern>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={`url(#${patternId})`}
            />
          </svg>
        </div>
      ) : (
        <div className="flex h-full min-h-0 w-full items-center justify-center">
          <p className="text-sm text-mute text-center">
            Draw a pattern to preview
          </p>
        </div>
      )}
    </>
  );
}
