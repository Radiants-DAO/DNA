import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface NavigationMenuProps {
  orientation?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: string;
}

export const NavigationMenuMeta = defineComponentMeta<NavigationMenuProps>()({
  name: "NavigationMenu",
  description:
    "Site navigation component with flyout content panels. Supports horizontal and vertical orientations.",
  subcomponents: [
    "NavigationMenu.Root",
    "NavigationMenu.List",
    "NavigationMenu.Item",
    "NavigationMenu.Trigger",
    "NavigationMenu.Content",
    "NavigationMenu.Link",
    "NavigationMenu.Viewport",
  ],
  props: {
    orientation: {
      type: "string",
      default: "horizontal",
      description: "Layout orientation",
    },
    value: {
      type: "string",
      description: "Controlled active item",
    },
    defaultValue: {
      type: "string",
      description: "Default active item",
    },
    onValueChange: {
      type: "string",
      description: "Callback when active item changes",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic navigation menu",
      code: '<NavigationMenu.Root>\n  <NavigationMenu.List>\n    <NavigationMenu.Item>\n      <NavigationMenu.Link href="/">Home</NavigationMenu.Link>\n    </NavigationMenu.Item>\n    <NavigationMenu.Item>\n      <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>\n      <NavigationMenu.Content>...</NavigationMenu.Content>\n    </NavigationMenu.Item>\n  </NavigationMenu.List>\n</NavigationMenu.Root>',
    },
  ],
  registry: {
    category: "navigation",
    tags: ["navigation", "nav", "flyout", "site-nav"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/NavigationMenu",
    propSchema: {},
    slashMenu: {
      title: "NavigationMenu",
      subtext: "Site navigation component with flyout content pane...",
      aliases: ["navigationmenu","navigation","nav","flyout"],
      icon: "globe",
    },
  },

});
