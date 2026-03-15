import { render, screen } from '@testing-library/react';
import {
  Button,
  Select,
  Dialog,
  Toggle,
  Checkbox,
  Radio,
  Tabs,
  useTabsState,
  ToastProvider,
  useToast,
  Tooltip,
  Switch,
  Slider,
  DropdownMenu,
  ContextMenu,
  Popover,
  HelpPanel,
  Alert,
  Badge,
  Spinner,
  NumberField,
  Combobox,
} from '../index';

test('core exports render', () => {
  render(<Button>Test</Button>);
  expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  expect(Select).toBeTruthy();
  expect(Dialog).toBeTruthy();
});

test('selection cluster exports are defined', () => {
  expect(Toggle).toBeTruthy();
  expect(Checkbox).toBeTruthy();
  expect(Radio).toBeTruthy();
  expect(Switch).toBeTruthy();
});

test('navigation cluster exports are defined', () => {
  expect(Tabs).toBeTruthy();
  expect(useTabsState).toBeTruthy();
});

test('form cluster exports are defined', () => {
  expect(Slider).toBeTruthy();
  expect(NumberField).toBeTruthy();
  expect(Combobox).toBeTruthy();
});

test('overlay cluster exports are defined', () => {
  expect(Tooltip).toBeTruthy();
  expect(Popover).toBeTruthy();
  expect(HelpPanel).toBeTruthy();
});

test('feedback cluster exports are defined', () => {
  expect(ToastProvider).toBeTruthy();
  expect(useToast).toBeTruthy();
  expect(Alert).toBeTruthy();
  expect(Badge).toBeTruthy();
  expect(Spinner).toBeTruthy();
});

test('menu cluster exports are defined', () => {
  expect(DropdownMenu).toBeTruthy();
  expect(ContextMenu).toBeTruthy();
});

// Exports added by later tasks — updated here when each task lands:
// Task 2: RadioGroup
// Task 3: Tabs.Indicator
// Task 8: ToastAction (Toast.Action)
