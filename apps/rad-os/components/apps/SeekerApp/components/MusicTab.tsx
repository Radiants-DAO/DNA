'use client';

import { RefObject } from 'react';
import { Icon, RadSunLogo } from '@/components/icons';
import { formatDuration, type Track } from '@/lib/mockData/tracks';
import { Slider } from '@rdna/radiants/components/core';

interface MusicTabProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (value: number) => void;
}

export function MusicTab({
  currentTrack,
  isPlaying,
  currentTime,
  volume,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
}: MusicTabProps) {
  const progress = currentTrack.duration > 0 ? (currentTime / currentTrack.duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    onSeek(percent * currentTrack.duration);
  };

  return (
    <div className="h-full flex flex-col px-6 py-4">
      {/* Album art area */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-sun-yellow/20 to-sun-yellow/5 border border-white/10 flex items-center justify-center">
          <RadSunLogo className="w-24 h-24 text-sun-yellow/80" />
        </div>
      </div>

      {/* Track info */}
      <div className="text-center py-3">
        <h3 className="font-mondwest text-lg text-cream">{currentTrack.title}</h3>
        <p className="font-mono text-xs text-cream/50">{currentTrack.artist}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div
          className="h-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
        >
          <div
            className="absolute left-0 top-0 h-full bg-sun-yellow rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-[10px] text-cream/40">
            {formatDuration(currentTime)}
          </span>
          <span className="font-mono text-[10px] text-cream/40">
            {formatDuration(currentTrack.duration)}
          </span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-6 py-4">
        <button
          onClick={onPrev}
          className="w-10 h-10 flex items-center justify-center text-cream/60 hover:text-cream transition-colors"
          aria-label="Previous track"
        >
          <Icon name="skip-back" size={20} />
        </button>
        <button
          onClick={onPlayPause}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-sun-yellow text-black"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={24} />
        </button>
        <button
          onClick={onNext}
          className="w-10 h-10 flex items-center justify-center text-cream/60 hover:text-cream transition-colors"
          aria-label="Next track"
        >
          <Icon name="skip-forward" size={20} />
        </button>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-2 pb-2">
        <Icon name="volume-mute" size={12} className="text-cream/40" />
        <div className="flex-1">
          <Slider
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={100}
            step={1}
            size="sm"
            className="space-y-0"
          />
        </div>
        <Icon name="volume-high" size={12} className="text-cream/40" />
      </div>
    </div>
  );
}
