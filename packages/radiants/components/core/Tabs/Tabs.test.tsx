import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { corner, px, registerCornerDefinition } from '@rdna/pixel';
import { afterEach, describe, it, expect } from 'vitest';
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

async function setDocumentCornerShape(value?: string) {
  await act(async () => {
    if (value === undefined) {
      delete document.documentElement.dataset.cornerShape;
    } else {
      document.documentElement.dataset.cornerShape = value;
    }

    await Promise.resolve();
  });
}

// ── Core behavior ────────────────────────────────────────────────

describe('Tabs', () => {
  afterEach(async () => {
    await setDocumentCornerShape();
  });

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

  it('renders capsule mode with the rounded list shell classes', () => {
    const { container } = render(<TestTabs />);
    const list = container.querySelector('[data-slot="tab-list"]');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('pixel-rounded-4');
    expect(list).toHaveClass('bg-card');
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
    render(
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a" icon={<svg data-testid="test-icon" />}>Tab A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    const trigger = screen.getByRole('tab', { name: 'Tab A' });
    expect(trigger.closest('.pixel-rounded-4')).toBeInTheDocument();
  });

  it('renders the dot indicator shell with the rounded frame classes', () => {
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
    const bgLayer = container.querySelector('.bg-main') as HTMLElement | null;
    expect(bgLayer).toBeInTheDocument();
    expect(bgLayer).toHaveClass('pixel-rounded-6');
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

    it('updates chrome corner styling when html data-corner-shape changes', async () => {
      await setDocumentCornerShape('circle');

      render(<TestTabs mode="chrome" />);

      const getActiveWrapper = () => {
        const activeTab = screen.getByRole('tab', { name: 'One' });
        return activeTab.parentElement as HTMLElement;
      };

      const initialWrapper = getActiveWrapper();
      const initialTopLeftCover = initialWrapper.style.getPropertyValue('--px-tl-cover');
      const initialTopRightCover = initialWrapper.style.getPropertyValue('--px-tr-cover');
      const initialShell = initialWrapper.parentElement as HTMLElement;
      const initialLeftShoulder = initialShell.querySelector(
        '[data-slot="tab-chrome-concave-left"]',
      ) as HTMLElement;
      const initialRightShoulder = initialShell.querySelector(
        '[data-slot="tab-chrome-concave-right"]',
      ) as HTMLElement;
      const initialLeftShoulderMask =
        initialLeftShoulder.style.getPropertyValue('--px-concave-mask');
      const initialRightShoulderMask =
        initialRightShoulder.style.getPropertyValue('--px-concave-mask');

      expect(initialWrapper).toHaveClass('pixel-corner');
      expect(initialTopLeftCover).not.toBe('');
      expect(initialTopRightCover).not.toBe('');
      expect(initialLeftShoulder).toHaveClass('pixel-concave-corner', 'pixel-concave-br');
      expect(initialRightShoulder).toHaveClass('pixel-concave-corner', 'pixel-concave-bl');
      expect(initialLeftShoulderMask).not.toBe('');
      expect(initialRightShoulderMask).not.toBe('');

      await setDocumentCornerShape('chamfer');

      await waitFor(() => {
        const updatedWrapper = getActiveWrapper();
        const updatedShell = updatedWrapper.parentElement as HTMLElement;
        const updatedLeftShoulder = updatedShell.querySelector(
          '[data-slot="tab-chrome-concave-left"]',
        ) as HTMLElement;
        const updatedRightShoulder = updatedShell.querySelector(
          '[data-slot="tab-chrome-concave-right"]',
        ) as HTMLElement;
        expect(updatedWrapper.style.getPropertyValue('--px-tl-cover')).not.toBe(initialTopLeftCover);
        expect(updatedWrapper.style.getPropertyValue('--px-tr-cover')).not.toBe(initialTopRightCover);
        expect(updatedLeftShoulder.style.getPropertyValue('--px-concave-mask')).not.toBe(
          initialLeftShoulderMask,
        );
        expect(updatedRightShoulder.style.getPropertyValue('--px-concave-mask')).not.toBe(
          initialRightShoulderMask,
        );
      });

      await setDocumentCornerShape('circle');

      await waitFor(() => {
        const resetWrapper = getActiveWrapper();
        const resetShell = resetWrapper.parentElement as HTMLElement;
        const resetLeftShoulder = resetShell.querySelector(
          '[data-slot="tab-chrome-concave-left"]',
        ) as HTMLElement;
        const resetRightShoulder = resetShell.querySelector(
          '[data-slot="tab-chrome-concave-right"]',
        ) as HTMLElement;
        expect(resetWrapper.style.getPropertyValue('--px-tl-cover')).toBe(initialTopLeftCover);
        expect(resetWrapper.style.getPropertyValue('--px-tr-cover')).toBe(initialTopRightCover);
        expect(resetLeftShoulder.style.getPropertyValue('--px-concave-mask')).toBe(
          initialLeftShoulderMask,
        );
        expect(resetRightShoulder.style.getPropertyValue('--px-concave-mask')).toBe(
          initialRightShoulderMask,
        );
      });
    });

    it('uses non-empty custom html data-corner-shape values for chrome tabs', async () => {
      const dispose = registerCornerDefinition({
        kind: 'override',
        shape: 'test-custom-shape',
        match(radiusPx) {
          if (radiusPx !== 6) {
            return null;
          }

          return {
            name: 'test-custom-shape-6',
            tl: {
              name: 'test-custom-shape-6-cover',
              width: 4,
              height: 4,
              bits: '1110110010000000',
            },
            border: {
              name: 'test-custom-shape-6-border',
              width: 4,
              height: 4,
              bits: '0001001001001000',
            },
          };
        },
      });

      try {
        await setDocumentCornerShape('test-custom-shape');

        render(<TestTabs mode="chrome" />);

        const activeTab = screen.getByRole('tab', { name: 'One' });
        const wrapper = activeTab.parentElement as HTMLElement;
        const expectedStyle = px({
          corners: corner.map(corner.flat, {
            tl: corner.themed(6),
            tr: corner.themed(6),
          }),
          edges: [1, 1, 0, 1],
          themeShape: 'test-custom-shape',
        }).style;
        const circleStyle = px({
          corners: corner.map(corner.flat, {
            tl: corner.themed(6),
            tr: corner.themed(6),
          }),
          edges: [1, 1, 0, 1],
          themeShape: 'circle',
        }).style;

        expect(wrapper.style.getPropertyValue('--px-tl-cover')).toBe(expectedStyle['--px-tl-cover']);
        expect(wrapper.style.getPropertyValue('--px-tr-cover')).toBe(expectedStyle['--px-tr-cover']);
        expect(wrapper.style.getPropertyValue('--px-tl-cover')).not.toBe(circleStyle['--px-tl-cover']);
      } finally {
        dispose();
      }
    });
  });

});
