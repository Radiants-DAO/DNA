'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePreferencesStore } from '@/store';
import {
  mockTracks,
  channels,
  getTracksByChannel,
  formatDuration,
  type Track,
} from '@/lib/mockData/tracks';
import { AppProps } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Slider,
} from '@dna/radiants/components/core';
import { WordmarkLogo, Icon } from '@/components/icons';

// ============================================================================
// Video Data
// ============================================================================

const videos = [
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
  isAudioPlaying: boolean;
}

function VideoPlayer({ currentVideoIndex, onPrevVideo, onNextVideo, isAudioPlaying }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const currentVideo = videos[currentVideoIndex];

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
      onNextVideo();
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
  }, [currentVideoIndex, onNextVideo]);

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black overflow-hidden">
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
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* CRT Phosphor/RGB effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
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
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Brand watermark - centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <WordmarkLogo className="h-8 w-auto drop-shadow-md opacity-90" color="cream" />
      </div>

      {/* Video controls bar - bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/80 flex items-center justify-between px-1">
        {/* Prev/Next video buttons */}
        <div className="flex items-center gap-0">
          <button
            onClick={onPrevVideo}
            className="w-[18px] h-[18px] flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors"
            aria-label="Previous video"
          >
            <SmallPrevIcon />
          </button>
          <button
            onClick={onNextVideo}
            className="w-[18px] h-[18px] flex items-center justify-center bg-white hover:bg-white/90 active:bg-white/80 transition-colors text-black"
            aria-label="Next video"
          >
            <SmallNextIcon />
          </button>
        </div>

        {/* Filename */}
        <span className="flex-1 px-2 font-mono text-xs text-cream/70 tracking-tight truncate">
          {currentVideo.filename}
        </span>

        {/* Resolution + resize handle */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-cream/70 tracking-tight">
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
      <Icon name="play" size={8} className="text-black/60" />

      {/* Progress track */}
      <div
        className="flex-1 h-1 bg-black/20 cursor-pointer relative"
        onClick={handleClick}
      >
        <div
          className="absolute left-0 top-0 h-full bg-black/60 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time display */}
      <span className="font-mono text-xs text-black/50 min-w-[60px] text-right">
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
}

function TransportControls({ isPlaying, onPlayPause, onPrev, onNext, onQueue }: TransportControlsProps) {
  return (
    <div className="flex items-center gap-0">
      {/* Play/Pause button - yellow background */}
      <button
        onClick={onPlayPause}
        className="h-9 w-[52px] flex items-center justify-center bg-sun-yellow border border-black rounded-l hover:brightness-95 active:brightness-90 transition-all"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      {/* Prev button */}
      <button
        onClick={onPrev}
        className="h-9 w-9 flex items-center justify-center bg-cream border-y border-r border-black hover:bg-black/5 active:bg-black/10 transition-all"
        aria-label="Previous track"
      >
        <PrevIcon />
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        className="h-9 w-9 flex items-center justify-center bg-cream border-y border-r border-black rounded-r hover:bg-black/5 active:bg-black/10 transition-all"
        aria-label="Next track"
      >
        <NextIcon />
      </button>

      {/* Spacer */}
      <div className="w-2" />

      {/* Queue button - pink background */}
      <button
        onClick={onQueue}
        className="h-9 w-[52px] flex items-center justify-center bg-highlight-pink/40 border border-black rounded hover:brightness-95 active:brightness-90 transition-all"
        aria-label="Add to queue"
      >
        <QueueIcon />
      </button>
    </div>
  );
}

// ============================================================================
// Channel Selector (Poolsuite-style dropdown)
// ============================================================================

interface ChannelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
  const currentChannel = channels.find(c => c.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="appearance-none w-full h-8 px-3 bg-cream border border-black rounded font-mono text-xs cursor-pointer hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-black flex items-center justify-between gap-2"
        >
          <span>{currentChannel ? `Artist: ${currentChannel.name}` : 'Select artist...'}</span>
          <ChevronDownIcon />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[200px] bg-cream">
        {channels.map((ch) => (
          <DropdownMenuItem
            key={ch.id}
            onClick={() => onChange(ch.id)}
            className={value === ch.id ? 'bg-sun-yellow' : ''}
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
}

function VolumeControl({ volume, onChange }: VolumeControlProps) {
  return (
    <div className="flex items-center gap-2 h-8 px-2 bg-cream border border-black rounded">
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
// Main Component
// ============================================================================

export function RadRadioApp({ windowId }: AppProps) {
  const { volume, setVolume } = usePreferencesStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio player state
  const [currentChannel, setCurrentChannel] = useState<Track['channel']>('kemosabe');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Video player state (independent from audio)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Get tracks for current channel
  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rados-favorites');
    if (saved) {
      try {
        setFavorites(new Set(JSON.parse(saved)));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    localStorage.setItem('rados-favorites', JSON.stringify([...newFavorites]));
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(() => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(currentTrack.id)) {
      newFavorites.delete(currentTrack.id);
    } else {
      newFavorites.add(currentTrack.id);
    }
    saveFavorites(newFavorites);
  }, [currentTrack.id, favorites, saveFavorites]);

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

    // Load the new source
    audio.load();

    // If we were playing, continue playing the new track
    if (isPlaying) {
      audio.play().catch(() => {
        // Autoplay blocked
      });
    }
  }, [currentTrack.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Time update handler
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (currentTrackIndex < channelTracks.length - 1) {
        setCurrentTrackIndex((prev) => prev + 1);
      } else {
        setCurrentTrackIndex(0);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, channelTracks.length]);

  // Play/pause control
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          // Autoplay blocked
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Previous track
  const prevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) =>
      prev > 0 ? prev - 1 : channelTracks.length - 1
    );
    setCurrentTime(0);
  }, [channelTracks.length]);

  // Next track
  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) =>
      prev < channelTracks.length - 1 ? prev + 1 : 0
    );
    setCurrentTime(0);
  }, [channelTracks.length]);

  // Video controls (independent from audio)
  const prevVideo = useCallback(() => {
    setCurrentVideoIndex((prev) =>
      prev > 0 ? prev - 1 : videos.length - 1
    );
  }, []);

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex((prev) =>
      prev < videos.length - 1 ? prev + 1 : 0
    );
  }, []);

  // Seek handler
  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Channel change handler
  const handleChannelChange = useCallback((value: string) => {
    setCurrentChannel(value as Track['channel']);
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const isFavorite = favorites.has(currentTrack.id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
      />

      {/* Video Player (independent from audio) */}
      <VideoPlayer
        currentVideoIndex={currentVideoIndex}
        onPrevVideo={prevVideo}
        onNextVideo={nextVideo}
        isAudioPlaying={isPlaying}
      />

      {/* Track Info */}
      <div className="px-3 py-2 border-b border-black/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-mondwest text-sm text-black truncate leading-tight">
              {currentTrack.artist} - {currentTrack.title}
            </h2>
            <p className="font-mono text-xs text-black/50 truncate">
              "{currentTrack.album}"
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="p-1.5 text-black/40 hover:text-black transition-colors"
              aria-label="Share"
            >
              <ShareIcon />
            </button>
            <button
              onClick={toggleFavorite}
              className={`p-1.5 transition-colors ${
                isFavorite ? 'text-highlight-pink' : 'text-black/40 hover:text-black'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon filled={isFavorite} />
            </button>
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
            onPrev={prevTrack}
            onNext={nextTrack}
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
