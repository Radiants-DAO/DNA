import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "decorated";
  className?: string;
}

export const DividerMeta = defineComponentMeta<DividerProps>()({
  name: "Divider",
  description:
    "A visual separator between content sections. Supports horizontal and vertical orientations with solid, dashed, and decorated (diamond ornament) variants.",
  props: {
    orientation: {
      type: "enum",
      values: ["horizontal", "vertical"],
      default: "horizontal",
      description: "Direction of the dividing line",
    },
    variant: {
      type: "enum",
      values: ["solid", "dashed", "decorated"],
      default: "solid",
      description: "Visual style of the divider line",
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },
  slots: {},
  examples: [
    {
      name: "Horizontal solid",
      code: "<Divider />",
    },
    {
      name: "Horizontal dashed",
      code: '<Divider variant="dashed" />',
    },
    {
      name: "Decorated with diamond",
      code: '<Divider variant="decorated" />',
    },
    {
      name: "Vertical divider",
      code: '<Divider orientation="vertical" />',
    },
  ],
  tokenBindings: {
    base: {
      border: "line/20",
      lineHeight: "2px",
    },
    decorated: {
      lineColor: "line/20",
      ornamentBackground: "accent",
      ornamentBorder: "line",
    },
  },
  variants: [
    { label: "Solid", props: { variant: "solid" } },
    { label: "Dashed", props: { variant: "dashed" } },
    { label: "Decorated", props: { variant: "decorated" } },
  ],
  registry: {
    category: "layout",
    tags: ["separator", "line", "hr"],
    renderMode: "inline",
  },
});
