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
import { WordmarkLogo, Icon } from '@rdna/radiants/icons/runtime';

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

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <Icon name="heart" size={14} className={filled ? 'fill-current text-danger' : ''} />
);
const VolumeIcon = () => <Icon name="volume-high" size={14} />;
const ChevronDownIcon = () => <Icon name="chevron-down" size={10} />;


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

export function VideoPlayer({ currentVideoIndex, onPrevVideo, onNextVideo, isAudioPlaying: _isAudioPlaying, wallpaperMode }: VideoPlayerProps) {
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
    video.play().catch(() => {});

    const handleEnded = () => {
      onNextVideoRef.current();
    };

    const handleError = () => {};

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
            iconOnly
            rounded="none"
            size="sm"
            onClick={onPrevVideo}
            aria-label="Previous video"
          >
            <SmallPrevIcon />
          </Button>
          <Button
            mode="flat"
            tone="accent"
            iconOnly
            size="sm"
            onClick={onNextVideo}
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
          <Icon name="resize-corner" size={10} className="opacity-60" />
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

  const handleClick = (e: React.PointerEvent<HTMLDivElement>) => {
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
        onPointerUp={handleClick}
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
  const size = compact ? 'md' : 'lg';

  return (
    <div className="flex items-center gap-0">
      {/* Play/Pause — accent flat, rounded left */}
      <Button
        mode="flat"
        tone="accent"
        iconOnly
        size={size}
        onClick={onPlayPause}
        className="rounded-l-sm border border-line"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </Button>

      {/* Prev */}
      <Button
        quiet
        iconOnly
        rounded="none"
        size={size}
        onClick={onPrev}
        className="border-y border-r border-line"
        aria-label="Previous track"
      >
        <PrevIcon />
      </Button>

      {/* Next — rounded right */}
      <Button
        quiet
        iconOnly
        rounded="none"
        size={size}
        onClick={onNext}
        className="rounded-r-sm border-y border-r border-line"
        aria-label="Next track"
      >
        <NextIcon />
      </Button>

      {!compact && (
        <>
          <div className="w-2" />

          {/* Queue */}
          <Button
            quiet
            iconOnly
            rounded="none"
            size={size}
            onClick={onQueue}
            className="rounded-sm border border-line"
            aria-label="Add to queue"
          >
            <Icon name="queue" size={14} />
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
          compact
          fullWidth
          size={compact ? 'md' : 'lg'}
          rounded="none"
          icon={<ChevronDownIcon />}
          className="rounded-sm border border-line"
        >
          {currentChannel ? `Artist: ${currentChannel.name}` : 'Select artist...'}
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
      <div className="flex-1 overflow-hidden">
        <Slider
          value={volume}
          onChange={onChange}
          min={0}
          max={100}
          step={1}
          size="sm"
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
    setPlaying: _setPlaying,
    setCurrentTime,
    nextTrack,
    pendingSeek,
    clearPendingSeek,
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

  // Apply pending seek from store
  useEffect(() => {
    if (pendingSeek !== null && audioRef.current) {
      audioRef.current.currentTime = pendingSeek;
      clearPendingSeek();
    }
  }, [pendingSeek, clearPendingSeek]);

  return (
    <audio
      ref={audioRef}
      src={currentTrack.audioUrl}
      preload="metadata"
    />
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RadRadioApp({ windowId: _windowId }: AppProps) {
  const { volume, setVolume } = usePreferencesStore();
  const {
    currentVideoIndex,
    currentTrackIndex,
    currentChannel,
    isPlaying,
    currentTime,
    favorites,
    minified,
    nextVideo,
    prevVideo,
    nextTrack,
    prevTrack,
    setChannel,
    togglePlay,
    seekTo,
    toggleFavorite,
    toggleMinified,
  } = useRadRadioStore();

  // Get tracks for current channel
  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];

  // Seek handler — dispatch through the store so RadRadioController applies it
  const handleSeek = useCallback((time: number) => {
    seekTo(time);
  }, [seekTo]);

  // Channel change handler
  const handleChannelChange = useCallback((value: string) => {
    setChannel(value as Track['channel']);
  }, [setChannel]);

  const isFavorite = favorites.includes(currentTrack.id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Headless audio controller */}
      <RadRadioController />

      {/* Video Player — hidden when minified */}
      {!minified && (
        <VideoPlayer
          currentVideoIndex={currentVideoIndex}
          onPrevVideo={() => prevVideo(videos.length)}
          onNextVideo={() => nextVideo(videos.length)}
          isAudioPlaying={isPlaying}
        />
      )}

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
              iconOnly
              rounded="none"
              size="sm"
              onClick={toggleMinified}
              aria-label={minified ? 'Show video' : 'Hide video'}
            >
              <Icon name={minified ? 'chevron-down' : 'chevron-up'} size={14} />
            </Button>
            <Button
              quiet
              iconOnly
              rounded="none"
              size="sm"
              tone={isFavorite ? 'danger' : 'accent'}
              onClick={() => toggleFavorite(currentTrack.id)}
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
          <div className="w-44">
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
