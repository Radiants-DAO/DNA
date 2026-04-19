'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Audio graph:
 *   audio element
 *     └ MediaElementSource
 *          ├─ dryGain ────────────┐
 *          └─ convolver → wetGain ┴─→ masterGain → analyser → destination
 *
 * SLOW — applied on the HTMLAudioElement via `playbackRate` with `preservesPitch = false`
 *        (classic chopped/screwed character).
 * REVERB — convolver wet/dry mix.
 *
 * Peak levels are read from the analyser time-domain data each frame and exposed
 * via refs (no re-render per frame; meter components read these in their own RAF).
 */
export interface WebAudioEffectsHandle {
  setSlow: (v: number) => void;
  setReverb: (v: number) => void;
  leftLevelRef: RefObject<number>;
  rightLevelRef: RefObject<number>;
  analyserRef: RefObject<AnalyserNode | null>;
}

function buildImpulseResponse(ctx: AudioContext, durationSec = 2.4, decay = 2.2): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c += 1) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i += 1) {
      const n = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
    }
  }
  return impulse;
}

export function useWebAudioEffects(
  audioRef: RefObject<HTMLAudioElement | null>,
  opts: { slow: number; reverb: number },
): WebAudioEffectsHandle {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const leftLevelRef = useRef(0);
  const rightLevelRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === 'undefined') return;
    if (sourceRef.current) return;

    const AudioCtor: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const source = ctx.createMediaElementSource(audio);

    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = buildImpulseResponse(ctx);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;

    source.connect(dryGain);
    source.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(analyser);
    wetGain.connect(analyser);
    analyser.connect(ctx.destination);

    dryGain.gain.value = 1;
    wetGain.gain.value = 0;

    ctxRef.current = ctx;
    sourceRef.current = source;
    dryGainRef.current = dryGain;
    wetGainRef.current = wetGain;
    convolverRef.current = convolver;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.fftSize);

    const tick = () => {
      const a = analyserRef.current;
      const data = dataArrayRef.current;
      if (a && data) {
        a.getByteTimeDomainData(data);
        let peakL = 0;
        let peakR = 0;
        const mid = data.length >> 1;
        for (let i = 0; i < mid; i += 1) {
          const v = Math.abs(data[i] - 128) / 128;
          if (v > peakL) peakL = v;
        }
        for (let i = mid; i < data.length; i += 1) {
          const v = Math.abs(data[i] - 128) / 128;
          if (v > peakR) peakR = v;
        }
        leftLevelRef.current = peakL;
        rightLevelRef.current = peakR;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const resume = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    audio.addEventListener('play', resume);

    return () => {
      audio.removeEventListener('play', resume);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      analyser.disconnect();
      dryGain.disconnect();
      wetGain.disconnect();
      convolver.disconnect();
      source.disconnect();
      ctx.close().catch(() => {});
      ctxRef.current = null;
      sourceRef.current = null;
    };
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const rate = 1 - Math.max(0, Math.min(1, opts.slow)) * 0.5;
    const mutable = audio as HTMLAudioElement & { preservesPitch?: boolean };
    mutable.preservesPitch = false;
    audio.playbackRate = rate;
  }, [audioRef, opts.slow]);

  useEffect(() => {
    const dry = dryGainRef.current;
    const wet = wetGainRef.current;
    if (!dry || !wet) return;
    const r = Math.max(0, Math.min(1, opts.reverb));
    dry.gain.value = 1 - r * 0.6;
    wet.gain.value = r;
  }, [opts.reverb]);

  const setSlow = (v: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const mutable = audio as HTMLAudioElement & { preservesPitch?: boolean };
    mutable.preservesPitch = false;
    audio.playbackRate = 1 - Math.max(0, Math.min(1, v)) * 0.5;
  };

  const setReverb = (v: number) => {
    const dry = dryGainRef.current;
    const wet = wetGainRef.current;
    if (!dry || !wet) return;
    const r = Math.max(0, Math.min(1, v));
    dry.gain.value = 1 - r * 0.6;
    wet.gain.value = r;
  };

  return {
    setSlow,
    setReverb,
    leftLevelRef,
    rightLevelRef,
    analyserRef,
  };
}
