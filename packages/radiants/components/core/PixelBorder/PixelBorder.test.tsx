import { render, screen } from '@testing-library/react';
import {
  PixelBorder,
  PixelBorderEdges,
  clampPixelCornerRadii,
  PIXEL_BORDER_RADII,
} from './PixelBorder';

describe('PixelBorder', () => {
  test('renders staircase corner SVGs around its children', () => {
    const { container } = render(
      <PixelBorder size="sm" className="test-pixel-border">
        <div>Wrapped content</div>
      </PixelBorder>,
    );

    expect(screen.getByText('Wrapped content')).toBeInTheDocument();

    const border = container.querySelector('.test-pixel-border');
    expect(border).toBeInTheDocument();
    // Only the border edges carry an explicit viewBox; the focus ring layer
    // intentionally omits viewBox (visually identical) so consumer-test
    // queries that count `svg[viewBox="0 0 R R"]` see only the border layer.
    expect(border?.querySelectorAll('svg[viewBox="0 0 6 6"]')).toHaveLength(4);
    // The focus-ring overlay still renders 4 corner SVGs of its own — they
    // just lack the viewBox attribute.
    const ring = border?.querySelector('[data-rdna-pixel-focus-ring]');
    expect(ring?.querySelectorAll('svg')).toHaveLength(4);
    ring?.querySelectorAll('svg').forEach((svg) => {
      expect(svg.hasAttribute('viewBox')).toBe(false);
    });
  });

  test('clips children via polygon clip-path and applies drop-shadow filters', () => {
    const { container } = render(
      <PixelBorder
        size="sm"
        shadow="4px 4px 0 var(--color-ink)"
        className="test-pixel-border-shadow"
      >
        <div>Shadowed content</div>
      </PixelBorder>,
    );

    const border = container.querySelector('.test-pixel-border-shadow') as HTMLElement | null;
    const clipper = border?.firstElementChild as HTMLElement | null;

    expect(border?.style.filter).toBe('drop-shadow(4px 4px 0 var(--color-ink))');
    expect(clipper).toHaveClass('overflow-hidden');
    // Polygon clip-path walks the staircase for all 4 sm corners, so every
    // quadrant should contribute `calc(100% - Npx)` edge vertices.
    expect(clipper?.style.clipPath).toContain('polygon(');
    expect(clipper?.style.clipPath).toContain('calc(100% -');
  });

  test('renders only the corners requested when radius is per-corner', () => {
    const { container } = render(
      <PixelBorder radius={{ tl: 'sm', tr: 'sm' }} className="test-pixel-per-corner">
        <div>Top only</div>
      </PixelBorder>,
    );
    const border = container.querySelector('.test-pixel-per-corner');
    // Border edges carry viewBox; focus ring SVGs do not.
    const borderCorners = border?.querySelectorAll('svg[viewBox="0 0 6 6"]') ?? [];
    expect(borderCorners.length).toBe(2);

    // Total SVG count = 2 border + 2 focus ring = 4.
    const allSvgs = border?.querySelectorAll('svg') ?? [];
    expect(allSvgs.length).toBe(4);

    const clipper = border?.firstElementChild as HTMLElement | null;
    // For tl=6, tr=6, bl=0, br=0 the polygon should include explicit sharp
    // corners at the bottom-right (100% 100%) and bottom-left (0px 100%).
    expect(clipper?.style.clipPath).toContain('100% 100%');
    expect(clipper?.style.clipPath).toContain('0px 100%');
  });

  test('omits the bottom straight edge when edges.bottom is false', () => {
    const { container } = render(
      <PixelBorder
        radius={{ tl: 'sm', tr: 'sm' }}
        edges={{ bottom: false }}
        className="test-pixel-no-bottom"
      >
        <div>Tabs chrome</div>
      </PixelBorder>,
    );
    const border = container.querySelector('.test-pixel-no-bottom');
    // Only check the regular border edges, not the focus ring overlay.
    const borderEdges = border?.querySelectorAll(':scope > div > div') ?? [];
    const bottomEdge = [...borderEdges].find((d) => {
      const style = (d as HTMLElement).style;
      return style.bottom === '0px' && style.height === '1px';
    });
    expect(bottomEdge).toBeUndefined();
  });

  test('background prop is applied to the clipper div', () => {
    const { container } = render(
      <PixelBorder
        size="sm"
        background="bg-red-500"
        className="test-pixel-bg"
      >
        <button data-testid="bg-button">click</button>
      </PixelBorder>,
    );

    const border = container.querySelector('.test-pixel-bg') as HTMLElement | null;
    const clipper = border?.firstElementChild as HTMLElement | null;
    expect(clipper).toHaveClass('overflow-hidden');
    expect(clipper).toHaveClass('bg-red-500');
    expect(clipper?.style.clipPath).toContain('polygon(');

    // Children sit inside the clipper now (single mode).
    const button = border?.querySelector('[data-testid="bg-button"]');
    expect(button?.closest('.bg-red-500')).toBe(clipper);
  });

  test('className lands on the outer wrapper, not the clipper', () => {
    const { container } = render(
      <PixelBorder size="sm" className="outer-marker" background="bg-blue-500">
        <span>content</span>
      </PixelBorder>,
    );

    const wrapper = container.querySelector('.outer-marker') as HTMLElement | null;
    expect(wrapper).toBeInTheDocument();
    // The wrapper carries `relative group/pixel`, the clipper does not.
    expect(wrapper).toHaveClass('relative');
    expect(wrapper).toHaveClass('group/pixel');

    const clipper = wrapper?.firstElementChild as HTMLElement | null;
    expect(clipper).not.toHaveClass('outer-marker');
    expect(clipper).toHaveClass('bg-blue-500');
  });

  test('focus ring layer is present by default', () => {
    const { container } = render(
      <PixelBorder size="sm" className="test-focus-default">
        <div>focusable parent</div>
      </PixelBorder>,
    );

    const border = container.querySelector('.test-focus-default');
    const ring = border?.querySelector('[data-rdna-pixel-focus-ring]');
    expect(ring).toBeInTheDocument();
    expect(ring).toHaveClass('group-focus-within/pixel:opacity-100');
    // Default focus ring color is the accent token.
    const ringPath = ring?.querySelector('svg path');
    expect(ringPath?.getAttribute('fill')).toBe('var(--color-accent)');
  });

  test('focusRing={false} removes the focus ring layer', () => {
    const { container } = render(
      <PixelBorder size="sm" className="test-focus-off" focusRing={false}>
        <div>no ring</div>
      </PixelBorder>,
    );

    const border = container.querySelector('.test-focus-off');
    const ring = border?.querySelector('[data-rdna-pixel-focus-ring]');
    expect(ring).toBeNull();

    // Without the ring, only 4 corner SVGs (the regular border) remain.
    expect(border?.querySelectorAll('svg[viewBox="0 0 6 6"]')).toHaveLength(4);
  });

  test('focusRingColor is forwarded to ring corners and edges', () => {
    const { container } = render(
      <PixelBorder size="sm" className="test-focus-color" focusRingColor="red">
        <div>red focus</div>
      </PixelBorder>,
    );

    const ring = container.querySelector('.test-focus-color [data-rdna-pixel-focus-ring]');
    expect(ring).toBeInTheDocument();

    // All four corner paths in the ring overlay use the focus color fill.
    const cornerFills = [...(ring?.querySelectorAll('svg path') ?? [])].map(
      (p) => p.getAttribute('fill'),
    );
    expect(cornerFills.length).toBe(4);
    cornerFills.forEach((fill) => expect(fill).toBe('red'));

    // And the straight edges use the same color via inline background.
    const edgeBgs = [...(ring?.querySelectorAll('div > div') ?? [])].map(
      (d) => (d as HTMLElement).style.background,
    );
    expect(edgeBgs.length).toBeGreaterThan(0);
    edgeBgs.forEach((bg) => expect(bg).toBe('red'));
  });
});

