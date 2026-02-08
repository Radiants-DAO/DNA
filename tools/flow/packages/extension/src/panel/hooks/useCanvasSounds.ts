/**
 * useCanvasSounds - Web Audio API sound effects for canvas interactions
 *
 * Generates sounds programmatically using oscillators (no audio files needed).
 * Ported from Flow 0.
 */

import { useCallback, useRef, useState, useEffect } from "react";
import {
  type SoundEffect,
  type SoundConfig,
  type UseCanvasSoundsOptions,
  type UseCanvasSoundsResult,
  DEFAULT_SOUND_CONFIG,
} from "../types/canvas";

// Sound definitions: frequency, duration, oscillator type
interface SoundDefinition {
  frequency: number;
  duration: number; // in ms
  type: OscillatorType;
  /** Optional frequency ramp for rising/falling tones */
  frequencyEnd?: number;
}

const SOUND_DEFINITIONS: Record<SoundEffect, SoundDefinition> = {
  bounce: {
    frequency: 80,
    duration: 60,
    type: "sine",
  },
  gridTouch: {
    frequency: 440,
    duration: 30,
    type: "sine",
  },
  select: {
    frequency: 880,
    duration: 40,
    type: "square",
  },
  deselect: {
    frequency: 660,
    duration: 40,
    type: "square",
  },
  expand: {
    frequency: 440,
    duration: 80,
    type: "sine",
    frequencyEnd: 880,
  },
  collapse: {
    frequency: 880,
    duration: 80,
    type: "sine",
    frequencyEnd: 440,
  },
  copy: {
    frequency: 1047,
    duration: 100,
    type: "sine",
    frequencyEnd: 1319,
  },
  drop: {
    frequency: 120,
    duration: 80,
    type: "triangle",
  },
};

export function useCanvasSounds(
  options?: UseCanvasSoundsOptions
): UseCanvasSoundsResult {
  const initialConfig: SoundConfig = {
    ...DEFAULT_SOUND_CONFIG,
    ...options?.config,
    volumes: {
      ...DEFAULT_SOUND_CONFIG.volumes,
      ...options?.config?.volumes,
    },
    enabled:
      options?.enabled ??
      options?.config?.enabled ??
      DEFAULT_SOUND_CONFIG.enabled,
  };

  const [config, setConfigState] = useState<SoundConfig>(initialConfig);

  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        isInitializedRef.current = true;
      } catch (error) {
        console.warn("useCanvasSounds: Failed to create AudioContext", error);
        return null;
      }
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch((error) => {
        console.warn("useCanvasSounds: Failed to resume AudioContext", error);
      });
    }

    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (
      freq: number,
      duration: number,
      volume: number,
      type: OscillatorType = "sine",
      frequencyEnd?: number
    ) => {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      const currentTime = audioContext.currentTime;
      const durationSecs = duration / 1000;

      const osc = audioContext.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, currentTime);

      if (frequencyEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(
          frequencyEnd,
          currentTime + durationSecs
        );
      }

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(volume, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, currentTime + durationSecs);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(currentTime);
      osc.stop(currentTime + durationSecs);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    },
    [getAudioContext]
  );

  const play = useCallback(
    (effect: SoundEffect, playOptions?: { volume?: number }) => {
      if (!config.enabled) return;

      const definition = SOUND_DEFINITIONS[effect];
      if (!definition) {
        console.warn(`useCanvasSounds: Unknown sound effect "${effect}"`);
        return;
      }

      const effectVolume = playOptions?.volume ?? config.volumes[effect];
      const finalVolume = Math.min(
        1,
        Math.max(0, config.masterVolume * effectVolume)
      );

      if (finalVolume < 0.001) return;

      playTone(
        definition.frequency,
        definition.duration,
        finalVolume,
        definition.type,
        definition.frequencyEnd
      );
    },
    [config, playTone]
  );

  const setEnabled = useCallback((enabled: boolean) => {
    setConfigState((prev) => ({ ...prev, enabled }));
  }, []);

  const setConfig = useCallback((partialConfig: Partial<SoundConfig>) => {
    setConfigState((prev) => ({
      ...prev,
      ...partialConfig,
      volumes: {
        ...prev.volumes,
        ...partialConfig.volumes,
      },
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore errors on cleanup
        });
        audioContextRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  return {
    play,
    setEnabled,
    isEnabled: config.enabled,
    setConfig,
  };
}

export default useCanvasSounds;
