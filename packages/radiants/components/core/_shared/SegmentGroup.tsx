'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// SegmentGroup — shared segmented-control container primitive
//
// One container, three consumers:
//   - Tabs.List (capsule mode)   — pixel-rounded-4 bg-card
//   - Toolbar.Root               — pixel-rounded-6 bg-page
//   - ToolbarGroup               — no paint, no radius (layout only)
//
// The primitive renders the inline-flex bar; it does NOT render any
// semantic element (Base UI's Tabs.List / Toolbar.Root still wrap it
// via the `render` prop on the consumer side). Here we expose a
// plain div-based container and `asChild`-style render escape via
// `render`, so consumers can compose with headless primitives.
// ============================================================================

export const segmentGroupVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
      // Density controls inner gap + padding; call-site naming is
      // intentionally coarse since the 3 consumers only need 2 levels.
      density: {
        // toolbar root + toolbar group (gap-0.5, pad 0.5)
        compact: 'gap-0.5 p-0.5',
        // tabs list capsule (gap-1, pad 1)
        comfortable: 'gap-1 p-1',
        // layout-only — no padding (ToolbarGroup inside Root has its own pad)
        none: 'gap-0.5 p-0',
      },
      surface: {
        card: 'bg-card',
        page: 'bg-page',
        // transparent — inherits parent surface (ToolbarGroup).
        // `bg-transparent` lives on the variant (not the base) so the
        // `card` / `page` values aren't clobbered by cascade order.
        none: 'bg-transparent',
      },
      corner: {
        xs: 'pixel-rounded-4',
        sm: 'pixel-rounded-6',
        none: '',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      density: 'compact',
      surface: 'none',
      corner: 'none',
    },
  },
);

export type SegmentGroupVariants = VariantProps<typeof segmentGroupVariants>;

export interface SegmentGroupProps extends SegmentGroupVariants {
  /**
   * Escape hatch for headless primitives (Base UI's Tabs.List,
   * Toolbar.Root, etc.). Called with the resolved className so the
   * primitive can merge it onto the DOM element it owns.
   */
  render?: (args: { className: string }) => React.ReactElement;
  className?: string;
  children?: React.ReactNode;
  'data-slot'?: string;
}

/**
 * Segmented-control container used by Tabs.List, Toolbar.Root, and
 * ToolbarGroup. When `render` is provided, the caller owns the DOM
 * element and SegmentGroup just supplies the className; otherwise a
 * plain `<div>` is emitted.
 */
export function SegmentGroup({
  orientation,
  density,
  surface,
  corner,
  className,
  render,
  children,
  ...rest
}: SegmentGroupProps) {
  const resolved = segmentGroupVariants({
    orientation,
    density,
    surface,
    corner,
    className,
  });

  if (render) {
    return render({ className: resolved });
  }

  return (
    <div className={resolved} {...rest}>
      {children}
    </div>
  );
}
