import { Tabs } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderTabsBlock(_props: BlockNoteRenderProps) {
  return (
    <Tabs defaultValue="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
}
