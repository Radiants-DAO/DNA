import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { TransportButtonProps } from "./TransportButton";

export const TransportButtonMeta = defineComponentMeta<TransportButtonProps>()({
  name: "TransportButton",
  description:
    "Icon-only slot button for TransportPill. Transparent click target that renders the icon in the accent color; parent pill owns the slot gradient + bevel + pressed treatment.",
  props: {
    label: { type: "string", required: true, description: "Accessible label (aria-label)" },
    iconName: { type: "string", required: true, description: "RDNA icon name (resolved via @rdna/radiants/icons/runtime)" },
    onClick: { type: "function", description: "Primary action callback (keyboard + pointer)" },
    onPointerDown: { type: "function", description: "Fires on pointer-down; use for momentary pressed state" },
    onPointerUp: { type: "function", description: "Fires on pointer-up, pointer-leave, or pointer-cancel" },
    iconSize: { type: "enum", values: [16, 24], default: 16, description: "Icon size (pixel sets are 16 or 24 only)" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    className: { type: "string", description: "Additional class names" },
  },
  slots: {},
  tokenBindings: {
    icon: { color: "accent" },
    focus: { ring: "ctrl-glow" },
  },
  examples: [
    {
      name: "Play button",
      code: '<TransportButton label="Play" iconName="play" onClick={togglePlay} />',
    },
    {
      name: "Skip with momentary press",
      code: '<TransportButton\n  label="Next"\n  iconName="skip-forward"\n  onClick={next}\n  onPointerDown={() => setPressed(true)}\n  onPointerUp={() => setPressed(false)}\n/>',
    },
  ],
  registry: {
    category: "action",
    tags: ["transport", "button", "icon"],
    renderMode: "inline",
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
      { name: "focus", driver: "wrapper" },
    ],
  },
});
