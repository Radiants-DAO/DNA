'use client';

import React, { useMemo } from 'react';

import {
  generateCorner,
  getCornerSet,
  mirrorForCorner,
  listFilledRects,
  type CornerPosition,
} from '@rdna/pixel';

export type PixelBorderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const RADII: Record<PixelBorderSize, number> = {
  xs: 1,
  sm: 4,
  md: 8,
  lg: 11,
  xl: 18,
};

const CORNERS: CornerPosition[] = ['tl', 'tr', 'bl', 'br'];

interface PixelBorderEdgesProps {
  /** Border size preset. */
  size?: PixelBorderSize;
  /** Custom Bresenham circle radius. Overrides `size`. */
  radius?: number;
  /**
   * Border color for the staircase corners and straight edges.
   * @default 'var(--color-line)'
   */
  color?: string;
}

function useCornerData(size: PixelBorderSize, radius: number | undefined) {
  const R = radius ?? RADII[size];
  return useMemo(() => {
    const set = radius != null ? generateCorner(R) : getCornerSet(size)!;
    const gridSize = set.tl.width;
    const corners = CORNERS.map((pos) => {
      const borderGrid = set.border
        ? mirrorForCorner(set.border, pos)
        : null;
      const borderRects = borderGrid
        ? listFilledRects(borderGrid, 1)
        : [];
      return { pos, borderRects };
    });
    return { corners, gridSize };
  }, [R, size, radius]);
}

/**
 * Renders just the pixel-art border elements (4 corner SVGs + 4 edge divs)
 * as a Fragment. Use inside an already-positioned parent (e.g. AppWindow)
 * that can't be wrapped by `<PixelBorder>`.
 *
 * @example
 * ```tsx
 * <div className="absolute ...">
 *   <PixelBorderEdges size="md" />
 *   {children}
 * </div>
 * ```
 */
export function PixelBorderEdges({
  size = 'md',
  radius,
  color = 'var(--color-line)',
}: PixelBorderEdgesProps) {
  const { corners, gridSize } = useCornerData(size, radius);

  return (
    <>
      {/* Corner SVGs — Bresenham staircase at each corner */}
      {corners.map(({ pos, borderRects }) => (
        <svg
          key={pos}
          aria-hidden
          width={gridSize}
          height={gridSize}
          viewBox={`0 0 ${gridSize} ${gridSize}`}
          style={{
            position: 'absolute',
            [pos === 'tl' || pos === 'tr' ? 'top' : 'bottom']: -1,
            [pos === 'tl' || pos === 'bl' ? 'left' : 'right']: -1,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {borderRects.map((r) => (
            <rect
              key={`${r.x}-${r.y}`}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill={color}
            />
          ))}
        </svg>
      ))}

      {/* Straight edges connecting the corners */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -1,
          left: gridSize - 1,
          right: gridSize - 1,
          height: 1,
          background: color,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -1,
          top: gridSize - 1,
          bottom: gridSize - 1,
          width: 1,
          background: color,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -1,
          left: gridSize - 1,
          right: gridSize - 1,
          height: 1,
          background: color,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -1,
          top: gridSize - 1,
          bottom: gridSize - 1,
          width: 1,
          background: color,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </>
  );
}

export interface PixelBorderProps {
  children: React.ReactNode;
  /** Border size preset. */
  size?: PixelBorderSize;
  /** Custom Bresenham circle radius. Overrides `size`. */
  radius?: number;
  /**
   * Border color for the staircase corners and straight edges.
   * @default 'var(--color-line)'
   */
  color?: string;
  /**
   * Drop shadow that follows the pixel staircase shape.
   * Uses CSS `filter: drop-shadow()` syntax: `offset-x offset-y blur color`.
   * @example "2px 4px 8px rgba(0,0,0,0.2)"
   */
  shadow?: string;
  /** Additional className applied to the wrapper div. */
  className?: string;
  /** Additional inline styles applied to the wrapper div. */
  style?: React.CSSProperties;
}

/**
 * Pixel-art border wrapper. Renders Bresenham staircase corners
 * connected by straight 1px edges — no CSS border needed.
 *
 * Content is clipped to a matching border-radius so it doesn't
 * overflow past the pixel corners. The `shadow` prop uses
 * `filter: drop-shadow()` which follows the staircase shape.
 *
 * @example
 * ```tsx
 * <PixelBorder size="md" shadow="2px 4px 8px rgba(0,0,0,0.2)">
 *   <div className="p-4">content</div>
 * </PixelBorder>
 * ```
 */
export function PixelBorder({
  children,
  size = 'md',
  radius,
  color = 'var(--color-line)',
  shadow,
  className = '',
  style,
}: PixelBorderProps) {
  const R = radius ?? RADII[size];
  const clipRadius = R + 2;

  return (
    <div
      className={`relative ${className}`.trim()}
      style={{
        ...style,
        filter: shadow ? `drop-shadow(${shadow})` : undefined,
      }}
    >
      <div
        className="overflow-hidden"
        style={{ borderRadius: clipRadius }}
      >
        {children}
      </div>
      <PixelBorderEdges size={size} radius={radius} color={color} />
    </div>
  );
}
