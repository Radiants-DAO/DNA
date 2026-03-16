import type { ForcedState } from "./types";

/**
 * Per-component state sets.
 *
 * Components only show states they visually respond to.
 * Components with a single state ("default") hide the strip entirely.
 */

type StateSet = ForcedState[];

const BUTTON_STATES: StateSet = ["default", "hover", "active", "focus", "disabled"];
const FORM_INPUT_STATES: StateSet = ["default", "focus", "error", "disabled"];
const TOGGLE_STATES: StateSet = ["default", "focus", "disabled"];
const NAV_STATES: StateSet = ["default", "hover", "focus", "disabled"];
const STATIC_STATES: StateSet = ["default"];

const COMPONENT_STATES: Record<string, StateSet> = {
  // Actions
  Button: BUTTON_STATES,
  Toggle: BUTTON_STATES,
  ToggleGroup: BUTTON_STATES,
  ContextMenu: NAV_STATES,
  DropdownMenu: NAV_STATES,
  Toolbar: BUTTON_STATES,

  // Forms — inputs
  Input: FORM_INPUT_STATES,
  TextArea: FORM_INPUT_STATES,
  Select: FORM_INPUT_STATES,
  Combobox: FORM_INPUT_STATES,
  NumberField: FORM_INPUT_STATES,
  Field: FORM_INPUT_STATES,

  // Forms — toggles
  Checkbox: TOGGLE_STATES,
  Radio: TOGGLE_STATES,
  RadioGroup: TOGGLE_STATES,
  Switch: TOGGLE_STATES,
  Slider: TOGGLE_STATES,

  // Forms — static
  Fieldset: STATIC_STATES,
  Label: STATIC_STATES,

  // Navigation
  Tabs: NAV_STATES,
  Breadcrumbs: NAV_STATES,
  Menubar: NAV_STATES,
  NavigationMenu: NAV_STATES,

  // Overlays
  Dialog: ["default", "focus", "disabled"],
  AlertDialog: ["default", "focus", "disabled"],
  Sheet: STATIC_STATES,
  Drawer: STATIC_STATES,
  Popover: STATIC_STATES,
  PreviewCard: STATIC_STATES,
  HelpPanel: STATIC_STATES,

  // Feedback
  Alert: STATIC_STATES,
  Badge: STATIC_STATES,
  Toast: STATIC_STATES,
  Spinner: STATIC_STATES,
  Meter: STATIC_STATES,
  Tooltip: STATIC_STATES,

  // Layout
  Card: STATIC_STATES,
  Divider: STATIC_STATES,
  Separator: STATIC_STATES,
  Collapsible: STATIC_STATES,
  ScrollArea: STATIC_STATES,

  // Data display
  CountdownTimer: STATIC_STATES,
  Web3ActionBar: STATIC_STATES,
  Avatar: STATIC_STATES,
};

const FALLBACK_STATES: StateSet = ["default", "focus", "disabled"];

/** Get the available forced states for a component by name. */
export function getStatesForComponent(componentName: string): StateSet {
  return COMPONENT_STATES[componentName] ?? FALLBACK_STATES;
}

/** Short labels for the vertical strip. */
export const STATE_LABELS: Record<ForcedState, string> = {
  default: "def",
  hover: "ho",
  active: "ac",
  focus: "fo",
  disabled: "di",
  error: "er",
};
