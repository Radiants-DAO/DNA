'use client';

import { useEffect, useState, type RefObject } from 'react';
import { Meter, Slider } from '@rdna/ctrl';
import { lcdText } from './styles';

// =============================================================================
// RadioEffectsRow — Stereo VU meters flanking SLOW + REVERB sliders.
//
// Layout (L to R):
//   [L Meter (vertical, 12-seg, glow)]
//   [dB scale: 0 / -12 / -48]
//   [SLOW slider + REVERB slider (stacked, labels below each track)]
//   [dB scale: 0 / -12 / -48]
//   [R Meter (vertical, 12-seg, glow)]
//
// VU levels come from refs populated by the WebAudio analyser (no parent
// re-renders per frame). Slow / reverb values are store-backed. Sliders use
// the shared LCD Slider primitive from @rdna/ctrl (default variant).
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
      className="flex flex-col justify-between h-20 text-xs leading-none tracking-wide font-mono"
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
            peakCapColor="accent"
            colorZones={{ low: 1, mid: 1 }}
          />
          <span
            className="text-xs uppercase tracking-wider font-mono"
            style={lcdText}
          >
            L
          </span>
        </div>
        <DbScale />
      </div>

      {/* SLOW + REVERB — LCD sliders (default variant) with labels below */}
      <div className="flex-1 flex flex-col self-stretch gap-3">
        <div className="flex flex-col items-center gap-0.5 w-full">
          <Slider
            value={slow}
            onChange={onSlowChange}
            min={0}
            max={1}
            step={0}
            ariaLabel="Slow"
            className="w-full"
          />
          <span
            className="text-xs uppercase tracking-wider font-mono"
            style={lcdText}
          >
            Slow
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 w-full">
          <Slider
            value={reverb}
            onChange={onReverbChange}
            min={0}
            max={1}
            step={0}
            ariaLabel="Reverb"
            className="w-full"
          />
          <span
            className="text-xs uppercase tracking-wider font-mono"
            style={lcdText}
          >
            Reverb
          </span>
        </div>
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
            peakCapColor="accent"
            colorZones={{ low: 1, mid: 1 }}
          />
          <span
            className="text-xs uppercase tracking-wider font-mono"
            style={lcdText}
          >
            R
          </span>
        </div>
      </div>
    </div>
  );
}
