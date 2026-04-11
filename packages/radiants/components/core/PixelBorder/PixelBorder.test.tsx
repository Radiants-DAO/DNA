import { render, screen } from '@testing-library/react';
import { PixelBorder } from './PixelBorder';

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
    expect(border?.querySelectorAll('svg[viewBox="0 0 5 5"]')).toHaveLength(4);
  });

  test('clips children with the matching radius and applies drop-shadow filters', () => {
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
    expect(clipper?.style.borderRadius).toBe('6px');
  });
});
