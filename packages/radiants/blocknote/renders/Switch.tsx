import { Switch } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderSwitchBlock(_props: BlockNoteRenderProps) {
  return <Switch checked={false} onChange={() => {}} />;
}
