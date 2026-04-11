import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PixelCorner } from './PixelCorner';

describe('PixelCorner', () => {
  it('renders 4 SVG elements for all corners', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        <PixelCorner size="sm" />
      </div>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
  });

  it('renders only specified corners', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        <PixelCorner size="md" corners={['tl', 'br']} />
      </div>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
  });

  it('supports mixed corner sizes', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        <PixelCorner size={{ tl: 'lg', tr: 'lg', bl: 'sm', br: 'sm' }} />
      </div>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);

    // lg corners should be 12px wide, sm corners 5px wide
    const widths = Array.from(svgs).map((s) => Number(s.getAttribute('width')));
    expect(widths).toEqual([12, 12, 5, 5]);
  });

  it('renders nothing for invalid size', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        {/* @ts-expect-error testing invalid input */}
        <PixelCorner size="invalid" />
      </div>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('renders both cover and border rects for sizes that include interior cover pixels', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        <PixelCorner size="sm" />
      </div>,
    );
    const svgs = container.querySelectorAll('svg');
    for (const svg of svgs) {
      const rects = Array.from(svg.querySelectorAll('rect'));
      const coverRects = rects.filter((r) => r.getAttribute('fill') === 'var(--color-page)');
      const borderRects = rects.filter((r) => r.getAttribute('fill') === 'var(--color-line)');

      expect(coverRects.length).toBeGreaterThan(0);
      expect(borderRects.length).toBeGreaterThan(0);
    }
  });

  it('positions corners absolutely', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        <PixelCorner size="sm" />
      </div>,
    );
    const svgs = container.querySelectorAll('svg');
    for (const svg of svgs) {
      expect(svg.style.position).toBe('absolute');
    }
  });

  it('applies custom colors', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        <PixelCorner size="sm" cornerBg="red" borderColor="blue" />
      </div>,
    );
    const svg = container.querySelector('svg')!;
    const rects = svg.querySelectorAll('rect');

    // Cover rects should have fill="red"
    const coverRects = Array.from(rects).filter(
      (r) => r.getAttribute('fill') === 'red',
    );
    expect(coverRects.length).toBeGreaterThan(0);

    // Border rects should have fill="blue"
    const borderRects = Array.from(rects).filter(
      (r) => r.getAttribute('fill') === 'blue',
    );
    expect(borderRects.length).toBeGreaterThan(0);
  });

  it('renders inner mask rects when innerBg is provided', () => {
    const { container } = render(
      <div style={{ position: 'relative' }}>
        <PixelCorner size="xs" innerBg="green" />
      </div>,
    );
    const svg = container.querySelector('svg')!;
    const rects = Array.from(svg.querySelectorAll('rect'));
    const innerRects = rects.filter((r) => r.getAttribute('fill') === 'green');

    expect(innerRects.length).toBeGreaterThan(0);
  });
});
