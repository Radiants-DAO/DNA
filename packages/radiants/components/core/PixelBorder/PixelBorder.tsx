'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { generatePixelCornerBorder } from '@rdna/pixel';

export type PixelBorderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const PIXEL_BORDER_RADII: Record<PixelBorderSize, number> = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 20,
};

type CornerValue = number | PixelBorderSize;

export type PixelBorderRadius =
  | CornerValue
  | {
      tl?: CornerValue;
      tr?: CornerValue;
      bl?: CornerValue;
      br?: CornerValue;
    };

export type PixelBorderEdgesFlags = {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
};

type CornerKey = 'tl' | 'tr' | 'bl' | 'br';
type Radii = Record<CornerKey, number>;

function resolveCornerValue(v: CornerValue | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Math.max(0, Math.floor(v));
  return PIXEL_BORDER_RADII[v];
}

function normalizeRadius(
  radius: PixelBorderRadius | undefined,
  size: PixelBorderSize,
): Radii {
  if (radius == null) {
    const r = PIXEL_BORDER_RADII[size];
    return { tl: r, tr: r, bl: r, br: r };
  }
  if (typeof radius === 'number' || typeof radius === 'string') {
    const r = resolveCornerValue(radius);
    return { tl: r, tr: r, bl: r, br: r };
  }
  return {
    tl: resolveCornerValue(radius.tl),
    tr: resolveCornerValue(radius.tr),
    bl: resolveCornerValue(radius.bl),
    br: resolveCornerValue(radius.br),
  };
}

/**
 * Clamp per-corner radii to fit the container, using the CSS `border-radius`
 * scaling algorithm: if the sum of radii on any side exceeds that side's
 * length, all four radii are scaled down by the same factor until they fit.
 *
 * Returns integer-floored radii. When container dimensions are unknown
 * (width or height ≤ 0), the input is returned unchanged.
 */
export function clampPixelCornerRadii(r: Radii, width: number, height: number): Radii {
  if (width <= 0 || height <= 0) return r;

  const horizTop = r.tl + r.tr;
  const horizBot = r.bl + r.br;
  const vertLeft = r.tl + r.bl;
  const vertRight = r.tr + r.br;

  const f = Math.min(
    1,
    horizTop > 0 ? width / horizTop : Infinity,
    horizBot > 0 ? width / horizBot : Infinity,
    vertLeft > 0 ? height / vertLeft : Infinity,
    vertRight > 0 ? height / vertRight : Infinity,
  );

  if (f >= 1) return r;

  return {
    tl: Math.max(0, Math.floor(r.tl * f)),
    tr: Math.max(0, Math.floor(r.tr * f)),
    bl: Math.max(0, Math.floor(r.bl * f)),
    br: Math.max(0, Math.floor(r.br * f)),
  };
}

function cellsToPath(cells: Array<[number, number]>): string {
  return cells.map(([x, y]) => `M${x} ${y}h1v1h-1Z`).join('');
}

function pathForRadius(radius: number): string {
  if (radius < 1) return '';
  return cellsToPath(generatePixelCornerBorder(radius));
}

const CORNER_TRANSFORM: Record<CornerKey, string | undefined> = {
  tl: undefined,
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1, -1)',
};

const CORNER_POSITION: Record<CornerKey, React.CSSProperties> = {
  tl: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0 },
  br: { bottom: 0, right: 0 },
};

interface PixelBorderEdgesProps {
  /** Size preset shorthand. Ignored when `radius` is passed. */
  size?: PixelBorderSize;
  /** Radius per corner (or uniform). */
  radius?: PixelBorderRadius;
  /** Which straight edges to draw. All default `true`. */
  edges?: PixelBorderEdgesFlags;
  /**
   * Border color for the staircase corners and straight edges.
   * @default 'var(--color-line)'
   */
  color?: string;
}

/**
 * Renders the pixel-art border elements (up to 4 corner SVGs + up to 4 edge
 * divs) as a fragment. Use inside an already-positioned parent that can't be
 * wrapped by `<PixelBorder>`. Does NOT auto-clamp — if the parent is smaller
 * than the sum of adjacent radii, pre-clamp with `clampPixelCornerRadii()`.
 */
