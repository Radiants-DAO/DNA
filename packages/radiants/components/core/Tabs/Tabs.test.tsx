import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tabs } from './Tabs';
import type { TabsMode, TabsPosition } from './Tabs';

// ── Helpers ──────────────────────────────────────────────────────

function TestTabs({
  defaultValue = 'one',
  mode,
  position,
  size,
  tone,
}: {
  defaultValue?: string;
  mode?: TabsMode;
  position?: TabsPosition;
  size?: 'sm' | 'md' | 'lg';
  tone?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue} mode={mode} position={position} size={size} tone={tone}>
      <Tabs.List>
        <Tabs.Trigger value="one">One</Tabs.Trigger>
        <Tabs.Trigger value="two">Two</Tabs.Trigger>
        <Tabs.Trigger value="three">Three</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one">Content one</Tabs.Content>
      <Tabs.Content value="two">Content two</Tabs.Content>
      <Tabs.Content value="three">Content three</Tabs.Content>
    </Tabs>
  );
}

// ── Core behavior ────────────────────────────────────────────────

describe('Tabs', () => {
  it('renders tabs with correct roles and initial selection', () => {
    render(<TestTabs />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });

  it('clicking a tab changes selection', () => {
    render(<TestTabs />);
    fireEvent.click(screen.getByText('Two'));
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('arrow keys move focus between tabs', () => {
    render(<TestTabs />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('supports controlled value + onValueChange', () => {
    let current = 'one';
    const onChange = (v: string) => { current = v; };

    const { rerender } = render(
      <Tabs value="one" onValueChange={onChange}>
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Content one</Tabs.Content>
        <Tabs.Content value="two">Content two</Tabs.Content>
      </Tabs>,
    );

    fireEvent.click(screen.getByText('Two'));
    expect(current).toBe('two');

    rerender(
      <Tabs value="two" onValueChange={onChange}>
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Content one</Tabs.Content>
        <Tabs.Content value="two">Content two</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('preserves panel state when keepMounted is enabled', () => {
    render(
      <Tabs defaultValue="one">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one" keepMounted>
          <input data-testid="preserved-input" />
        </Tabs.Content>
        <Tabs.Content value="two">Two</Tabs.Content>
      </Tabs>,
    );

    const input = screen.getByTestId('preserved-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByText('Two'));
    fireEvent.click(screen.getByText('One'));
    expect((screen.getByTestId('preserved-input') as HTMLInputElement).value).toBe('hello');
  });

  // ── Axis props ──────────────────────────────────────────────

  it('sets data-mode on root', () => {
    const { container } = render(<TestTabs mode="chrome" />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-mode', 'chrome');
  });

  it('defaults mode to capsule', () => {
    const { container } = render(<TestTabs />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-mode', 'capsule');
  });

  it('sets data-position on root', () => {
    const { container } = render(<TestTabs position="bottom" />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-position', 'bottom');
  });

  it('uses vertical keyboard navigation when position=left', () => {
    render(<TestTabs position="left" />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('sets data-size on triggers', () => {
    render(<TestTabs size="lg" />);
    const triggers = screen.getAllByRole('tab');
    expect(triggers[0]).toHaveAttribute('data-size', 'lg');
  });

  it('sets data-color on root when tone is provided', () => {
    const { container } = render(<TestTabs tone="accent" />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-color', 'accent');
  });

  // ── Trigger with icon ──────────────────────────────────────

  it('renders icon in trigger when provided', () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a" icon={<svg data-testid="test-icon" />}>Tab A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  // ── Backward compat: useTabsState still exported ───────────

  it('exports useTabsState for backward compatibility', async () => {
    const mod = await import('./Tabs');
    expect(mod.useTabsState).toBeDefined();
    expect(typeof mod.useTabsState).toBe('function');
  });
});
