import { Tabs, useTabsState } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderTabsBlock(_props: BlockNoteRenderProps) {
  const { state, actions, meta } = useTabsState({ defaultValue: 'tab1' });
  return (
    <Tabs.Provider state={state} actions={actions} meta={meta}>
      <Tabs.List>
        <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Provider>
  );
}