export function PixelBorderEdges({
  size = 'md',
  radius,
  edges,
  color = 'var(--color-line)',
}: PixelBorderEdgesProps) {
  const r = normalizeRadius(radius, size);
  const e = { top: true, right: true, bottom: true, left: true, ...edges };

  const paths = useMemo(() => ({
    tl: pathForRadius(r.tl),
    tr: pathForRadius(r.tr),
    bl: pathForRadius(r.bl),
    br: pathForRadius(r.br),
  }), [r.tl, r.tr, r.bl, r.br]);

  const cornerBase: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 1,
  };

  const edgeBase: React.CSSProperties = {
    position: 'absolute',
    background: color,
    pointerEvents: 'none',
    zIndex: 1,
  };

  const renderCorner = (key: CornerKey) => {
    const R = r[key];
    if (R < 1) return null;
    const transform = CORNER_TRANSFORM[key];
    return (
      <svg
        key={key}
        aria-hidden
        width={R}
        height={R}
        viewBox={`0 0 ${R} ${R}`}
        style={{
          ...cornerBase,
          ...CORNER_POSITION[key],
          ...(transform ? { transform, transformOrigin: 'center' } : null),
        }}
      >
        <path d={paths[key]} fill={color} />
      </svg>
    );
  };

  return (
    <>
      {renderCorner('tl')}
      {renderCorner('tr')}
      {renderCorner('bl')}
      {renderCorner('br')}

      {e.top && (
        <div
          style={{
            ...edgeBase,
            top: 0,
            left: r.tl,
            right: r.tr,
            height: 1,
          }}
        />
      )}
      {e.right && (
        <div
          style={{
            ...edgeBase,
            right: 0,
            top: r.tr,
            bottom: r.br,
            width: 1,
          }}
        />
      )}
      {e.bottom && (
        <div
          style={{
            ...edgeBase,
            bottom: 0,
            left: r.bl,
            right: r.br,
            height: 1,
          }}
        />
      )}
      {e.left && (
        <div
          style={{
            ...edgeBase,
            left: 0,
            top: r.tl,
            bottom: r.bl,
            width: 1,
          }}
        />
      )}
    </>
  );
}

export interface PixelBorderProps {
  children: React.ReactNode;
  /** Size preset shorthand. Ignored when `radius` is passed. */
  size?: PixelBorderSize;
  /** Radius per corner (or uniform). Overrides `size`. */
  radius?: PixelBorderRadius;
  /** Which straight edges to draw. All default `true`. */
  edges?: PixelBorderEdgesFlags;
  /**
   * Border color for the staircase corners and straight edges.
   * @default 'var(--color-line)'
   */
  color?: string;
  /**
   * Drop shadow that follows the pixel staircase shape.
   * Uses CSS `filter: drop-shadow()` syntax: `offset-x offset-y blur color`.
   */
  shadow?: string;
  /** Additional className applied to the wrapper div. */
  className?: string;
  /** Additional inline styles applied to the wrapper div. */
  style?: React.CSSProperties;
}

/**
 * Pixel-art border wrapper. Renders hand-drawn staircase corners at the four
 * corners and 1px straight edges between them — no CSS border needed.
 *
 * Content is clipped to a matching border-radius so it doesn't overflow past
 * the pixel corners. The `shadow` prop uses `filter: drop-shadow()`, which
 * follows the staircase shape.
 *
 * If the requested radii don't fit the container, they are clamped with the
 * CSS `border-radius` scaling algorithm (all four shrink proportionally).
 */
export function PixelBorder({
  children,
  size = 'md',
  radius,
  edges,
  color = 'var(--color-line)',
  shadow,
  className = '',
  style,
}: PixelBorderProps) {
  const requested = normalizeRadius(radius, size);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setDimensions((prev) =>
        prev.w === rect.width && prev.h === rect.height
          ? prev
          : { w: rect.width, h: rect.height },
      );
    };

    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const effective = clampPixelCornerRadii(requested, dimensions.w, dimensions.h);
  const clipRadius =
    effective.tl === effective.tr &&
    effective.tl === effective.bl &&
    effective.tl === effective.br
      ? `${effective.tl}px`
      : `${effective.tl}px ${effective.tr}px ${effective.br}px ${effective.bl}px`;

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`.trim()}
      style={{
        ...style,
        filter: shadow ? `drop-shadow(${shadow})` : undefined,
      }}
    >
      <div className="overflow-hidden" style={{ borderRadius: clipRadius }}>
        {children}
      </div>
      <PixelBorderEdges radius={effective} edges={edges} color={color} />
    </div>
  );
}
