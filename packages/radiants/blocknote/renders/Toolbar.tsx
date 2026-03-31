import { Toolbar } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderToolbarBlock(_props: BlockNoteRenderProps) {
  return (
    <Toolbar.Root>
      <Toolbar.Button>Bold</Toolbar.Button>
      <Toolbar.Button>Italic</Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Button>Link</Toolbar.Button>
    </Toolbar.Root>
  );
}
