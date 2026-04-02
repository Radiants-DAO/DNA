'use client';

import type { AppProps } from '@/lib/apps';

export default function AmericaApp({ windowId: _windowId }: AppProps) {
  return (
    <div className="relative w-full h-full bg-inv overflow-hidden">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- reason:background-video owner:rad-os expires:2026-12-31 issue:DNA-000 */}
      <video
        src="/media/video/america.mov"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Superteam USA logo centered */}
      {/* eslint-disable-next-line @next/next/no-img-element -- reason:static-logo owner:rad-os expires:2026-12-31 issue:DNA-000 */}
      <img
        src="/assets/superteam-usa.webp"
        alt="Superteam USA"
        className="absolute inset-0 m-auto w-64 object-contain pointer-events-none"
      />
    </div>
  );
}
