import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  test('renders alert content with the current rounded shell classes', () => {
    render(
      <Alert.Root variant="info">
        <Alert.Content>
          <Alert.Title>Notice</Alert.Title>
          <Alert.Description>Alert body</Alert.Description>
        </Alert.Content>
      </Alert.Root>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-variant', 'info');
    expect(alert).toHaveClass('pixel-rounded-4');
    expect(alert).toHaveClass('pixel-shadow-raised');
  });
});
