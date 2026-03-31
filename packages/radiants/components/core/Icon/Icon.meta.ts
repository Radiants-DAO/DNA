import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface IconProps {
  name: string;
  size?: 16 | 24;
  large?: boolean;
  className?: string;
}

export const IconMeta = defineComponentMeta<IconProps>()({
  name: "Icon",
  description:
    "Dynamic SVG icon loader with dual-size support. Loads pixel-art icons (16px) or detailed icons (24px). Size is locked to 16 or 24 — no arbitrary scaling.",
  props: {
    name: {
      type: "string",
      description:
        "Icon name (filename without .svg). Aliases like 'search', 'home', 'trash' resolve automatically.",
    },
    size: {
      type: "enum",
      values: [16, 24],
      default: 16,
      description:
        "Render size: 16 (pixel-art set) or 24 (detailed set). Prefer `large` for 24px.",
    },
    large: {
      type: "boolean",
      default: false,
      description:
        "When true, renders at 24px using the 24px icon set. Equivalent to size={24}.",
    },
    className: {
      type: "string",
      default: "",
      description: "CSS classes for styling. Use text-* classes for color.",
    },
  },
  slots: {},
  examples: [
    {
      name: "16px pixel-art (default)",
      code: '<Icon name="search" />',
    },
    {
      name: "24px detailed",
      code: '<Icon name="search" large />',
    },
    {
      name: "24px-only icon",
      code: '<Icon name="coding-apps-websites-database" large />',
    },
  ],
  tokenBindings: {
    base: {
      text: "currentColor",
    },
  },
  registry: {
    category: "media",
    tags: ["icon", "svg", "16px", "24px", "pixel-art"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    propSchema: { size: { prop: "size" } },
    slashMenu: {
      title: "Icon",
      subtext: "Dynamic SVG icon loader with dual-size support. Lo...",
      aliases: ["icon","icon","svg","16px"],
      icon: "plus",
    },
  },

});
