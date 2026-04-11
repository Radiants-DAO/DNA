import { render } from '@testing-library/react';
import { CountdownTimer } from './CountdownTimer';

describe('CountdownTimer', () => {
  test('renders the large shell inside a PixelBorder wrapper', () => {
    const { container } = render(
      <CountdownTimer endTime={Date.now() + 60_000} variant="large" label="Auction" showDays={false} />,
    );

    expect(container.querySelector('[data-rdna="countdowntimer"]')).toBeInTheDocument();
    expect(container.querySelectorAll('svg[viewBox="0 0 12 12"]')).toHaveLength(4);
    expect(container.querySelector('.pixel-rounded-sm')).toBeInTheDocument();
  });
});
