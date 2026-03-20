/**
 * Path-only data for each registered component.
 *
 * Migration glue — will be deleted once all components are migrated to
 * co-located *.meta.ts files (Task 9). Canonical meta files carry their
 * own paths via the generated meta/index.ts barrel.
 */
interface ComponentPaths {
  sourcePath: string;
  schemaPath: string;
}

export const componentPaths: Record<string, ComponentPaths> = {
  Alert: {
    sourcePath: 'packages/radiants/components/core/Alert/Alert.tsx',
    schemaPath: 'packages/radiants/components/core/Alert/Alert.schema.json',
  },
  AlertDialog: {
    sourcePath: 'packages/radiants/components/core/AlertDialog/AlertDialog.tsx',
    schemaPath: 'packages/radiants/components/core/AlertDialog/AlertDialog.schema.json',
  },
  Avatar: {
    sourcePath: 'packages/radiants/components/core/Avatar/Avatar.tsx',
    schemaPath: 'packages/radiants/components/core/Avatar/Avatar.schema.json',
  },
  Badge: {
    sourcePath: 'packages/radiants/components/core/Badge/Badge.tsx',
    schemaPath: 'packages/radiants/components/core/Badge/Badge.schema.json',
  },
  Breadcrumbs: {
    sourcePath: 'packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx',
    schemaPath: 'packages/radiants/components/core/Breadcrumbs/Breadcrumbs.schema.json',
  },
  Button: {
    sourcePath: 'packages/radiants/components/core/Button/Button.tsx',
    schemaPath: 'packages/radiants/components/core/Button/Button.schema.json',
  },
  Card: {
    sourcePath: 'packages/radiants/components/core/Card/Card.tsx',
    schemaPath: 'packages/radiants/components/core/Card/Card.schema.json',
  },
  Checkbox: {
    sourcePath: 'packages/radiants/components/core/Checkbox/Checkbox.tsx',
    schemaPath: 'packages/radiants/components/core/Checkbox/Checkbox.schema.json',
  },
  Collapsible: {
    sourcePath: 'packages/radiants/components/core/Collapsible/Collapsible.tsx',
    schemaPath: 'packages/radiants/components/core/Collapsible/Collapsible.schema.json',
  },
  Combobox: {
    sourcePath: 'packages/radiants/components/core/Combobox/Combobox.tsx',
    schemaPath: 'packages/radiants/components/core/Combobox/Combobox.schema.json',
  },
  ContextMenu: {
    sourcePath: 'packages/radiants/components/core/ContextMenu/ContextMenu.tsx',
    schemaPath: 'packages/radiants/components/core/ContextMenu/ContextMenu.schema.json',
  },
  CountdownTimer: {
    sourcePath: 'packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx',
    schemaPath: 'packages/radiants/components/core/CountdownTimer/CountdownTimer.schema.json',
  },
  Dialog: {
    sourcePath: 'packages/radiants/components/core/Dialog/Dialog.tsx',
    schemaPath: 'packages/radiants/components/core/Dialog/Dialog.schema.json',
  },
  Divider: {
    sourcePath: 'packages/radiants/components/core/Divider/Divider.tsx',
    schemaPath: 'packages/radiants/components/core/Divider/Divider.schema.json',
  },
  Drawer: {
    sourcePath: 'packages/radiants/components/core/Drawer/Drawer.tsx',
    schemaPath: 'packages/radiants/components/core/Drawer/Drawer.schema.json',
  },
  DropdownMenu: {
    sourcePath: 'packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx',
    schemaPath: 'packages/radiants/components/core/DropdownMenu/DropdownMenu.schema.json',
  },
  Field: {
    sourcePath: 'packages/radiants/components/core/Field/Field.tsx',
    schemaPath: 'packages/radiants/components/core/Field/Field.schema.json',
  },
  Fieldset: {
    sourcePath: 'packages/radiants/components/core/Fieldset/Fieldset.tsx',
    schemaPath: 'packages/radiants/components/core/Fieldset/Fieldset.schema.json',
  },
  HelpPanel: {
    sourcePath: 'packages/radiants/components/core/HelpPanel/HelpPanel.tsx',
    schemaPath: 'packages/radiants/components/core/HelpPanel/HelpPanel.schema.json',
  },
  Input: {
    sourcePath: 'packages/radiants/components/core/Input/Input.tsx',
    schemaPath: 'packages/radiants/components/core/Input/Input.schema.json',
  },
  Label: {
    sourcePath: 'packages/radiants/components/core/Input/Input.tsx',
    schemaPath: 'packages/radiants/components/core/Input/Label.schema.json',
  },
  Menubar: {
    sourcePath: 'packages/radiants/components/core/Menubar/Menubar.tsx',
    schemaPath: 'packages/radiants/components/core/Menubar/Menubar.schema.json',
  },
  Meter: {
    sourcePath: 'packages/radiants/components/core/Meter/Meter.tsx',
    schemaPath: 'packages/radiants/components/core/Meter/Meter.schema.json',
  },
  MockStatesPopover: {
    sourcePath: 'packages/radiants/components/core/MockStatesPopover/MockStatesPopover.tsx',
    schemaPath: 'packages/radiants/components/core/MockStatesPopover/MockStatesPopover.schema.json',
  },
  NavigationMenu: {
    sourcePath: 'packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx',
    schemaPath: 'packages/radiants/components/core/NavigationMenu/NavigationMenu.schema.json',
  },
  NumberField: {
    sourcePath: 'packages/radiants/components/core/NumberField/NumberField.tsx',
    schemaPath: 'packages/radiants/components/core/NumberField/NumberField.schema.json',
  },
  Pattern: {
    sourcePath: 'packages/radiants/components/core/Pattern/Pattern.tsx',
    schemaPath: 'packages/radiants/components/core/Pattern/Pattern.schema.json',
  },
  Popover: {
    sourcePath: 'packages/radiants/components/core/Popover/Popover.tsx',
    schemaPath: 'packages/radiants/components/core/Popover/Popover.schema.json',
  },
  PreviewCard: {
    sourcePath: 'packages/radiants/components/core/PreviewCard/PreviewCard.tsx',
    schemaPath: 'packages/radiants/components/core/PreviewCard/PreviewCard.schema.json',
  },
  Radio: {
    sourcePath: 'packages/radiants/components/core/Checkbox/Checkbox.tsx',
    schemaPath: 'packages/radiants/components/core/Checkbox/Radio.schema.json',
  },
  ScrollArea: {
    sourcePath: 'packages/radiants/components/core/ScrollArea/ScrollArea.tsx',
    schemaPath: 'packages/radiants/components/core/ScrollArea/ScrollArea.schema.json',
  },
  Select: {
    sourcePath: 'packages/radiants/components/core/Select/Select.tsx',
    schemaPath: 'packages/radiants/components/core/Select/Select.schema.json',
  },
  Separator: {
    sourcePath: 'packages/radiants/components/core/Separator/Separator.tsx',
    schemaPath: 'packages/radiants/components/core/Separator/Separator.schema.json',
  },
  Sheet: {
    sourcePath: 'packages/radiants/components/core/Sheet/Sheet.tsx',
    schemaPath: 'packages/radiants/components/core/Sheet/Sheet.schema.json',
  },
  Slider: {
    sourcePath: 'packages/radiants/components/core/Slider/Slider.tsx',
    schemaPath: 'packages/radiants/components/core/Slider/Slider.schema.json',
  },
  Spinner: {
    sourcePath: 'packages/radiants/components/core/Spinner/Spinner.tsx',
    schemaPath: 'packages/radiants/components/core/Spinner/Spinner.schema.json',
  },
  Switch: {
    sourcePath: 'packages/radiants/components/core/Switch/Switch.tsx',
    schemaPath: 'packages/radiants/components/core/Switch/Switch.schema.json',
  },
  Tabs: {
    sourcePath: 'packages/radiants/components/core/Tabs/Tabs.tsx',
    schemaPath: 'packages/radiants/components/core/Tabs/Tabs.schema.json',
  },
  TextArea: {
    sourcePath: 'packages/radiants/components/core/Input/Input.tsx',
    schemaPath: 'packages/radiants/components/core/Input/TextArea.schema.json',
  },
  Toggle: {
    sourcePath: 'packages/radiants/components/core/Toggle/Toggle.tsx',
    schemaPath: 'packages/radiants/components/core/Toggle/Toggle.schema.json',
  },
  ToggleGroup: {
    sourcePath: 'packages/radiants/components/core/ToggleGroup/ToggleGroup.tsx',
    schemaPath: 'packages/radiants/components/core/ToggleGroup/ToggleGroup.schema.json',
  },
  Toolbar: {
    sourcePath: 'packages/radiants/components/core/Toolbar/Toolbar.tsx',
    schemaPath: 'packages/radiants/components/core/Toolbar/Toolbar.schema.json',
  },
  Toast: {
    sourcePath: 'packages/radiants/components/core/Toast/Toast.tsx',
    schemaPath: 'packages/radiants/components/core/Toast/Toast.schema.json',
  },
  Tooltip: {
    sourcePath: 'packages/radiants/components/core/Tooltip/Tooltip.tsx',
    schemaPath: 'packages/radiants/components/core/Tooltip/Tooltip.schema.json',
  },
  Web3ActionBar: {
    sourcePath: 'packages/radiants/components/core/Web3ActionBar/Web3ActionBar.tsx',
    schemaPath: 'packages/radiants/components/core/Web3ActionBar/Web3ActionBar.schema.json',
  },
};
