import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface WaveformProps {
  data: Float32Array | number[];
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WaveformMeta = defineComponentMeta<WaveformProps>()({
  name: "Waveform",
  description: "Canvas waveform visualization from audio/signal data. Renders vertical amplitude bars.",
  props: {
    data: { type: "array", required: true, description: "Audio/signal sample data (-1 to 1 range)" },
    label: { type: "string", description: "Label text above the waveform" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Height preset" },
  },
  slots: {},
  tokenBindings: {
    line: { stroke: "ctrl-fill" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic waveform", code: '<Waveform data={audioBuffer} />' },
  ],
  registry: {
    category: "data-display",
    tags: ["waveform", "audio", "signal"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
