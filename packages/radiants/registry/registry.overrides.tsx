'use client';

import React, { useState } from 'react';
import type { DisplayMeta } from './types';
import {
  Card, CardHeader, CardBody, CardFooter,
  Alert,
  AlertDialog,
  Button,
  Tooltip,
  Accordion, useAccordionState,
  Breadcrumbs,
  Progress,
  Checkbox,
  Radio,
  Switch,
  Slider,
  Spinner,
  Input, TextArea, Label,
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  Drawer,
  Select,
  ToastProvider, useToast,
  Tabs,
  Dialog,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose,
  Popover, PopoverTrigger, PopoverContent,
  HelpPanel,
  CountdownTimer,
  Web3ActionBar,
} from '../components/core';

/**
 * Runtime overrides that provide Demo components for entries
 * that cannot be demoed via simple prop spreading.
 *
 * Keyed by component name. Demo fields are proper React components
 * (not plain render functions) so hooks are safe to use.
 * Only components that need a custom Demo or curated variants
 * should appear here — plain components get auto-generated
 * variants from their schema enum props.
 */
export const overrides: Record<string, Partial<DisplayMeta>> = {
  // ── Custom renders for compound/controlled components ──────────────

  Card: {
    Demo: () => (
      <Card variant="default" className="w-full max-w-[20rem]">
        <CardHeader>Card Title</CardHeader>
        <CardBody>
          <p className="text-sm text-content-secondary">Card body content goes here.</p>
        </CardBody>
        <CardFooter>
          <Button variant="outline" size="sm">Action</Button>
        </CardFooter>
      </Card>
    ),
    renderMode: 'custom',
  },

  Alert: {
    Demo: () => (
      <div className="flex flex-col gap-2 w-full">
        <Alert.Root>
          <Alert.Content>
            <Alert.Title>Default alert</Alert.Title>
            <Alert.Description>This is a default alert message.</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      </div>
    ),
    renderMode: 'custom',
  },

  AlertDialog: {
    Demo: () => {
      const { state, actions } = AlertDialog.useAlertDialogState();
      return (
        <AlertDialog.Provider state={state} actions={actions}>
          <AlertDialog.Trigger asChild>
            <Button variant="destructive" size="sm">Delete Item</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Are you sure?</AlertDialog.Title>
              <AlertDialog.Description>This action cannot be undone. This will permanently delete the item.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Close asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </AlertDialog.Close>
              <Button variant="destructive" size="sm" onClick={actions.close}>Delete</Button>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Provider>
      );
    },
    renderMode: 'custom',
  },

  Tooltip: {
    Demo: () => (
      <Tooltip content="Tooltip text">
        <Button variant="outline" size="sm">Hover me</Button>
      </Tooltip>
    ),
    renderMode: 'custom',
  },

  Accordion: {
    Demo: () => {
      const { state, actions, meta } = useAccordionState({ type: 'single' });
      return (
        <div className="w-full max-w-[24rem]">
          <Accordion.Provider state={state} actions={actions} meta={meta}>
            <Accordion.Frame>
              <Accordion.Item value="1">
                <Accordion.Trigger>What is RDNA?</Accordion.Trigger>
                <Accordion.Content>A design token system for portable themes.</Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="2">
                <Accordion.Trigger>How do tokens work?</Accordion.Trigger>
                <Accordion.Content>Semantic tokens reference brand palette values.</Accordion.Content>
              </Accordion.Item>
            </Accordion.Frame>
          </Accordion.Provider>
        </div>
      );
    },
    renderMode: 'custom',
  },

  Breadcrumbs: {
    Demo: () => (
      <Breadcrumbs
        items={[
          { label: 'Home', href: '#' },
          { label: 'Components', href: '#' },
          { label: 'Breadcrumbs' },
        ]}
      />
    ),
    renderMode: 'custom',
  },

  Checkbox: {
    Demo: () => {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          label="Accept terms"
        />
      );
    },
    renderMode: 'custom',
  },

  Radio: {
    Demo: () => {
      const [selected, setSelected] = useState('md');
      return (
        <div className="flex flex-col gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Radio
              key={size}
              label={size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
              name="demo-size"
              value={size}
              checked={selected === size}
              onChange={() => setSelected(size)}
            />
          ))}
        </div>
      );
    },
    renderMode: 'custom',
  },

  Switch: {
    Demo: () => {
      const [checked, setChecked] = useState(false);
      return <Switch checked={checked} onChange={setChecked} label="Dark mode" />;
    },
    renderMode: 'custom',
  },

  Slider: {
    Demo: () => {
      const [value, setValue] = useState(50);
      return <Slider value={value} onChange={setValue} min={0} max={100} />;
    },
    renderMode: 'custom',
  },

  Input: {
    Demo: () => (
      <div className="flex w-full flex-col gap-2 max-w-[20rem]">
        <Label htmlFor="demo-input">Full Name</Label>
        <Input id="demo-input" placeholder="Enter your name" />
      </div>
    ),
    renderMode: 'custom',
  },

  TextArea: {
    Demo: () => (
      <div className="flex w-full flex-col gap-2 max-w-[20rem]">
        <Label htmlFor="demo-textarea">Message</Label>
        <TextArea id="demo-textarea" placeholder="Write a message..." />
      </div>
    ),
    renderMode: 'custom',
  },

  Label: {
    Demo: () => (
      <div className="flex flex-col gap-3">
        <Label htmlFor="demo-label">Regular Label</Label>
        <Label htmlFor="demo-label-req" required>Required Label</Label>
      </div>
    ),
    renderMode: 'custom',
  },

  Spinner: {
    Demo: () => (
      <div className="flex items-center gap-4">
        <Spinner size={24} />
        <Spinner size={32} />
        <Spinner size={24} completed />
      </div>
    ),
    renderMode: 'custom',
  },

  // ── Demos for overlay/compound components ───────────────────────────

  ContextMenu: {
    Demo: () => (
      <ContextMenu className="flex items-center justify-center rounded-md border border-dashed border-edge-primary p-8">
        <span className="text-sm text-content-muted">Right-click this area</span>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => {}}>Edit</ContextMenuItem>
          <ContextMenuItem onClick={() => {}}>Duplicate</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem destructive onClick={() => {}}>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
    renderMode: 'custom',
  },

  DropdownMenu: {
    Demo: () => (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" size="sm">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => {}}>Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => {}}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    renderMode: 'custom',
  },

  Select: {
    Demo: () => {
      const { state, actions } = Select.useSelectState({ defaultValue: '' });
      return (
        <div className="w-full max-w-[16rem]">
          <Select.Provider state={state} actions={actions}>
            <Select.Trigger placeholder="Pick a color" size="md" />
            <Select.Content>
              <Select.Option value="red">Sun Red</Select.Option>
              <Select.Option value="yellow">Sun Yellow</Select.Option>
              <Select.Option value="blue">Sky Blue</Select.Option>
            </Select.Content>
          </Select.Provider>
        </div>
      );
    },
    renderMode: 'custom',
  },

  Toast: {
    Demo: () => {
      const ToastDemo = () => {
        const { addToast } = useToast();
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToast({ title: 'Saved!', variant: 'success' })}
            >
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToast({ title: 'Warning', variant: 'warning' })}
            >
              Warning
            </Button>
          </div>
        );
      };
      return (
        <ToastProvider>
          <ToastDemo />
        </ToastProvider>
      );
    },
    renderMode: 'custom',
  },

  Tabs: {
    Demo: () => {
      const { state, actions, meta } = Tabs.useTabsState({ defaultValue: 'design', variant: 'pill' });
      return (
        <div className="w-full max-w-[24rem]">
          <Tabs.Provider state={state} actions={actions} meta={meta}>
            <Tabs.Frame>
              <Tabs.List>
                <Tabs.Trigger value="design">Design</Tabs.Trigger>
                <Tabs.Trigger value="code">Code</Tabs.Trigger>
                <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="design">
                <p className="p-3 text-sm text-content-secondary">Design token configuration.</p>
              </Tabs.Content>
              <Tabs.Content value="code">
                <p className="p-3 text-sm text-content-secondary">Component source code.</p>
              </Tabs.Content>
              <Tabs.Content value="preview">
                <p className="p-3 text-sm text-content-secondary">Live component preview.</p>
              </Tabs.Content>
            </Tabs.Frame>
          </Tabs.Provider>
        </div>
      );
    },
    renderMode: 'custom',
  },

  Dialog: {
    Demo: () => {
      const { state, actions } = Dialog.useDialogState();
      return (
        <Dialog.Provider state={state} actions={actions}>
          <Dialog.Trigger asChild>
            <Button variant="outline" size="sm">Open Dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirm Action</Dialog.Title>
              <Dialog.Description>This action cannot be undone.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <p className="text-sm text-content-secondary">Are you sure you want to proceed?</p>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">Cancel</Button>
              </Dialog.Close>
              <Button variant="primary" size="sm" onClick={actions.close}>Confirm</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Provider>
      );
    },
    renderMode: 'custom',
  },

  Drawer: {
    Demo: () => {
      const { state, actions } = Drawer.useDrawerState();
      return (
        <Drawer.Provider state={state} actions={actions} direction="bottom">
          <Drawer.Trigger asChild>
            <Button variant="outline" size="sm">Open Drawer</Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Drawer Title</Drawer.Title>
              <Drawer.Description>Swipe down or tap outside to dismiss.</Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <p className="text-sm text-content-secondary">Drawer body content goes here.</p>
            </Drawer.Body>
            <Drawer.Footer>
              <Drawer.Close asChild>
                <Button variant="ghost" size="sm">Close</Button>
              </Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Provider>
      );
    },
    renderMode: 'custom',
  },

  Sheet: {
    Demo: () => (
      <Sheet side="right">
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Configure your preferences.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p className="text-sm text-content-secondary">Sheet body content goes here.</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost" size="sm">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
    renderMode: 'custom',
  },

  Popover: {
    Demo: () => (
      <Popover position="bottom">
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Show Info</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-sm text-content-secondary">Popover content with extra details.</p>
        </PopoverContent>
      </Popover>
    ),
    renderMode: 'custom',
  },

  HelpPanel: {
    Demo: () => {
      const { state, actions } = HelpPanel.useHelpPanelState();
      return (
        <div className="relative w-full h-48 rounded-md border border-edge-primary">
          <HelpPanel.Provider state={state} actions={actions}>
            <div className="p-3">
              <HelpPanel.Trigger>
                <Button variant="outline" size="sm">? Help</Button>
              </HelpPanel.Trigger>
            </div>
            <HelpPanel.Content title="Getting Started">
              <p className="text-sm text-content-secondary">This panel provides help content.</p>
            </HelpPanel.Content>
          </HelpPanel.Provider>
        </div>
      );
    },
    renderMode: 'custom',
  },

  CountdownTimer: {
    Demo: () => (
      <CountdownTimer
        endTime={Date.now() + 3 * 60 * 60 * 1000 + 42 * 60 * 1000}
        label="Auction ends in"
        variant="default"
      />
    ),
    renderMode: 'custom',
  },

  Web3ActionBar: {
    Demo: () => (
      <Web3ActionBar
        isConnected={false}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
    ),
    renderMode: 'custom',
  },

  // ── Curated variants for simple components ─────────────────────────

  Button: {
    variants: [
      { label: 'Primary', props: { children: 'Primary', variant: 'primary' } },
      { label: 'Secondary', props: { children: 'Secondary', variant: 'secondary' } },
      { label: 'Outline', props: { children: 'Outline', variant: 'outline' } },
      { label: 'Ghost', props: { children: 'Ghost', variant: 'ghost' } },
      { label: 'Destructive', props: { children: 'Destructive', variant: 'destructive' } },
      { label: 'Text', props: { children: 'Text', variant: 'text' } },
    ],
  },

  Badge: {
    variants: [
      { label: 'Default', props: { children: 'Default' } },
      { label: 'Success', props: { children: 'Success', variant: 'success' } },
      { label: 'Warning', props: { children: 'Warning', variant: 'warning' } },
      { label: 'Error', props: { children: 'Error', variant: 'error' } },
      { label: 'Info', props: { children: 'Info', variant: 'info' } },
    ],
  },

  Progress: {
    variants: [
      { label: '25%', props: { value: 25 } },
      { label: '50%', props: { value: 50 } },
      { label: '75%', props: { value: 75 } },
      { label: '100%', props: { value: 100 } },
    ],
  },

  Divider: {
    variants: [
      { label: 'Solid', props: { variant: 'solid' } },
      { label: 'Dashed', props: { variant: 'dashed' } },
      { label: 'Decorated', props: { variant: 'decorated' } },
    ],
  },
};
