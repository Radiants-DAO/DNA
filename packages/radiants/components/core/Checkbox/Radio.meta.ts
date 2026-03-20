import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface RadioProps {
  label?: string;
  disabled?: boolean;
  checked?: boolean;
  name?: string;
  value?: string;
}

export const RadioMeta = defineComponentMeta<RadioProps>()({
  name: "Radio",
  sourcePath: "packages/radiants/components/core/Checkbox/Checkbox.tsx",
  description: "Retro-styled radio button with pixel-art dot indicator. Uses Base UI Radio internally for accessibility.",
  props: {
    label: { type: "string", description: "Label text displayed next to the radio" },
    disabled: { type: "boolean", default: false, description: "Disable radio interactions" },
    checked: { type: "boolean", description: "Controlled checked state" },
    name: { type: "string", description: "Input name for form submission (groups radios together)" },
    value: { type: "string", description: "Input value for form submission" },
  },
  slots: {},
  tokenBindings: {
    container: { gap: "spacing-xs" },
    input: {
      background: "page",
      border: "line",
      backgroundChecked: "accent",
      focusRing: "focus",
    },
    dot: { background: "main" },
    label: { text: "main", font: "mondwest" },
  },
  examples: [
    { name: "Basic radio", code: '<Radio label="Option A" name="choice" value="a" />' },
    {
      name: "Radio group",
      code: '<>\n  <Radio label="Small" name="size" value="sm" />\n  <Radio label="Medium" name="size" value="md" checked />\n  <Radio label="Large" name="size" value="lg" />\n</>',
    },
  ],
  registry: {
    category: "form",
    tags: ["radio", "option", "choice"],
    renderMode: "custom",
    states: ["hover", "focus", "disabled"],
  },
});
