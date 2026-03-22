'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePreferencesStore, useRadRadioStore } from '@/store';
import {
  mockTracks,
  channels,
  getTracksByChannel,
  formatDuration,
  type Track,
} from '@/lib/mockData/tracks';
import { type AppProps } from '@/lib/apps';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Slider,
} from '@rdna/radiants/components/core';
import { WordmarkLogo, Icon } from '@rdna/radiants/icons';

// ============================================================================
// Video Data
// ============================================================================

export const videos = [
  { id: 'dream', filename: 'dream.mp4', src: '/media/video/dream.mp4' },
  { id: 'miner', filename: 'miner.mp4', src: '/media/video/miner.mp4' },
  { id: 'porsche', filename: 'porsche.mp4', src: '/media/video/porsche.mp4' },
];

// ============================================================================
// Icons (using Icon component from assets)
// ============================================================================

// Playback icons
const PlayIcon = () => <Icon name="play" size={16} />;
const PauseIcon = () => <Icon name="pause" size={16} />;
const PrevIcon = () => <Icon name="skip-back" size={14} />;
const NextIcon = () => <Icon name="skip-forward" size={14} />;

// Small prev/next icons for video controls
const SmallPrevIcon = () => <Icon name="skip-back" size={8} />;
const SmallNextIcon = () => <Icon name="skip-forward" size={8} />;

// Other icons
const ShareIcon = () => <Icon name="share" size={14} />;
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <Icon name="heart" size={14} className={filled ? 'fill-current' : ''} />
);
const VolumeIcon = () => <Icon name="volume-high" size={14} />;
const ChevronDownIcon = () => <Icon name="chevron-down" size={10} />;

// Queue icon - keeping custom since no queue icon exists in assets
const QueueIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="1" y="2" width="8" height="1.5" />
    <rect x="1" y="5" width="8" height="1.5" />
    <rect x="1" y="8" width="8" height="1.5" />
    <path d="M11 4v6l3-3z" />
  </svg>
);

const ResizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="opacity-60">
    <path d="M9 1v8H1" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// ============================================================================
// Video Player Component (Poolsuite-style with CRT effects)
// ============================================================================

interface VideoPlayerProps {
  currentVideoIndex: number;
  onPrevVideo: () => void;
  onNextVideo: () => void;
  isAudioPlaying?: boolean;
  /** When true, renders full-bleed (no aspect-video, inset-0 object-cover) */
  wallpaperMode?: boolean;
}

