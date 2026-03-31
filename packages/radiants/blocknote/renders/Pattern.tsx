import { Pattern } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderPatternBlock({ contentRef }: BlockNoteRenderProps) {
  return (
    <Pattern pat="diagonal-dots" bg="true" className="p-4 my-1">
      <span ref={contentRef} />
    </Pattern>
  );
}
