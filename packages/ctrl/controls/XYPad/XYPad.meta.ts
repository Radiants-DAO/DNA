import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { Point2D } from "../../primitives/types";

interface XYPadProps {
  value: Point2D;
  onChange: (value: Point2D) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  formatValue?: (v: Point2D) => string;
}

export const XYPadMeta = defineComponentMeta<XYPadProps>()({
  name: "XYPad",
  description: "2D control surface with dot-grid background and crosshair indicator. Drag to set X/Y position.",
  props: {
    value: { type: "object", required: true, description: "Current {x, y} value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value for both axes" },
    max: { type: "number", default: 100, description: "Maximum value for both axes" },
    step: { type: "number", default: 0, description: "Step increment (0 = continuous)" },
    label: { type: "string", description: "Label text above the pad" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Pad dimension preset" },
    showValue: { type: "boolean", default: false, description: "Display coordinates below the pad" },
  },
  slots: {},
  tokenBindings: {
    surface: { background: "ctrl-track" },
    grid: { dot: "ctrl-grid-dot", line: "ctrl-grid-line" },
    indicator: { fill: "ctrl-fill" },
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
  },
  examples: [
    { name: "Basic pad", code: '<XYPad value={{x:50,y:50}} onChange={setValue} />' },
    { name: "With label", code: '<XYPad value={pos} onChange={setPos} label="Pan/Tilt" showValue />' },
  ],
  registry: {
    category: "control",
    tags: ["2d", "position", "coordinate"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
