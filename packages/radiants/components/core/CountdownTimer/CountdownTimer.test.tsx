import { render } from '@testing-library/react';
import { CountdownTimer } from './CountdownTimer';

describe('CountdownTimer', () => {
  test('renders the large shell with the expected rounded and shadow classes', () => {
    const { container } = render(
      <CountdownTimer endTime={Date.now() + 60_000} variant="large" label="Auction" showDays={false} />,
    );

    expect(container.querySelector('[data-rdna="countdowntimer"]')).toBeInTheDocument();
    expect(container.querySelector('.pixel-rounded-12')).toBeInTheDocument();
    expect(container.querySelector('.pixel-shadow-raised')).toBeInTheDocument();
    expect(container.querySelectorAll('.pixel-rounded-6')).toHaveLength(3);
  });
});
