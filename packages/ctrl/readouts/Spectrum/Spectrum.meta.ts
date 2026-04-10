import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SpectrumProps {
  data: number[];
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  barWidth?: number;
}

export const SpectrumMeta = defineComponentMeta<SpectrumProps>()({
  name: "Spectrum",
  description: "Canvas vertical bar frequency analyzer. EQ-style spectrum display.",
  props: {
    data: { type: "array", required: true, description: "Frequency bin data (0 to 1 range)" },
    label: { type: "string", description: "Label text above the spectrum" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Height preset" },
    barWidth: { type: "number", default: 3, description: "Width of each frequency bar in px" },
  },
  slots: {},
  tokenBindings: {
    bar: { fill: "ctrl-fill" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic spectrum", code: '<Spectrum data={fftData} />' },
  ],
  registry: {
    category: "data-display",
    tags: ["spectrum", "analyzer", "frequency", "eq"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
