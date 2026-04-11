import { render } from '@testing-library/react';
import { Meter } from './Meter';

describe('Meter', () => {
  test('uses pixel-rounded styling on the track shell', () => {
    const { container } = render(<Meter value={60} />);
    const track = container.querySelector('[data-rdna="meter"] .pixel-rounded-xs');
    const classTokens = track?.className.split(/\s+/) ?? [];

    expect(track?.className).toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
  });
});
