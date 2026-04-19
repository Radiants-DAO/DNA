'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppWindow, Tooltip } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { LCDScreen, TransportPill } from '@rdna/ctrl';
import { usePreferencesStore, useRadRadioStore } from '@/store';
import {
  mockTracks,
  getTracksByChannel,
  formatDuration,
} from '@/lib/mockData/tracks';
import { videos } from '@/components/apps/RadRadioApp';
import type { AppProps } from '@/lib/apps';
import { RadioFrame } from './RadioFrame';
import { RadioTitleBar } from './RadioTitleBar';
import { RadioDisc } from './RadioDisc';
import { RadioVisualizer } from './RadioVisualizer';
import { RadioEffectsRow } from './RadioEffectsRow';
import { useWebAudioEffects } from './useWebAudioEffects';
import { lcdText } from './styles';

// =============================================================================
// Radio — Side-by-side sibling of RadRadioApp. Chromeless 277×535 portrait
// widget with circular transport disc + LCD effect rack + transport pill.
// =============================================================================

/**
 * Headless audio element wired to the shared radio store. Scoped to this
 * component instance so `useWebAudioEffects` can bind a single
 * MediaElementSource without colliding with RadRadioApp's own audio element.
 */
function useRadioAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { volume } = usePreferencesStore();
  const {
    currentTrackIndex,
    currentChannel,
    isPlaying,
    setCurrentTime,
    nextTrack,
    pendingSeek,
    clearPendingSeek,
  } = useRadRadioStore();

  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
  }, [currentTrack.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => nextTrack(channelTracks.length);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [channelTracks.length, nextTrack, setCurrentTime]);

  useEffect(() => {
    if (pendingSeek !== null && audioRef.current) {
      audioRef.current.currentTime = pendingSeek;
      clearPendingSeek();
    }
  }, [pendingSeek, clearPendingSeek]);

  return { audioRef, currentTrack };
}

interface TransportButtonProps {
  label: string;
  iconName: string;
  onClick: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
}
function TransportButton({ label, iconName, onClick, onPointerDown, onPointerUp }: TransportButtonProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={label}
        // eslint-disable-next-line rdna/prefer-rdna-components -- reason:transport-pill-custom-slot owner:rad-os expires:2026-12-31 issue:DNA-999
        className="flex items-center justify-center w-full h-full bg-transparent outline-none cursor-pointer text-accent"
        style={{ imageRendering: 'pixelated' }}
      >
        <Icon name={iconName} size={16} />
      </button>
    </Tooltip>
  );
}

// Thin 1px volume slider that preserves the paper-design cream track + white
// fill with a 3-layer yellow/cream glow. Click or drag on the track to set
// volume in the [0..100] range.
interface VolumeSliderProps {
  volume: number;
  onChange: (v: number) => void;
}
function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const update = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(Math.round(pct * 100));
    },
    [onChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      update(e.clientX);
    },
    [update],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e.clientX);
    },
    [update],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Volume"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={volume}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="flex-1 cursor-pointer relative"
      style={{
        // Enlarge the hit target vertically while keeping the visible line 1px.
        paddingTop: 6,
        paddingBottom: 6,
        touchAction: 'none',
      }}
    >
      <div
        style={{
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-progress-line-track owner:rad-os expires:2026-12-31 issue:DNA-999
          backgroundColor: 'oklch(0.9126 0.1170 93.68 / 0.53)',
          height: 1,
          position: 'relative',
        }}
      >
        <div
          style={{
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-progress-line-fill owner:rad-os expires:2026-12-31 issue:DNA-999
            backgroundColor: 'oklch(1 0 0)',
            boxShadow:
              'var(--color-sun-yellow) 0 0 0.25px, var(--color-sun-yellow) 0 0 2.25px, var(--color-cream) 0 0 8.25px',
            height: 1,
            width: `${volume}%`,
            transition: 'width 75ms linear',
          }}
        />
      </div>
    </div>
  );
}

