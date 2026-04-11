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

/**
 * Trace the clockwise outline of the TL-corner filled region for a pixel
 * corner of radius R. Vertices walk from `(0, R)` to `(R, 0)` in R-cell space,
 * following the same `inside(col, row)` circle-rasterization as
 * `generatePixelCornerBorder`. Collinear points are not deduped; CSS
 * `polygon()` handles them fine.
 */
function traceTLCornerVertices(R: number): Array<[number, number]> {
  if (R < 1) return [];

  const r2 = R * R;
  const isInside = (col: number, row: number): boolean => {
    const dx = col + 0.5 - R;
    const dy = row + 0.5 - R;
    return dx * dx + dy * dy < r2;
  };

  const leftmost = new Array<number>(R).fill(R);
  for (let row = 0; row < R; row++) {
    for (let col = 0; col < R; col++) {
      if (isInside(col, row)) {
        leftmost[row] = col;
        break;
      }
    }
  }

  const vertices: Array<[number, number]> = [[0, R]];
  let cx = 0;

  for (let row = R - 1; row >= 0; row--) {
    const lm = leftmost[row];
    if (lm >= R) continue;
    if (lm > cx) {
      vertices.push([lm, row + 1]);
      cx = lm;
    }
    vertices.push([cx, row]);
  }

  if (cx < R) {
    vertices.push([R, 0]);
  }

  return vertices;
}

/**
 * Build a CSS `clip-path: polygon(...)` string whose outline exactly matches
 * the pixel-art staircase for the given per-corner radii. Edge coordinates
 * use `calc(100% - Npx)` so the same string works regardless of the element's
 * actual width/height at paint time.
 *
 * Walks clockwise: TL staircase → top edge → TR → right edge → BR → bottom
 * edge → BL → left edge (implicit close). Zero-radius corners collapse to a
 * single rectangle-corner vertex.
 */
export function pixelCornerClipPath(r: Radii): string {
  const parts: string[] = [];

  if (r.tl > 0) {
    for (const [x, y] of traceTLCornerVertices(r.tl)) {
      parts.push(`${x}px ${y}px`);
    }
  } else {
    parts.push('0px 0px');
  }

  if (r.tr > 0) {
    const verts = traceTLCornerVertices(r.tr).slice().reverse();
    for (const [x, y] of verts) {
      parts.push(`calc(100% - ${x}px) ${y}px`);
    }
  } else {
    parts.push('100% 0px');
  }

  if (r.br > 0) {
    for (const [x, y] of traceTLCornerVertices(r.br)) {
      parts.push(`calc(100% - ${x}px) calc(100% - ${y}px)`);
    }
  } else {
    parts.push('100% 100%');
  }

  if (r.bl > 0) {
    const verts = traceTLCornerVertices(r.bl).slice().reverse();
    for (const [x, y] of verts) {
      parts.push(`${x}px calc(100% - ${y}px)`);
    }
  } else {
    parts.push('0px 100%');
  }

  return `polygon(${parts.join(', ')})`;
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
  /**
   * Optional Tailwind class string applied to an absolute-positioned background
   * layer behind the children. The bg layer is clipped to the pixel-corner
   * polygon via `clip-path`, while the children themselves remain unclipped —
   * letting focus outlines, overflowing text, etc. render normally.
   *
   * When omitted, the component falls back to the legacy "wrapped clipper"
   * mode: children sit inside an `overflow-hidden` div whose polygon clip-path
   * matches the staircase exactly.
   *
   * The wrapper carries `group/pixel` so the bg layer class can use
   * `group-hover/pixel:`, `group-focus-within/pixel:`, etc. modifiers.
   */
  background?: string;
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
  background,
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
  const clipPath = pixelCornerClipPath(effective);

  const wrapperStyle: React.CSSProperties = {
    isolation: 'isolate',
    ...style,
    filter: shadow ? `drop-shadow(${shadow})` : undefined,
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative group/pixel ${className}`.trim()}
      style={wrapperStyle}
    >
      {background !== undefined ? (
        <>
          {/* Layered mode: absolute bg layer clipped to the polygon; children
              render unclipped at natural z so focus outlines, overflowing text,
              etc. are preserved. */}
          <div
            aria-hidden
            className={`absolute inset-0 pointer-events-none ${background}`.trim()}
            style={{ clipPath, zIndex: -1 }}
          />
          {children}
        </>
      ) : (
        /* Wrapped mode: legacy compat — children are clipped by a polygon
           clip-path on their parent div, matching the staircase exactly.
           `grid` on the clipper eliminates the line-box overhead that
           inline-flex children would otherwise add, stretches a single
           block child to fill the wrapper (so Card's inner div fills
           width), and still sizes the clipper to content so wrappers
           with no explicit dimensions hug their children tightly. */
        <div className="overflow-hidden grid h-full w-full" style={{ clipPath }}>
          {children}
        </div>
      )}
      <PixelBorderEdges radius={effective} edges={edges} color={color} />
    </div>
  );
}
