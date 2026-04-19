'use client';

import { useCallback, useEffect, useRef } from 'react';
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
}
function TransportButton({ label, iconName, onClick }: TransportButtonProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        // eslint-disable-next-line rdna/prefer-rdna-components -- reason:transport-pill-custom-slot owner:rad-os expires:2026-12-31 issue:DNA-999
        className="flex items-center justify-center w-full h-full bg-transparent outline-none cursor-pointer"
      >
        <Icon name={iconName} />
      </button>
    </Tooltip>
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
  const { volume } = usePreferencesStore();

  const channelTracks = getTracksByChannel(currentChannel);
  const currentTrack = channelTracks[currentTrackIndex] || mockTracks[0];

  const { audioRef } = useRadioAudio();
  const { leftLevelRef, rightLevelRef } = useWebAudioEffects(audioRef, { slow, reverb });

  const handlePrev = useCallback(() => prevTrack(channelTracks.length), [prevTrack, channelTracks.length]);
  const handleNext = useCallback(() => nextTrack(channelTracks.length), [nextTrack, channelTracks.length]);

  const currentVideo = videos[currentVideoIndex % videos.length];
  const progressPct = currentTrack.duration > 0 ? Math.round((currentTime / currentTrack.duration) * 100) : 0;
  const trackTitle = `${currentTrack.title} - ${currentTrack.artist}`;

  return (
    <AppWindow.Content layout="bleed">
      {/* headless audio element bound to the WebAudio graph */}
      <audio ref={audioRef} src={currentTrack.audioUrl} preload="metadata" />

      {/* Floating chromeless titlebar — sits just above the frame */}
      <RadioTitleBar
        title="Radio"
        style={{ top: -36, left: '50%', transform: 'translateX(-50%)' }}
      />

      <RadioFrame>
        {/* Circular disc with tick ring and video — sits overlapping the top */}
        <RadioDisc
          style={{
            position: 'absolute',
            top: -66,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          currentTime={currentTime}
          duration={currentTrack.duration}
          isPlaying={isPlaying}
          videoSrc={currentVideo.src}
        />

        {/* LCD screen — 260×210, asymmetric padding, flex-col justify-end */}
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
            justifyContent: 'flex-end',
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
            <span
              style={{
                // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-lcd-text-dim owner:rad-os expires:2026-12-31 issue:DNA-999
                color: 'oklch(1 0 0 / 0.35)',
                textShadow:
                  'var(--color-sun-yellow) 0 0 0.25px, var(--color-sun-yellow) 0 0 2.25px, var(--color-cream) 0 0 8.25px',
              }}
            >
              {formatDuration(currentTime)}
            </span>
            <span
              className="flex-1 text-center truncate"
              style={{
                // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-lcd-text owner:rad-os expires:2026-12-31 issue:DNA-999
                color: 'oklch(1 0 0)',
                textShadow:
                  'var(--color-sun-yellow) 0 0 0.25px, var(--color-sun-yellow) 0 0 2.25px, var(--color-cream) 0 0 8.25px',
              }}
            >
              {trackTitle}
            </span>
            <span
              style={{
                // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-lcd-text-dim owner:rad-os expires:2026-12-31 issue:DNA-999
                color: 'oklch(1 0 0 / 0.35)',
                textShadow:
                  'var(--color-sun-yellow) 0 0 0.25px, var(--color-sun-yellow) 0 0 2.25px, var(--color-cream) 0 0 8.25px',
              }}
            >
              {formatDuration(currentTrack.duration)}
            </span>
          </div>

          {/* Music note icon + progress line + volume pct */}
          <div className="flex items-center gap-1.5">
            <Icon name="music-8th-notes" className="text-accent" />
            <div
              className="flex-1"
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
                  width: `${progressPct}%`,
                  transition: 'width 150ms linear',
                }}
              />
            </div>
            <span
              className="font-mono tabular-nums"
              style={{
                // eslint-disable-next-line rdna/no-hardcoded-typography, rdna/no-raw-line-height, rdna/no-hardcoded-colors -- reason:paper-design-lcd-pct owner:rad-os expires:2026-12-31 issue:DNA-999
                fontSize: 9,
                lineHeight: '12px',
                color: 'oklch(1 0 0 / 0.35)',
              }}
            >
              {volume}%
            </span>
          </div>
        </LCDScreen>

        {/* Transport pill — at the bottom inside the frame */}
        <div className="px-2 py-2">
          <TransportPill activeIndex={1}>
            <TransportButton label="Previous" iconName="skip-back" onClick={handlePrev} />
            <TransportButton
              label={isPlaying ? 'Pause' : 'Play'}
              iconName={isPlaying ? 'pause' : 'play'}
              onClick={togglePlay}
            />
            <TransportButton label="Next" iconName="skip-forward" onClick={handleNext} />
          </TransportPill>
        </div>
      </RadioFrame>
    </AppWindow.Content>
  );
}

export default Radio;
