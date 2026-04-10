'use client';

import { useState, useCallback } from 'react';
import '@rdna/ctrl/ctrl.css';

// Controls
import { Knob } from '@rdna/ctrl/controls/Knob/Knob';
import { Fader } from '@rdna/ctrl/controls/Fader/Fader';
import { CtrlSlider } from '@rdna/ctrl/controls/Slider/Slider';
import { XYPad } from '@rdna/ctrl/controls/XYPad/XYPad';
import { NumberScrubber } from '@rdna/ctrl/controls/NumberScrubber/NumberScrubber';
import { Ribbon } from '@rdna/ctrl/controls/Ribbon/Ribbon';
import { ArcRing } from '@rdna/ctrl/controls/ArcRing/ArcRing';

// Selectors
import { SegmentedControl } from '@rdna/ctrl/selectors/SegmentedControl/SegmentedControl';
import { Stepper } from '@rdna/ctrl/selectors/Stepper/Stepper';
import { ButtonStrip } from '@rdna/ctrl/selectors/ButtonStrip/ButtonStrip';
import { Toggle } from '@rdna/ctrl/selectors/Toggle/Toggle';
import { ChipTag } from '@rdna/ctrl/selectors/ChipTag/ChipTag';
import { MatrixGrid } from '@rdna/ctrl/selectors/MatrixGrid/MatrixGrid';
import { RadialMenu } from '@rdna/ctrl/selectors/RadialMenu/RadialMenu';

// Readouts
import { Meter } from '@rdna/ctrl/readouts/Meter/Meter';
import { LEDArray } from '@rdna/ctrl/readouts/LEDArray/LEDArray';
import { Sparkline } from '@rdna/ctrl/readouts/Sparkline/Sparkline';
import { Waveform } from '@rdna/ctrl/readouts/Waveform/Waveform';
import { Spectrum } from '@rdna/ctrl/readouts/Spectrum/Spectrum';

// Layout
import { Section } from '@rdna/ctrl/layout/Section/Section';
import { PropertyRow } from '@rdna/ctrl/layout/PropertyRow/PropertyRow';
import { ControlPanel } from '@rdna/ctrl/layout/ControlPanel/ControlPanel';

// ============================================================================
// Demo state
// ============================================================================

const SPARKLINE_DATA = [10, 25, 18, 40, 35, 55, 48, 60, 52, 70, 65, 80, 72, 90, 85];
const WAVEFORM_DATA = Array.from({ length: 200 }, (_, i) => Math.sin(i * 0.1) * 0.7 + Math.sin(i * 0.03) * 0.3);
const SPECTRUM_DATA = Array.from({ length: 32 }, (_, i) => Math.max(0, 0.8 - i * 0.02 + Math.sin(i * 0.5) * 0.3));

function initMatrix(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (r + c) % 3 === 0),
  );
}

// ============================================================================
// Group wrapper
// ============================================================================

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-mono text-sm text-main uppercase tracking-wider border-b border-rule pb-1">
        {title}
      </h2>
      <div className="flex flex-wrap items-end gap-6">
        {children}
      </div>
    </div>
  );
}

