import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ColorZones {
  low: number;
  mid: number;
}

interface MeterProps {
  value: number | [number, number];
  min?: number;
  max?: number;
  segments?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  formatValue?: (v: number) => string;
  peakHold?: boolean;
  peakDecay?: number;
  showScale?: boolean;
  scaleMarks?: number[];
  channelLabels?: [string, string];
  colorZones?: ColorZones;
}

export const MeterMeta = defineComponentMeta<MeterProps>()({
  name: "Meter",
  description: "VU-style segmented bar with green/yellow/red color zones. Supports mono and stereo (L/R) with peak hold, dB scale markings, and configurable color zones.",
  props: {
    value: { type: "number", required: true, description: "Current level value (number for mono, [L, R] tuple for stereo)" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    segments: { type: "number", default: 12, description: "Number of segments" },
    label: { type: "string", description: "Label text" },
    showValue: { type: "boolean", default: false, description: "Display numeric value" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Segment size preset" },
    orientation: { type: "enum", values: ["horizontal", "vertical"], default: "horizontal", description: "Bar direction" },
    formatValue: { type: "function", description: "Custom value formatter" },
    peakHold: { type: "boolean", default: false, description: "Show peak hold indicator at highest reached level" },
    peakDecay: { type: "number", default: 2000, description: "Milliseconds before peak indicator starts falling" },
    showScale: { type: "boolean", default: false, description: "Show dB scale markings (vertical orientation only)" },
    scaleMarks: { type: "array", description: "dB values to mark on the scale (default [0, -12, -48])" },
    channelLabels: { type: "array", description: "Labels for stereo channels, e.g. ['L', 'R']" },
    colorZones: { type: "object", description: "Color zone thresholds { low: number, mid: number } as fractions (default { low: 0.6, mid: 0.85 })" },
  },
  slots: {},
  tokenBindings: {
    segmentLow: { background: "ctrl-meter-low" },
    segmentMid: { background: "ctrl-meter-mid" },
    segmentHigh: { background: "ctrl-meter-high" },
    segmentOff: { background: "ctrl-track" },
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
    glow: { text: "ctrl-glow" },
  },
  examples: [
    { name: "Basic meter", code: '<Meter value={75} />' },
    { name: "Vertical with label", code: '<Meter value={60} orientation="vertical" label="Level" showValue />' },
    { name: "Stereo VU", code: '<Meter value={[72, 65]} orientation="vertical" channelLabels={["L", "R"]} peakHold showScale />' },
  ],
  registry: {
    category: "data-display",
    tags: ["meter", "vu", "level", "bar", "stereo", "peak"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
