import { render } from '@testing-library/react';
import { Meter } from './Meter';

describe('Meter', () => {
  test('renders the track shell with the rounded background wrapper', () => {
    const { container } = render(<Meter value={60} />);
    const meter = container.querySelector('[data-rdna="meter"]');
    expect(meter).toBeInTheDocument();
    const shell = container.querySelector('[data-rdna="meter"] .pixel-rounded-4');
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveClass('bg-page');
  });
});
