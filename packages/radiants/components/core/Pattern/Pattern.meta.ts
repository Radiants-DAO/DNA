import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import { PATTERN_REGISTRY, type PatternName } from "@rdna/pixel/patterns";

const PATTERN_NAMES = PATTERN_REGISTRY.map((pattern) => pattern.name) as PatternName[];

interface PatternProps {
  pat?: PatternName;
  color?: string;
  bg?: string;
  scale?: 1 | 2 | 3 | 4;
  tiled?: boolean;
}

export const PatternMeta = defineComponentMeta<PatternProps>()({
  name: "Pattern",
  description:
    "Renders a recolorable pixel pattern from the System 6 library using mask-image tokens on a single host element. Children render directly inside the host above the art layer.",
  props: {
    pat: {
      type: "enum",
      values: PATTERN_NAMES,
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
    tiled: {
      type: "boolean",
      default: true,
      description: "If true, tile the pattern to fill the host. If false, render a single 8x8 tile without repeating.",
    },
  },
  slots: {
    children: { description: "Content rendered directly inside the host above the masked art layer" },
  },
  examples: [
    { name: "Basic checkerboard", code: '<Pattern pat="checkerboard" className="w-20 h-20" />' },
    { name: "Colored diagonal", code: '<Pattern pat="diagonal" color="var(--color-accent)" className="w-20 h-20" />' },
    { name: "With background", code: '<Pattern pat="brick" color="white" bg="var(--color-accent)" className="w-20 h-20" />' },
    { name: "Scaled up", code: '<Pattern pat="grid" scale={2} className="w-20 h-20" />' },
    { name: "Single tile", code: '<Pattern pat="checkerboard" tiled={false} className="w-20 h-20" />' },
  ],
  registry: {
    category: "layout",
    tags: ["pattern", "texture", "pixel", "fill"],
    renderMode: "inline",
    exampleProps: { pat: "checkerboard" },
  },
  blockNote: {
    enabled: true,
    content: "inline",
    render: "./blocknote/renders/Pattern",
    propSchema: { pat: { prop: "pat" }, scale: { prop: "scale" } },
    slashMenu: {
      title: "Pattern",
      subtext: "Renders a recolorable 8x8 tiling pattern from the...",
      aliases: ["pattern","pattern","texture","pixel"],
      icon: "grid-3x3",
    },
  },

});
