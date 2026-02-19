'use client';

import { Icon } from '@/components/icons';
import type { Track } from '@/lib/mockData/tracks';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToMusic: () => void;
}

export function MiniPlayer({
  currentTrack,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onGoToMusic,
}: MiniPlayerProps) {
  if (!currentTrack) return null;

  return (
    <div className="h-10 px-3 flex items-center gap-2 bg-white/5 border-t border-white/10 shrink-0">
      <button
        onClick={onPrev}
        className="w-6 h-6 flex items-center justify-center text-cream/50 hover:text-cream transition-colors"
        aria-label="Previous track"
      >
        <Icon name="skip-back" size={10} />
      </button>

      <button
        onClick={onPlayPause}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-sun-yellow text-black"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <Icon name={isPlaying ? 'pause' : 'play'} size={10} />
      </button>

      <button
        onClick={onNext}
        className="w-6 h-6 flex items-center justify-center text-cream/50 hover:text-cream transition-colors"
        aria-label="Next track"
      >
        <Icon name="skip-forward" size={10} />
      </button>

      <button
        onClick={onGoToMusic}
        className="flex-1 min-w-0 text-left"
      >
        <p className="font-mono text-xs text-cream/70 truncate">
          {currentTrack.artist} — {currentTrack.title}
        </p>
      </button>

      <div className="flex items-center gap-1">
        <Icon name="music-8th-notes" size={12} className="text-sun-yellow/60" />
      </div>
    </div>
  );
}