function ControlDemo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {children}
      <span className="font-mono text-[0.5rem] text-mute uppercase">{label}</span>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function CtrlPreview() {
  // Continuous controls
  const [knob, setKnob] = useState(65);
  const [fader, setFader] = useState(70);
  const [slider, setSlider] = useState(40);
  const [xy, setXY] = useState({ x: 50, y: 50 });
  const [scrub, setScrub] = useState(16);
  const [ribbon, setRibbon] = useState(50);
  const [arc, setArc] = useState(75);

  // Selectors
  const [segment, setSegment] = useState('circle');
  const [stepper, setStepper] = useState(5);
  const [strip, setStrip] = useState('1');
  const [toggle, setToggle] = useState(true);
  const [chips, setChips] = useState<string | string[]>(['A', 'C']);
  const [matrix, setMatrix] = useState(() => initMatrix(4, 8));
  const [radial, setRadial] = useState('N');

  // Readouts
  const [meter, setMeter] = useState(72);

  // For live meter animation
  const animateMeter = useCallback(() => {
    setMeter((prev) => {
      const next = prev + (Math.random() - 0.48) * 8;
      return Math.max(0, Math.min(100, next));
    });
  }, []);

  // Tick meter
  useState(() => {
    const id = setInterval(animateMeter, 200);
    return () => clearInterval(id);
  });

  return (
    <div className="min-h-screen bg-inv text-flip p-8 space-y-10">
      <div className="max-w-[56rem] mx-auto space-y-10">
        <header>
          <h1 className="font-mono text-lg text-accent tracking-wider">@rdna/ctrl</h1>
          <p className="font-mono text-xs text-mute mt-1">Control Surface Primitives — 25 components</p>
        </header>

        {/* ── Continuous Controls ── */}
        <Group title="Controls — Continuous Value">
          <ControlDemo label="Knob">
            <Knob value={knob} onChange={setKnob} label="Vol" showValue size="lg" />
          </ControlDemo>

          <ControlDemo label="Knob sm">
            <Knob value={knob} onChange={setKnob} showValue size="sm" />
          </ControlDemo>

          <ControlDemo label="Fader">
            <Fader value={fader} onChange={setFader} label="Gain" showValue size="lg" />
          </ControlDemo>

          <ControlDemo label="Fader sm">
            <Fader value={fader} onChange={setFader} showValue size="sm" />
          </ControlDemo>

          <ControlDemo label="ArcRing">
            <ArcRing value={arc} onChange={setArc} label="CPU" size="lg" />
          </ControlDemo>

          <ControlDemo label="ArcRing sm">
            <ArcRing value={arc} onChange={setArc} size="sm" />
          </ControlDemo>

          <ControlDemo label="XYPad">
            <XYPad value={xy} onChange={setXY} label="Pan/Tilt" showValue size="lg" />
          </ControlDemo>
        </Group>

        <Group title="Controls — Horizontal">
          <div className="w-full space-y-3">
            <CtrlSlider value={slider} onChange={setSlider} label="Pan" showValue size="lg" />
            <CtrlSlider value={slider} onChange={setSlider} label="Pan (sm)" showValue size="sm" />
            <Ribbon value={ribbon} onChange={setRibbon} label="Pitch Bend" showValue size="lg" />
            <Ribbon value={50} onChange={setRibbon} label="Spring Return" showValue springReturn size="md" />
            <div className="flex items-center gap-4">
              <NumberScrubber value={scrub} onChange={setScrub} label="Size" size="lg" />
              <NumberScrubber value={scrub} onChange={setScrub} label="Size" size="sm" />
            </div>
          </div>
        </Group>

        {/* ── Discrete Selectors ── */}
        <Group title="Selectors — Discrete">
          <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <SegmentedControl
                value={segment}
                onChange={setSegment}
                options={[
                  { value: 'circle', label: 'Circle' },
                  { value: 'ellipse', label: 'Ellipse' },
                  { value: 'rect', label: 'Rect' },
                ]}
                label="Shape"
              />

              <Stepper value={stepper} onChange={setStepper} min={1} max={20} label="Count" />

              <Toggle value={toggle} onChange={setToggle} label="Enabled" />
              <Toggle value={!toggle} onChange={(v) => setToggle(!v)} label="Muted" size="sm" />
            </div>

            <ButtonStrip
              value={strip}
              onChange={(v) => setStrip(typeof v === 'string' ? v : v[0])}
              options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
              ]}
              label="Channel"
            />

            <ChipTag
              value={chips}
              onChange={setChips}
              options={['A', 'B', 'C', 'D', 'E']}
              mode="multi"
              label="Tags"
            />

            <RadialMenu
              value={radial}
              onChange={setRadial}
              options={[
                { value: 'N', label: 'N' },
                { value: 'E', label: 'E' },
                { value: 'S', label: 'S' },
                { value: 'W', label: 'W' },
              ]}
              label="Direction"
              size="lg"
            />

            <div>
              <span className="font-mono text-[0.625rem] text-mute uppercase tracking-wider block mb-1">Matrix Grid</span>
              <MatrixGrid value={matrix} onChange={setMatrix} size="md" />
            </div>
          </div>
        </Group>

        {/* ── Readouts ── */}
        <Group title="Readouts — Data Display">
          <div className="w-full space-y-4">
            <div className="flex flex-wrap items-end gap-6">
              <Meter value={meter} label="Level" showValue size="lg" />
              <Meter value={meter} label="VU" showValue size="md" orientation="vertical" />
              <LEDArray values={[true, true, false, true, false, true, true, true]} label="Status" size="md" />
              <LEDArray
                values={['var(--color-success)', 'var(--color-accent)', '', 'var(--color-danger)', 'var(--color-success)']}
                label="Multi-color"
                size="lg"
              />
            </div>

            <Sparkline data={SPARKLINE_DATA} label="Trend" showDots size="lg" />
            <Waveform data={WAVEFORM_DATA} label="Audio" size="lg" />
            <Spectrum data={SPECTRUM_DATA} label="Frequency" size="lg" />
          </div>
        </Group>

        {/* ── Layout ── */}
        <Group title="Layout — Panel Composition">
          <div className="w-full max-w-[20rem]">
            <ControlPanel density="normal">
              <Section title="Oscillator">
                <PropertyRow label="Shape">
                  <SegmentedControl
                    value={segment}
                    onChange={setSegment}
                    options={[
                      { value: 'circle', label: 'Sin' },
                      { value: 'ellipse', label: 'Tri' },
                      { value: 'rect', label: 'Sqr' },
                    ]}
                    size="sm"
                  />
                </PropertyRow>
                <PropertyRow label="Frequency">
                  <NumberScrubber value={scrub} onChange={setScrub} formatValue={(v) => `${v} Hz`} size="sm" />
                </PropertyRow>
                <PropertyRow label="Gain">
                  <Knob value={knob} onChange={setKnob} showValue size="sm" />
                </PropertyRow>
              </Section>
              <Section title="Filter">
                <PropertyRow label="Cutoff">
                  <CtrlSlider value={slider} onChange={setSlider} min={20} max={20000} size="sm" />
                </PropertyRow>
                <PropertyRow label="Resonance">
                  <Knob value={fader} onChange={setFader} showValue size="sm" />
                </PropertyRow>
                <PropertyRow label="Active">
                  <Toggle value={toggle} onChange={setToggle} size="sm" />
                </PropertyRow>
              </Section>
            </ControlPanel>
          </div>
        </Group>
      </div>
    </div>
  );
}
