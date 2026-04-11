import { render, screen } from '@testing-library/react';
import { Card, CardBody } from './Card';

describe('Card', () => {
  test('renders the default card inside a PixelBorder shell', () => {
    const { container } = render(
      <Card>
        <CardBody>Card content</CardBody>
      </Card>,
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
    expect(card?.querySelectorAll('svg')).toHaveLength(0);
    expect(container.querySelectorAll('svg[viewBox="0 0 12 12"]')).toHaveLength(4);
  });

  test('applies the raised shadow through PixelBorder', () => {
    const { container } = render(
      <Card variant="raised" rounded="sm">
        <CardBody>Raised card</CardBody>
      </Card>,
    );

    const shell = container.firstElementChild as HTMLElement | null;
    expect(shell?.style.filter).toBe('drop-shadow(2px 2px 0 var(--color-ink))');
    expect(container.querySelector('[data-rdna-pixel-border]')).toBeInTheDocument();
  });
});
