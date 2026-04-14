import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  formatValue?: (v: number) => string;
}

export const StepperMeta = defineComponentMeta<StepperProps>()({
  name: "Stepper",
  description: "Decrement/increment buttons flanking an editable numeric value.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 1, description: "Step increment" },
    label: { type: "string", description: "Label text above the stepper" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Button/text size preset" },
    formatValue: { type: "function", description: "Custom value formatter" },
  },
  slots: {},
  tokenBindings: {
    track: { background: "ctrl-track" },
    button: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic stepper", code: '<Stepper value={5} onChange={setValue} />' },
    { name: "With bounds", code: '<Stepper value={3} onChange={setValue} min={1} max={10} label="Count" />' },
  ],
  registry: {
    category: "form",
    tags: ["stepper", "increment", "number"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
