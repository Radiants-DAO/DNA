import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MutationDiffPanel } from '../MutationDiffPanel';
import type { MutationDiff } from '@flow/shared';

const makeDiff = (id: string, selector: string): MutationDiff => ({
  id,
  element: { selector, componentName: 'Button' },
  type: 'style',
  changes: [{ property: 'color', oldValue: 'black', newValue: 'red' }],
  timestamp: new Date().toISOString(),
});

describe('MutationDiffPanel', () => {
  beforeEach(() => {
    cleanup();
  });

  it('shows empty state when no diffs', () => {
    render(
      <MutationDiffPanel
        diffs={[]}
        onRevert={vi.fn()}
        onRevertAll={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText(/No mutations captured/)).toBeTruthy();
  });

  it('renders diffs grouped by selector', () => {
    const diffs = [
      makeDiff('1', '.btn'),
      makeDiff('2', '.btn'),
      makeDiff('3', '.hero'),
    ];
    render(
      <MutationDiffPanel
        diffs={diffs}
        onRevert={vi.fn()}
        onRevertAll={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText('.btn')).toBeTruthy();
    expect(screen.getByText('.hero')).toBeTruthy();
    expect(screen.getByText('3 mutations')).toBeTruthy();
  });

  it('shows singular "mutation" for single diff', () => {
    render(
      <MutationDiffPanel
        diffs={[makeDiff('1', '.btn')]}
        onRevert={vi.fn()}
        onRevertAll={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText('1 mutation')).toBeTruthy();
  });

  it('calls onRevertAll when button clicked', () => {
    const onRevertAll = vi.fn();
    render(
      <MutationDiffPanel
        diffs={[makeDiff('1', '.a')]}
        onRevert={vi.fn()}
        onRevertAll={onRevertAll}
        onClear={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Revert All' }));
    expect(onRevertAll).toHaveBeenCalledOnce();
  });

  it('calls onClear when button clicked', () => {
    const onClear = vi.fn();
    render(
      <MutationDiffPanel
        diffs={[makeDiff('1', '.a')]}
        onRevert={vi.fn()}
        onRevertAll={vi.fn()}
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('calls onRevert with mutation id when revert button clicked', () => {
    const onRevert = vi.fn();
    render(
      <MutationDiffPanel
        diffs={[makeDiff('test-id-123', '.a')]}
        onRevert={onRevert}
        onRevertAll={vi.fn()}
        onClear={vi.fn()}
      />
    );
    // The × button for reverting individual changes
    const revertButton = screen.getByTitle('Revert this change');
    fireEvent.click(revertButton);
    expect(onRevert).toHaveBeenCalledWith('test-id-123');
  });

  it('displays property changes with old and new values', () => {
    render(
      <MutationDiffPanel
        diffs={[makeDiff('1', '.btn')]}
        onRevert={vi.fn()}
        onRevertAll={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText('color')).toBeTruthy();
    expect(screen.getByText('black')).toBeTruthy();
    expect(screen.getByText('red')).toBeTruthy();
  });

  it('displays component name when present', () => {
    render(
      <MutationDiffPanel
        diffs={[makeDiff('1', '.btn')]}
        onRevert={vi.fn()}
        onRevertAll={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText('(Button)')).toBeTruthy();
  });
});
