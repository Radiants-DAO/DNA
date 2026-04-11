import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  test('renders alert content inside a PixelBorder shell', () => {
    render(
      <Alert.Root variant="info">
        <Alert.Content>
          <Alert.Title>Notice</Alert.Title>
          <Alert.Description>Alert body</Alert.Description>
        </Alert.Content>
      </Alert.Root>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(document.querySelectorAll('svg[viewBox="0 0 2 2"]')).toHaveLength(4);
  });
});
