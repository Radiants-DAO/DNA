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
 * **Why a module-level WeakMap**: `AudioContext.createMediaElementSource()`
 * can only be called ONCE per HTMLMediaElement — the element is permanently
 * bound to its first source node. StrictMode (and any re-mount of this hook)
 * would otherwise throw InvalidStateError on the second call. We cache the
 * whole graph by element and reuse it across mounts.
 */
export interface WebAudioEffectsHandle {
  leftLevelRef: RefObject<number>;
  rightLevelRef: RefObject<number>;
  analyserRef: RefObject<AnalyserNode | null>;
}

interface Graph {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  dryGain: GainNode;
  wetGain: GainNode;
  convolver: ConvolverNode;
  analyserL: AnalyserNode;
  analyserR: AnalyserNode;
}

const graphCache = new WeakMap<HTMLMediaElement, Graph>();

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

function createGraph(audio: HTMLAudioElement): Graph | null {
  const AudioCtor: typeof AudioContext | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;

  const ctx = new AudioCtor();
  const source = ctx.createMediaElementSource(audio);

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const convolver = ctx.createConvolver();
  convolver.buffer = buildImpulseResponse(ctx);

  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  const analyserL = ctx.createAnalyser();
  const analyserR = ctx.createAnalyser();
  analyserL.fftSize = 1024;
  analyserR.fftSize = 1024;
  analyserL.smoothingTimeConstant = 0.6;
  analyserR.smoothingTimeConstant = 0.6;

  source.connect(dryGain);
  source.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(splitter);
  wetGain.connect(splitter);
  splitter.connect(analyserL, 0);
  analyserL.connect(merger, 0, 0);
  splitter.connect(analyserR, 1);
  analyserR.connect(merger, 0, 1);
  merger.connect(ctx.destination);

  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  return { ctx, source, dryGain, wetGain, convolver, analyserL, analyserR };
}

export function useWebAudioEffects(
  audioRef: RefObject<HTMLAudioElement | null>,
  opts: { slow: number; reverb: number },
): WebAudioEffectsHandle {
  const graphRef = useRef<Graph | null>(null);
  const dataLRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const dataRRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const leftLevelRef = useRef(0);
  const rightLevelRef = useRef(0);
  const analyserLRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === 'undefined') return;

    let graph = graphCache.get(audio);
    if (!graph) {
      graph = createGraph(audio) ?? undefined;
      if (!graph) return;
      graphCache.set(audio, graph);
    }
    graphRef.current = graph;
    analyserLRef.current = graph.analyserL;
    dataLRef.current = new Uint8Array(new ArrayBuffer(graph.analyserL.fftSize));
    dataRRef.current = new Uint8Array(new ArrayBuffer(graph.analyserR.fftSize));

    const peakOf = (data: Uint8Array<ArrayBuffer>): number => {
      let peak = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = Math.abs(data[i] - 128) / 128;
        if (v > peak) peak = v;
      }
      return peak;
    };

    const tick = () => {
      const g = graphRef.current;
      const dL = dataLRef.current;
      const dR = dataRRef.current;
      if (g && dL && dR) {
        g.analyserL.getByteTimeDomainData(dL);
        g.analyserR.getByteTimeDomainData(dR);
        leftLevelRef.current = peakOf(dL);
        rightLevelRef.current = peakOf(dR);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const resume = () => {
      if (graph && graph.ctx.state === 'suspended') graph.ctx.resume().catch(() => {});
    };
    audio.addEventListener('play', resume);

    return () => {
      audio.removeEventListener('play', resume);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      // Intentionally do NOT disconnect nodes or close the context — the graph
      // is cached on the element and must survive remounts (StrictMode, HMR).
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
    const g = graphRef.current;
    if (!g) return;
    const r = Math.max(0, Math.min(1, opts.reverb));
    g.dryGain.gain.value = 1 - r * 0.6;
    g.wetGain.gain.value = r;
  }, [opts.reverb]);

  return {
    leftLevelRef,
    rightLevelRef,
    analyserRef: analyserLRef,
  };
}
