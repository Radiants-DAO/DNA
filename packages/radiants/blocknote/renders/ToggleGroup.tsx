import { ToggleGroup } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderToggleGroupBlock(_props: BlockNoteRenderProps) {
  return (
    <ToggleGroup defaultValue={['a']}>
      <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      <ToggleGroup.Item value="c">C</ToggleGroup.Item>
    </ToggleGroup>
  );
}
