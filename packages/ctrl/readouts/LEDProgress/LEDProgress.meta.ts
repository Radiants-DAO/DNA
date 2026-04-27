import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { LEDProgressProps } from "./LEDProgress";

export const LEDProgressMeta = defineComponentMeta<LEDProgressProps>()({
  name: "LEDProgress",
  description:
    "Horizontal LED progress strip in the Paper LCD style. A framed dark substrate containing N identical cells that light left→right based on value/max. Distinct from Meter (VU/level readouts with color zones) and ProgressBar (segmented pixel loader) — use LEDProgress for LCD-style playback/position readouts where cells are uniform and only the fill fraction matters.",
  props: {
    value: {
      type: "number",
      required: true,
      description: "Current value. Clamped to [0, max].",
    },
    max: {
      type: "number",
      default: 100,
      description: "Maximum value. Must be > 0.",
    },
    cells: {
      type: "number",
      default: 32,
      description: "Number of cells in the strip.",
    },
    className: {
      type: "string",
      description: "Additional className applied to the root element.",
    },
    ariaLabel: {
      type: "string",
      description: "Accessible label for the progressbar.",
    },
  },
  slots: {},
  tokenBindings: {
    substrate: { background: "ctrl-led-substrate" },
    cellOn: { background: "ctrl-led-on", glow: "ctrl-led-glow" },
    cellOff: { background: "ctrl-led-off" },
    frame: { border: "ctrl-led-frame", glow: "ctrl-led-frame-glow" },
  },
  examples: [
    {
      name: "Playback progress (32 cells)",
      code: '<LEDProgress value={currentTime} max={duration} ariaLabel="Playback progress" />',
    },
    {
      name: "Custom cell count",
      code: '<LEDProgress value={40} max={100} cells={16} />',
    },
  ],
  registry: {
    category: "data-display",
    tags: ["led", "progress", "lcd", "playback", "strip"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
