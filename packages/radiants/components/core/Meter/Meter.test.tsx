import { render } from '@testing-library/react';
import { Meter } from './Meter';

describe('Meter', () => {
  test('uses rounded fallback styling on the track shell', () => {
    const { container } = render(<Meter value={60} />);
    const track = container.querySelector('[data-rdna="meter"] .rounded-xs');

    expect(track?.className).toContain('rounded-xs');
    expect(track?.className).toContain('border-line');
    expect(track?.className).not.toContain('pixel-rounded');
  });
});
