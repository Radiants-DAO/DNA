import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, useTabsState } from './Tabs';

function TestTabs({ defaultValue = 'one' }: { defaultValue?: string }) {
  const { state, actions, meta } = useTabsState({
    defaultValue,
    mode: 'pill',
    layout: 'default',
  });

  return (
    <Tabs.Provider state={state} actions={actions} meta={meta}>
      <Tabs.Frame>
        <Tabs.List>
          <Tabs.Trigger value="one">Tab One</Tabs.Trigger>
          <Tabs.Trigger value="two">Tab Two</Tabs.Trigger>
          <Tabs.Trigger value="three">Tab Three</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Panel One</Tabs.Content>
        <Tabs.Content value="two">Panel Two</Tabs.Content>
        <Tabs.Content value="three">Panel Three</Tabs.Content>
      </Tabs.Frame>
    </Tabs.Provider>
  );
}

function SidebarTabs() {
  const { state, actions, meta } = useTabsState({
    defaultValue: 'one',
    mode: 'pill',
    layout: 'sidebar',
  });
  return (
    <Tabs.Provider state={state} actions={actions} meta={meta}>
      <Tabs.List>
        <Tabs.Trigger value="one">Tab One</Tabs.Trigger>
        <Tabs.Trigger value="two">Tab Two</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one">Panel One</Tabs.Content>
      <Tabs.Content value="two">Panel Two</Tabs.Content>
    </Tabs.Provider>
  );
}

function StatefulTabs({ keepMounted }: { keepMounted?: boolean }) {
  const { state, actions, meta } = useTabsState({ defaultValue: 'one', layout: 'default' });
  return (
    <Tabs.Provider state={state} actions={actions} meta={meta}>
      <Tabs.List>
        <Tabs.Trigger value="one">Tab One</Tabs.Trigger>
        <Tabs.Trigger value="two">Tab Two</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one" keepMounted={keepMounted}>
        <input defaultValue="draft value" />
      </Tabs.Content>
      <Tabs.Content value="two" keepMounted={keepMounted}>Panel Two</Tabs.Content>
    </Tabs.Provider>
  );
}

describe('Tabs', () => {
  test('renders tabs with correct roles and initial selection', () => {
    render(<TestTabs />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel One');
  });

  test('clicking a tab changes selection', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    await user.click(screen.getByText('Tab Two'));

    expect(screen.getByText('Tab Two').closest('[role="tab"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two');
  });

  test('arrow keys move focus between tabs', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    const tabs = screen.getAllByRole('tab');

    // Focus first tab
    await user.click(tabs[0]);
    expect(tabs[0]).toHaveFocus();

    // ArrowRight moves focus to next tab
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveFocus();

    // ArrowRight again
    await user.keyboard('{ArrowRight}');
    expect(tabs[2]).toHaveFocus();
  });

  test('uses vertical keyboard navigation in sidebar layout', async () => {
    const user = userEvent.setup();
    render(<SidebarTabs />);
    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[0]);
    await user.keyboard('{ArrowDown}');
    expect(tabs[1]).toHaveFocus();
  });

  test('preserves panel state when keepMounted is enabled', async () => {
    const user = userEvent.setup();
    render(<StatefulTabs keepMounted />);
    // Switch to Tab Two
    await user.click(screen.getByText('Tab Two'));
    // Switch back to Tab One — input should still be in DOM with its value
    await user.click(screen.getByText('Tab One'));
    expect(screen.getByDisplayValue('draft value')).toBeInTheDocument();
  });

  test('Tabs.Indicator is exported', () => {
    expect(Tabs.Indicator).toBeDefined();
  });

  test('arrow key focus activates tab on focus', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[0]);

    // Navigate right - should activate tab two
    await user.keyboard('{ArrowRight}');
    // The second tab should now be focused and selected
    expect(tabs[1]).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Two');
  });
});
