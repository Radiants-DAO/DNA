import { defineComponentMeta } from "@rdna/preview/define-component-meta";

export type SliderSize = "sm" | "md" | "lg";

interface SliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  disabled?: boolean;
  showValue?: boolean;
  label?: string;
}

export const SliderMeta = defineComponentMeta<SliderProps>()({
  name: "Slider",
  description: "Numeric range input with draggable thumb. Supports keyboard navigation and customizable sizes.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 1, description: "Step increment between values" },
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      description: "Size preset controlling track height and thumb dimensions",
    },
    disabled: { type: "boolean", default: false, description: "Disable slider interactions" },
    showValue: { type: "boolean", default: false, description: "Display current value next to label" },
    label: { type: "string", description: "Label text displayed above the slider" },
  },
  slots: {},
  tokenBindings: {
    label: { text: "main", font: "heading" },
    value: { text: "main/60", font: "heading" },
    track: { background: "line/10", border: "line", focusRing: "focus" },
    fill: { background: "accent" },
    thumb: { background: "depth", border: "line" },
  },
  examples: [
    { name: "Basic slider", code: "<Slider value={50} onChange={setValue} />" },
    {
      name: "With label and value display",
      code: "<Slider value={volume} onChange={setVolume} label=\"Volume\" showValue />",
    },
    {
      name: "Large disabled slider",
      code: '<Slider value={75} onChange={() => {}} size="lg" disabled />',
    },
  ],
  registry: {
    category: "form",
    tags: ["range", "volume", "adjust"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "focus", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/Slider",
    propSchema: { size: { prop: "size" } },
    slashMenu: {
      title: "Slider",
      subtext: "Numeric range input with draggable thumb. Supports...",
      aliases: ["slider","range","volume","adjust"],
      icon: "grip-horizontal",
    },
  },

});
