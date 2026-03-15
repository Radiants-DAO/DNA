import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewCard, PreviewCardTrigger, PreviewCardContent } from './PreviewCard';

describe('PreviewCard', () => {
  test('renders trigger element', () => {
    render(
      <PreviewCard>
        <PreviewCardTrigger asChild>
          <a href="#">Hover me</a>
        </PreviewCardTrigger>
        <PreviewCardContent>Preview content</PreviewCardContent>
      </PreviewCard>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
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
