import { ScrollArea } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderScrollAreaBlock({ contentRef }: BlockNoteRenderProps) {
  return (
    <ScrollArea.Root className="my-1" style={{ maxHeight: 200 }}>
      <ScrollArea.Viewport>
        <div ref={contentRef} />
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" />
    </ScrollArea.Root>
  );
}
