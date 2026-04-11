import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  test('wraps the span in a PixelBorder with a raised drop shadow', () => {
    const { container } = render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    const classTokens = badge.className.split(/\s+/);

    // Legacy pixel-rounded / pixel-shadow classes are gone from the <span>.
    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('pixel-shadow-raised');
    expect(classTokens).not.toContain('rounded-xs');
    expect(classTokens).not.toContain('shadow-raised');

    // PixelBorder (size="xs") renders four corner SVGs around the badge.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(4);

    // The raised drop-shadow is applied via the wrapper's filter style.
    const wrapper = badge.closest('[class*="group/pixel"]') as HTMLElement | null;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.style.filter).toContain('drop-shadow(2px 2px 0 var(--color-ink))');
  });
});
