'use client';

import { Button } from '@rdna/radiants/components/core';
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onPlayPause}
          className="h-9 w-[52px] flex items-center justify-center bg-action-primary border border-edge-primary rounded-l hover:brightness-95 active:brightness-90 transition-[filter]"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          className="h-9 w-9 flex items-center justify-center bg-surface-primary border-y border-r border-edge-primary hover:bg-surface-muted active:bg-edge-muted transition-colors"
          aria-label="Previous track"
        >
          <Icon name="skip-back" size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="h-9 w-9 flex items-center justify-center bg-surface-primary border-y border-r border-edge-primary rounded-r hover:bg-surface-muted active:bg-edge-muted transition-colors"
          aria-label="Next track"
        >
          <Icon name="skip-forward" size={14} />
        </Button>
      </div>

      {/* Track info */}
      <Button variant="ghost" size="sm" onClick={onGoToMusic} className="flex-1 min-w-0 text-left">
        <p className="truncate">
          {currentTrack.artist} — {currentTrack.title}
        </p>
      </Button>
    </div>
  );
}
