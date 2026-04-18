import { defineComponentMeta } from "@rdna/preview/define-component-meta";

export interface ComboboxProps {
  /** The controlled selected value */
  value?: unknown;
  /** Default selected value for uncontrolled usage */
  defaultValue?: unknown;
  /** Callback when value changes */
  onValueChange?: (value: unknown) => void;
  /** Callback when the popup opens or closes — receives Base UI eventDetails as second arg */
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
  /** Callback when input value changes */
  onInputValueChange?: (value: string) => void;
  /** Whether to auto-highlight the first matching item */
  autoHighlight?: boolean;
  /** Whether the combobox should ignore user interaction */
  disabled?: boolean;
}

export const ComboboxMeta = defineComponentMeta<ComboboxProps>()({
  name: "Combobox",
  description:
    "Searchable select / autocomplete input. Combines a text input with a filterable dropdown list. Supports keyboard navigation, custom filtering, groups, and empty states.",
  subcomponents: [
    "Combobox.Root",
    "Combobox.Input",
    "Combobox.Portal",
    "Combobox.Popup",
    "Combobox.Item",
    "Combobox.Empty",
    "Combobox.Group",
    "Combobox.GroupLabel",
  ],
  props: {
    value: { type: "string", description: "The controlled selected value" },
    defaultValue: { type: "string", description: "Default selected value for uncontrolled usage" },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable combobox interactions",
    },
    autoHighlight: {
      type: "boolean",
      default: true,
      description: "Whether the first matching item is highlighted automatically",
    },
  },
  slots: {
    children: {
      description: "Combobox.Input and Combobox.Portal wrapping Combobox.Popup with Combobox.Item children",
    },
  },
  tokenBindings: {
    input: { text: "main", background: "page", border: "line", placeholder: "mute" },
    popup: { background: "card", border: "line", shadow: "raised" },
    item: {
      text: "main",
      backgroundHighlighted: "accent",
      textHighlighted: "accent-inv",
      backgroundSelected: "accent",
      textSelected: "accent-inv",
    },
    empty: { text: "mute" },
    groupLabel: { text: "mute" },
  },
  examples: [
    {
      name: "Basic combobox",
      code: '<Combobox.Root>\n  <Combobox.Input placeholder="Search frameworks..." />\n  <Combobox.Portal>\n    <Combobox.Popup>\n      <Combobox.Item value="react">React</Combobox.Item>\n      <Combobox.Item value="vue">Vue</Combobox.Item>\n      <Combobox.Empty>No results found</Combobox.Empty>\n    </Combobox.Popup>\n  </Combobox.Portal>\n</Combobox.Root>',
    },
  ],
  registry: {
    category: "form",
    tags: ["combobox", "autocomplete", "search", "select"],
    renderMode: "custom",
    states: [
      { name: "focus", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/Combobox",
    propSchema: {},
    slashMenu: {
      title: "Combobox",
      subtext: "Searchable select / autocomplete input. Combines a...",
      aliases: ["combobox","combobox","autocomplete","search"],
      icon: "search",
    },
  },

});
