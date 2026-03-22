// AUTO-GENERATED — do not edit by hand
// Run: pnpm --filter @rdna/radiants generate:schemas

import AlertSchema from "../components/core/Alert/Alert.schema.json";
import AlertDialogSchema from "../components/core/AlertDialog/AlertDialog.schema.json";
import AvatarSchema from "../components/core/Avatar/Avatar.schema.json";
import BadgeSchema from "../components/core/Badge/Badge.schema.json";
import BreadcrumbsSchema from "../components/core/Breadcrumbs/Breadcrumbs.schema.json";
import ButtonSchema from "../components/core/Button/Button.schema.json";
import CardSchema from "../components/core/Card/Card.schema.json";
import CheckboxSchema from "../components/core/Checkbox/Checkbox.schema.json";
import RadioSchema from "../components/core/Checkbox/Radio.schema.json";
import CollapsibleSchema from "../components/core/Collapsible/Collapsible.schema.json";
import ComboboxSchema from "../components/core/Combobox/Combobox.schema.json";
import ContextMenuSchema from "../components/core/ContextMenu/ContextMenu.schema.json";
import CountdownTimerSchema from "../components/core/CountdownTimer/CountdownTimer.schema.json";
import DialogSchema from "../components/core/Dialog/Dialog.schema.json";
import DrawerSchema from "../components/core/Drawer/Drawer.schema.json";
import DropdownMenuSchema from "../components/core/DropdownMenu/DropdownMenu.schema.json";
import FieldSchema from "../components/core/Field/Field.schema.json";
import FieldsetSchema from "../components/core/Fieldset/Fieldset.schema.json";
import InputSchema from "../components/core/Input/Input.schema.json";
import LabelSchema from "../components/core/Input/Label.schema.json";
import TextAreaSchema from "../components/core/Input/TextArea.schema.json";
import MenubarSchema from "../components/core/Menubar/Menubar.schema.json";
import MeterSchema from "../components/core/Meter/Meter.schema.json";
import NavigationMenuSchema from "../components/core/NavigationMenu/NavigationMenu.schema.json";
import NumberFieldSchema from "../components/core/NumberField/NumberField.schema.json";
import PatternSchema from "../components/core/Pattern/Pattern.schema.json";
import PopoverSchema from "../components/core/Popover/Popover.schema.json";
import PreviewCardSchema from "../components/core/PreviewCard/PreviewCard.schema.json";
import ScrollAreaSchema from "../components/core/ScrollArea/ScrollArea.schema.json";
import SelectSchema from "../components/core/Select/Select.schema.json";
import SeparatorSchema from "../components/core/Separator/Separator.schema.json";
import SheetSchema from "../components/core/Sheet/Sheet.schema.json";
import SliderSchema from "../components/core/Slider/Slider.schema.json";
import SpinnerSchema from "../components/core/Spinner/Spinner.schema.json";
import SwitchSchema from "../components/core/Switch/Switch.schema.json";
import TabsSchema from "../components/core/Tabs/Tabs.schema.json";
import ToastSchema from "../components/core/Toast/Toast.schema.json";
import ToggleSchema from "../components/core/Toggle/Toggle.schema.json";
import ToggleGroupSchema from "../components/core/ToggleGroup/ToggleGroup.schema.json";
import ToolbarSchema from "../components/core/Toolbar/Toolbar.schema.json";
import TooltipSchema from "../components/core/Tooltip/Tooltip.schema.json";
import Web3ActionBarSchema from "../components/core/Web3ActionBar/Web3ActionBar.schema.json";

export const componentData = {
  Alert: { schema: AlertSchema },
  AlertDialog: { schema: AlertDialogSchema },
  Avatar: { schema: AvatarSchema },
  Badge: { schema: BadgeSchema },
  Breadcrumbs: { schema: BreadcrumbsSchema },
  Button: { schema: ButtonSchema },
  Card: { schema: CardSchema },
  Checkbox: { schema: CheckboxSchema },
  Radio: { schema: RadioSchema },
  Collapsible: { schema: CollapsibleSchema },
  Combobox: { schema: ComboboxSchema },
  ContextMenu: { schema: ContextMenuSchema },
  CountdownTimer: { schema: CountdownTimerSchema },
  Dialog: { schema: DialogSchema },
  Drawer: { schema: DrawerSchema },
  DropdownMenu: { schema: DropdownMenuSchema },
  Field: { schema: FieldSchema },
  Fieldset: { schema: FieldsetSchema },
  Input: { schema: InputSchema },
  Label: { schema: LabelSchema },
  TextArea: { schema: TextAreaSchema },
  Menubar: { schema: MenubarSchema },
  Meter: { schema: MeterSchema },
  NavigationMenu: { schema: NavigationMenuSchema },
  NumberField: { schema: NumberFieldSchema },
  Pattern: { schema: PatternSchema },
  Popover: { schema: PopoverSchema },
  PreviewCard: { schema: PreviewCardSchema },
  ScrollArea: { schema: ScrollAreaSchema },
  Select: { schema: SelectSchema },
  Separator: { schema: SeparatorSchema },
  Sheet: { schema: SheetSchema },
  Slider: { schema: SliderSchema },
  Spinner: { schema: SpinnerSchema },
  Switch: { schema: SwitchSchema },
  Tabs: { schema: TabsSchema },
  Toast: { schema: ToastSchema },
  Toggle: { schema: ToggleSchema },
  ToggleGroup: { schema: ToggleGroupSchema },
  Toolbar: { schema: ToolbarSchema },
  Tooltip: { schema: TooltipSchema },
  Web3ActionBar: { schema: Web3ActionBarSchema },
} as const;

export type ComponentName = keyof typeof componentData;
export type ComponentData = (typeof componentData)[ComponentName];
