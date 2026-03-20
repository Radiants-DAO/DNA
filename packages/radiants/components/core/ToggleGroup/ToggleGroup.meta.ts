import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ToggleGroupProps {
  multiple?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: string;
  disabled?: boolean;
  orientation?: string;
  size?: string;
  children?: React.ReactNode;
}

export const ToggleGroupMeta = defineComponentMeta<ToggleGroupProps>()({
  name: "ToggleGroup",
  description:
    "Group of related toggle buttons for single or multiple selection. Manages selection state across its Toggle children.",
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
      type: "string",
      default: "horizontal",
      description: "Layout direction",
    },
    size: {
      type: "string",
      description: "Size applied to all toggle items",
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
      code: '<ToggleGroup defaultValue="center">\n  <ToggleGroup.Item value="left">Left</ToggleGroup.Item>\n  <ToggleGroup.Item value="center">Center</ToggleGroup.Item>\n  <ToggleGroup.Item value="right">Right</ToggleGroup.Item>\n</ToggleGroup>',
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
});
