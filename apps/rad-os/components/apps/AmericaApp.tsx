'use client';

import type { AppProps } from '@/lib/apps';

export default function AmericaApp({ windowId: _windowId }: AppProps) {
  return (
    <div className="w-full h-full bg-inv flex items-center justify-center">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- reason:background-video owner:rad-os expires:2026-12-31 issue:DNA-000 */}
      <video
        src="/media/video/america.mp4"
        autoPlay
        loop
        className="w-full h-full object-contain"
      />
    </div>
  );
}
