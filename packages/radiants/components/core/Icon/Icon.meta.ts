import { defineComponentMeta } from "@rdna/preview/define-component-meta";

export interface DynamicIconProps {
  /** Canonical icon name or alias resolved against the baked bitmap registries. */
  name: string;
  /** Render size in CSS pixels. Public contract is 16 or 24 only. */
  size?: number;
  /** When true, selects the 24px bitmap set. Default: 16px (1rem). */
  large?: boolean;
  /** Additional CSS classes for styling (use text-* for color) */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Deprecated compatibility prop. Ignored at runtime; icons no longer fetch from asset paths. */
  basePath?: string;
}

export const IconMeta = defineComponentMeta<DynamicIconProps>()({
  name: "Icon",
  description:
    "Bitmap-backed RDNA icon wrapper with dual-size support. Renders baked 16px or 24px icons through @rdna/pixel BitmapIcon. Public size contract is 16 or 24 only.",
  props: {
    name: {
      type: "string",
      description:
        "Canonical icon name or alias resolved against the baked bitmap registries. Aliases like 'search', 'home', and 'trash' resolve automatically.",
    },
    size: {
      type: "enum",
      values: [16, 24],
      default: 16,
      description:
        "Render size: 16 or 24 only. `size={24}` and `large` both select the 24px bitmap registry.",
    },
    large: {
      type: "boolean",
      default: false,
      description:
        "When true, selects the 24px bitmap registry. Equivalent to `size={24}`.",
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
      name: "16px bitmap (default)",
      code: '<Icon name="search" />',
    },
    {
      name: "24px bitmap via size",
      code: '<Icon name="search" size={24} />',
    },
    {
      name: "24px-only icon via large",
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
    tags: ["icon", "bitmap", "16px", "24px", "pixel-art"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/Icon",
    propSchema: {},
    slashMenu: {
      title: "Icon",
      subtext: "Bitmap-backed icon wrapper with 16px/24px sizes. ...",
      aliases: ["icon","bitmap","pixel","16px"],
      icon: "plus",
    },
  },

});
