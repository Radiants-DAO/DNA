'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { PanelTitle } from '@rdna/ctrl/layout/PanelTitle/PanelTitle';

// ============================================================================
// Demo data
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
// Shared preview helpers
// ============================================================================

/** Section divider on the preview surface */
function PreviewSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-mono text-xs text-accent uppercase tracking-wider shrink-0">{title}</h2>
        <div className="flex-1 h-px bg-rule" />
      </div>
      {children}
    </section>
  );
}

/** Side-by-side size variants */
function SizeRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-6">{children}</div>;
}

/** Labeled demo slot */
function Demo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {children}
      <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function CtrlPreview() {
  // ── State ──
  const [knob, setKnob] = useState(65);
  const [fader, setFader] = useState(70);
  const [slider, setSlider] = useState(40);
  const [xy, setXY] = useState({ x: 50, y: 50 });
  const [scrub, setScrub] = useState(16);
  const [ribbon, setRibbon] = useState(50);
  const [arc, setArc] = useState(75);
  const [segment, setSegment] = useState('grid');
  const [stepper, setStepper] = useState(5);
  const [strip, setStrip] = useState('1');
  const [toggle, setToggle] = useState(true);
  const [chips, setChips] = useState<string | string[]>(['A', 'C']);
  const [matrix, setMatrix] = useState(() => initMatrix(4, 8));
  const [radial, setRadial] = useState('N');
  const [meter, setMeter] = useState(72);

  const animateMeter = useCallback(() => {
    setMeter((prev) => {
      const next = prev + (Math.random() - 0.48) * 8;
      return Math.max(0, Math.min(100, next));
    });
  }, []);

  useEffect(() => {
    const id = setInterval(animateMeter, 200);
    return () => clearInterval(id);
  }, [animateMeter]);

  return (
    <div className="dark min-h-screen bg-page text-main p-6 pb-20">
      <div className="max-w-[28rem] mx-auto space-y-8">
        {/* ── Header ── */}
        <header className="space-y-1">
          <h1 className="font-mono text-base text-accent uppercase tracking-wider">
            @rdna/ctrl
          </h1>
          <p className="font-mono text-[0.625rem] text-mute">
            Visual Fidelity Pass — working surface
          </p>
        </header>

        {/* ════════════════════════════════════════════════════
            LAYOUT COMPONENTS
           ════════════════════════════════════════════════════ */}
        <PreviewSection id="layout" title="Layout">
          <div className="space-y-6">
            {/* PanelTitle — isolated */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Panel Title</span>
              <PanelTitle title="Layout" />
              <PanelTitle title="Inspector" subtitle="CSS Properties" />
            </div>

            {/* Section — isolated variants */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Section Headers</span>
              <Section title="Size">
                <PropertyRow label="W">
                  <span className="font-mono text-[0.625rem] text-ctrl-value">Fill</span>
                </PropertyRow>
                <PropertyRow label="H">
                  <span className="font-mono text-[0.625rem] text-ctrl-text-active"
                    style={{ textShadow: '0 0 8px var(--glow-sun-yellow)' }}
                  >10</span>
                  <span className="font-mono text-[0.5rem] text-ctrl-label ml-1">REM</span>
                </PropertyRow>
              </Section>
              <Section title="Layers" count={12}>
                <PropertyRow label="App">
                  <span className="font-mono text-[0.625rem] text-ctrl-label">div</span>
                </PropertyRow>
              </Section>
            </div>

            {/* Full composed panel */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Composed Panel</span>
              <ControlPanel density="normal">
                <PanelTitle title="Layout" />
                <Section title="Oscillator">
                  <PropertyRow label="Shape">
                    <SegmentedControl
                      value={segment}
                      onChange={setSegment}
                      options={[
                        { value: 'sin', label: 'Sin' },
                        { value: 'tri', label: 'Tri' },
                        { value: 'sqr', label: 'Sqr' },
                      ]}
                      size="sm"
                    />
                  </PropertyRow>
                  <PropertyRow label="Freq">
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
                  <PropertyRow label="Active">
                    <Toggle value={toggle} onChange={setToggle} size="sm" />
                  </PropertyRow>
                </Section>
              </ControlPanel>
            </div>
          </div>
        </PreviewSection>

        {/* ════════════════════════════════════════════════════
            SELECTORS
           ════════════════════════════════════════════════════ */}
        <PreviewSection id="selectors" title="Selectors">
          <div className="space-y-6">
            {/* Toggle — isolated, all states */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Toggle</span>
              <SizeRow>
                <Demo label="on / lg">
                  <Toggle value={true} onChange={setToggle} label="ON" size="lg" />
                </Demo>
                <Demo label="off / lg">
                  <Toggle value={false} onChange={setToggle} label="OFF" size="lg" />
                </Demo>
                <Demo label="on / md">
                  <Toggle value={toggle} onChange={setToggle} label="Enabled" />
                </Demo>
                <Demo label="off / sm">
                  <Toggle value={false} onChange={setToggle} size="sm" />
                </Demo>
              </SizeRow>
            </div>

            {/* SegmentedControl */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Segmented Control</span>
              <SegmentedControl
                value={segment}
                onChange={setSegment}
                options={[
                  { value: 'flex', label: 'Flex' },
                  { value: 'grid', label: 'Grid' },
                  { value: 'block', label: 'Block' },
                  { value: 'none', label: 'None' },
                ]}
                label="Display"
              />
            </div>

            {/* ButtonStrip */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Button Strip</span>
              <ButtonStrip
                value={strip}
                onChange={(v) => setStrip(typeof v === 'string' ? v : v[0])}
                options={[
                  { value: '-1', label: '-1' },
                  { value: '0', label: '0' },
                  { value: '10', label: '10' },
                  { value: '25', label: '25' },
                  { value: '50', label: '50' },
                  { value: '99', label: '99' },
                  { value: '100', label: '100' },
                  { value: 'auto', label: 'Auto' },
                ]}
                label="Z-Index"
              />
            </div>

            {/* Stepper */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Stepper</span>
              <SizeRow>
                <Stepper value={stepper} onChange={setStepper} min={0} max={100} label="Count" size="lg" />
                <Stepper value={stepper} onChange={setStepper} min={0} max={100} label="Count" size="sm" />
              </SizeRow>
            </div>

            {/* ChipTag */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Chip Tag</span>
              <ChipTag value={chips} onChange={setChips} options={['A', 'B', 'C', 'D', 'E']} mode="multi" label="Tags" />
            </div>

            {/* MatrixGrid */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Matrix Grid</span>
              <MatrixGrid value={matrix} onChange={setMatrix} size="md" />
            </div>

            {/* RadialMenu */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Radial Menu</span>
              <SizeRow>
                <Demo label="lg">
                  <RadialMenu
                    value={radial}
                    onChange={setRadial}
                    options={[
                      { value: 'N', label: 'N' },
                      { value: 'E', label: 'E' },
                      { value: 'S', label: 'S' },
                      { value: 'W', label: 'W' },
                    ]}
                    size="lg"
                  />
                </Demo>
                <Demo label="sm">
                  <RadialMenu
                    value={radial}
                    onChange={setRadial}
                    options={[
                      { value: 'N', label: 'N' },
                      { value: 'E', label: 'E' },
                      { value: 'S', label: 'S' },
                      { value: 'W', label: 'W' },
                    ]}
                    size="sm"
                  />
                </Demo>
              </SizeRow>
            </div>
          </div>
        </PreviewSection>

        {/* ════════════════════════════════════════════════════
            CONTROLS
           ════════════════════════════════════════════════════ */}
        <PreviewSection id="controls" title="Controls">
          <div className="space-y-6">
            {/* Knob */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Knob</span>
              <SizeRow>
                <Demo label="lg"><Knob value={knob} onChange={setKnob} label="Vol" showValue size="lg" /></Demo>
                <Demo label="md"><Knob value={knob} onChange={setKnob} showValue size="md" /></Demo>
                <Demo label="sm"><Knob value={knob} onChange={setKnob} showValue size="sm" /></Demo>
              </SizeRow>
            </div>

            {/* Fader */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Fader</span>
              <SizeRow>
                <Demo label="lg"><Fader value={fader} onChange={setFader} label="Gain" showValue size="lg" /></Demo>
                <Demo label="md"><Fader value={fader} onChange={setFader} showValue size="md" /></Demo>
                <Demo label="sm"><Fader value={fader} onChange={setFader} showValue size="sm" /></Demo>
              </SizeRow>
            </div>

            {/* ArcRing */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Arc Ring</span>
              <SizeRow>
                <Demo label="lg"><ArcRing value={arc} onChange={setArc} label="CPU" size="lg" /></Demo>
                <Demo label="md"><ArcRing value={arc} onChange={setArc} size="md" /></Demo>
                <Demo label="sm"><ArcRing value={arc} onChange={setArc} size="sm" /></Demo>
              </SizeRow>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Slider</span>
              <CtrlSlider value={slider} onChange={setSlider} label="Pan" showValue size="lg" />
              <CtrlSlider value={slider} onChange={setSlider} showValue size="sm" />
            </div>

            {/* Ribbon */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Ribbon</span>
              <Ribbon value={ribbon} onChange={setRibbon} label="Pitch" showValue size="lg" />
              <Ribbon value={50} onChange={setRibbon} label="Spring" showValue springReturn size="md" />
            </div>

            {/* NumberScrubber */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Number Scrubber</span>
              <SizeRow>
                <NumberScrubber value={scrub} onChange={setScrub} label="Size" size="lg" />
                <NumberScrubber value={scrub} onChange={setScrub} label="Size" size="sm" />
              </SizeRow>
            </div>

            {/* XYPad */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">XY Pad</span>
              <XYPad value={xy} onChange={setXY} label="Pan/Tilt" showValue size="lg" />
            </div>
          </div>
        </PreviewSection>

        {/* ════════════════════════════════════════════════════
            READOUTS
           ════════════════════════════════════════════════════ */}
        <PreviewSection id="readouts" title="Readouts">
          <div className="space-y-6">
            {/* Meter */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Meter</span>
              <SizeRow>
                <Meter value={meter} label="Level" showValue size="lg" />
                <Meter value={meter} label="VU" showValue size="md" orientation="vertical" />
              </SizeRow>
            </div>

            {/* LEDArray */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">LED Array</span>
              <SizeRow>
                <LEDArray values={[true, true, false, true, false, true, true, true]} label="Status" size="md" />
                <LEDArray
                  values={['var(--color-success)', 'var(--color-accent)', '', 'var(--color-danger)', 'var(--color-success)']}
                  label="Multi"
                  size="lg"
                />
              </SizeRow>
            </div>

            {/* Sparkline */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Sparkline</span>
              <Sparkline data={SPARKLINE_DATA} label="Trend" showDots size="lg" />
            </div>

            {/* Waveform */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Waveform</span>
              <Waveform data={WAVEFORM_DATA} label="Audio" size="lg" />
            </div>

            {/* Spectrum */}
            <div className="space-y-2">
              <span className="font-mono text-[0.5rem] text-mute uppercase tracking-wider">Spectrum</span>
              <Spectrum data={SPECTRUM_DATA} label="Frequency" size="lg" />
            </div>
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}
