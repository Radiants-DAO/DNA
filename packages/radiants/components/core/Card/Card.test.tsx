import { render, screen } from '@testing-library/react';
import { Card, CardBody } from './Card';

describe('Card', () => {
  test('renders the default card with the expected rounded class', () => {
    render(
      <Card>
        <CardBody>Card content</CardBody>
      </Card>,
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
    const card = screen.getByText('Card content').closest('[data-slot="card"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('pixel-rounded-12');
    expect(card).toHaveAttribute('data-variant', 'default');
  });

  test('applies the raised shadow class for the raised variant', () => {
    render(
      <Card variant="raised" rounded="sm">
        <CardBody>Raised card</CardBody>
      </Card>,
    );

    const card = screen.getByText('Raised card').closest('[data-slot="card"]');
    expect(card).toHaveClass('pixel-rounded-6');
    expect(card).toHaveClass('pixel-shadow-raised');
    expect(card).toHaveAttribute('data-variant', 'raised');
  });
});
