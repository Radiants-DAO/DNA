import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionButton } from '../layout/ActionButton/ActionButton';

describe('ActionButton', () => {
  afterEach(cleanup);

  it('renders the label and fires onClick', () => {
    const onClick = vi.fn();
    render(<ActionButton label="Copy" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is inert when disabled', () => {
    const onClick = vi.fn();
    render(<ActionButton label="Copy" onClick={onClick} disabled />);
    const btn = screen.getByRole('button', { name: /copy/i });
    expect(btn).toBeDisabled();
  });
});
