'use client';

import { useEffect, useState, type RefObject } from 'react';
import { CtrlSlider, Meter } from '@rdna/ctrl';
import { lcdText } from './styles';

// =============================================================================
// RadioEffectsRow — Stereo VU meters flanking SLOW + REVERB faders.
//
// Layout (L to R):
//   [L Meter (vertical, 12-seg, glow)]
//   [dB scale: 0 / -12 / -48]
//   [SLOW label + horizontal Fader]
//   [REVERB label + horizontal Fader]
//   [dB scale: 0 / -12 / -48]
//   [R Meter (vertical, 12-seg, glow)]
//
// VU levels come from refs populated by the WebAudio analyser (no parent
// re-renders per frame). Slow / reverb values are store-backed.
// =============================================================================

interface RadioEffectsRowProps {
  leftLevelRef: RefObject<number>;
  rightLevelRef: RefObject<number>;
  slow: number;
  reverb: number;
  onSlowChange: (v: number) => void;
  onReverbChange: (v: number) => void;
}

const DB_LABELS = ['0', '-12', '-48'];

function useAnimatedLevel(ref: RefObject<number>): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setLevel(ref.current ?? 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref]);
  return level;
}

function DbScale() {
  return (
    <div
      className="flex flex-col justify-between h-20 text-[7px] leading-[8px] tracking-wide font-mono"
      style={lcdText}
    >
      {DB_LABELS.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  );
}

export function RadioEffectsRow({
  leftLevelRef,
  rightLevelRef,
  slow,
  reverb,
  onSlowChange,
  onReverbChange,
}: RadioEffectsRowProps) {
  const leftLevel = useAnimatedLevel(leftLevelRef);
  const rightLevel = useAnimatedLevel(rightLevelRef);

  return (
    <div className="flex items-end gap-3">
      {/* L channel */}
      <div className="flex items-start gap-1">
        <div className="flex flex-col items-center gap-1">
          <Meter
            value={leftLevel}
            min={0}
            max={1}
            segments={12}
            size="sm"
            orientation="vertical"
            glow
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-peak-cap-yellow owner:rad-os expires:2026-12-31 issue:DNA-999
            peakCapColor="oklch(0.9126 0.1170 93.68)"
            colorZones={{ low: 1, mid: 1 }}
          />
          <span
            className="text-[8px] uppercase tracking-wider font-mono"
            style={lcdText}
          >
            L
          </span>
        </div>
        <DbScale />
      </div>

      {/* SLOW + REVERB */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <span
          className="text-[8px] uppercase tracking-wider"
          style={lcdText}
        >
          Slow
        </span>
        <CtrlSlider
          size="sm"
          min={0}
          max={1}
          step={0.01}
          value={slow}
          onChange={onSlowChange}
          ticks={5}
          className="w-full"
        />
        <span
          className="text-[8px] uppercase tracking-wider"
          style={lcdText}
        >
          Reverb
        </span>
        <CtrlSlider
          size="sm"
          min={0}
          max={1}
          step={0.01}
          value={reverb}
          onChange={onReverbChange}
          ticks={5}
          className="w-full"
        />
      </div>

      {/* R channel */}
      <div className="flex items-start gap-1">
        <DbScale />
        <div className="flex flex-col items-center gap-1">
          <Meter
            value={rightLevel}
            min={0}
            max={1}
            segments={12}
            size="sm"
            orientation="vertical"
            glow
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-peak-cap-yellow owner:rad-os expires:2026-12-31 issue:DNA-999
            peakCapColor="oklch(0.9126 0.1170 93.68)"
            colorZones={{ low: 1, mid: 1 }}
          />
          <span
            className="text-[8px] uppercase tracking-wider font-mono"
            style={lcdText}
          >
            R
          </span>
        </div>
      </div>
    </div>
  );
}
