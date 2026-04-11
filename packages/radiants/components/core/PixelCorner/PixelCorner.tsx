'use client';

import {
  getCornerSet,
  mirrorForCorner,
  listFilledRects,
  type CornerPosition,
} from '@rdna/pixel';

export type CornerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const ALL_CORNERS: CornerPosition[] = ['tl', 'tr', 'bl', 'br'];

export interface PixelCornerProps {
  /**
   * Corner size — single value for all corners,
   * or a record for mixed sizes per corner.
   */
  size: CornerSize | Partial<Record<CornerPosition, CornerSize>>;
  /**
   * Background color used to paint the cover layer that hides the
   * smooth CSS border-radius underneath.
   *
   * Accepts any CSS value including `var()` references.
   * @default 'var(--color-page)'
   */
  cornerBg?: string;
  /**
   * Border color for the 1px staircase edge.
   *
   * Accepts any CSS value including `var()` references.
   * @default 'var(--color-line)'
   */
  borderColor?: string;
  /**
   * Render scale — CSS pixels per grid cell.
   * @default 1
   */
  pixelSize?: number;
  /**
   * Inner fill color painted inside the arc to mask the container's
   * CSS border at the corners. Set to the element's own background
   * color so the staircase border cleanly replaces the CSS border.
   *
   * When omitted, the interior is transparent (no inner mask).
   */
  innerBg?: string;
  /**
   * Which corners to render. Omit corners that are flush
   * against a container edge (e.g. top corners of a bottom sheet).
   * @default all four
   */
  corners?: CornerPosition[];
}

/**
 * Renders pixel-art staircase corners as SVG overlays.
 *
 * Place inside a `position: relative` parent alongside content.
 * Each corner is a small absolutely-positioned SVG with two layers:
 * a cover layer (bg-colored, hides smooth CSS border-radius) and
 * a border layer (staircase edge).
 *
 * Uses SVG with CSS custom properties — no canvas, no getComputedStyle
 * hacks, SSR-safe.
 *
 * @example
 * ```tsx
 * // border-radius = grid size + 1px (9×9 md → 10px)
 * <div className="relative rounded-[10px] border border-line overflow-hidden">
 *   <PixelCorner size="md" />
 *   {children}
 * </div>
 * ```
 */
export function PixelCorner({
  size,
  cornerBg = 'var(--color-page)',
  borderColor = 'var(--color-line)',
  innerBg,
  pixelSize = 1,
  corners = ALL_CORNERS,
}: PixelCornerProps) {
  return (
    <>
      {corners.map((pos) => {
        const cornerSize = typeof size === 'string' ? size : size[pos];
        if (!cornerSize) return null;

        const set = getCornerSet(cornerSize);
        if (!set) return null;

        const coverGrid = mirrorForCorner(set.tl, pos);
        const coverRects = listFilledRects(coverGrid, pixelSize);

        const borderGrid = set.border
          ? mirrorForCorner(set.border, pos)
          : null;
        const borderRects = borderGrid
          ? listFilledRects(borderGrid, pixelSize)
          : [];

        // Inner mask: pixels inside the arc (complement of cover + border).
        // Covers the container's CSS border at corners so only the
        // staircase border is visible.
        let innerRects: { x: number; y: number; width: number; height: number }[] = [];
        if (innerBg && borderGrid) {
          const innerBits = coverGrid.bits
            .split('')
            .map((bit, i) =>
              bit === '0' && borderGrid.bits[i] === '0' ? '1' : '0',
            )
            .join('');
          const innerGrid = { ...coverGrid, bits: innerBits, name: `inner-${pos}` };
          innerRects = listFilledRects(innerGrid, pixelSize);
        }

        const cssSize = coverGrid.width * pixelSize;

        return (
          <svg
            key={pos}
            aria-hidden
            width={cssSize}
            height={cssSize}
            viewBox={`0 0 ${cssSize} ${cssSize}`}
            style={{
              position: 'absolute',
              [pos === 'tl' || pos === 'tr' ? 'top' : 'bottom']: -1,
              [pos === 'tl' || pos === 'bl' ? 'left' : 'right']: -1,
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'visible',
            }}
          >
            {/* Inner mask — covers container CSS border inside the arc */}
            {innerRects.map((r) => (
              <rect
                key={`i-${r.x}-${r.y}`}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill={innerBg}
              />
            ))}
            {/* Cover layer — hides smooth CSS border-radius */}
            {coverRects.map((r) => (
              <rect
                key={`c-${r.x}-${r.y}`}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill={cornerBg}
              />
            ))}
            {/* Border layer — staircase edge */}
            {borderRects.map((r) => (
              <rect
                key={`b-${r.x}-${r.y}`}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill={borderColor}
              />
            ))}
          </svg>
        );
      })}
    </>
  );
}
