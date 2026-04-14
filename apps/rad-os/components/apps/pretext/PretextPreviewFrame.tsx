'use client';

import { useContainerSize } from '@/hooks/useContainerSize';
import { PretextDocumentView } from './PretextDocumentView';
import type { PretextDocumentSettings } from './types';

interface PretextPreviewFrameProps {
  markdown: string;
  settings: PretextDocumentSettings;
}

export function PretextPreviewFrame({
  markdown,
  settings,
}: PretextPreviewFrameProps) {
  const [frameRef, size] = useContainerSize(
    settings.preview.windowWidth,
    settings.preview.windowHeight,
  );

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-md border border-line bg-card shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2 text-xs uppercase tracking-[0.12em] text-mute">
        <span>{settings.primitive}</span>
        <span>{settings.preview.windowWidth} x {settings.preview.windowHeight}</span>
      </div>
      <div ref={frameRef} className="min-h-0 flex-1 overflow-hidden">
        <PretextDocumentView
          markdown={markdown}
          settings={settings}
          containerWidth={size.width}
          containerHeight={size.height}
        />
      </div>
    </div>
  );
}
