'use client';

import React, { useState } from 'react';
import type { DisplayMeta } from './types';
import { Pencil, CodeWindow, Eye } from '../icons/generated';
import {
  Card, CardHeader, CardBody, CardFooter,
  Alert,
  AlertDialog,
  Avatar,
  Button,
  Tooltip,
  Breadcrumbs,
  Collapsible,
  Combobox,
  Field,
  Fieldset,
  Menubar,
  Meter,
  NavigationMenu,
  NumberField,
  PreviewCard, PreviewCardTrigger, PreviewCardContent,
  Checkbox,
  Radio, RadioGroup,
  ScrollArea,
  Switch,
  Slider,
  Spinner,
  Toggle,
  ToggleGroup,
  Toolbar,
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

  Avatar: {
    Demo: ({ size = 'md', shape, ...rest }: Record<string, unknown>) => (
      <div className="flex items-center gap-3">
        <Avatar fallback="JD" size={size as string} shape={shape as string} {...rest} />
        <Avatar fallback="RM" size="md" />
        <Avatar fallback="AK" size="lg" />
        <Avatar fallback="XL" size="xl" />
        <Avatar fallback="SQ" size="md" shape="square" />
      </div>
    ),
    renderMode: 'custom',
    variants: [
      { label: 'Small', props: { fallback: 'SM', size: 'sm' } },
      { label: 'Medium', props: { fallback: 'MD', size: 'md' } },
      { label: 'Large', props: { fallback: 'LG', size: 'lg' } },
      { label: 'X-Large', props: { fallback: 'XL', size: 'xl' } },
      { label: 'Square', props: { fallback: 'SQ', size: 'md', shape: 'square' } },
    ],
  },

  PreviewCard: {
    controlledProps: [],
    Demo: () => (
      <PreviewCard>
        <PreviewCardTrigger>
          <a href="#" className="text-sm text-main underline">Hover for preview</a>
        </PreviewCardTrigger>
        <PreviewCardContent>
          <div className="flex flex-col gap-2 max-w-[16rem]">
            <p className="text-sm font-heading text-main">Preview Card</p>
            <p className="text-xs text-sub">
              This popup appears on hover to show additional context without navigating away.
            </p>
          </div>
        </PreviewCardContent>
      </PreviewCard>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Meter: {
    Demo: ({ value = 85, low = 25, high = 75, optimum = 50, ...rest }: Record<string, unknown>) => (
      <div className="flex w-full flex-col gap-3 max-w-[20rem]">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sub font-mono">Disk usage ({String(value)}%)</span>
          <Meter value={value as number} low={low as number} high={high as number} optimum={optimum as number} {...rest} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sub font-mono">Signal (good)</span>
          <Meter value={80} low={20} high={60} optimum={100} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sub font-mono">Battery (low)</span>
          <Meter value={15} low={20} high={80} optimum={100} />
        </div>
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Card: {
    Demo: ({ variant = 'default', className = '' }: Record<string, unknown>) => (
      <div className="flex flex-col gap-3 w-full">
        <Card variant={variant as string} className={`w-full max-w-[20rem] ${className as string}`.trim()}>
          <CardHeader>Default</CardHeader>
          <CardBody>
            <p className="text-sm text-sub">Standard card with default styling.</p>
          </CardBody>
          <CardFooter>
            <Button mode="pattern" size="sm">Action</Button>
          </CardFooter>
        </Card>
        <Card variant="inverted" className="w-full max-w-[20rem]">
          <CardHeader>Inverted</CardHeader>
          <CardBody>
            <p className="text-sm text-sub">Inverted card with dark background.</p>
          </CardBody>
        </Card>
        <Card variant="raised" className="w-full max-w-[20rem]">
          <CardHeader>Raised</CardHeader>
          <CardBody>
            <p className="text-sm text-sub">Elevated card with shadow.</p>
          </CardBody>
        </Card>
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Alert: {
    Demo: ({ variant = 'default', ...rest }: Record<string, unknown>) => (
      <div className="flex flex-col gap-2 w-full">
        <Alert.Root variant={variant as string} {...rest}>
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Default</Alert.Title>
            <Alert.Description>This is a default alert message.</Alert.Description>
          </Alert.Content>
          <Alert.Close />
        </Alert.Root>
        <Alert.Root variant="success">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Success</Alert.Title>
            <Alert.Description>Operation completed successfully.</Alert.Description>
          </Alert.Content>
          <Alert.Close />
        </Alert.Root>
        <Alert.Root variant="warning">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Warning</Alert.Title>
            <Alert.Description>Please review before continuing.</Alert.Description>
          </Alert.Content>
          <Alert.Close />
        </Alert.Root>
        <Alert.Root variant="error">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>Something went wrong.</Alert.Description>
          </Alert.Content>
          <Alert.Close />
        </Alert.Root>
        <Alert.Root variant="info">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Info</Alert.Title>
            <Alert.Description>Additional details are available.</Alert.Description>
          </Alert.Content>
          <Alert.Close />
        </Alert.Root>
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  AlertDialog: {
    controlledProps: [],
    Demo: () => {
      const { state, actions } = AlertDialog.useAlertDialogState();
      return (
        <AlertDialog.Provider state={state} actions={actions}>
          <AlertDialog.Trigger asChild>
            <Button tone="danger" size="sm">Delete Item</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Are you sure?</AlertDialog.Title>
              <AlertDialog.Description>This action cannot be undone. This will permanently delete the item.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Close asChild>
                <Button mode="pattern" size="sm">Cancel</Button>
              </AlertDialog.Close>
              <Button tone="danger" size="sm" onClick={actions.close}>Delete</Button>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Provider>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Tooltip: {
    Demo: ({ content = 'Tooltip text', position, ...rest }: Record<string, unknown>) => (
      <Tooltip content={content as string} {...(position ? { position: position as string } : {})} {...rest}>
        <Button mode="pattern" size="sm">Hover me</Button>
      </Tooltip>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Breadcrumbs: {
    Demo: ({ separator, ...rest }: Record<string, unknown>) => (
      <Breadcrumbs
        items={[
          { label: 'Home', href: '#' },
          { label: 'Components', href: '#' },
          { label: 'Breadcrumbs' },
        ]}
        {...(separator ? { separator: separator as string } : {})}
        {...rest}
      />
    ),
    renderMode: 'custom',
    variants: [],
  },

  Checkbox: {
    exampleProps: { label: 'Accept terms', defaultChecked: false },
    variants: [
      { label: 'Unchecked', props: { label: 'Accept terms', defaultChecked: false } },
      { label: 'Checked', props: { label: 'Subscribe', defaultChecked: true } },
      { label: 'Disabled', props: { label: 'Locked', disabled: true, defaultChecked: false } },
    ],
  },

  Radio: {
    controlledProps: [],
    Demo: () => {
      const [selected, setSelected] = useState('md');
      return (
        <RadioGroup value={selected} onValueChange={setSelected} className="flex flex-col gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Radio
              key={size}
              label={size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
              value={size}
            />
          ))}
        </RadioGroup>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Switch: {
    Demo: ({ size, disabled, label = 'Dark mode', labelPosition, ...rest }: Record<string, unknown>) => {
      const [checked, setChecked] = useState(false);
      return <Switch checked={checked} onChange={setChecked} label={label as string} {...(size ? { size: size as string } : {})} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...(labelPosition ? { labelPosition: labelPosition as string } : {})} {...rest} />;
    },
    renderMode: 'custom',
    variants: [
      { label: 'Small', props: { checked: true, onChange: () => {}, size: 'sm', label: 'Small' } },
      { label: 'Medium', props: { checked: true, onChange: () => {}, size: 'md', label: 'Medium' } },
      { label: 'Large', props: { checked: true, onChange: () => {}, size: 'lg', label: 'Large' } },
      { label: 'Disabled', props: { checked: true, onChange: () => {}, disabled: true, label: 'Locked' } },
      { label: 'Label Left', props: { checked: false, onChange: () => {}, label: 'Left label', labelPosition: 'left' } },
    ],
  },

  Slider: {
    Demo: ({ size, disabled, min = 0, max = 100, step, label, showValue, ...rest }: Record<string, unknown>) => {
      const [value, setValue] = useState(50);
      return <Slider value={value} onChange={setValue} min={min as number} max={max as number} {...(size ? { size: size as string } : {})} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...(step !== undefined ? { step: step as number } : {})} {...(label ? { label: label as string } : {})} {...(showValue !== undefined ? { showValue: showValue as boolean } : {})} {...rest} />;
    },
    renderMode: 'custom',
    variants: [
      { label: 'Small', props: { value: 50, onChange: () => {}, size: 'sm', min: 0, max: 100 } },
      { label: 'Medium', props: { value: 50, onChange: () => {}, size: 'md', min: 0, max: 100 } },
      { label: 'Large', props: { value: 50, onChange: () => {}, size: 'lg', min: 0, max: 100 } },
      { label: 'With Label', props: { value: 75, onChange: () => {}, label: 'Volume', showValue: true, min: 0, max: 100 } },
      { label: 'Disabled', props: { value: 30, onChange: () => {}, disabled: true, min: 0, max: 100 } },
    ],
  },

  Input: {
    Demo: ({ size, disabled, placeholder = 'Enter your name', error, ...rest }: Record<string, unknown>) => (
      <div className="flex w-full flex-col gap-2 max-w-[20rem]">
        <Label htmlFor="demo-input">Full Name</Label>
        <Input id="demo-input" placeholder={placeholder as string} {...(size ? { size: size as string } : {})} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...(error !== undefined ? { error: error as boolean } : {})} {...rest} />
      </div>
    ),
    renderMode: 'custom',
    variants: [
      { label: 'Small', props: { size: 'sm', placeholder: 'Small input' } },
      { label: 'Medium', props: { size: 'md', placeholder: 'Medium input' } },
      { label: 'Large', props: { size: 'lg', placeholder: 'Large input' } },
      { label: 'Error', props: { size: 'md', placeholder: 'Error state', error: true } },
    ],
  },

  TextArea: {
    Demo: ({ disabled, placeholder = 'Write a message...', ...rest }: Record<string, unknown>) => (
      <div className="flex w-full flex-col gap-2 max-w-[20rem]">
        <Label htmlFor="demo-textarea">Message</Label>
        <TextArea id="demo-textarea" placeholder={placeholder as string} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest} />
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Label: {
    Demo: ({ required, ...rest }: Record<string, unknown>) => (
      <div className="flex flex-col gap-3">
        <Label htmlFor="demo-label" {...rest}>Regular Label</Label>
        <Label htmlFor="demo-label-req" required={required !== undefined ? (required as boolean) : true}>Required Label</Label>
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Spinner: {
    Demo: ({ size = 24, variant, completed, ...rest }: Record<string, unknown>) => (
      <div className="flex items-center gap-4">
        <Spinner size={size as number} variant={variant as string} completed={completed as boolean} {...rest} />
        <Spinner size={32} />
        <Spinner size={24} completed />
        <Spinner variant="dots" size={24} />
        <Spinner variant="dots" size={24} completed />
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  // ── Demos for overlay/compound components ───────────────────────────

  ContextMenu: {
    controlledProps: [],
    Demo: () => (
      <ContextMenu className="flex items-center justify-center rounded-md border border-dashed border-line p-8">
        <span className="text-sm text-mute">Right-click this area</span>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => {}}>Edit</ContextMenuItem>
          <ContextMenuItem onClick={() => {}}>Duplicate</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem destructive onClick={() => {}}>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
    renderMode: 'custom',
    variants: [],
  },

  DropdownMenu: {
    controlledProps: [],
    Demo: () => (
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button mode="pattern" size="sm">Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {}}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => {}}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button mode="ghost" size="sm">More</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {}}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem disabled onClick={() => {}}>Archive</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => {}}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    renderMode: 'custom',
    // Suppress auto-generated position enum variants — compound component
    // can't render meaningfully via prop spreading. The Demo above shows
    // multiple trigger/content configurations inline.
    variants: [],
  },

  Select: {
    Demo: ({ size = 'md', disabled, placeholder = 'Pick a color', error, fullWidth, value }: Record<string, unknown>) => {
      const { state, actions } = Select.useSelectState({ value: typeof value === 'string' ? value : undefined });
      return (
        <div className="w-full max-w-[16rem]">
          <Select.Provider state={state} actions={actions}>
            <Select.Trigger placeholder={placeholder as string} size={size as string} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...(error !== undefined ? { error: error as boolean } : {})} {...(fullWidth !== undefined ? { fullWidth: fullWidth as boolean } : {})} />
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
    variants: [],
  },

  Toast: {
    controlledProps: [],
    Demo: () => {
      const ToastDemo = () => {
        const { addToast } = useToast();
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              mode="pattern"
              size="sm"
              onClick={() => addToast({ title: 'Notice', variant: 'default' })}
            >
              Default
            </Button>
            <Button
              mode="pattern"
              size="sm"
              onClick={() => addToast({ title: 'Saved!', variant: 'success' })}
            >
              Success
            </Button>
            <Button
              mode="pattern"
              size="sm"
              onClick={() => addToast({ title: 'Warning', variant: 'warning' })}
            >
              Warning
            </Button>
            <Button
              mode="pattern"
              size="sm"
              onClick={() => addToast({ title: 'Error', description: 'Something went wrong.', variant: 'error' })}
            >
              Error
            </Button>
            <Button
              mode="pattern"
              size="sm"
              onClick={() => addToast({ title: 'Info', description: 'Additional details.', variant: 'info' })}
            >
              Info
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
    variants: [],
  },

  Tabs: {
    controlledProps: [],
    Demo: () => {
      const [variant, setVariant] = useState<'pill' | 'line'>('pill');
      const [layout, setLayout] = useState<'default' | 'dot' | 'capsule' | 'sidebar'>('default');
      const tabs = Tabs.useTabsState({ defaultValue: 'design', variant, layout });
      return (
        <div className="flex flex-col gap-3 w-full max-w-[24rem]">
          {/* Variant + layout switcher */}
          <div className="flex gap-1 flex-wrap">
            {(['pill', 'line'] as const).map((v) => (
              <Button key={v} mode={variant === v ? undefined : 'pattern'} size="sm" onClick={() => setVariant(v)}>
                {v}
              </Button>
            ))}
            <span className="w-px bg-line mx-1" />
            {([['default', 'default'], ['dot', 'dot'], ['capsule', 'capsule'], ['sidebar', 'sidebar']] as const).map(([val, label]) => (
              <Button key={val} mode={layout === val ? undefined : 'ghost'} size="sm" onClick={() => setLayout(val)}>
                {label}
              </Button>
            ))}
          </div>
          <div className={layout === 'sidebar' ? 'h-48' : 'h-32'}>
            <Tabs.Provider {...tabs}>
              {layout === 'default' ? (
                <Tabs.Frame>
                  <Tabs.List>
                    <Tabs.Trigger value="design" icon={<Pencil size={14} />}>Design</Tabs.Trigger>
                    <Tabs.Trigger value="code" icon={<CodeWindow size={14} />}>Code</Tabs.Trigger>
                    <Tabs.Trigger value="preview" icon={<Eye size={14} />}>Preview</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="design"><p className="p-3 text-sm text-sub">Design token configuration.</p></Tabs.Content>
                  <Tabs.Content value="code"><p className="p-3 text-sm text-sub">Component source code.</p></Tabs.Content>
                  <Tabs.Content value="preview"><p className="p-3 text-sm text-sub">Live component preview.</p></Tabs.Content>
                </Tabs.Frame>
              ) : (
                <>
                  <Tabs.List>
                    <Tabs.Trigger value="design" icon={<Pencil size={14} />}>Design</Tabs.Trigger>
                    <Tabs.Trigger value="code" icon={<CodeWindow size={14} />}>Code</Tabs.Trigger>
                    <Tabs.Trigger value="preview" icon={<Eye size={14} />}>Preview</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="design"><p className="p-3 text-sm text-sub">Design token configuration.</p></Tabs.Content>
                  <Tabs.Content value="code"><p className="p-3 text-sm text-sub">Component source code.</p></Tabs.Content>
                  <Tabs.Content value="preview"><p className="p-3 text-sm text-sub">Live component preview.</p></Tabs.Content>
                </>
              )}
            </Tabs.Provider>
          </div>
        </div>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Dialog: {
    controlledProps: [],
    Demo: () => {
      const { state, actions } = Dialog.useDialogState();
      return (
        <Dialog.Provider state={state} actions={actions}>
          <Dialog.Trigger asChild>
            <Button mode="pattern" size="sm">Open Dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirm Action</Dialog.Title>
              <Dialog.Description>This action cannot be undone.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <p className="text-sm text-sub">Are you sure you want to proceed?</p>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button mode="ghost" tone="danger" size="sm">Cancel</Button>
              </Dialog.Close>
              <Button size="sm" onClick={actions.close}>Confirm</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Provider>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Drawer: {
    Demo: ({ direction = 'bottom', defaultOpen }: Record<string, unknown>) => {
      const { state, actions } = Drawer.useDrawerState({ defaultOpen: defaultOpen as boolean | undefined });
      return (
        <Drawer.Provider state={state} actions={actions} direction={direction as string}>
          <Drawer.Trigger asChild>
            <Button mode="pattern" size="sm">Open Drawer</Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Drawer Title</Drawer.Title>
              <Drawer.Description>Swipe down or tap outside to dismiss.</Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <p className="text-sm text-sub">Drawer body content goes here.</p>
            </Drawer.Body>
            <Drawer.Footer>
              <Drawer.Close asChild>
                <Button mode="ghost" size="sm">Close</Button>
              </Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Provider>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Sheet: {
    Demo: ({ side = 'right', ...rest }: Record<string, unknown>) => (
      <Sheet side={side as string} {...rest}>
        <SheetTrigger asChild>
          <Button mode="pattern" size="sm">Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Configure your preferences.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p className="text-sm text-sub">Sheet body content goes here.</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button mode="ghost" size="sm">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Popover: {
    Demo: ({ position = 'bottom', ...rest }: Record<string, unknown>) => (
      <Popover position={position as string} {...rest}>
        <PopoverTrigger asChild>
          <Button mode="pattern" size="sm">Show Info</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-sm text-sub">Popover content with extra details.</p>
        </PopoverContent>
      </Popover>
    ),
    renderMode: 'custom',
    variants: [],
  },

  HelpPanel: {
    controlledProps: [],
    Demo: () => {
      const { state, actions } = HelpPanel.useHelpPanelState();
      return (
        <div className="relative w-full h-48 rounded-md border border-line">
          <HelpPanel.Provider state={state} actions={actions}>
            <div className="p-3">
              <HelpPanel.Trigger>
                <Button mode="pattern" size="sm">? Help</Button>
              </HelpPanel.Trigger>
            </div>
            <HelpPanel.Content title="Getting Started">
              <p className="text-sm text-sub">This panel provides help content.</p>
            </HelpPanel.Content>
          </HelpPanel.Provider>
        </div>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  CountdownTimer: {
    Demo: ({ variant = 'default', label = 'Auction ends in', ...rest }: Record<string, unknown>) => (
      <CountdownTimer
        endTime={Date.now() + 3 * 60 * 60 * 1000 + 42 * 60 * 1000}
        label={label as string}
        variant={variant as string}
        {...rest}
      />
    ),
    renderMode: 'custom',
    variants: [
      { label: 'Default', props: { variant: 'default', endTime: Date.now() + 3600000, label: 'Ends in' } },
      { label: 'Compact', props: { variant: 'compact', endTime: Date.now() + 3600000, label: 'Ends in' } },
      { label: 'Large', props: { variant: 'large', endTime: Date.now() + 3600000, label: 'Ends in' } },
    ],
  },

  Web3ActionBar: {
    Demo: ({ isConnected = false, ...rest }: Record<string, unknown>) => (
      <Web3ActionBar
        isConnected={isConnected as boolean}
        onConnect={() => {}}
        onDisconnect={() => {}}
        {...rest}
      />
    ),
    renderMode: 'custom',
    variants: [],
  },

  Toggle: {
    exampleProps: { children: 'Bold', defaultPressed: false },
    variants: [
      { label: 'Default', props: { children: 'Bold', defaultPressed: false } },
      { label: 'Pressed', props: { children: 'Bold', defaultPressed: true } },
      { label: 'Outline', props: { children: 'Italic', variant: 'outline' } },
      { label: 'Disabled', props: { children: 'Bold', disabled: true } },
    ],
  },

  ToggleGroup: {
    Demo: ({ variant, disabled, ...rest }: Record<string, unknown>) => {
      const [value, setValue] = useState<string[]>(['center']);
      return (
        <ToggleGroup value={value} onValueChange={setValue} {...(variant ? { variant: variant as string } : {})} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest}>
          <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
          <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
          <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
        </ToggleGroup>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Toolbar: {
    Demo: ({ orientation, ...rest }: Record<string, unknown>) => (
      <Toolbar.Root {...(orientation ? { orientation: orientation as string } : {})} {...rest}>
        <Toolbar.Group>
          <Toolbar.Button>Cut</Toolbar.Button>
          <Toolbar.Button>Copy</Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
        </Toolbar.Group>
        <Toolbar.Separator />
        <Toolbar.Button>Undo</Toolbar.Button>
        <Toolbar.Button>Redo</Toolbar.Button>
        <Toolbar.Separator />
        <Toolbar.Link href="#">Help</Toolbar.Link>
      </Toolbar.Root>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Field: {
    Demo: ({ disabled, ...rest }: Record<string, unknown>) => (
      <div className="w-full max-w-[20rem]">
        <Field.Root {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest}>
          <Field.Label>Email address</Field.Label>
          <Field.Control>
            <input
              type="email"
              placeholder="you@example.com"
              className="font-sans bg-page text-main border border-line rounded-xs h-8 px-3 text-sm w-full placeholder:text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0"
            />
          </Field.Control>
          <Field.Description>We will never share your email.</Field.Description>
        </Field.Root>
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Fieldset: {
    Demo: ({ disabled, ...rest }: Record<string, unknown>) => (
      <div className="w-full max-w-[24rem]">
        <Fieldset.Root {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest}>
          <Fieldset.Legend>Contact Info</Fieldset.Legend>
          <div className="flex flex-col gap-3 mt-2">
            <Field.Root>
              <Field.Label>Name</Field.Label>
              <Field.Control>
                <input
                  placeholder="Jane Doe"
                  className="font-sans bg-page text-main border border-line rounded-xs h-8 px-3 text-sm w-full placeholder:text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0"
                />
              </Field.Control>
            </Field.Root>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Field.Control>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  className="font-sans bg-page text-main border border-line rounded-xs h-8 px-3 text-sm w-full placeholder:text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0"
                />
              </Field.Control>
            </Field.Root>
          </div>
        </Fieldset.Root>
      </div>
    ),
    renderMode: 'custom',
    variants: [],
  },

  NumberField: {
    Demo: ({ min = 0, max = 99, step = 1, disabled, ...rest }: Record<string, unknown>) => {
      const [value, setValue] = useState<number | null>(5);
      return (
        <div className="w-full max-w-[12rem]">
          <NumberField.Root
            value={value ?? undefined}
            onValueChange={setValue}
            min={min as number}
            max={max as number}
            step={step as number}
            {...(disabled !== undefined ? { disabled: disabled as boolean } : {})}
            {...rest}
          >
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </div>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Menubar: {
    controlledProps: [],
    Demo: () => (
      <Menubar.Root>
        <Menubar.Menu>
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item shortcut="Ctrl+N" onClick={() => {}}>New</Menubar.Item>
            <Menubar.Item shortcut="Ctrl+O" onClick={() => {}}>Open</Menubar.Item>
            <Menubar.Item shortcut="Ctrl+S" onClick={() => {}}>Save</Menubar.Item>
            <Menubar.Separator />
            <Menubar.Item onClick={() => {}}>Exit</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu>
          <Menubar.Trigger>Edit</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item shortcut="Ctrl+Z" onClick={() => {}}>Undo</Menubar.Item>
            <Menubar.Item shortcut="Ctrl+Y" onClick={() => {}}>Redo</Menubar.Item>
            <Menubar.Separator />
            <Menubar.Item shortcut="Ctrl+X" onClick={() => {}}>Cut</Menubar.Item>
            <Menubar.Item shortcut="Ctrl+C" onClick={() => {}}>Copy</Menubar.Item>
            <Menubar.Item shortcut="Ctrl+V" onClick={() => {}}>Paste</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar.Root>
    ),
    renderMode: 'custom',
    variants: [],
  },

  NavigationMenu: {
    Demo: ({ orientation, ...rest }: Record<string, unknown>) => (
      <NavigationMenu.Root {...(orientation ? { orientation: orientation as string } : {})} {...rest}>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Components</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div className="flex flex-col gap-1 min-w-48">
                <NavigationMenu.Link href="#">Button</NavigationMenu.Link>
                <NavigationMenu.Link href="#">Input</NavigationMenu.Link>
                <NavigationMenu.Link href="#">Select</NavigationMenu.Link>
                <NavigationMenu.Link href="#">Dialog</NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Documentation</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div className="flex flex-col gap-1 min-w-48">
                <NavigationMenu.Link href="#">Getting Started</NavigationMenu.Link>
                <NavigationMenu.Link href="#">Token System</NavigationMenu.Link>
                <NavigationMenu.Link href="#">Theme Spec</NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="#">About</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Viewport />
      </NavigationMenu.Root>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Combobox: {
    Demo: ({ disabled, ...rest }: Record<string, unknown>) => {
      const frameworks = ['React', 'Vue', 'Svelte', 'Angular', 'Solid'];
      const [value, setValue] = useState<string | null>(null);
      const [inputValue, setInputValue] = useState('');
      const filtered = frameworks.filter((fw) =>
        fw.toLowerCase().includes(inputValue.toLowerCase())
      );
      return (
        <div className="w-full max-w-[16rem]">
          <Combobox.Root
            value={value}
            onValueChange={setValue}
            onInputValueChange={setInputValue}
            {...(disabled !== undefined ? { disabled: disabled as boolean } : {})}
            {...rest}
          >
            <Combobox.Input placeholder="Search frameworks..." />
            <Combobox.Portal>
              <Combobox.Popup>
                {filtered.map((fw) => (
                  <Combobox.Item key={fw} value={fw}>{fw}</Combobox.Item>
                ))}
                <Combobox.Empty>No frameworks found</Combobox.Empty>
              </Combobox.Popup>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  ScrollArea: {
    controlledProps: [],
    Demo: () => (
      <ScrollArea.Root className="h-48 w-full max-w-[20rem] border border-line rounded-xs">
        <div className="p-4 space-y-4">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="text-sm text-main">
              Scrollable item {i + 1} — semantic tokens keep the scrollbar on-brand.
            </p>
          ))}
        </div>
      </ScrollArea.Root>
    ),
    renderMode: 'custom',
    variants: [],
  },

  Collapsible: {
    Demo: ({ disabled, ...rest }: Record<string, unknown>) => {
      const [open, setOpen] = useState(false);
      return (
        <div className="w-full max-w-[24rem]">
          <Collapsible.Root open={open} onOpenChange={setOpen} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest}>
            <Collapsible.Trigger>What is a Collapsible?</Collapsible.Trigger>
            <Collapsible.Content>
              A simple expand/collapse section. Lighter than Accordion when you only need one toggle.
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
      );
    },
    renderMode: 'custom',
    variants: [],
  },

  Separator: {
    variants: [
      { label: 'Horizontal', props: { orientation: 'horizontal' } },
      { label: 'Vertical', props: { orientation: 'vertical', className: 'h-8' } },
    ],
  },

  // ── Curated variants for simple components ─────────────────────────

  Button: {
    variants: [],
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

  Divider: {
    variants: [
      { label: 'Solid', props: { variant: 'solid' } },
      { label: 'Dashed', props: { variant: 'dashed' } },
      { label: 'Decorated', props: { variant: 'decorated' } },
    ],
  },
};
