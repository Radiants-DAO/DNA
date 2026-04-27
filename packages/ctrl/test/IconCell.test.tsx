import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IconCell } from '../selectors/IconCell/IconCell';

describe('IconCell', () => {
  afterEach(cleanup);

  it('renders as a button by default and fires onClick', () => {
    const onClick = vi.fn();
    render(
      <IconCell label="Pen" onClick={onClick}>
        <span>P</span>
      </IconCell>,
    );
    const btn = screen.getByRole('button', { name: /pen/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('reports aria-checked in radio mode', () => {
    render(
      <IconCell label="Pen" mode="radio" selected>
        <span>P</span>
      </IconCell>,
    );
    const btn = screen.getByRole('radio', { name: /pen/i });
    expect(btn).toHaveAttribute('aria-checked', 'true');
  });

  it('honors the disabled prop', () => {
    render(
      <IconCell label="Pen" disabled>
        <span>P</span>
      </IconCell>,
    );
    const btn = screen.getByRole('button', { name: /pen/i });
    expect(btn).toBeDisabled();
  });
});