export function VideoPlayer({ currentVideoIndex, onPrevVideo, onNextVideo, isAudioPlaying, wallpaperMode }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onNextVideoRef = useRef(onNextVideo);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const currentVideo = videos[currentVideoIndex];

  // Keep callback ref fresh without triggering effect re-runs
  onNextVideoRef.current = onNextVideo;

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load and auto-play video when source changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Load the new source
    video.load();

    // Play video (muted for autoplay policy)
    video.muted = true;
    video.play().catch((err) => {
      console.log('Video autoplay prevented:', err);
    });

    const handleEnded = () => {
      onNextVideoRef.current();
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentVideoIndex]);

  if (wallpaperMode) {
    return (
      // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:video-playback-requires-true-black owner:rad-os expires:2026-12-31 issue:DNA-999
      <div ref={containerRef} className="absolute inset-0 bg-pure-black overflow-hidden">
        {/* Video element */}
        <video
          key={currentVideo.id}
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          loop={false}
          playsInline
          muted
          autoPlay
        >
          <source src={currentVideo.src} type="video/mp4" />
        </video>

        {/* CRT Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:DNA-999
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* CRT Phosphor/RGB effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:DNA-999
            backgroundImage: `repeating-linear-gradient(
              90deg,
              rgba(255,0,0,1) 0px,
              rgba(0,255,0,1) 1px,
              rgba(0,0,255,1) 2px,
              rgba(255,0,0,1) 3px
            )`,
            backgroundSize: '3px 100%',
          }}
        />

        {/* Vignette effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:DNA-999
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:video-playback-requires-true-black owner:rad-os expires:2026-12-31 issue:DNA-999
    <div ref={containerRef} className="relative w-full aspect-video bg-pure-black overflow-hidden">
      {/* Video element */}
      <video
        key={currentVideo.id}
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        loop={false}
        playsInline
        muted
        autoPlay
      >
        <source src={currentVideo.src} type="video/mp4" />
      </video>

      {/* CRT Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:DNA-999
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* CRT Phosphor/RGB effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:DNA-999
          backgroundImage: `repeating-linear-gradient(
            90deg,
            rgba(255,0,0,1) 0px,
            rgba(0,255,0,1) 1px,
            rgba(0,0,255,1) 2px,
            rgba(255,0,0,1) 3px
          )`,
          backgroundSize: '3px 100%',
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:crt-visual-effect owner:rad-os expires:2026-12-31 issue:DNA-999
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Brand watermark - centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <WordmarkLogo className="h-8 w-auto drop-shadow-md opacity-90" color="cream" />
      </div>

      {/* Video controls bar - bottom */}
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:video-control-bar-requires-true-black owner:rad-os expires:2026-12-31 issue:DNA-999 */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-pure-black/80 flex items-center justify-between px-1">
        {/* Prev/Next video buttons */}
        <div className="flex items-center gap-0">
          <Button
            quiet
            size="sm"
            onClick={onPrevVideo}
            className="w-[18px] h-[18px] flex items-center justify-center hover:bg-accent/20 active:bg-accent/30 transition-colors"
            aria-label="Previous video"
          >
            <SmallPrevIcon />
          </Button>
          <Button
            quiet
            size="sm"
            onClick={onNextVideo}
            className="w-[18px] h-[18px] flex items-center justify-center bg-accent hover:bg-accent/90 active:bg-accent/80 transition-colors text-accent-inv"
            aria-label="Next video"
          >
            <SmallNextIcon />
          </Button>
        </div>

        {/* Filename */}
        <span className="flex-1 px-2 font-mono text-sm text-mute tracking-tight truncate">
          {currentVideo.filename}
        </span>

        {/* Resolution + resize handle */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm text-mute tracking-tight">
            {dimensions.width}x{dimensions.height}
          </span>
          <ResizeIcon />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Progress Bar (Poolsuite-style minimal)
// ============================================================================

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    onSeek(percent * duration);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Play marker */}
      <Icon name="play" size={8} className="text-mute" />

      {/* Progress track */}
      <div
        className="flex-1 h-1 bg-rule cursor-pointer relative"
        onClick={handleClick}
      >
        <div
          className="absolute left-0 top-0 h-full bg-inv/60 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time display */}
      <span className="font-mono text-sm text-mute min-w-[60px] text-right">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>
    </div>
  );
}

// ============================================================================
// Transport Controls (Poolsuite-style grouped buttons)
// ============================================================================

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onQueue?: () => void;
  compact?: boolean;
}

