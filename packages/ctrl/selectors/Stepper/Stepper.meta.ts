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
  parseValue?: (s: string) => number;
  suffix?: React.ReactNode;
  presets?: number[];
  keywordValue?: string;
}

export const StepperMeta = defineComponentMeta<StepperProps>()({
  name: "Stepper",
  description: "Decrement/increment buttons flanking an editable numeric value. Supports label, presets, keyword mode, and suffix slot.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 1, description: "Step increment" },
    label: { type: "string", description: "Axis or property label cell rendered before the stepper (e.g. X, Y, GAP)" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Button/text size preset" },
    formatValue: { type: "function", description: "Custom value formatter for display" },
    parseValue: { type: "function", description: "Custom parser for typed input" },
    suffix: { type: "slot", description: "Trailing slot for unit dropdown or other content" },
    presets: { type: "array", description: "Array of preset values rendered as inline buttons" },
    keywordValue: { type: "string", description: "When set, display this keyword instead of the numeric value" },
  },
  slots: {
    suffix: { description: "Trailing content after the increment button (e.g. unit dropdown)" },
  },
  tokenBindings: {
    cell: { background: "ctrl-cell-bg" },
    button: { text: "ctrl-label" },
    value: { text: "ctrl-text-active" },
    label: { text: "ctrl-text-active" },
    preset: { text: "ctrl-label", activeText: "ctrl-text-active" },
    glow: { textShadow: "ctrl-glow" },
  },
  examples: [
    { name: "Basic stepper", code: '<Stepper value={5} onChange={setValue} />' },
    { name: "With label", code: '<Stepper value={120} onChange={setValue} label="X" />' },
    { name: "With presets", code: '<Stepper value={4} onChange={setValue} label="GAP" presets={[0, 1, 2, 3, 4, 8]} />' },
    { name: "Keyword mode", code: '<Stepper value={0} onChange={setValue} label="W" keywordValue="AUTO" />' },
    { name: "Multi-axis", code: '<div className="flex gap-2"><Stepper value={120} onChange={setX} label="X" /><Stepper value={340} onChange={setY} label="Y" /></div>' },
  ],
  registry: {
    category: "form",
    tags: ["stepper", "increment", "number", "presets", "keyword"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
