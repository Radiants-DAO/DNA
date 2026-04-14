import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  segments?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  formatValue?: (v: number) => string;
}

export const MeterMeta = defineComponentMeta<MeterProps>()({
  name: "Meter",
  description: "VU-style segmented bar with green/yellow/red color zones. Read-only data display.",
  props: {
    value: { type: "number", required: true, description: "Current level value" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    segments: { type: "number", default: 12, description: "Number of segments" },
    label: { type: "string", description: "Label text" },
    showValue: { type: "boolean", default: false, description: "Display numeric value" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Segment size preset" },
    orientation: { type: "enum", values: ["horizontal", "vertical"], default: "horizontal", description: "Bar direction" },
    formatValue: { type: "function", description: "Custom value formatter" },
  },
  slots: {},
  tokenBindings: {
    segmentLow: { background: "ctrl-meter-low" },
    segmentMid: { background: "ctrl-meter-mid" },
    segmentHigh: { background: "ctrl-meter-high" },
    segmentOff: { background: "ctrl-track" },
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
  },
  examples: [
    { name: "Basic meter", code: '<Meter value={75} />' },
    { name: "Vertical with label", code: '<Meter value={60} orientation="vertical" label="Level" showValue />' },
  ],
  registry: {
    category: "data-display",
    tags: ["meter", "vu", "level", "bar"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
