import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface CardProps {
  variant?: "default" | "inverted" | "raised";
  rounded?: "sm" | "md" | "lg";
}

export const CardMeta = defineComponentMeta<CardProps>()({
  name: "Card",
  description:
    "Container with retro pixel-corner bevels and theme-owned colors. Use CardHeader, CardBody, CardFooter for structured layouts.",
  props: {
    variant: {
      type: "enum",
      values: ["default", "inverted", "raised"],
      default: "default",
      description: "Visual variant controlling background and bevel treatment",
    },
    rounded: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "lg",
      description: "Pixel-corner roundness",
    },
  },
  slots: {
    children: {
      description:
        "Card content. Use CardHeader, CardBody, CardFooter sub-components for structured layouts, or pass content directly with padding via className.",
    },
  },
  examples: [
    {
      name: "Default card with sections",
      code: "<Card><CardHeader>Title</CardHeader><CardBody>Content</CardBody><CardFooter>Actions</CardFooter></Card>",
    },
    {
      name: "Simple padded card",
      code: '<Card className="p-4">Simple content</Card>',
    },
    {
      name: "Inverted card",
      code: '<Card variant="inverted"><CardBody>Dark surface</CardBody></Card>',
    },
    {
      name: "Raised card with shadow",
      code: '<Card variant="raised"><CardBody>Elevated content</CardBody></Card>',
    },
  ],
  tokenBindings: {
    default: {
      background: "card",
      text: "main",
      border: "line",
      bevel: "white-0.2/black-0.08",
    },
    inverted: {
      background: "inv",
      text: "flip",
      border: "line",
      bevel: "white-0.12/black-0.15",
    },
    raised: {
      background: "card",
      text: "main",
      border: "line",
      shadow: "pixel-shadow-raised",
      bevel: "white-0.2/black-0.08",
    },
  },
  registry: {
    category: "layout",
    tags: ["container", "panel", "surface"],
    renderMode: "custom",
  },
});
