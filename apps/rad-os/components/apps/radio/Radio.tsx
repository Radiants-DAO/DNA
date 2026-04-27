'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
            width: 260,
            padding: '12px 8px 8px',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: 8,
            // Match the frame's bowl-shaped bottom so the LCD clips cleanly
            // against it. Top stays square.
            borderBottomLeftRadius: 128,
            borderBottomRightRadius: 128,
          }}
        >
          {/* Header: spectrum strip + Time | Title | Time (tight group, gap 4) */}
          <div className="flex flex-col self-stretch" style={{ gap: 4 }}>
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
          <div className="flex items-center self-stretch" style={{ gap: 6 }}>
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
          <div className="self-stretch" style={{ marginTop: -16 }}>
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
