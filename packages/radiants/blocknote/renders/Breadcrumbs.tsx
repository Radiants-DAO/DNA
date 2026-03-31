import { Breadcrumbs } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderBreadcrumbsBlock(_props: BlockNoteRenderProps) {
  return (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '#' },
        { label: 'Section', href: '#' },
        { label: 'Page' },
      ]}
    />
  );
}
