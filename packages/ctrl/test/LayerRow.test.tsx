import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LayerRow } from '../layout/LayerRow/LayerRow';

describe('LayerRow', () => {
  afterEach(cleanup);

  it('renders the label and fires onSelect when the name cell is clicked', () => {
    const onSelect = vi.fn();
    render(<LayerRow label="Layer 1" onSelect={onSelect} />);

    const name = screen.getByRole('button', { name: /layer 1/i });
    fireEvent.click(name);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('reflects the selected state via aria-pressed', () => {
    render(<LayerRow label="Layer 1" selected onSelect={() => {}} />);
    const name = screen.getByRole('button', { name: /layer 1/i });
    expect(name).toHaveAttribute('aria-pressed', 'true');
  });

  it('wires visibility / reorder / delete action buttons when handlers are provided', () => {
    const onToggleVisible = vi.fn();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    const onDelete = vi.fn();

    render(
      <LayerRow
        label="Layer 1"
        visible
        onSelect={() => {}}
        onToggleVisible={onToggleVisible}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: /hide layer 1/i }));
    fireEvent.click(screen.getByRole('button', { name: /move layer 1 up/i }));
    fireEvent.click(screen.getByRole('button', { name: /move layer 1 down/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete layer 1/i }));

    expect(onToggleVisible).toHaveBeenCalledOnce();
    expect(onMoveUp).toHaveBeenCalledOnce();
    expect(onMoveDown).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('disables delete when canDelete=false', () => {
    const onDelete = vi.fn();
    render(
      <LayerRow
        label="Layer 1"
        onSelect={() => {}}
        onDelete={onDelete}
        canDelete={false}
      />,
    );
    const btn = screen.getByRole('button', { name: /delete layer 1/i });
    expect(btn).toBeDisabled();
  });
});
