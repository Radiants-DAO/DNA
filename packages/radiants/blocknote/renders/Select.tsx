import { Select, useSelectState } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderSelectBlock(_props: BlockNoteRenderProps) {
  const { state, actions } = useSelectState({ defaultValue: '' });
  return (
    <Select.Provider state={state} actions={actions}>
      <Select.Trigger placeholder="Select..." size="md" />
    </Select.Provider>
  );
}
