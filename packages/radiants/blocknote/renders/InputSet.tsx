import { InputSet } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderInputSetBlock(_props: BlockNoteRenderProps) {
  return (
    <InputSet.Root>
      <InputSet.Legend>Field Group</InputSet.Legend>
    </InputSet.Root>
  );
}
