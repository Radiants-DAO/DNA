import { defineComponentMeta } from "@rdna/preview/define-component-meta";

type PatternName =
  | "solid" | "empty" | "checkerboard" | "checkerboard-alt"
  | "pinstripe-v" | "pinstripe-v-wide" | "pinstripe-h" | "pinstripe-h-wide"
  | "diagonal" | "diagonal-dots" | "diagonal-right"
  | "grid" | "brick" | "shelf" | "columns" | "stagger" | "diamond"
  | "confetti" | "weave" | "brick-diagonal" | "brick-diagonal-alt"
  | "caret" | "trellis" | "arch" | "cross" | "sawtooth" | "chevron"
  | "basket" | "tweed" | "dust" | "mist"
  | "scatter" | "scatter-alt" | "scatter-pair"
  | "rain" | "rain-cluster" | "spray" | "spray-grid" | "spray-mixed"
  | "fill-75" | "fill-75-rows" | "fill-75-sweep" | "fill-75-offset"
  | "fill-75-inv" | "fill-75-bars"
  | "fill-81" | "fill-88" | "fill-88-alt" | "fill-94" | "fill-94-alt" | "fill-97";

interface PatternProps {
  pat?: PatternName;
  color?: string;
  bg?: string;
  scale?: 1 | 2 | 3 | 4;
}

export const PatternMeta = defineComponentMeta<PatternProps>()({
  name: "Pattern",
  description:
    "Renders a recolorable 8x8 tiling pattern from the System 6 pattern library. Uses CSS mask-image so any color paints through the pattern shape.",
  props: {
    pat: {
      type: "enum",
      values: [
        "solid", "empty", "checkerboard", "checkerboard-alt",
        "pinstripe-v", "pinstripe-v-wide", "pinstripe-h", "pinstripe-h-wide",
        "diagonal", "diagonal-dots", "diagonal-right",
        "grid", "brick", "shelf", "columns", "stagger", "diamond",
        "confetti", "weave", "brick-diagonal", "brick-diagonal-alt",
        "caret", "trellis", "arch", "cross", "sawtooth", "chevron",
        "basket", "tweed", "dust", "mist",
        "scatter", "scatter-alt", "scatter-pair",
        "rain", "rain-cluster", "spray", "spray-grid", "spray-mixed",
        "fill-75", "fill-75-rows", "fill-75-sweep", "fill-75-offset",
        "fill-75-inv", "fill-75-bars",
        "fill-81", "fill-88", "fill-88-alt", "fill-94", "fill-94-alt", "fill-97",
      ],
      description: "Pattern name from the registry",
    },
    color: {
      type: "string",
      description: "Dot/foreground color. Any CSS color value. Defaults to var(--color-main)",
    },
    bg: {
      type: "string",
      description: "Background color behind the pattern. Defaults to transparent (overlay mode)",
    },
    scale: {
      type: "enum",
      values: [1, 2, 3, 4],
      default: 1,
      description: "Scale multiplier: 1=8px, 2=16px, 3=24px, 4=32px",
    },
  },
  slots: {
    children: { description: "Content rendered on top of the pattern (when using bg mode)" },
  },
  examples: [
    { name: "Basic checkerboard", code: '<Pattern pat="checkerboard" className="w-20 h-20" />' },
    { name: "Colored diagonal", code: '<Pattern pat="diagonal" color="var(--color-accent)" className="w-20 h-20" />' },
    { name: "With background", code: '<Pattern pat="brick" color="white" bg="var(--color-accent)" className="w-20 h-20" />' },
    { name: "Scaled up", code: '<Pattern pat="grid" scale={2} className="w-20 h-20" />' },
  ],
  registry: {
    category: "layout",
    tags: ["pattern", "texture", "pixel", "fill"],
    renderMode: "inline",
    exampleProps: { pat: "checkerboard" },
  },
});
