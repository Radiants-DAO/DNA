import AccordionSchema from "../components/core/Accordion/Accordion.schema.json";
import AccordionDna from "../components/core/Accordion/Accordion.dna.json";
import AlertSchema from "../components/core/Alert/Alert.schema.json";
import AlertDna from "../components/core/Alert/Alert.dna.json";
import BadgeSchema from "../components/core/Badge/Badge.schema.json";
import BadgeDna from "../components/core/Badge/Badge.dna.json";
import BreadcrumbsSchema from "../components/core/Breadcrumbs/Breadcrumbs.schema.json";
import BreadcrumbsDna from "../components/core/Breadcrumbs/Breadcrumbs.dna.json";
import ButtonSchema from "../components/core/Button/Button.schema.json";
import ButtonDna from "../components/core/Button/Button.dna.json";
import CardSchema from "../components/core/Card/Card.schema.json";
import CardDna from "../components/core/Card/Card.dna.json";
import CheckboxSchema from "../components/core/Checkbox/Checkbox.schema.json";
import CheckboxDna from "../components/core/Checkbox/Checkbox.dna.json";
import RadioSchema from "../components/core/Checkbox/Radio.schema.json";
import RadioDna from "../components/core/Checkbox/Radio.dna.json";
import ContextMenuSchema from "../components/core/ContextMenu/ContextMenu.schema.json";
import ContextMenuDna from "../components/core/ContextMenu/ContextMenu.dna.json";
import CountdownTimerSchema from "../components/core/CountdownTimer/CountdownTimer.schema.json";
import CountdownTimerDna from "../components/core/CountdownTimer/CountdownTimer.dna.json";
import DialogSchema from "../components/core/Dialog/Dialog.schema.json";
import DialogDna from "../components/core/Dialog/Dialog.dna.json";
import DividerSchema from "../components/core/Divider/Divider.schema.json";
import DividerDna from "../components/core/Divider/Divider.dna.json";
import DropdownMenuSchema from "../components/core/DropdownMenu/DropdownMenu.schema.json";
import DropdownMenuDna from "../components/core/DropdownMenu/DropdownMenu.dna.json";
import HelpPanelSchema from "../components/core/HelpPanel/HelpPanel.schema.json";
import HelpPanelDna from "../components/core/HelpPanel/HelpPanel.dna.json";
import InputSchema from "../components/core/Input/Input.schema.json";
import InputDna from "../components/core/Input/Input.dna.json";
import LabelSchema from "../components/core/Input/Label.schema.json";
import LabelDna from "../components/core/Input/Label.dna.json";
import TextAreaSchema from "../components/core/Input/TextArea.schema.json";
import TextAreaDna from "../components/core/Input/TextArea.dna.json";
import MockStatesPopoverSchema from "../components/core/MockStatesPopover/MockStatesPopover.schema.json";
import MockStatesPopoverDna from "../components/core/MockStatesPopover/MockStatesPopover.dna.json";
import PopoverSchema from "../components/core/Popover/Popover.schema.json";
import PopoverDna from "../components/core/Popover/Popover.dna.json";
import ProgressSchema from "../components/core/Progress/Progress.schema.json";
import ProgressDna from "../components/core/Progress/Progress.dna.json";
import SpinnerSchema from "../components/core/Progress/Spinner.schema.json";
import SpinnerDna from "../components/core/Progress/Spinner.dna.json";
import SelectSchema from "../components/core/Select/Select.schema.json";
import SelectDna from "../components/core/Select/Select.dna.json";
import SheetSchema from "../components/core/Sheet/Sheet.schema.json";
import SheetDna from "../components/core/Sheet/Sheet.dna.json";
import SliderSchema from "../components/core/Slider/Slider.schema.json";
import SliderDna from "../components/core/Slider/Slider.dna.json";
import SwitchSchema from "../components/core/Switch/Switch.schema.json";
import SwitchDna from "../components/core/Switch/Switch.dna.json";
import TabsSchema from "../components/core/Tabs/Tabs.schema.json";
import TabsDna from "../components/core/Tabs/Tabs.dna.json";
import ToastSchema from "../components/core/Toast/Toast.schema.json";
import ToastDna from "../components/core/Toast/Toast.dna.json";
import TooltipSchema from "../components/core/Tooltip/Tooltip.schema.json";
import TooltipDna from "../components/core/Tooltip/Tooltip.dna.json";
import Web3ActionBarSchema from "../components/core/Web3ActionBar/Web3ActionBar.schema.json";
import Web3ActionBarDna from "../components/core/Web3ActionBar/Web3ActionBar.dna.json";

export const componentData = {
  Accordion: { schema: AccordionSchema, dna: AccordionDna },
  Alert: { schema: AlertSchema, dna: AlertDna },
  Badge: { schema: BadgeSchema, dna: BadgeDna },
  Breadcrumbs: { schema: BreadcrumbsSchema, dna: BreadcrumbsDna },
  Button: { schema: ButtonSchema, dna: ButtonDna },
  Card: { schema: CardSchema, dna: CardDna },
  Checkbox: { schema: CheckboxSchema, dna: CheckboxDna },
  ContextMenu: { schema: ContextMenuSchema, dna: ContextMenuDna },
  CountdownTimer: { schema: CountdownTimerSchema, dna: CountdownTimerDna },
  Dialog: { schema: DialogSchema, dna: DialogDna },
  Divider: { schema: DividerSchema, dna: DividerDna },
  DropdownMenu: { schema: DropdownMenuSchema, dna: DropdownMenuDna },
  HelpPanel: { schema: HelpPanelSchema, dna: HelpPanelDna },
  Input: { schema: InputSchema, dna: InputDna },
  Label: { schema: LabelSchema, dna: LabelDna },
  MockStatesPopover: { schema: MockStatesPopoverSchema, dna: MockStatesPopoverDna },
  Popover: { schema: PopoverSchema, dna: PopoverDna },
  Progress: { schema: ProgressSchema, dna: ProgressDna },
  Radio: { schema: RadioSchema, dna: RadioDna },
  Select: { schema: SelectSchema, dna: SelectDna },
  Sheet: { schema: SheetSchema, dna: SheetDna },
  Slider: { schema: SliderSchema, dna: SliderDna },
  Spinner: { schema: SpinnerSchema, dna: SpinnerDna },
  Switch: { schema: SwitchSchema, dna: SwitchDna },
  Tabs: { schema: TabsSchema, dna: TabsDna },
  TextArea: { schema: TextAreaSchema, dna: TextAreaDna },
  Toast: { schema: ToastSchema, dna: ToastDna },
  Tooltip: { schema: TooltipSchema, dna: TooltipDna },
  Web3ActionBar: { schema: Web3ActionBarSchema, dna: Web3ActionBarDna },
} as const;

export type ComponentName = keyof typeof componentData;
export type ComponentData = (typeof componentData)[ComponentName];

export const componentNames = Object.keys(componentData) as ComponentName[];

export const schemas = Object.fromEntries(
  componentNames.map((name) => [name, componentData[name].schema])
) as Record<ComponentName, ComponentData["schema"]>;

export const dna = Object.fromEntries(
  componentNames.map((name) => [name, componentData[name].dna])
) as Record<ComponentName, ComponentData["dna"]>;

export function getComponentData(name: string): ComponentData | null {
  if (!Object.prototype.hasOwnProperty.call(componentData, name)) {
    return null;
  }

  return componentData[name as ComponentName];
}
