'use client';

import type { PatternPlaygroundState } from './types';
import {
  Toggle,
  SegmentedControl,
  CtrlSlider,
  Section,
  PropertyRow,
} from '@rdna/ctrl';

// =============================================================================
// GlowControls — ctrl-powered glow parameter editor
//
// Wires PatternPlaygroundState glow fields to @rdna/ctrl primitives.
// =============================================================================

interface GlowControlsProps {
  state: PatternPlaygroundState;
  onChange: (patch: Partial<PatternPlaygroundState>) => void;
}

export function GlowControls({ state, onChange }: GlowControlsProps) {
  return (
    <Section title="Glow" defaultOpen={state.glowEnabled}>
      <PropertyRow label="Enabled">
        <Toggle
          value={state.glowEnabled}
          onChange={(v) => onChange({ glowEnabled: v })}
          size="sm"
        />
      </PropertyRow>

      {state.glowEnabled && (
        <>
          <PropertyRow label="Shape">
            <SegmentedControl
              value={state.glowShape}
              onChange={(v) => onChange({ glowShape: v as 'circle' | 'ellipse' })}
              options={[
                { value: 'circle', label: 'Circle' },
                { value: 'ellipse', label: 'Ellipse' },
              ]}
              size="sm"
            />
          </PropertyRow>

          <PropertyRow label="Radius">
            <CtrlSlider
              value={state.glowRadius}
              onChange={(v) => onChange({ glowRadius: v })}
              min={20}
              max={400}
              step={5}
              showValue
              formatValue={(v) => `${v}px`}
              size="sm"
            />
          </PropertyRow>

          <PropertyRow label="Mid Stop">
            <CtrlSlider
              value={state.glowMidStop}
              onChange={(v) => onChange({ glowMidStop: v })}
              min={10}
              max={90}
              step={1}
              showValue
              formatValue={(v) => `${v}%`}
              size="sm"
            />
          </PropertyRow>
        </>
      )}
    </Section>
  );
}
