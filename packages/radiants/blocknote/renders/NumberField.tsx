import { NumberField } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderNumberFieldBlock(_props: BlockNoteRenderProps) {
  return (
    <NumberField.Root defaultValue={0}>
      <NumberField.Group>
        <NumberField.Decrement />
        <NumberField.Input />
        <NumberField.Increment />
      </NumberField.Group>
    </NumberField.Root>
  );
}
