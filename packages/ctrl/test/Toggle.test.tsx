import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toggle } from '../selectors/Toggle/Toggle';

describe('Toggle', () => {
  afterEach(cleanup);

  it('submits a hidden form value when named', () => {
    render(
      <form data-testid="form">
        <Toggle value onChange={() => {}} label="Grid" name="grid" valueOn="enabled" />
      </form>,
    );

    const form = screen.getByTestId('form') as HTMLFormElement;
    expect(new FormData(form).get('grid')).toBe('enabled');
  });

  it('does not call onChange while readOnly', () => {
    const onChange = vi.fn();
    render(<Toggle value={false} onChange={onChange} label="Grid" readOnly />);

    fireEvent.click(screen.getByRole('switch', { name: /grid/i }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
