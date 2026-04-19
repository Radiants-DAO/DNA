'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Audio graph:
 *
 *   HTMLAudioElement
 *     └ MediaElementSource
 *          ├─ dryGain ───────────────────┐
 *          └─ convolver → wetGain ───────┤
 *                                        ▼
 *                                     splitter (2 channels)
 *                                      ├─ analyserL  (L peak)
 *                                      └─ analyserR  (R peak)
 *                                        merger → destination
 *
 * SLOW — applied on the HTMLAudioElement via `playbackRate` with
 *        `preservesPitch = false` (classic chopped/screwed character).
 * REVERB — convolver wet/dry mix.
 *
 * Peak levels are read from each channel's analyser every frame and exposed
 * via refs (no re-render per frame; meter components read these in their own RAF).
 *
 * Invariants:
 * - `createMediaElementSource` may only be called once per HTMLAudioElement.
 *   This hook guards against re-init; if the parent mounts a fresh audio
 *   element, remount this hook too.
 * - Values are driven by the `opts` prop only — no imperative setters.
 */
export interface WebAudioEffectsHandle {
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
  const analyserLRef = useRef<AnalyserNode | null>(null);
  const analyserRRef = useRef<AnalyserNode | null>(null);
  const dataLRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const dataRRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
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

    // Stereo split for true L/R metering.
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    const analyserL = ctx.createAnalyser();
    const analyserR = ctx.createAnalyser();
    analyserL.fftSize = 1024;
    analyserR.fftSize = 1024;
    analyserL.smoothingTimeConstant = 0.6;
    analyserR.smoothingTimeConstant = 0.6;

    // Dry + wet mix → splitter
    source.connect(dryGain);
    source.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(splitter);
    wetGain.connect(splitter);

    // L channel
    splitter.connect(analyserL, 0);
    analyserL.connect(merger, 0, 0);
    // R channel
    splitter.connect(analyserR, 1);
    analyserR.connect(merger, 0, 1);

    merger.connect(ctx.destination);

    dryGain.gain.value = 1;
    wetGain.gain.value = 0;

    ctxRef.current = ctx;
    sourceRef.current = source;
    dryGainRef.current = dryGain;
    wetGainRef.current = wetGain;
    analyserLRef.current = analyserL;
    analyserRRef.current = analyserR;
    dataLRef.current = new Uint8Array(new ArrayBuffer(analyserL.fftSize));
    dataRRef.current = new Uint8Array(new ArrayBuffer(analyserR.fftSize));

    const peakOf = (data: Uint8Array<ArrayBuffer>): number => {
      let peak = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = Math.abs(data[i] - 128) / 128;
        if (v > peak) peak = v;
      }
      return peak;
    };

    const tick = () => {
      const dL = dataLRef.current;
      const dR = dataRRef.current;
      const aL = analyserLRef.current;
      const aR = analyserRRef.current;
      if (aL && aR && dL && dR) {
        aL.getByteTimeDomainData(dL);
        aR.getByteTimeDomainData(dR);
        leftLevelRef.current = peakOf(dL);
        rightLevelRef.current = peakOf(dR);
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
      merger.disconnect();
      analyserL.disconnect();
      analyserR.disconnect();
      splitter.disconnect();
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

  return {
    leftLevelRef,
    rightLevelRef,
    // Expose only the L analyser by default for callers that just want one
    // spectrum handle (e.g. Spectrum component).
    analyserRef: analyserLRef,
  };
}
