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
    <div className="px-3 pt-2 pb-3 border-t border-edge-muted shrink-0 flex items-center gap-3">
      {/* Transport controls — RadRadio style */}
      <div className="flex items-center gap-0 shrink-0">
        <button
          onClick={onPlayPause}
          className="h-9 w-[52px] flex items-center justify-center bg-action-primary border border-edge-primary rounded-l hover:brightness-95 active:brightness-90 transition-[filter]"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={16} />
        </button>
        <button
          onClick={onPrev}
          className="h-9 w-9 flex items-center justify-center bg-surface-primary border-y border-r border-edge-primary hover:bg-surface-muted active:bg-edge-muted transition-colors"
          aria-label="Previous track"
        >
          <Icon name="skip-back" size={14} />
        </button>
        <button
          onClick={onNext}
          className="h-9 w-9 flex items-center justify-center bg-surface-primary border-y border-r border-edge-primary rounded-r hover:bg-surface-muted active:bg-edge-muted transition-colors"
          aria-label="Next track"
        >
          <Icon name="skip-forward" size={14} />
        </button>
      </div>

      {/* Track info */}
      <button onClick={onGoToMusic} className="flex-1 min-w-0 text-left">
        <p className="font-mono text-[10px] text-content-muted truncate">
          {currentTrack.artist} — {currentTrack.title}
        </p>
      </button>
    </div>
  );
}
