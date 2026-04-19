import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ToggleGroupProps {
  multiple?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  tone?: "accent" | "danger" | "success" | "neutral" | "cream" | "white" | "info" | "tinted";
  size?: "xs" | "sm" | "md" | "lg";
  rounded?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "none";
  children?: React.ReactNode;
}

export const ToggleGroupMeta = defineComponentMeta<ToggleGroupProps>()({
  name: "ToggleGroup",
  description:
    "Ink-surfaced group of chip toggles for single or multi-select. Items render as RDNA Toggles.",
  subcomponents: ["ToggleGroup.Item"],
  props: {
    multiple: {
      type: "boolean",
      default: false,
      description: "Allow multiple items to be selected simultaneously",
    },
    value: {
      type: "string",
      description: "Controlled selected value(s)",
    },
    defaultValue: {
      type: "string",
      description: "Default selected value(s)",
    },
    onValueChange: {
      type: "string",
      description: "Callback when selection changes",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable all toggle interactions",
    },
    orientation: {
      type: "enum",
      options: ["horizontal", "vertical"],
      default: "horizontal",
      description: "Layout direction",
    },
    tone: {
      type: "enum",
      options: ["accent", "danger", "success", "neutral", "cream", "white", "info", "tinted"],
      default: "neutral",
      description: "Color tone applied to all items",
    },
    size: {
      type: "enum",
      options: ["xs", "sm", "md", "lg"],
      default: "xs",
      description: "Size applied to all items",
    },
    rounded: {
      type: "enum",
      options: ["xs", "sm", "md", "lg", "xl", "full", "none"],
      default: "xs",
      description: "Pixel-corner roundness applied to all items",
    },
  },
  slots: {
    children: {
      description: "ToggleGroup.Item elements",
    },
  },
  examples: [
    {
      name: "Single selection",
      code: '<ToggleGroup defaultValue={["center"]}>\n  <ToggleGroup.Item value="left">Left</ToggleGroup.Item>\n  <ToggleGroup.Item value="center">Center</ToggleGroup.Item>\n  <ToggleGroup.Item value="right">Right</ToggleGroup.Item>\n</ToggleGroup>',
    },
    {
      name: "Multiple selection",
      code: '<ToggleGroup multiple>\n  <ToggleGroup.Item value="bold">B</ToggleGroup.Item>\n  <ToggleGroup.Item value="italic">I</ToggleGroup.Item>\n</ToggleGroup>',
    },
  ],
  registry: {
    category: "action",
    tags: ["toggle-group", "segmented", "multi-select"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/ToggleGroup",
    propSchema: {},
    slashMenu: {
      title: "ToggleGroup",
      subtext: "Group of related toggle buttons for single or mult...",
      aliases: ["togglegroup","toggle-group","segmented","multi-select"],
      icon: "grid-3x3",
    },
  },

});
