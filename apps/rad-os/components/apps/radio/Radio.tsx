'use client';

import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { LCDScreen, Slider, TransportButton, TransportPill } from '@rdna/ctrl';
import { usePreferencesStore, useRadRadioStore } from '@/store';
import {
  mockTracks,
  getTracksByChannel,
  formatDuration,
} from '@/lib/mockData/tracks';
import { videos } from './videos';
import { RadioFrame } from './RadioFrame';
import { RadioDisc } from './RadioDisc';
import { RadioVisualizer } from './RadioVisualizer';
import { RadioEffectsRow } from './RadioEffectsRow';
import { useWebAudioEffects } from './useWebAudioEffects';
import { lcdText } from './styles';

// =============================================================================
// Radio — Chromeless drop-down widget body. No AppWindow wrapper — hosted by
// RadioWidget, which positions it and animates open/closed.
// =============================================================================

/**
 * Headless audio element wired to the shared radio store. Always mounted as
 * part of the RadioWidget so `useWebAudioEffects` can bind a single
 * MediaElementSource for the session — playback continues whether the
 * drop-down panel is open or closed.
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

export function Radio() {
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
  const trackCount = channelTracks.length;

  const { audioRef } = useRadioAudio();
  const { leftLevelRef, rightLevelRef } = useWebAudioEffects(audioRef, { slow, reverb });

  const handlePrev = () => prevTrack(trackCount);
  const handleNext = () => nextTrack(trackCount);

  // Momentary press state for skip buttons (pressed only while pointer is down).
  // Play/pause uses the persistent `isPlaying` flag for its pressed state.
  const [prevPressed, setPrevPressed] = useState(false);
  const [nextPressed, setNextPressed] = useState(false);

  const currentVideo = videos[currentVideoIndex % videos.length];
  const trackTitle = `${currentTrack.title} - ${currentTrack.artist}`;

  return (
    <>
      {/* headless audio element bound to the WebAudio graph */}
      <audio ref={audioRef} src={currentTrack.audioUrl} preload="metadata" />

      <RadioFrame>
        {/* Transport pill — full-width strip at the top of the frame */}
        <div className="px-2 py-2">
          <TransportPill pressedStates={[prevPressed, isPlaying, nextPressed]}>
            <Tooltip content="Previous">
              <TransportButton
                label="Previous"
                iconName="skip-back"
                onClick={handlePrev}
                onPointerDown={() => setPrevPressed(true)}
                onPointerUp={() => setPrevPressed(false)}
              />
            </Tooltip>
            <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
              <TransportButton
                label={isPlaying ? 'Pause' : 'Play'}
                iconName={isPlaying ? 'pause' : 'play'}
                onClick={togglePlay}
              />
            </Tooltip>
            <Tooltip content="Next">
              <TransportButton
                label="Next"
                iconName="skip-forward"
                onClick={handleNext}
                onPointerDown={() => setNextPressed(true)}
                onPointerUp={() => setNextPressed(false)}
              />
            </Tooltip>
          </TransportPill>
        </div>

        {/* Tall LCD screen — contains the info header, progress row, effects
            block, and the circular video window all on one display. */}
        <LCDScreen
          padding="none"
          style={{
            ['--radio-lcd-width' as string]: '260px',
            ['--radio-lcd-padding-top' as string]: '12px',
            ['--radio-lcd-padding-inline' as string]: '8px',
            ['--radio-lcd-padding-bottom' as string]: '8px',
            ['--radio-lcd-margin' as string]: 'auto',
            ['--radio-lcd-gap' as string]: '8px',
            width: 'var(--radio-lcd-width)',
            paddingTop: 'var(--radio-lcd-padding-top)',
            paddingRight: 'var(--radio-lcd-padding-inline)',
            paddingBottom: 'var(--radio-lcd-padding-bottom)',
            paddingLeft: 'var(--radio-lcd-padding-inline)',
            marginLeft: 'var(--radio-lcd-margin)',
            marginRight: 'var(--radio-lcd-margin)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: 'var(--radio-lcd-gap)',
            // Match the frame's bowl-shaped bottom so the LCD clips cleanly
            // against it. Top stays square.
            // eslint-disable-next-line rdna/no-raw-radius -- reason:radio-lcd-bowl-radius owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
            borderBottomLeftRadius: 128,
            // eslint-disable-next-line rdna/no-raw-radius -- reason:radio-lcd-bowl-radius owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
            borderBottomRightRadius: 128,
          }}
        >
          {/* Header: spectrum strip + Time | Title | Time (tight group, gap 4) */}
          <div className="flex flex-col self-stretch gap-1">
            {/* 32-LED progress strip */}
            <RadioVisualizer
              currentTime={currentTime}
              duration={currentTrack.duration}
            />

            {/* Time | Title | Time */}
            <div className="flex items-center justify-between px-0.5 font-mono tabular-nums uppercase text-xs leading-none">
              <span style={lcdText}>{formatDuration(currentTime)}</span>
              <span className="flex-1 text-center truncate" style={lcdText}>
                {trackTitle}
              </span>
              <span style={lcdText}>{formatDuration(currentTrack.duration)}</span>
            </div>
          </div>

          {/* Music note icon + VOLUME slider + volume pct */}
          <div className="flex items-center self-stretch gap-1.5">
            <span
              aria-hidden
              className="inline-flex text-accent"
              style={{
                // eslint-disable-next-line rdna/no-raw-shadow -- reason:radio-lcd-icon-glow owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
                filter:
                  'drop-shadow(0 0 0.25px var(--color-sun-yellow)) drop-shadow(0 0 2.25px var(--color-sun-yellow)) drop-shadow(0 0 8.25px var(--color-cream))',
              }}
            >
              <Icon name="music-8th-notes" />
            </span>
            <Slider
              variant="line"
              value={volume}
              onChange={setVolume}
              min={0}
              max={100}
              step={1}
              ariaLabel="Volume"
              className="flex-1"
            />
            <span className="font-mono tabular-nums text-xs leading-none" style={lcdText}>
              {volume}%
            </span>
          </div>

          {/* Stereo VU + SLOW + REVERB */}
          <RadioEffectsRow
            leftLevelRef={leftLevelRef}
            rightLevelRef={rightLevelRef}
            slow={slow}
            reverb={reverb}
            onSlowChange={setSlow}
            onReverbChange={setReverb}
          />

          {/* Circular video window — inset inside the LCD's 8px padding.
              Negative top margin pulls it up so the bubble tucks under the
              effects row, tightening the LCD stack. */}
          <div className="-mt-4 self-stretch">
            <RadioDisc
              currentTime={currentTime}
              duration={currentTrack.duration}
              isPlaying={isPlaying}
              videoSrc={currentVideo.src}
            />
          </div>
        </LCDScreen>
      </RadioFrame>
    </>
  );
}
