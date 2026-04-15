import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface LEDArrayProps {
  values: (boolean | string)[];
  color?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LEDArrayMeta = defineComponentMeta<LEDArrayProps>()({
  name: "LEDArray",
  description: "Row of colored indicator dots with glow. Supports boolean on/off or custom color per LED.",
  props: {
    values: { type: "array", required: true, description: "Array of booleans or color strings" },
    color: { type: "string", default: "var(--color-ctrl-fill)", description: "Default LED color" },
    label: { type: "string", description: "Label text above the array" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Dot size preset" },
  },
  slots: {},
  tokenBindings: {
    ledOn: { background: "ctrl-fill", glow: "ctrl-glow" },
    ledOff: { background: "ctrl-track" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic LEDs", code: '<LEDArray values={[true, true, false, true]} />' },
    { name: "Custom colors", code: '<LEDArray values={["red", "green", "", "blue"]} label="Status" />' },
  ],
  registry: {
    category: "data-display",
    tags: ["led", "indicator", "status"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
