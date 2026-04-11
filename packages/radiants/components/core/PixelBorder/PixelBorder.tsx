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

/**
 * Build the absolute-positioning style for a corner SVG, optionally pushed
 * `offset` pixels outside the parent box. The same R x R svg is used for both
 * the border and the focus ring — only the anchor offset changes.
 */
function cornerPositionStyle(key: CornerKey, offset: number): React.CSSProperties {
  switch (key) {
    case 'tl': return { top: -offset, left: -offset };
    case 'tr': return { top: -offset, right: -offset };
    case 'bl': return { bottom: -offset, left: -offset };
    case 'br': return { bottom: -offset, right: -offset };
  }
}

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
  /**
   * Push every corner SVG and straight edge `offset` pixels outside the
   * parent box. Used by the focus-ring layer; defaults to `0` (flush with
   * the parent edge).
   * @default 0
   */
  offset?: number;
  /**
   * When `false`, the corner SVGs render in "presentational overlay" mode:
   * no `viewBox` attribute (1:1 user-to-pixel mapping is the SVG default,
   * so the rendering is identical) and no `aria-hidden` (the overlay's
   * parent supplies it, and consumer tests querying
   * `svg[aria-hidden="true"]` should only count the border layer).
   * @default true
   */
  withViewBox?: boolean;
}

/**
 * Renders the pixel-art border elements (up to 4 corner SVGs + up to 4 edge
 * divs) as a fragment. Use inside an already-positioned parent that can't be
 * wrapped by `<PixelBorder>`. Does NOT auto-clamp — if the parent is smaller
 * than the sum of adjacent radii, pre-clamp with `clampPixelCornerRadii()`.
 *
 * `offset` shifts every element outward by N pixels — when set, the parent
 * must permit overflow (`overflow: visible`, the default for plain divs).
 */
export function PixelBorderEdges({
  size = 'md',
  radius,
  edges,
  color = 'var(--color-line)',
  offset = 0,
  withViewBox = true,
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
        width={R}
        height={R}
        {...(withViewBox
          ? { viewBox: `0 0 ${R} ${R}`, 'aria-hidden': true }
          : null)}
        style={{
          ...cornerBase,
          ...cornerPositionStyle(key, offset),
          ...(transform ? { transform, transformOrigin: 'center' } : null),
        }}
      >
        <path d={paths[key]} fill={color} />
      </svg>
    );
  };

  // Edge anchor: when offset > 0 the corner SVGs are shifted outward by
  // `offset`px, so the staircase ends `offset`px earlier on the inner side.
  // Each straight edge starts where its adjacent corner ends, which translates
  // to `r.{corner} - offset` from each edge. The transverse offset (top/right
  // /bottom/left = -offset) lifts the 1px stripe out of the parent box so it
  // sits flush with the corners.
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
            top: -offset,
            left: r.tl - offset,
            right: r.tr - offset,
            height: 1,
          }}
        />
      )}
      {e.right && (
        <div
          style={{
            ...edgeBase,
            right: -offset,
            top: r.tr - offset,
            bottom: r.br - offset,
            width: 1,
          }}
        />
      )}
      {e.bottom && (
        <div
          style={{
            ...edgeBase,
            bottom: -offset,
            left: r.bl - offset,
            right: r.br - offset,
            height: 1,
          }}
        />
      )}
      {e.left && (
        <div
          style={{
            ...edgeBase,
            left: -offset,
            top: r.tl - offset,
            bottom: r.bl - offset,
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
   * Optional Tailwind class string concatenated onto the inner clipper div.
   * Use this for the surface background and any pseudo-state classes that
   * should respect the staircase clip (e.g. `bg-page hover:bg-line`).
   *
   * The clipper carries the polygon `clip-path`, so backgrounds passed here
   * are guaranteed not to bleed past the pixel corners. The wrapper div
   * carries `group/pixel`, so this string can use `group-hover/pixel:`,
   * `group-focus-within/pixel:`, etc. modifiers.
   */
  background?: string;
}

/**
 * Pixel-art border wrapper. Renders hand-drawn staircase corners at the four
 * corners and 1px straight edges between them — no CSS border needed.
 *
 * Content is clipped to a matching pixel-corner polygon so it doesn't bleed
 * past the staircase. The `shadow` prop uses `filter: drop-shadow()`, which
 * follows the staircase shape. The `background` prop is concatenated onto
 * the clipper div, so any surface bg / hover bg / pattern fill on it
 * respects the same clip.
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

  // `isolation: isolate` keeps the wrapper a stacking context so the focus
  // ring overlay stays above descendants of unrelated stacking siblings;
  // `filter: drop-shadow(...)` lives on the wrapper so the shadow follows
  // the clipped polygon. Both stay outside the clipper itself.
  const wrapperStyle: React.CSSProperties = {
    isolation: 'isolate',
    ...style,
    filter: shadow ? `drop-shadow(${shadow})` : undefined,
  };

  // Single-mode clipper. `grid` (instead of plain `block`) collapses the
  // line-box overhead that inline-flex children otherwise add, stretches a
  // single block child to fill the wrapper, and still sizes the clipper to
  // content so wrappers with no explicit dimensions hug their children.
  const clipperClassName = `overflow-hidden grid h-full w-full${background ? ` ${background}` : ''}`;

  return (
    <div
      ref={wrapperRef}
      data-rdna-pixel-border=""
      className={`relative group/pixel ${className}`.trim()}
      style={wrapperStyle}
    >
      <div className={clipperClassName} style={{ clipPath }}>
        {children}
      </div>
      <PixelBorderEdges radius={effective} edges={edges} color={color} />
    </div>
  );
}
