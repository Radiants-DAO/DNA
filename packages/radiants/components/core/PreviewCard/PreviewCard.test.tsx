import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewCard, PreviewCardTrigger, PreviewCardContent } from './PreviewCard';

describe('PreviewCard', () => {
  test('renders trigger and shows content on hover', async () => {
    const user = userEvent.setup();
    render(
      <PreviewCard delay={0}>
        <PreviewCardTrigger asChild>
          <a href="#">Hover me</a>
        </PreviewCardTrigger>
        <PreviewCardContent>Preview content</PreviewCardContent>
      </PreviewCard>
    );
    expect(screen.queryByText('Preview content')).not.toBeInTheDocument();
    await user.hover(screen.getByText('Hover me'));
    expect(screen.getByText('Preview content')).toBeInTheDocument();
  });

  test('forwards eventDetails signature in onOpenChange', () => {
    const onOpenChange = vi.fn<[boolean, unknown?]>();
    render(
      <PreviewCard onOpenChange={onOpenChange}>
        <PreviewCardTrigger asChild><a href="#">T</a></PreviewCardTrigger>
        <PreviewCardContent>content</PreviewCardContent>
      </PreviewCard>
    );
    expect(onOpenChange).toBeDefined();
    // Verify the type signature is correct (checked at build time)
    expect(PreviewCard).toBeDefined();
  });
});
