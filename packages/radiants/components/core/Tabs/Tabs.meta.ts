import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: string;
  mode?: "capsule" | "chrome";
  position?: "top" | "bottom" | "left";
  tone?: "neutral" | "accent";
  size?: "sm" | "md" | "lg";
  indicator?: "none" | "dot";
}

export const TabsMeta = defineComponentMeta<TabsProps>()({
  name: "Tabs",
  description:
    "Tabbed navigation — capsule (detached) or chrome (attached). Built on Base UI Tabs.",
  subcomponents: ["TabsList", "TabsTrigger", "TabsContent"],
  props: {
    defaultValue: {
      type: "string",
      description: "Initially active tab (uncontrolled)",
    },
    value: {
      type: "string",
      description: "Active tab value (controlled)",
    },
    onValueChange: {
      type: "string",
      description: "Callback when active tab changes",
    },
    mode: {
      type: "enum",
      options: ["capsule", "chrome"],
      default: "capsule",
      description:
        "Spatial mode — capsule (detached, free-floating bar) or chrome (attached, merges into content edge)",
    },
    position: {
      type: "enum",
      options: ["top", "bottom", "left"],
      default: "top",
      description: "Where the tab list sits relative to content",
    },
    tone: {
      type: "enum",
      options: ["neutral", "accent"],
      default: "neutral",
      description: "Color tone",
    },
    size: {
      type: "enum",
      options: ["sm", "md", "lg"],
      default: "md",
      description: "Trigger size preset",
    },
    indicator: {
      type: "enum",
      options: ["none", "dot"],
      default: "none",
      description: "Show dot pagination indicator alongside tab list",
    },
  },
  slots: {
    children: { description: "Tabs.List and Tabs.Content elements" },
  },
  examples: [
    {
      name: "Capsule tabs (default — detached)",
      code: `<Tabs defaultValue="design">
  <Tabs.List>
    <Tabs.Trigger value="design" icon={<PencilIcon />}>Design</Tabs.Trigger>
    <Tabs.Trigger value="code" icon={<CodeIcon />}>Code</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="design">Design panel</Tabs.Content>
  <Tabs.Content value="code">Code panel</Tabs.Content>
</Tabs>`,
    },
    {
      name: "Chrome tabs (attached — merges into content)",
      code: `<Tabs defaultValue="home" mode="chrome">
  <Tabs.List>
    <Tabs.Trigger value="home" icon={<HomeIcon />}>Home</Tabs.Trigger>
    <Tabs.Trigger value="settings" icon={<GearIcon />}>Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="home">Home content</Tabs.Content>
  <Tabs.Content value="settings">Settings content</Tabs.Content>
</Tabs>`,
    },
    {
      name: "Bottom tabs with dot indicator",
      code: `<Tabs defaultValue="feed" position="bottom" indicator="dot">
  <Tabs.Content value="feed">Feed</Tabs.Content>
  <Tabs.Content value="search">Search</Tabs.Content>
  <Tabs.List>
    <Tabs.Trigger value="feed">Feed</Tabs.Trigger>
    <Tabs.Trigger value="search">Search</Tabs.Trigger>
  </Tabs.List>
</Tabs>`,
    },
  ],
  tokenBindings: {
    background: "card",
    border: "line",
    text: "main",
  },
  registry: {
    category: "navigation",
    tags: ["sections", "switch", "tabs"],
    renderMode: "custom",
    states: [
      { name: "hover", type: "pseudo" },
      { name: "selected", type: "data", attribute: "data-state" },
      { name: "focus", type: "pseudo" },
    ],
    exampleProps: {
      defaultValue: "design",
    },
    replaces: [],
  },
});
