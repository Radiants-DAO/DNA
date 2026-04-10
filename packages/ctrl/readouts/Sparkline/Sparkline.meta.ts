import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SparklineProps {
  data: number[];
  min?: number;
  max?: number;
  label?: string;
  showDots?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SparklineMeta = defineComponentMeta<SparklineProps>()({
  name: "Sparkline",
  description: "Canvas line/dot chart for compact time-series or data visualization.",
  props: {
    data: { type: "array", required: true, description: "Array of numeric data points" },
    min: { type: "number", description: "Forced minimum (auto-detected if omitted)" },
    max: { type: "number", description: "Forced maximum (auto-detected if omitted)" },
    label: { type: "string", description: "Label text above the sparkline" },
    showDots: { type: "boolean", default: false, description: "Show dots at data points" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Height preset" },
  },
  slots: {},
  tokenBindings: {
    line: { stroke: "ctrl-fill" },
    dot: { fill: "ctrl-glow" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic sparkline", code: '<Sparkline data={[10, 30, 20, 50, 40]} />' },
    { name: "With dots", code: '<Sparkline data={[5, 15, 10, 25, 20]} showDots label="Trend" />' },
  ],
  registry: {
    category: "data-display",
    tags: ["sparkline", "chart", "line"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
