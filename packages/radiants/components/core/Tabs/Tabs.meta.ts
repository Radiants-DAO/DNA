import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: string;
  variant?: "pill" | "line";
  layout?: "default" | "bottom-tabs";
}

export const TabsMeta = defineComponentMeta<TabsProps>()({
  name: "Tabs",
  description:
    "Accessible tabbed navigation with keyboard support. Supports pill and line visual variants.",
  subcomponents: ["TabsList", "TabsTrigger", "TabsContent"],
  props: {
    defaultValue: {
      type: "string",
      description: "Default selected tab value",
    },
    value: {
      type: "string",
      description: "Controlled selected tab value",
    },
    onValueChange: {
      type: "string",
      description: "Callback when active tab changes",
    },
    variant: {
      type: "enum",
      options: ["pill", "line"],
      default: "pill",
      description: "Visual style variant",
    },
    layout: {
      type: "enum",
      options: ["default", "bottom-tabs"],
      default: "default",
      description: "Layout mode for tab positioning",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic tabs",
      code: '<Tabs defaultValue="tab1">\n  <TabsList>\n    <TabsTrigger value="tab1">Tab 1</TabsTrigger>\n    <TabsTrigger value="tab2">Tab 2</TabsTrigger>\n  </TabsList>\n  <TabsContent value="tab1">Content 1</TabsContent>\n  <TabsContent value="tab2">Content 2</TabsContent>\n</Tabs>',
    },
  ],
  registry: {
    category: "navigation",
    tags: ["sections", "switch"],
    renderMode: "custom",
  },
});