describe('clampPixelCornerRadii', () => {
  test('returns input unchanged when dimensions unknown (0 or negative)', () => {
    const r = { tl: 100, tr: 100, bl: 100, br: 100 };
    expect(clampPixelCornerRadii(r, 0, 0)).toBe(r);
    expect(clampPixelCornerRadii(r, -1, 10)).toBe(r);
  });

  test('uniform radius is clamped to half the smaller axis', () => {
    const r = { tl: 100, tr: 100, bl: 100, br: 100 };
    expect(clampPixelCornerRadii(r, 200, 160)).toEqual({
      tl: 80, tr: 80, bl: 80, br: 80,
    });
  });

  test('per-corner radii scale proportionally when a side overflows', () => {
    // 60 + 60 = 120 on a 100-wide top edge → f = 100/120 ≈ 0.833
    const r = { tl: 60, tr: 60, bl: 0, br: 0 };
    expect(clampPixelCornerRadii(r, 100, 100)).toEqual({
      tl: 50, tr: 50, bl: 0, br: 0,
    });
  });

  test('no clamp when everything fits', () => {
    const r = { tl: 6, tr: 6, bl: 6, br: 6 };
    expect(clampPixelCornerRadii(r, 240, 160)).toBe(r);
  });

  test('handles mixed zero corners without dividing by zero', () => {
    const r = { tl: 30, tr: 0, bl: 0, br: 30 };
    // Neither pair sums exceed 60; 2*30=60 on diagonals, so:
    // horizTop = 30, horizBot = 30, vertLeft = 30, vertRight = 30
    // On 40×40: f = 40/30 ≈ 1.33 → clamps at 1 → unchanged
    expect(clampPixelCornerRadii(r, 40, 40)).toBe(r);
    // On 20×20: f = 20/30 → 30 * (20/30) = 20 → floors to 20
    expect(clampPixelCornerRadii(r, 20, 20)).toEqual({
      tl: 20, tr: 0, bl: 0, br: 20,
    });
  });
});

describe('PIXEL_BORDER_RADII', () => {
  test('exposes the size-preset radius map', () => {
    expect(PIXEL_BORDER_RADII.xs).toBe(4);
    expect(PIXEL_BORDER_RADII.sm).toBe(6);
    expect(PIXEL_BORDER_RADII.md).toBe(8);
    expect(PIXEL_BORDER_RADII.lg).toBe(12);
    expect(PIXEL_BORDER_RADII.xl).toBe(20);
  });
});
