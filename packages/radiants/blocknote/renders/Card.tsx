import { Card, CardBody } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderCardBlock({ block, contentRef }: BlockNoteRenderProps) {
  return (
    <Card variant={block.props.variant as 'default' | 'inverted' | 'raised'} className="my-1">
      <CardBody>
        <div ref={contentRef} />
      </CardBody>
    </Card>
  );
}
