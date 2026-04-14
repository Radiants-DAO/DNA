import { render, screen } from '@testing-library/react';

import { Pattern } from './Pattern';

describe('Pattern', () => {
  test('renders a single host node with mask-backed pattern classes', () => {
    const { container } = render(
      <Pattern
        pat="checkerboard"
        color="rgb(255, 0, 0)"
        bg="rgb(0, 0, 255)"
        scale={2}
        className="w-20 h-20"
      />,
    );

    const host = container.firstElementChild as HTMLDivElement | null;
    expect(host).not.toBeNull();
    expect(host?.style.backgroundColor).toBe('rgb(0, 0, 255)');
    expect(host).toHaveClass('rdna-pat');
    expect(host).toHaveClass('rdna-pat--checkerboard');
    expect(host).toHaveClass('rdna-pat--2x');
    expect(host?.style.getPropertyValue('--pat-color')).toBe('rgb(255, 0, 0)');
    expect(host?.style.getPropertyValue('--pat-bg')).toBe('rgb(0, 0, 255)');
    expect(host?.style.getPropertyValue('--pat-scale')).toBe('2');

    expect(container.querySelector('svg')).toBeNull();
  });

  test('keeps children as direct descendants without a wrapper node', () => {
    const { container } = render(
      <Pattern pat="grid" className="w-20 h-20">
        <span>Foreground content</span>
      </Pattern>,
    );

    expect(screen.getByText('Foreground content')).toBeInTheDocument();
    const host = container.firstElementChild as HTMLDivElement | null;
    expect(host).not.toBeNull();
    expect(host?.firstElementChild).toBe(screen.getByText('Foreground content'));
    expect(host?.children).toHaveLength(1);
  });

  test('switches repeat mode without adding extra nodes', () => {
    const { container } = render(
      <Pattern pat="checkerboard" tiled={false} className="w-20 h-20" />,
    );

    const host = container.firstElementChild as HTMLDivElement | null;
    expect(host).not.toBeNull();
    expect(host?.style.getPropertyValue('--pat-repeat')).toBe('no-repeat');
    expect(container.querySelector('svg')).toBeNull();
  });

  test('returns null for unknown patterns', () => {
    const { container } = render(<Pattern pat="definitely-not-real" />);
    expect(container.firstChild).toBeNull();
  });

  test('normalizes legacy pattern aliases onto the canonical utility class', () => {
    const { container } = render(<Pattern pat="checker-32" className="w-20 h-20" />);

    const host = container.firstElementChild as HTMLDivElement | null;
    expect(host).not.toBeNull();
    expect(host).toHaveClass('rdna-pat');
    expect(host).toHaveClass('rdna-pat--checkerboard');
    expect(host).not.toHaveClass('rdna-pat--checker-32');
  });
});
