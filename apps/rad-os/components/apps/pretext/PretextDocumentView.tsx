'use client';

import { useMemo } from 'react';
import { markdownToPretextBlocks } from './markdown';
import type { PretextDocumentSettings } from './types';
import { BookView } from './primitives/book/BookView';
import { BroadsheetView } from './primitives/broadsheet/BroadsheetView';
import { EditorialView } from './primitives/editorial/EditorialView';

interface PretextDocumentViewProps {
  markdown: string;
  settings: PretextDocumentSettings;
  containerWidth?: number;
  containerHeight?: number;
}

export function PretextDocumentView({
  markdown,
  settings,
  containerWidth = settings.preview.windowWidth,
  containerHeight = settings.preview.windowHeight,
}: PretextDocumentViewProps) {
  const blocks = useMemo(() => markdownToPretextBlocks(markdown), [markdown]);

  switch (settings.primitive) {
    case 'editorial':
      return (
        <EditorialView
          blocks={blocks}
          settings={settings.primitiveSettings}
          assets={settings.assets}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      );

    case 'broadsheet':
      return (
        <BroadsheetView
          blocks={blocks}
          settings={settings.primitiveSettings}
          title={settings.title}
          assets={settings.assets}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      );

    case 'book':
      return (
        <BookView
          blocks={blocks}
          settings={settings.primitiveSettings}
          assets={settings.assets}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      );
  }
}