export function Radio({ windowId: _windowId }: AppProps) {
  const {
    currentVideoIndex,
    currentTrackIndex,
    currentChannel,
    isPlaying,
    currentTime,
    nextVideo: _nextVideo,
    prevVideo: _prevVideo,
    nextTrack,
    prevTrack,
    togglePlay,
    slow,
    reverb,
    setSlow,
    setReverb,
  } = useRadRadioStore();
  const { volume, setVolume } = usePreferencesStore();

  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];

  const { audioRef } = useRadioAudio();
  const { leftLevelRef, rightLevelRef } = useWebAudioEffects(audioRef, { slow, reverb });

  const handlePrev = useCallback(() => prevTrack(channelTracks.length), [prevTrack, channelTracks.length]);
  const handleNext = useCallback(() => nextTrack(channelTracks.length), [nextTrack, channelTracks.length]);

  // Momentary press state for skip buttons (pressed only while pointer is down).
  // Play/pause uses the persistent `isPlaying` flag for its pressed state.
  const [prevPressed, setPrevPressed] = useState(false);
  const [nextPressed, setNextPressed] = useState(false);

  const currentVideo = videos[currentVideoIndex % videos.length];
  const trackTitle = `${currentTrack.title} - ${currentTrack.artist}`;

  return (
    <AppWindow.Content layout="bleed">
      {/* headless audio element bound to the WebAudio graph */}
      <audio ref={audioRef} src={currentTrack.audioUrl} preload="metadata" />

      {/* Floating chromeless titlebar — sits just above the frame */}
      <RadioTitleBar
        title="Radio"
        style={{ top: -40, left: '50%', transform: 'translateX(-50%)' }}
      />

      <RadioFrame>
        {/* Circular disc with tick ring and video — sits overlapping the bottom.
            zIndex keeps the overhanging portion above the frame's inner content
            (TransportPill, LCDScreen) which may create their own stacking
            contexts via shadows/transforms. */}
        <RadioDisc
          style={{
            position: 'absolute',
            bottom: -66,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
          currentTime={currentTime}
          duration={currentTrack.duration}
          isPlaying={isPlaying}
          videoSrc={currentVideo.src}
        />

        {/* Transport pill — at the top inside the frame */}
        <div className="px-2 py-2">
          <TransportPill pressedStates={[prevPressed, isPlaying, nextPressed]}>
            <TransportButton
              label="Previous"
              iconName="skip-back"
              onClick={handlePrev}
              onPointerDown={() => setPrevPressed(true)}
              onPointerUp={() => setPrevPressed(false)}
            />
            <TransportButton
              label={isPlaying ? 'Pause' : 'Play'}
              iconName={isPlaying ? 'pause' : 'play'}
              onClick={togglePlay}
            />
            <TransportButton
              label="Next"
              iconName="skip-forward"
              onClick={handleNext}
              onPointerDown={() => setNextPressed(true)}
              onPointerUp={() => setNextPressed(false)}
            />
          </TransportPill>
        </div>

        {/* LCD screen — 260×210, asymmetric padding, flex-col */}
        <LCDScreen
          padding="none"
          style={{
            width: 260,
            height: 210,
            padding: '12px 8px 8px',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: 6,
          }}
        >
          {/* Stereo VU + SLOW + REVERB */}
          <RadioEffectsRow
            leftLevelRef={leftLevelRef}
            rightLevelRef={rightLevelRef}
            slow={slow}
            reverb={reverb}
            onSlowChange={setSlow}
            onReverbChange={setReverb}
          />

          {/* 32-LED progress strip */}
          <RadioVisualizer
            currentTime={currentTime}
            duration={currentTrack.duration}
          />

          {/* Time | Title | Time */}
          <div
            className="flex items-center justify-between px-0.5 font-mono tabular-nums uppercase"
            style={{
              // eslint-disable-next-line rdna/no-hardcoded-typography, rdna/no-raw-line-height -- reason:paper-design-lcd-text owner:rad-os expires:2026-12-31 issue:DNA-999
              fontSize: 9,
              lineHeight: '12px',
            }}
          >
            <span style={lcdText}>{formatDuration(currentTime)}</span>
            <span className="flex-1 text-center truncate" style={lcdText}>
              {trackTitle}
            </span>
            <span style={lcdText}>{formatDuration(currentTrack.duration)}</span>
          </div>

          {/* Music note icon + VOLUME slider + volume pct */}
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-flex text-accent"
              style={{
                filter:
                  'drop-shadow(0 0 0.25px var(--color-sun-yellow)) drop-shadow(0 0 2.25px var(--color-sun-yellow)) drop-shadow(0 0 8.25px var(--color-cream))',
              }}
            >
              <Icon name="music-8th-notes" />
            </span>
            <VolumeSlider volume={volume} onChange={setVolume} />
            <span
              className="font-mono tabular-nums"
              style={{
                // eslint-disable-next-line rdna/no-hardcoded-typography, rdna/no-raw-line-height -- reason:paper-design-lcd-pct owner:rad-os expires:2026-12-31 issue:DNA-999
                fontSize: 9,
                lineHeight: '12px',
                ...lcdText,
              }}
            >
              {volume}%
            </span>
          </div>
        </LCDScreen>
      </RadioFrame>
    </AppWindow.Content>
  );
}

export default Radio;
