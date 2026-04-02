'use client';

import { useRef, useEffect } from 'react';
import type { AppProps } from '@/lib/apps';

export default function AmericaApp({ windowId: _windowId }: AppProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 7;
    video.play();
    return () => {
      video.pause();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-inv overflow-hidden">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- reason:background-video owner:rad-os expires:2026-12-31 issue:DNA-000 */}
      <video
        ref={videoRef}
        src="/media/video/america.mov"
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Superteam USA logo — ink shadow behind, white logo on top */}
      <div className="absolute inset-0 m-auto w-64 h-fit pointer-events-none">
        {/* Shadow: ink-masked duplicate offset down-right */}
        {/* eslint-disable-next-line @next/next/no-img-element -- reason:static-logo owner:rad-os expires:2026-12-31 issue:DNA-000 */}
        <img
          src="/assets/superteam-usa.png"
          alt=""
          aria-hidden="true"
          className="absolute top-[3px] left-[3px] w-full object-contain brightness-0"
        />
        {/* Foreground logo */}
        {/* eslint-disable-next-line @next/next/no-img-element -- reason:static-logo owner:rad-os expires:2026-12-31 issue:DNA-000 */}
        <img
          src="/assets/superteam-usa.png"
          alt="Superteam USA"
          className="relative w-full object-contain"
        />
      </div>
    </div>
  );
}
