import { render } from '@testing-library/react';
import { Meter } from './Meter';

describe('Meter', () => {
  test('wraps the track shell with a PixelBorder', () => {
    const { container } = render(<Meter value={60} />);
    const meter = container.querySelector('[data-rdna="meter"]');
    expect(meter).toBeInTheDocument();
    // Track element should no longer carry the legacy pixel-rounded utility.
    const trackEl = container.querySelector('[data-rdna="meter"] [class*="relative"]');
    const classTokens = trackEl?.className.split(/\s+/) ?? [];
    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
    // Layered-mode bg layer with polygon clip-path.
    const bgLayer = container.querySelector('.bg-page') as HTMLElement | null;
    expect(bgLayer).toBeInTheDocument();
    expect(bgLayer?.style.clipPath).toContain('polygon(');
    // PixelBorder corner SVGs (xs = 4x4 viewBox).
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(4);
  });
});
