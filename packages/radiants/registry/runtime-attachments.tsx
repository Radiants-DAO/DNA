'use client';

import React, { useState } from 'react';
import * as coreComponents from '../components/core';
import {
  Alert,
  AlertDialog,
  Avatar,
  Breadcrumbs,
  Button,
  Card, CardHeader, CardBody, CardFooter,
  Collapsible,
  Combobox,
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  CountdownTimer,
  Dialog,
  Drawer,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
  Icon,
  Input, TextArea,
  InputSet,
  Menubar,
  Meter,
  NavigationMenu,
  NumberField,
  Pattern,
  Popover, PopoverTrigger, PopoverContent,
  PreviewCard, PreviewCardTrigger, PreviewCardContent,
  Radio, RadioGroup,
  ScrollArea,
  Select,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetBody, SheetFooter, SheetClose,
  Slider,
  Spinner,
  Switch,
  Tabs,
  ToastProvider, useToast,
  ToggleGroup,
  Toolbar,
  Tooltip,
} from '../components/core';
import { Pencil, CodeWindow, Eye } from '../icons';
import type { RuntimeAttachment } from './types';

const NON_COMPONENT_EXPORTS = new Set([
  'alertVariants',
  'badgeVariants',
  'buttonFaceVariants',
  'buttonRootVariants',
  'buttonVariants',
  'cardVariants',
  'inputVariants',
  'selectTriggerVariants',
  'switchTrackVariants',
  'tabTriggerVariants',
  'useAlertDialogState',
  'useComboboxFilter',
  'useDialogState',
  'useDrawerState',
  'useSelectState',
  'useTabsState',
  'useToast',
]);

function isRuntimeComponentExport(
  name: string,
  value: unknown,
): value is NonNullable<RuntimeAttachment['component']> {
  return (
    /^[A-Z]/.test(name) &&
    !NON_COMPONENT_EXPORTS.has(name) &&
    (typeof value === 'function' || (typeof value === 'object' && value !== null))
  );
}

const autoRuntimeAttachments = Object.fromEntries(
  Object.entries(coreComponents)
    .filter(([name, value]) => isRuntimeComponentExport(name, value))
    .map(([name, component]) => [name, { component } satisfies RuntimeAttachment]),
) as Record<string, RuntimeAttachment>;

