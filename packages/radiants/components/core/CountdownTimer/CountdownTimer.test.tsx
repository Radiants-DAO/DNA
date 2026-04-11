import { render } from '@testing-library/react';
import { CountdownTimer } from './CountdownTimer';

describe('CountdownTimer', () => {
  test('renders the large shell inside a PixelBorder wrapper', () => {
    const { container } = render(
      <CountdownTimer endTime={Date.now() + 60_000} variant="large" label="Auction" showDays={false} />,
    );

    expect(container.querySelector('[data-rdna="countdowntimer"]')).toBeInTheDocument();
    // Outer shell: PixelBorder size="lg" → four corner SVGs with viewBox 0 0 12 12.
    expect(container.querySelectorAll('svg[viewBox="0 0 12 12"]')).toHaveLength(4);
    // Each of the three visible segments (hrs/min/sec) gets its own PixelBorder
    // size="sm" wrapper → 4 corner SVGs per segment × 3 segments = 12.
    expect(container.querySelectorAll('svg[viewBox="0 0 6 6"]')).toHaveLength(12);
    // Legacy pixel-rounded-* classes are gone.
    expect(container.querySelector('.pixel-rounded-sm')).not.toBeInTheDocument();
  });
});
