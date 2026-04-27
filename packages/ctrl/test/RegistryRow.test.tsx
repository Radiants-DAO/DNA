import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistryRow } from '../layout/RegistryRow/RegistryRow';

describe('RegistryRow', () => {
  afterEach(cleanup);

  it('renders as a button by default and fires onSelect', () => {
    const onSelect = vi.fn();
    render(
      <RegistryRow
        label="checkerboard"
        onSelect={onSelect}
        thumb={<span data-testid="thumb">▣</span>}
      />,
    );
    const btn = screen.getByRole('button', { name: /checkerboard/i });
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getByTestId('thumb')).toBeInTheDocument();
  });

  it('reports aria-checked in radio mode', () => {
    render(
      <RegistryRow label="checkerboard" mode="radio" selected thumb={<span>▣</span>} />,
    );
    const row = screen.getByRole('radio', { name: /checkerboard/i });
    expect(row).toHaveAttribute('aria-checked', 'true');
  });

  it('carries the selected data-attribute so CSS can hook into it', () => {
    render(
      <RegistryRow label="dots" selected thumb={<span>▣</span>} />,
    );
    const row = screen.getByRole('button', { name: /dots/i });
    expect(row).toHaveAttribute('data-selected', 'true');
  });

  it('honors the disabled prop', () => {
    const onSelect = vi.fn();
    render(
      <RegistryRow label="dots" disabled onSelect={onSelect} />,
    );
    const row = screen.getByRole('button', { name: /dots/i });
    expect(row).toBeDisabled();
    fireEvent.click(row);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
