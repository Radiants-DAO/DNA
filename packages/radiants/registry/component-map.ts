import {
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Collapsible,
  Combobox,
  ContextMenu,
  CountdownTimer,
  Dialog,
  Divider,
  Drawer,
  DropdownMenu,
  Field,
  Fieldset,
  HelpPanel,
  Input,
  Label,
  Menubar,
  Meter,
  MockStatesPopover,
  NavigationMenu,
  NumberField,
  Popover,
  PreviewCard,
  Radio,
  ScrollArea,
  Select,
  Separator,
  Sheet,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  Toggle,
  ToggleGroup,
  Toolbar,
  ToastProvider,
  Tooltip,
  Web3ActionBar,
} from '../components/core';
import type { ComponentType } from 'react';

interface ComponentMapEntry {
  /** The primary export — may be a plain component or a namespace object */
  component: ComponentType<any> | Record<string, unknown>;
  sourcePath: string;
  schemaPath: string;
}

export const componentMap: Record<string, ComponentMapEntry> = {
  Alert: {
    component: Alert as any,
    sourcePath: 'packages/radiants/components/core/Alert/Alert.tsx',
    schemaPath: 'packages/radiants/components/core/Alert/Alert.schema.json',
  },
  AlertDialog: {
    component: AlertDialog as any,
    sourcePath: 'packages/radiants/components/core/AlertDialog/AlertDialog.tsx',
    schemaPath: 'packages/radiants/components/core/AlertDialog/AlertDialog.schema.json',
  },
  Avatar: {
    component: Avatar as any,
    sourcePath: 'packages/radiants/components/core/Avatar/Avatar.tsx',
    schemaPath: 'packages/radiants/components/core/Avatar/Avatar.schema.json',
  },
  Badge: {
    component: Badge,
    sourcePath: 'packages/radiants/components/core/Badge/Badge.tsx',
    schemaPath: 'packages/radiants/components/core/Badge/Badge.schema.json',
  },
  Breadcrumbs: {
    component: Breadcrumbs,
    sourcePath: 'packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx',
    schemaPath: 'packages/radiants/components/core/Breadcrumbs/Breadcrumbs.schema.json',
  },
  Button: {
    component: Button,
    sourcePath: 'packages/radiants/components/core/Button/Button.tsx',
    schemaPath: 'packages/radiants/components/core/Button/Button.schema.json',
  },
  Card: {
    component: Card,
    sourcePath: 'packages/radiants/components/core/Card/Card.tsx',
    schemaPath: 'packages/radiants/components/core/Card/Card.schema.json',
  },
  Checkbox: {
    component: Checkbox,
    sourcePath: 'packages/radiants/components/core/Checkbox/Checkbox.tsx',
    schemaPath: 'packages/radiants/components/core/Checkbox/Checkbox.schema.json',
  },
  Collapsible: {
    component: Collapsible as any,
    sourcePath: 'packages/radiants/components/core/Collapsible/Collapsible.tsx',
    schemaPath: 'packages/radiants/components/core/Collapsible/Collapsible.schema.json',
  },
  Combobox: {
    component: Combobox as any,
    sourcePath: 'packages/radiants/components/core/Combobox/Combobox.tsx',
    schemaPath: 'packages/radiants/components/core/Combobox/Combobox.schema.json',
  },
  ContextMenu: {
    component: ContextMenu as any,
    sourcePath: 'packages/radiants/components/core/ContextMenu/ContextMenu.tsx',
    schemaPath: 'packages/radiants/components/core/ContextMenu/ContextMenu.schema.json',
  },
  CountdownTimer: {
    component: CountdownTimer,
    sourcePath: 'packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx',
    schemaPath: 'packages/radiants/components/core/CountdownTimer/CountdownTimer.schema.json',
  },
  Dialog: {
    component: Dialog as any,
    sourcePath: 'packages/radiants/components/core/Dialog/Dialog.tsx',
    schemaPath: 'packages/radiants/components/core/Dialog/Dialog.schema.json',
  },
  Divider: {
    component: Divider,
    sourcePath: 'packages/radiants/components/core/Divider/Divider.tsx',
    schemaPath: 'packages/radiants/components/core/Divider/Divider.schema.json',
  },
  Drawer: {
    component: Drawer as any,
    sourcePath: 'packages/radiants/components/core/Drawer/Drawer.tsx',
    schemaPath: 'packages/radiants/components/core/Drawer/Drawer.schema.json',
  },
  DropdownMenu: {
    component: DropdownMenu as any,
    sourcePath: 'packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx',
    schemaPath: 'packages/radiants/components/core/DropdownMenu/DropdownMenu.schema.json',
  },
  Field: {
    component: Field as any,
    sourcePath: 'packages/radiants/components/core/Field/Field.tsx',
    schemaPath: 'packages/radiants/components/core/Field/Field.schema.json',
  },
  Fieldset: {
    component: Fieldset as any,
    sourcePath: 'packages/radiants/components/core/Fieldset/Fieldset.tsx',
    schemaPath: 'packages/radiants/components/core/Fieldset/Fieldset.schema.json',
  },
  HelpPanel: {
    component: HelpPanel as any,
    sourcePath: 'packages/radiants/components/core/HelpPanel/HelpPanel.tsx',
    schemaPath: 'packages/radiants/components/core/HelpPanel/HelpPanel.schema.json',
  },
  Input: {
    component: Input,
    sourcePath: 'packages/radiants/components/core/Input/Input.tsx',
    schemaPath: 'packages/radiants/components/core/Input/Input.schema.json',
  },
  Label: {
    component: Label,
    sourcePath: 'packages/radiants/components/core/Input/Input.tsx',
    schemaPath: 'packages/radiants/components/core/Input/Label.schema.json',
  },
  Menubar: {
    component: Menubar as any,
    sourcePath: 'packages/radiants/components/core/Menubar/Menubar.tsx',
    schemaPath: 'packages/radiants/components/core/Menubar/Menubar.schema.json',
  },
  Meter: {
    component: Meter as any,
    sourcePath: 'packages/radiants/components/core/Meter/Meter.tsx',
    schemaPath: 'packages/radiants/components/core/Meter/Meter.schema.json',
  },
  MockStatesPopover: {
    component: MockStatesPopover,
    sourcePath: 'packages/radiants/components/core/MockStatesPopover/MockStatesPopover.tsx',
    schemaPath: 'packages/radiants/components/core/MockStatesPopover/MockStatesPopover.schema.json',
  },
  NavigationMenu: {
    component: NavigationMenu as any,
    sourcePath: 'packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx',
    schemaPath: 'packages/radiants/components/core/NavigationMenu/NavigationMenu.schema.json',
  },
  NumberField: {
    component: NumberField as any,
    sourcePath: 'packages/radiants/components/core/NumberField/NumberField.tsx',
    schemaPath: 'packages/radiants/components/core/NumberField/NumberField.schema.json',
  },
  Popover: {
    component: Popover as any,
    sourcePath: 'packages/radiants/components/core/Popover/Popover.tsx',
    schemaPath: 'packages/radiants/components/core/Popover/Popover.schema.json',
  },
  PreviewCard: {
    component: PreviewCard as any,
    sourcePath: 'packages/radiants/components/core/PreviewCard/PreviewCard.tsx',
    schemaPath: 'packages/radiants/components/core/PreviewCard/PreviewCard.schema.json',
  },
  Radio: {
    component: Radio,
    sourcePath: 'packages/radiants/components/core/Checkbox/Checkbox.tsx',
    schemaPath: 'packages/radiants/components/core/Checkbox/Radio.schema.json',
  },
  ScrollArea: {
    component: ScrollArea as any,
    sourcePath: 'packages/radiants/components/core/ScrollArea/ScrollArea.tsx',
    schemaPath: 'packages/radiants/components/core/ScrollArea/ScrollArea.schema.json',
  },
  Select: {
    component: Select as any,
    sourcePath: 'packages/radiants/components/core/Select/Select.tsx',
    schemaPath: 'packages/radiants/components/core/Select/Select.schema.json',
  },
  Separator: {
    component: Separator,
    sourcePath: 'packages/radiants/components/core/Separator/Separator.tsx',
    schemaPath: 'packages/radiants/components/core/Separator/Separator.schema.json',
  },
  Sheet: {
    component: Sheet as any,
    sourcePath: 'packages/radiants/components/core/Sheet/Sheet.tsx',
    schemaPath: 'packages/radiants/components/core/Sheet/Sheet.schema.json',
  },
  Slider: {
    component: Slider,
    sourcePath: 'packages/radiants/components/core/Slider/Slider.tsx',
    schemaPath: 'packages/radiants/components/core/Slider/Slider.schema.json',
  },
  Spinner: {
    component: Spinner,
    sourcePath: 'packages/radiants/components/core/Spinner/Spinner.tsx',
    schemaPath: 'packages/radiants/components/core/Spinner/Spinner.schema.json',
  },
  Switch: {
    component: Switch,
    sourcePath: 'packages/radiants/components/core/Switch/Switch.tsx',
    schemaPath: 'packages/radiants/components/core/Switch/Switch.schema.json',
  },
  Tabs: {
    component: Tabs as any,
    sourcePath: 'packages/radiants/components/core/Tabs/Tabs.tsx',
    schemaPath: 'packages/radiants/components/core/Tabs/Tabs.schema.json',
  },
  TextArea: {
    component: TextArea,
    sourcePath: 'packages/radiants/components/core/Input/Input.tsx',
    schemaPath: 'packages/radiants/components/core/Input/TextArea.schema.json',
  },
  Toggle: {
    component: Toggle,
    sourcePath: 'packages/radiants/components/core/Toggle/Toggle.tsx',
    schemaPath: 'packages/radiants/components/core/Toggle/Toggle.schema.json',
  },
  ToggleGroup: {
    component: ToggleGroup as any,
    sourcePath: 'packages/radiants/components/core/ToggleGroup/ToggleGroup.tsx',
    schemaPath: 'packages/radiants/components/core/ToggleGroup/ToggleGroup.schema.json',
  },
  Toolbar: {
    component: Toolbar as any,
    sourcePath: 'packages/radiants/components/core/Toolbar/Toolbar.tsx',
    schemaPath: 'packages/radiants/components/core/Toolbar/Toolbar.schema.json',
  },
  Toast: {
    component: ToastProvider,
    sourcePath: 'packages/radiants/components/core/Toast/Toast.tsx',
    schemaPath: 'packages/radiants/components/core/Toast/Toast.schema.json',
  },
  Tooltip: {
    component: Tooltip,
    sourcePath: 'packages/radiants/components/core/Tooltip/Tooltip.tsx',
    schemaPath: 'packages/radiants/components/core/Tooltip/Tooltip.schema.json',
  },
  Web3ActionBar: {
    component: Web3ActionBar,
    sourcePath: 'packages/radiants/components/core/Web3ActionBar/Web3ActionBar.tsx',
    schemaPath: 'packages/radiants/components/core/Web3ActionBar/Web3ActionBar.schema.json',
  },
};
