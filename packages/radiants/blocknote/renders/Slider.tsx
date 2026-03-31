import { Slider } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderSliderBlock(_props: BlockNoteRenderProps) {
  return <Slider value={50} onChange={() => {}} />;
}