function TransportControls({ isPlaying, onPlayPause, onPrev, onNext, onQueue, compact }: TransportControlsProps) {
  const btnHeight = compact ? 'h-7' : 'h-9';
  const playWidth = compact ? 'w-10' : 'w-[52px]';
  const navWidth = compact ? 'w-7' : 'w-9';
  const queueWidth = compact ? 'w-10' : 'w-[52px]';

  return (
    <div className="flex items-center gap-0">
      {/* Play/Pause button - yellow background */}
      <Button
        quiet
        size="sm"
        onClick={onPlayPause}
        className={`${btnHeight} ${playWidth} flex items-center justify-center bg-accent text-accent-inv border border-line rounded-l hover:brightness-95 active:brightness-90 transition-[filter]`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </Button>

      {/* Prev button */}
      <Button
        quiet
        size="sm"
        onClick={onPrev}
        className={`${btnHeight} ${navWidth} flex items-center justify-center bg-page text-main border-y border-r border-line hover:bg-depth active:bg-depth transition-colors`}
        aria-label="Previous track"
      >
        <PrevIcon />
      </Button>

      {/* Next button */}
      <Button
        quiet
        size="sm"
        onClick={onNext}
        className={`${btnHeight} ${navWidth} flex items-center justify-center bg-page text-main border-y border-r border-line rounded-r hover:bg-depth active:bg-depth transition-colors`}
        aria-label="Next track"
      >
        <NextIcon />
      </Button>

      {!compact && (
        <>
          {/* Spacer */}
          <div className="w-2" />

          {/* Queue button - pink background */}
          <Button
            quiet
            size="sm"
            onClick={onQueue}
            className={`${btnHeight} ${queueWidth} flex items-center justify-center bg-accent-soft/40 text-main border border-line rounded hover:brightness-95 active:brightness-90 transition-[filter]`}
            aria-label="Add to queue"
          >
            <QueueIcon />
          </Button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Channel Selector (Poolsuite-style dropdown)
// ============================================================================

interface ChannelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

function ChannelSelector({ value, onChange, compact }: ChannelSelectorProps) {
  const currentChannel = channels.find(c => c.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          quiet
          size="sm"
          className={`appearance-none w-full ${compact ? 'h-7' : 'h-8'} px-3 bg-page text-main border border-line rounded font-mono text-sm cursor-pointer hover:bg-depth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus flex items-center justify-between gap-2`}
        >
          <span>{currentChannel ? `Artist: ${currentChannel.name}` : 'Select artist...'}</span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[200px] bg-page">
        {channels.map((ch) => (
          <DropdownMenuItem
            key={ch.id}
            onClick={() => onChange(ch.id)}
            className={value === ch.id ? 'bg-accent' : ''}
          >
            {ch.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Volume Control (Poolsuite-style)
// ============================================================================

interface VolumeControlProps {
  volume: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

function VolumeControl({ volume, onChange, compact }: VolumeControlProps) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'h-7' : 'h-8'} px-2 bg-page text-main border border-line rounded`}>
      <VolumeIcon />
      <div className="flex-1">
        <Slider
          value={volume}
          onChange={onChange}
          min={0}
          max={100}
          step={1}
          size="sm"
          className="space-y-0"
        />
      </div>
    </div>
  );
}

// ============================================================================
// RadRadioController — headless audio element (persists across mode switches)
// ============================================================================

export function RadRadioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { volume } = usePreferencesStore();
  const {
    currentTrackIndex,
    currentChannel,
    isPlaying,
    setPlaying,
    setCurrentTime,
    nextTrack,
  } = useRadRadioStore();

  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];

  // Update volume when preference changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Load and play new track when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.load();

    if (isPlaying) {
      audio.play().catch(() => {
        // Autoplay blocked
      });
    }
  }, [currentTrack.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause with store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Time update and ended handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      nextTrack(channelTracks.length);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [channelTracks.length, nextTrack, setCurrentTime]);

  return (
    <audio
      ref={audioRef}
      src={currentTrack.audioUrl}
      preload="metadata"
    />
  );
}

// ============================================================================
// RadRadioWidget — compact floating panel for widget mode
// ============================================================================

interface RadRadioWidgetProps {
  onExitWidget: () => void;
}

export function RadRadioWidget({ onExitWidget }: RadRadioWidgetProps) {
  const { volume, setVolume } = usePreferencesStore();
  const {
    currentTrackIndex,
    currentChannel,
    isPlaying,
    currentTime,
    favorites,
    togglePlay,
    prevTrack,
    nextTrack,
    setChannel,
    setCurrentTime,
    toggleFavorite,
    prevVideo,
    nextVideo,
  } = useRadRadioStore();

  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];
  const isFavorite = favorites.includes(currentTrack.id);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    // Also seek the audio element via a custom event
    const audioEl = document.querySelector('audio') as HTMLAudioElement | null;
    if (audioEl) {
      audioEl.currentTime = time;
    }
  }, [setCurrentTime]);

  const handleChannelChange = useCallback((value: string) => {
    setChannel(value as Track['channel']);
  }, [setChannel]);

  return (
    <div className="w-[320px] bg-inv border border-line pixel-rounded-sm pixel-shadow-floating text-accent">
      {/* Header with track info + close */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-line/30">
        <Icon name="broadcast-dish" size={12} className="shrink-0 text-accent" />
        <div className="flex-1 min-w-0">
          <p className="truncate">
            {currentTrack.artist} - {currentTrack.title}
          </p>
        </div>
        <div className="flex items-center gap-0 shrink-0">
          <Button
            quiet
            size="sm"
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`p-1 transition-colors ${isFavorite ? 'text-danger' : 'text-mute hover:text-accent'}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartIcon filled={isFavorite} />
          </Button>
          <Button
            quiet
            size="sm"
            onClick={onExitWidget}
            className="p-1 text-mute hover:text-accent transition-colors"
            aria-label="Exit widget mode"
          >
            <Icon name="close" size={14} />
          </Button>
        </div>
      </div>

      {/* Transport + progress */}
      <div className="px-3 py-1.5 flex items-center gap-2">
        <TransportControls
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onPrev={() => prevTrack(channelTracks.length)}
          onNext={() => nextTrack(channelTracks.length)}
          compact
        />
        <div className="flex-1 min-w-0">
          <ProgressBar
            currentTime={currentTime}
            duration={currentTrack.duration}
            onSeek={handleSeek}
          />
        </div>
      </div>

      {/* Channel + Volume + Video nav */}
      <div className="px-3 pb-1.5 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <ChannelSelector value={currentChannel} onChange={handleChannelChange} compact />
        </div>
        <div className="w-28">
          <VolumeControl volume={volume} onChange={setVolume} compact />
        </div>
      </div>

      {/* Video navigation */}
      <div className="px-3 pb-1.5 flex items-center gap-1.5">
        <Button
          quiet
          size="sm"
          onClick={() => prevVideo(videos.length)}
          className="h-5 px-1.5 flex items-center gap-0.5 text-xs font-mono text-mute hover:text-accent border border-line/30 rounded transition-colors"
          aria-label="Previous video"
        >
          <SmallPrevIcon /> Vid
        </Button>
        <Button
          quiet
          size="sm"
          onClick={() => nextVideo(videos.length)}
          className="h-5 px-1.5 flex items-center gap-0.5 text-xs font-mono text-mute hover:text-accent border border-line/30 rounded transition-colors"
          aria-label="Next video"
        >
          Vid <SmallNextIcon />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RadRadioApp({ windowId }: AppProps) {
  const { volume, setVolume } = usePreferencesStore();
  const {
    currentVideoIndex,
    currentTrackIndex,
    currentChannel,
    isPlaying,
    currentTime,
    favorites,
    nextVideo,
    prevVideo,
    nextTrack,
    prevTrack,
    setChannel,
    togglePlay,
    setCurrentTime,
    toggleFavorite,
  } = useRadRadioStore();

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rados-favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        // Sync localStorage → store (only once on mount)
        parsed.forEach((id) => {
          if (!favorites.includes(id)) {
            toggleFavorite(id);
          }
        });
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get tracks for current channel
  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];

  // Seek handler — also update the audio element directly
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    const audioEl = document.querySelector('audio') as HTMLAudioElement | null;
    if (audioEl) {
      audioEl.currentTime = time;
    }
  }, [setCurrentTime]);

  // Channel change handler
  const handleChannelChange = useCallback((value: string) => {
    setChannel(value as Track['channel']);
  }, [setChannel]);

  const isFavorite = favorites.includes(currentTrack.id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Video Player (independent from audio) */}
      <VideoPlayer
        currentVideoIndex={currentVideoIndex}
        onPrevVideo={() => prevVideo(videos.length)}
        onNextVideo={() => nextVideo(videos.length)}
        isAudioPlaying={isPlaying}
      />

      {/* Track Info */}
      <div className="px-3 py-2 border-b border-rule">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-size-md truncate">
              {currentTrack.artist} - {currentTrack.title}
            </h2>
            <p className="truncate">
              &quot;{currentTrack.album}&quot;
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              quiet
              size="sm"
              className="p-1.5 text-mute hover:text-main transition-colors"
              aria-label="Share"
            >
              <ShareIcon />
            </Button>
            <Button
              quiet
              size="sm"
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`p-1.5 transition-colors ${
                isFavorite ? 'text-danger' : 'text-mute hover:text-main'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon filled={isFavorite} />
            </Button>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex-1 p-3 flex flex-col gap-3">
        {/* Transport Controls + Progress Bar */}
        <div className="flex items-center gap-3">
          <TransportControls
            isPlaying={isPlaying}
            onPlayPause={togglePlay}
            onPrev={() => prevTrack(channelTracks.length)}
            onNext={() => nextTrack(channelTracks.length)}
          />
          <div className="flex-1">
            <ProgressBar
              currentTime={currentTime}
              duration={currentTrack.duration}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Channel Selector + Volume */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ChannelSelector
              value={currentChannel}
              onChange={handleChannelChange}
            />
          </div>
          <div className="w-32">
            <VolumeControl
              volume={volume}
              onChange={setVolume}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadRadioApp;
