import { render, screen } from '@testing-library/react';

import { Pattern } from './Pattern';

describe('Pattern', () => {
  test('renders a tiled SVG layer and preserves the host background', () => {
    const { container } = render(
      <Pattern
        pat="checkerboard"
        color="rgb(255, 0, 0)"
        bg="rgb(0, 0, 255)"
        className="w-20 h-20"
      />,
    );

    const host = container.firstElementChild as HTMLDivElement | null;
    expect(host).not.toBeNull();
    expect(host?.style.backgroundColor).toBe('rgb(0, 0, 255)');

    const svg = host?.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.style.color).toBe('rgb(255, 0, 0)');

    const pattern = svg?.querySelector('pattern');
    expect(pattern).not.toBeNull();
    expect(pattern).toHaveAttribute('width', '8');
    expect(pattern).toHaveAttribute('height', '8');

    const tileRect = svg?.querySelector('rect[fill^="url(#"]');
    expect(tileRect).not.toBeNull();
  });

  test('keeps children in a positioned wrapper above the pattern art', () => {
    const { container } = render(
      <Pattern pat="grid" className="w-20 h-20">
        <span>Foreground content</span>
      </Pattern>,
    );

    expect(screen.getByText('Foreground content')).toBeInTheDocument();

    const wrappers = container.querySelectorAll('div');
    const childWrapper = wrappers[1] as HTMLDivElement | undefined;
    expect(childWrapper).toBeDefined();
    expect(childWrapper?.style.position).toBe('relative');
    expect(childWrapper?.style.zIndex).toBe('1');
  });

  test('renders a single untiled tile when tiled is false', () => {
    const { container } = render(
      <Pattern pat="checkerboard" tiled={false} className="w-20 h-20" />,
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.querySelector('pattern')).toBeNull();

    const rects = svg?.querySelectorAll('rect');
    expect(rects).toBeDefined();
    expect(rects).toHaveLength(32);
    expect([...rects ?? []].every((rect) => rect.getAttribute('fill') === 'currentColor')).toBe(true);
  });

  test('returns null for unknown patterns', () => {
    const { container } = render(<Pattern pat="definitely-not-real" />);
    expect(container.firstChild).toBeNull();
  });
});
