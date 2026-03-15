'use client';

import React, { useState } from 'react';
import type { DisplayMeta } from './types';
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
  Radio,
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
    Demo: () => (
      <div className="flex items-center gap-3">
        <Avatar fallback="JD" size="sm" />
        <Avatar fallback="RM" size="md" />
        <Avatar fallback="AK" size="lg" />
        <Avatar fallback="XL" size="xl" />
        <Avatar fallback="SQ" size="md" shape="square" />
      </div>
    ),
    renderMode: 'custom',
  },

  PreviewCard: {
    Demo: () => (
      <PreviewCard>
        <PreviewCardTrigger>
          <a href="#" className="text-sm text-content-primary underline">Hover for preview</a>
        </PreviewCardTrigger>
        <PreviewCardContent>
          <div className="flex flex-col gap-2 max-w-[16rem]">
            <p className="text-sm font-heading text-content-primary">Preview Card</p>
            <p className="text-xs text-content-secondary">
              This popup appears on hover to show additional context without navigating away.
            </p>
          </div>
        </PreviewCardContent>
      </PreviewCard>
    ),
    renderMode: 'custom',
  },

  Meter: {
    Demo: () => (
      <div className="flex w-full flex-col gap-3 max-w-[20rem]">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-content-secondary font-mono">Disk usage (85%)</span>
          <Meter value={85} low={25} high={75} optimum={50} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-content-secondary font-mono">Signal (good)</span>
          <Meter value={80} low={20} high={60} optimum={100} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-content-secondary font-mono">Battery (low)</span>
          <Meter value={15} low={20} high={80} optimum={100} />
        </div>
      </div>
    ),
    renderMode: 'custom',
  },

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
        <DropdownMenuTrigger asChild>
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
      const PenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>;
      const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
      const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>;
      const [layout, setLayout] = useState<'default' | 'dot' | 'capsule' | 'sidebar'>('default');
      const tabs = Tabs.useTabsState({ defaultValue: 'design', variant: 'pill', layout });
      return (
        <div className="flex flex-col gap-3 w-full max-w-[24rem]">
          {/* Layout switcher */}
          <div className="flex gap-1 flex-wrap">
            {([['default', 'pill'], ['dot', 'dot'], ['capsule', 'capsule'], ['sidebar', 'sidebar']] as const).map(([val, label]) => (
              <Button key={val} variant={layout === val ? 'primary' : 'outline'} size="sm" onClick={() => setLayout(val)}>
                {label}
              </Button>
            ))}
          </div>
          <div className={layout === 'sidebar' ? 'h-48' : 'h-32'}>
            <Tabs.Provider {...tabs}>
              {layout === 'default' ? (
                <Tabs.Frame>
                  <Tabs.List>
                    <Tabs.Trigger value="design" icon={<PenIcon />}>Design</Tabs.Trigger>
                    <Tabs.Trigger value="code" icon={<CodeIcon />}>Code</Tabs.Trigger>
                    <Tabs.Trigger value="preview" icon={<EyeIcon />}>Preview</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="design"><p className="p-3 text-sm text-content-secondary">Design token configuration.</p></Tabs.Content>
                  <Tabs.Content value="code"><p className="p-3 text-sm text-content-secondary">Component source code.</p></Tabs.Content>
                  <Tabs.Content value="preview"><p className="p-3 text-sm text-content-secondary">Live component preview.</p></Tabs.Content>
                </Tabs.Frame>
              ) : (
                <>
                  <Tabs.List>
                    <Tabs.Trigger value="design" icon={<PenIcon />}>Design</Tabs.Trigger>
                    <Tabs.Trigger value="code" icon={<CodeIcon />}>Code</Tabs.Trigger>
                    <Tabs.Trigger value="preview" icon={<EyeIcon />}>Preview</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="design"><p className="p-3 text-sm text-content-secondary">Design token configuration.</p></Tabs.Content>
                  <Tabs.Content value="code"><p className="p-3 text-sm text-content-secondary">Component source code.</p></Tabs.Content>
                  <Tabs.Content value="preview"><p className="p-3 text-sm text-content-secondary">Live component preview.</p></Tabs.Content>
                </>
              )}
            </Tabs.Provider>
          </div>
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

  Toggle: {
    Demo: () => {
      const [pressed, setPressed] = useState(false);
      return (
        <div className="flex gap-2">
          <Toggle pressed={pressed} onPressedChange={setPressed}>
            Bold
          </Toggle>
          <Toggle variant="outline">Italic</Toggle>
        </div>
      );
    },
    renderMode: 'custom',
  },

  ToggleGroup: {
    Demo: () => {
      const [value, setValue] = useState<string[]>(['center']);
      return (
        <ToggleGroup value={value} onValueChange={setValue}>
          <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
          <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
          <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
        </ToggleGroup>
      );
    },
    renderMode: 'custom',
  },

  Toolbar: {
    Demo: () => (
      <Toolbar.Root>
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
  },

  Field: {
    Demo: () => (
      <div className="w-full max-w-[20rem]">
        <Field.Root>
          <Field.Label>Email address</Field.Label>
          <Field.Control>
            <input
              type="email"
              placeholder="you@example.com"
              className="font-sans bg-surface-primary text-content-primary border border-edge-primary rounded-xs h-8 px-3 text-sm w-full placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0"
            />
          </Field.Control>
          <Field.Description>We will never share your email.</Field.Description>
        </Field.Root>
      </div>
    ),
    renderMode: 'custom',
  },

  Fieldset: {
    Demo: () => (
      <div className="w-full max-w-[24rem]">
        <Fieldset.Root>
          <Fieldset.Legend>Contact Info</Fieldset.Legend>
          <div className="flex flex-col gap-3 mt-2">
            <Field.Root>
              <Field.Label>Name</Field.Label>
              <Field.Control>
                <input
                  placeholder="Jane Doe"
                  className="font-sans bg-surface-primary text-content-primary border border-edge-primary rounded-xs h-8 px-3 text-sm w-full placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0"
                />
              </Field.Control>
            </Field.Root>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Field.Control>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  className="font-sans bg-surface-primary text-content-primary border border-edge-primary rounded-xs h-8 px-3 text-sm w-full placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0"
                />
              </Field.Control>
            </Field.Root>
          </div>
        </Fieldset.Root>
      </div>
    ),
    renderMode: 'custom',
  },

  NumberField: {
    Demo: () => {
      const [value, setValue] = useState<number | null>(5);
      return (
        <div className="w-full max-w-[12rem]">
          <NumberField.Root
            value={value ?? undefined}
            onValueChange={setValue}
            min={0}
            max={99}
            step={1}
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
  },

  Menubar: {
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
  },

  NavigationMenu: {
    Demo: () => (
      <NavigationMenu.Root>
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
  },

  Combobox: {
    Demo: () => {
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
  },

  ScrollArea: {
    Demo: () => (
      <ScrollArea.Root className="h-48 w-full max-w-[20rem] border border-edge-primary rounded-xs">
        <div className="p-4 space-y-4">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="text-sm text-content-primary">
              Scrollable item {i + 1} — semantic tokens keep the scrollbar on-brand.
            </p>
          ))}
        </div>
      </ScrollArea.Root>
    ),
    renderMode: 'custom',
  },

  Collapsible: {
    Demo: () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="w-full max-w-[24rem]">
          <Collapsible.Root open={open} onOpenChange={setOpen}>
            <Collapsible.Trigger>What is a Collapsible?</Collapsible.Trigger>
            <Collapsible.Content>
              A simple expand/collapse section. Lighter than Accordion when you only need one toggle.
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
      );
    },
    renderMode: 'custom',
  },

  Separator: {
    variants: [
      { label: 'Horizontal', props: { orientation: 'horizontal' } },
      { label: 'Vertical', props: { orientation: 'vertical', className: 'h-8' } },
    ],
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

  Divider: {
    variants: [
      { label: 'Solid', props: { variant: 'solid' } },
      { label: 'Dashed', props: { variant: 'dashed' } },
      { label: 'Decorated', props: { variant: 'decorated' } },
    ],
  },
};
