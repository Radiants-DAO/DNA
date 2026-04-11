import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  test('wraps trigger and content shells in PixelBorder (xs radius)', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Collapsible.Root>
        <Collapsible.Trigger>Section</Collapsible.Trigger>
        <Collapsible.Content>Panel body</Collapsible.Content>
      </Collapsible.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Section' });
    const triggerTokens = trigger.className.split(/\s+/);
    expect(triggerTokens).not.toContain('pixel-rounded-xs');

    // Trigger wrapped in PixelBorder size="xs" (radius 4) — 4 corner SVGs.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(4);

    await user.click(trigger);

    const panelBody = screen.getByText('Panel body');
    const panelBodyTokens = panelBody.className.split(/\s+/);
    expect(panelBodyTokens).not.toContain('pixel-rounded-xs');

    // After expanding, trigger + content are each wrapped in PixelBorder xs —
    // expect at least 8 corner SVGs total.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(8);
    // Legacy PixelCorner overlay (2×2 viewBox) must not be present.
    expect(container.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });
});