const customRuntimeAttachments: Record<string, RuntimeAttachment> = {

  // ── Custom Demo components ────────────────────────────────────────────

  Alert: {
    component: Alert as any,
    Demo: ({ variant = 'default', ...rest }: Record<string, unknown>) => (
      <Alert.Root variant={variant as string} {...rest}>
        <Alert.Icon />
        <Alert.Content>
          <Alert.Title>Heads up</Alert.Title>
          <Alert.Description>This is an alert message.</Alert.Description>
        </Alert.Content>
        <Alert.Close />
      </Alert.Root>
    ),
  },

  AlertDialog: {
    component: AlertDialog as any,
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
              <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
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
  },

  Avatar: {
    component: Avatar as any,
    Demo: ({ size = 'md', shape, ...rest }: Record<string, unknown>) => (
      <Avatar fallback="JD" size={size as string} shape={shape as string} {...rest} />
    ),
  },

  Breadcrumbs: {
    component: Breadcrumbs,
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
  },

  Card: {
    component: Card as any,
    Demo: ({ variant = 'default', className = '', ...rest }: Record<string, unknown>) => (
      <Card variant={variant as string} className={`w-full max-w-[20rem] ${className as string}`.trim()} {...rest}>
        <CardHeader>Card Title</CardHeader>
        <CardBody>
          <p className="text-sm text-sub">Card content goes here.</p>
        </CardBody>
        <CardFooter>
          <Button mode="pattern" size="sm">Action</Button>
        </CardFooter>
      </Card>
    ),
  },

  Collapsible: {
    component: Collapsible as any,
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
  },

  Combobox: {
    component: Combobox as any,
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
  },

  ContextMenu: {
    component: ContextMenu as any,
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
  },

  CountdownTimer: {
    component: CountdownTimer,
    Demo: ({ variant = 'default', label = 'Auction ends in', ...rest }: Record<string, unknown>) => (
      <CountdownTimer
        endTime={Date.now() + 3 * 60 * 60 * 1000 + 42 * 60 * 1000}
        label={label as string}
        variant={variant as string}
        {...rest}
      />
    ),
  },

  Dialog: {
    component: Dialog as any,
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
                <Button quiet tone="danger" size="sm">Cancel</Button>
              </Dialog.Close>
              <Button size="sm" onClick={actions.close}>Confirm</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Provider>
      );
    },
  },

  Drawer: {
    component: Drawer as any,
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
                <Button quiet size="sm">Close</Button>
              </Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Provider>
      );
    },
  },

  DropdownMenu: {
    component: DropdownMenu as any,
    Demo: ({ position = 'bottom', ...rest }: Record<string, unknown>) => (
      <DropdownMenu {...rest}>
        <DropdownMenuTrigger asChild>
          <Button mode="pattern" size="sm">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent {...(position ? { side: position as string } : {})}>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => {}}>Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => {}}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },

  Input: {
    component: Input as any,
    Demo: ({ size, disabled, placeholder = 'Enter your name', error, ...rest }: Record<string, unknown>) => (
      <div className="w-full max-w-[20rem]">
        <Input.Root {...(error !== undefined ? { invalid: error as boolean } : {})}>
          <Input.Label>Label</Input.Label>
          <Input placeholder={placeholder as string} {...(size ? { size: size as string } : {})} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest} />
          <Input.Description>Helper text goes here.</Input.Description>
        </Input.Root>
      </div>
    ),
  },

  InputSet: {
    component: InputSet as any,
    Demo: ({ disabled, ...rest }: Record<string, unknown>) => (
      <div className="w-full max-w-[24rem]">
        <InputSet.Root {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest}>
          <InputSet.Legend>Contact Info</InputSet.Legend>
          <div className="flex flex-col gap-3 mt-2">
            <Input.Root>
              <Input.Label>Name</Input.Label>
              <Input placeholder="Jane Doe" />
            </Input.Root>
            <Input.Root>
              <Input.Label>Email</Input.Label>
              <Input type="email" placeholder="jane@example.com" />
            </Input.Root>
          </div>
        </InputSet.Root>
      </div>
    ),
  },

  Icon: {
    component: Icon,
    Demo: ({ name = 'search', size = 16, iconSet, className, ...rest }: Record<string, unknown>) => (
      <Icon
        name={name as string}
        size={size as number}
        {...(iconSet !== undefined ? { iconSet: iconSet as 16 | 24 } : {})}
        {...(className ? { className: className as string } : {})}
        {...rest}
      />
    ),
  },


  Menubar: {
    component: Menubar as any,
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
  },

  Meter: {
    component: Meter as any,
    Demo: ({ value = 85, low = 25, high = 75, optimum = 50, ...rest }: Record<string, unknown>) => (
      <div className="w-full max-w-[20rem] flex flex-col gap-1">
        <span className="text-xs text-sub font-mono">Usage ({String(value)}%)</span>
        <Meter value={value as number} low={low as number} high={high as number} optimum={optimum as number} {...rest} />
      </div>
    ),
  },

  NavigationMenu: {
    component: NavigationMenu as any,
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
  },

  NumberField: {
    component: NumberField as any,
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
  },

  Popover: {
    component: Popover as any,
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
  },

  PreviewCard: {
    component: PreviewCard as any,
    Demo: () => (
      <PreviewCard>
        <PreviewCardTrigger>
          <a href="#" className="text-sm text-main underline">Hover for preview</a>
        </PreviewCardTrigger>
        <PreviewCardContent>
          <div className="flex flex-col gap-2 max-w-[16rem]">
            <p className="text-sm font-heading text-main">Preview Card</p>
            <p className="text-xs text-sub">
              This popup appears on hover to show additional context.
            </p>
          </div>
        </PreviewCardContent>
      </PreviewCard>
    ),
  },

  Radio: {
    component: Radio,
    Demo: ({ disabled }: Record<string, unknown>) => {
      const [selected, setSelected] = useState('md');
      const isDisabled = disabled === true;
      return (
        <RadioGroup
          value={selected}
          onValueChange={setSelected}
          disabled={isDisabled}
          className="flex flex-col gap-2"
        >
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Radio
              key={size}
              label={size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
              value={size}
              disabled={isDisabled}
            />
          ))}
        </RadioGroup>
      );
    },
  },

  RadioGroup: { component: RadioGroup as any },

  ScrollArea: {
    component: ScrollArea as any,
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
  },

  Select: {
    component: Select as any,
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
  },

  Spinner: {
    component: Spinner,
    Demo: ({ size = 24, variant, completed, ...rest }: Record<string, unknown>) => (
      <Spinner size={size as number} variant={variant as string} completed={completed as boolean} {...rest} />
    ),
  },

  Sheet: {
    component: Sheet as any,
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
              <Button quiet size="sm">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
  },

  Slider: {
    component: Slider,
    Demo: ({ size, disabled, min = 0, max = 100, step, label, showValue, ...rest }: Record<string, unknown>) => {
      const [value, setValue] = useState(50);
      return <Slider value={value} onChange={setValue} min={min as number} max={max as number} {...(size ? { size: size as string } : {})} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...(step !== undefined ? { step: step as number } : {})} {...(label ? { label: label as string } : {})} {...(showValue !== undefined ? { showValue: showValue as boolean } : {})} {...rest} />;
    },
  },

  Switch: {
    component: Switch,
    Demo: ({ size, disabled, label = 'Dark mode', labelPosition, ...rest }: Record<string, unknown>) => {
      const [checked, setChecked] = useState(false);
      return <Switch checked={checked} onChange={setChecked} label={label as string} {...(size ? { size: size as string } : {})} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...(labelPosition ? { labelPosition: labelPosition as string } : {})} {...rest} />;
    },
  },

  Tabs: {
    component: Tabs as any,
    Demo: ({ variant = 'pill', layout = 'default', ...rest }: Record<string, unknown>) => {
      const tabs = Tabs.useTabsState({ defaultValue: 'design', variant: variant as string, layout: layout as string });
      return (
        <div className="w-full max-w-[24rem]">
          <Tabs.Provider {...tabs} {...rest}>
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
      );
    },
  },

  TextArea: {
    component: TextArea,
    Demo: ({ disabled, placeholder = 'Write a message...', ...rest }: Record<string, unknown>) => (
      <div className="w-full max-w-[20rem]">
        <Input.Root>
          <Input.Label>Message</Input.Label>
          <TextArea placeholder={placeholder as string} {...(disabled !== undefined ? { disabled: disabled as boolean } : {})} {...rest} />
          <Input.Description>Markdown supported.</Input.Description>
        </Input.Root>
      </div>
    ),
  },

  Toast: {
    component: ToastProvider,
    Demo: () => {
      const ToastDemo = () => {
        const { addToast } = useToast();
        return (
          <div className="flex flex-wrap gap-2">
            <Button mode="pattern" size="sm" onClick={() => addToast({ title: 'Notice', variant: 'default' })}>Default</Button>
            <Button mode="pattern" size="sm" onClick={() => addToast({ title: 'Saved!', variant: 'success' })}>Success</Button>
            <Button mode="pattern" size="sm" onClick={() => addToast({ title: 'Warning', variant: 'warning' })}>Warning</Button>
            <Button mode="pattern" size="sm" onClick={() => addToast({ title: 'Error', description: 'Something went wrong.', variant: 'error' })}>Error</Button>
            <Button mode="pattern" size="sm" onClick={() => addToast({ title: 'Info', description: 'Additional details.', variant: 'info' })}>Info</Button>
          </div>
        );
      };
      return <ToastProvider><ToastDemo /></ToastProvider>;
    },
  },

  ToggleGroup: {
    component: ToggleGroup as any,
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
  },

  Toolbar: {
    component: Toolbar as any,
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
  },

  Tooltip: {
    component: Tooltip,
    Demo: ({ content = 'Tooltip text', position, ...rest }: Record<string, unknown>) => (
      <Tooltip content={content as string} {...(position ? { position: position as string } : {})} {...rest}>
        <Button mode="pattern" size="sm">Hover me</Button>
      </Tooltip>
    ),
  },

};

export const runtimeAttachments: Record<string, RuntimeAttachment> = {
  ...autoRuntimeAttachments,
  ...customRuntimeAttachments,
};
