import { Alert } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderAlertBlock({ block, contentRef }: BlockNoteRenderProps) {
  return (
    <Alert.Root variant={block.props.variant as 'default' | 'success' | 'warning' | 'error' | 'info'} className="my-1">
      <Alert.Icon />
      <Alert.Content className="flex-1 min-w-0">
        <div ref={contentRef} />
      </Alert.Content>
    </Alert.Root>
  );
}
