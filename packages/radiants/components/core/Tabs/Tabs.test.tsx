import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  indicator,
}: {
  defaultValue?: string;
  mode?: TabsMode;
  position?: TabsPosition;
  size?: 'sm' | 'md' | 'lg';
  tone?: string;
  indicator?: 'none' | 'dot';
}) {
  return (
    <Tabs defaultValue={defaultValue} mode={mode} position={position} size={size} tone={tone} indicator={indicator}>
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

  it('clicking a tab changes selection', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);
    await user.click(screen.getByText('Two'));
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('arrow keys move focus between tabs', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);
    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[0]);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]);
  });

  it('supports controlled value + onValueChange', async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByText('Two'));
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

  it('preserves panel state when keepMounted is enabled', async () => {
    const user = userEvent.setup();
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
    await user.type(input, 'hello');
    await user.click(screen.getByText('Two'));
    await user.click(screen.getByText('One'));
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

  it('renders capsule mode with a PixelBorder around the list shell', () => {
    const { container } = render(<TestTabs />);
    const list = container.querySelector('[data-slot="tab-list"]');
    expect(list).toBeInTheDocument();
    // Layered-mode wrapper: list's parent has a bg-card sibling with a polygon clip-path.
    const listWrapper = list?.parentElement;
    const bgLayer = listWrapper?.querySelector('.bg-card') as HTMLElement | null;
    expect(bgLayer).toBeInTheDocument();
    expect(bgLayer?.style.clipPath).toContain('polygon(');
    // Legacy PixelCorner overlay (2×2 viewBox) must not be present.
    expect(container.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });

  it('sets data-position on root', () => {
    const { container } = render(<TestTabs position="bottom" />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-position', 'bottom');
  });

  it('uses vertical keyboard navigation when position=left', async () => {
    const user = userEvent.setup();
    render(<TestTabs position="left" />);
    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[0]);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]);
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
    const { container } = render(
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a" icon={<svg data-testid="test-icon" />}>Tab A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    const trigger = screen.getByRole('tab', { name: 'Tab A' });
    const classTokens = trigger.className.split(/\s+/);
    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
    // Each capsule trigger is wrapped in a PixelBorder (xs = radius 4).
    expect(trigger.closest('.overflow-hidden')).toBeInTheDocument();
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(4);
  });

  it('renders the dot indicator shell with a PixelBorder frame', () => {
    const { container } = render(
      <Tabs defaultValue="one">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.DotPill />
        <Tabs.Content value="one">Content one</Tabs.Content>
        <Tabs.Content value="two">Content two</Tabs.Content>
      </Tabs>,
    );
    // DotPill renders a clipped bg-main layer (sm = radius 6) plus corner SVGs.
    const bgLayer = container.querySelector('.bg-main') as HTMLElement | null;
    expect(bgLayer).toBeInTheDocument();
    expect(bgLayer?.style.clipPath).toContain('polygon(');
    expect(container.querySelectorAll('svg[viewBox="0 0 6 6"]').length).toBeGreaterThanOrEqual(4);
  });

  // ── Chrome mode ─────────────────────────────────────────────

  describe('mode="chrome"', () => {
    it('sets data-mode="chrome" on root', () => {
      const { container } = render(
        <Tabs defaultValue="a" mode="chrome">
          <Tabs.List>
            <Tabs.Trigger value="a" icon={<svg data-testid="icon-a" />}>Tab A</Tabs.Trigger>
            <Tabs.Trigger value="b" icon={<svg data-testid="icon-b" />}>Tab B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">Content A</Tabs.Content>
        </Tabs>,
      );
      expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-mode', 'chrome');
    });

    it('shows icon always, shows text only when active', () => {
      render(
        <Tabs defaultValue="a" mode="chrome">
          <Tabs.List>
            <Tabs.Trigger value="a" icon={<svg data-testid="icon-a" />}>Active</Tabs.Trigger>
            <Tabs.Trigger value="b" icon={<svg data-testid="icon-b" />}>Inactive</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">Content</Tabs.Content>
        </Tabs>,
      );
      expect(screen.getByTestId('icon-a')).toBeInTheDocument();
      expect(screen.getByTestId('icon-b')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      // Inactive text should not be rendered (icon-expand-on-active pattern)
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
    });
  });

  // ── Backward compat: useTabsState still exported ───────────

  it('exports useTabsState for backward compatibility', async () => {
    const mod = await import('./Tabs');
    expect(mod.useTabsState).toBeDefined();
    expect(typeof mod.useTabsState).toBe('function');
  });
});
