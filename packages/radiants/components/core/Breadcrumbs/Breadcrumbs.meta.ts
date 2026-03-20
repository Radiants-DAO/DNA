import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface BreadcrumbsProps {
  items?: Array<{ label: string; href?: string }>;
  separator?: string;
  className?: string;
}

export const BreadcrumbsMeta = defineComponentMeta<BreadcrumbsProps>()({
  name: "Breadcrumbs",
  description:
    "Hierarchical navigation trail showing the current page location within the site structure.",
  props: {
    items: {
      type: "array",
      description: "Ordered list of breadcrumb items, each with a label and optional href",
    },
    separator: {
      type: "string",
      default: "/",
      description: "Character or string rendered between breadcrumb items",
    },
    className: {
      type: "string",
      description: "Additional CSS classes applied to the breadcrumb container",
    },
  },
  slots: {
    items: { description: "Breadcrumb item nodes when composing manually" },
  },
  examples: [
    {
      name: "Basic breadcrumbs",
      code: '<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Profile" }]} />',
    },
    {
      name: "Custom separator",
      code: '<Breadcrumbs separator="›" items={[{ label: "Home", href: "/" }, { label: "Docs", href: "/docs" }, { label: "API" }]} />',
    },
    {
      name: "Single item",
      code: '<Breadcrumbs items={[{ label: "Home" }]} />',
    },
  ],
  tokenBindings: {
    base: {
      font: "heading",
      gap: "spacing-sm",
    },
    separator: {
      text: "main/40",
    },
    link: {
      text: "main/60",
      textHover: "main",
    },
    current: {
      text: "main",
      fontWeight: "semibold",
    },
    inactive: {
      text: "main/60",
    },
  },
  registry: {
    category: "navigation",
    tags: ["path", "navigation", "trail"],
    renderMode: "inline",
  },
});
