import { render, screen } from '@testing-library/react';
import { Button, Select, Dialog } from '../index';

test('core exports render', () => {
  render(<Button>Test</Button>);
  expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  expect(Select).toBeTruthy();
  expect(Dialog).toBeTruthy();
});
