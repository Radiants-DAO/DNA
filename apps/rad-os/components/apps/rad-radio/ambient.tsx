'use client';

import React from 'react';
import { VideoPlayer, RadRadioWidget, RadRadioController, videos } from '@/components/apps/RadRadioApp';
import { useRadRadioStore } from '@/store';

export function RadRadioAmbientWallpaper() {
  const { currentVideoIndex, prevVideo, nextVideo } = useRadRadioStore();
  return (
    <VideoPlayer
      currentVideoIndex={currentVideoIndex}
      onPrevVideo={() => prevVideo(videos.length)}
      onNextVideo={() => nextVideo(videos.length)}
      wallpaperMode
    />
  );
}

export function RadRadioAmbientWidget({ appId, onExit }: { appId: string; onExit: () => void }) {
  return <RadRadioWidget onExitWidget={onExit} />;
}

export function RadRadioAmbientController() {
  return <RadRadioController />;
}
