import { Collapsible } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderCollapsibleBlock({ contentRef }: BlockNoteRenderProps) {
  return (
    <Collapsible.Root defaultOpen className="my-1">
      <Collapsible.Trigger>Toggle section</Collapsible.Trigger>
      <Collapsible.Content>
        <div ref={contentRef} />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
