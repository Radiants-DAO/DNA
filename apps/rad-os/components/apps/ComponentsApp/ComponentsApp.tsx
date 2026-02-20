'use client';

import React, { useState } from 'react';
import {
  Accordion,
  useAccordionState,
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  IconButton,
  LoadingButton,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Checkbox,
  Radio,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  CountdownTimer,
  Dialog,
  useDialogState,
  Divider,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Input,
  TextArea,
  Label,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Progress,
  ProgressLabel,
  Spinner,
  Select,
  useSelectState,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  SheetClose,
  Slider,
  Switch,
  Tabs,
  useTabsState,
  ToastProvider,
  useToast,
  Tooltip,
  Web3ActionBar,
} from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';
import type { AppProps } from '@/lib/constants';

// ============================================================================
// Helpers
// ============================================================================

function Section({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Trigger className="font-joystix text-xs uppercase tracking-wide">
        {title}
      </Accordion.Trigger>
      <Accordion.Content>
        <div className="py-3 px-1 space-y-6">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <code className="font-mono text-2xs text-content-primary/60 uppercase">{label}</code>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// ============================================================================
// Section: Action Controls
// ============================================================================

function ActionControlsSection() {
  return (
    <Section title="Action Controls" value="actions">
      <Row label="Button — primary">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
      </Row>

      <Row label="Button — secondary">
        <Button variant="secondary" size="sm">Small</Button>
        <Button variant="secondary" size="md">Secondary</Button>
        <Button variant="secondary" size="lg">Large</Button>
      </Row>

      <Row label="Button — outline">
        <Button variant="outline" size="sm">Small</Button>
        <Button variant="outline" size="md">Outline</Button>
        <Button variant="outline" size="lg">Large</Button>
      </Row>

      <Row label="Button — ghost">
        <Button variant="ghost" size="sm">Small</Button>
        <Button variant="ghost" size="md">Ghost</Button>
        <Button variant="ghost" size="lg">Large</Button>
      </Row>

      <Row label="Button — with icon">
        <Button variant="primary" icon={<Icon name="lightning" size={16} />}>Action</Button>
        <Button variant="outline" icon={<Icon name="download" size={16} />}>Download</Button>
        <Button variant="ghost" icon={<Icon name="copy-to-clipboard" size={16} />}>Copy</Button>
      </Row>

      <Row label="Button — states">
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="primary" fullWidth>Full Width</Button>
      </Row>

      <Row label="IconButton">
        <IconButton icon={<Icon name="close" size={16} />} aria-label="Close" variant="ghost" size="sm" />
        <IconButton icon={<Icon name="settings-cog" size={16} />} aria-label="Settings" variant="ghost" size="md" />
        <IconButton icon={<Icon name="expand" size={16} />} aria-label="Expand" variant="outline" size="lg" />
      </Row>

      <Row label="LoadingButton">
        <LoadingButton variant="primary" isLoading={true} loadingText="Saving...">
          Save
        </LoadingButton>
        <LoadingButton variant="secondary" isLoading={false}>
          Idle
        </LoadingButton>
      </Row>
    </Section>
  );
}

// ============================================================================
// Section: Data Display
// ============================================================================

function DataDisplaySection() {
  return (
    <Section title="Data Display" value="data-display">
      <Row label="Badge — variants">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </Row>

      <Row label="Badge — sizes">
        <Badge variant="default" size="sm">SM</Badge>
        <Badge variant="default" size="md">MD</Badge>
        <Badge variant="success" size="sm">SM</Badge>
        <Badge variant="success" size="md">MD</Badge>
      </Row>

      <Row label="Card — default">
        <div className="w-full max-w-sm">
          <Card variant="default">
            <CardHeader>
              <span className="font-joystix text-xs uppercase">System Status</span>
            </CardHeader>
            <CardBody>
              <p className="font-mondwest text-sm">All subsystems operational.</p>
            </CardBody>
            <CardFooter>
              <Badge variant="success">Online</Badge>
            </CardFooter>
          </Card>
        </div>
      </Row>

      <Row label="Card — dark">
        <div className="w-full max-w-sm">
          <Card variant="dark">
            <CardBody>
              <p className="font-mondwest text-sm">Dark variant with inverted tokens.</p>
            </CardBody>
          </Card>
        </div>
      </Row>

      <Row label="Card — raised">
        <div className="w-full max-w-sm">
          <Card variant="raised">
            <CardBody>
              <p className="font-mondwest text-sm">Raised with shadow depth.</p>
            </CardBody>
          </Card>
        </div>
      </Row>

      <Row label="Progress — variants">
        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center gap-2">
            <Progress value={65} variant="default" size="md" />
            <ProgressLabel value={65} />
          </div>
          <Progress value={100} variant="success" size="md" />
          <Progress value={45} variant="warning" size="sm" />
          <Progress value={20} variant="error" size="lg" />
        </div>
      </Row>

      <Row label="Spinner">
        <Spinner size={24} />
        <Spinner size={32} />
        <Spinner size={24} completed />
      </Row>

      <Row label="CountdownTimer — variants">
        <CountdownTimer
          endTime={new Date(Date.now() + 3600000)}
          variant="default"
          label="Default"
        />
        <CountdownTimer
          endTime={new Date(Date.now() + 7200000)}
          variant="compact"
          label="Compact"
        />
        <CountdownTimer
          endTime={new Date(Date.now() + 86400000)}
          variant="large"
          label="Large"
        />
      </Row>

      <Row label="Breadcrumbs">
        <Breadcrumbs items={[
          { label: 'Home', href: '#' },
          { label: 'Components', href: '#' },
          { label: 'Badge' },
        ]} />
      </Row>

      <Row label="Divider — variants">
        <div className="w-full space-y-3">
          <Divider variant="solid" />
          <Divider variant="dashed" />
          <Divider variant="decorated" />
        </div>
      </Row>

      <Row label="Alert — variants">
        <div className="w-full space-y-2">
          <Alert.Root variant="default">
            <Alert.Content>
              <Alert.Title>Default Alert</Alert.Title>
              <Alert.Description>Informational message.</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <Alert.Root variant="success">
            <Alert.Content>
              <Alert.Title>Success</Alert.Title>
              <Alert.Description>Operation completed.</Alert.Description>
            </Alert.Content>
            <Alert.Close />
          </Alert.Root>
          <Alert.Root variant="warning">
            <Alert.Content>
              <Alert.Title>Warning</Alert.Title>
              <Alert.Description>Proceed with caution.</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <Alert.Root variant="error">
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>Something went wrong.</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        </div>
      </Row>

      <Row label="Tooltip — positions">
        <Tooltip content="Top tooltip" position="top">
          <Button variant="outline" size="sm">Top</Button>
        </Tooltip>
        <Tooltip content="Bottom tooltip" position="bottom">
          <Button variant="outline" size="sm">Bottom</Button>
        </Tooltip>
        <Tooltip content="Left tooltip" position="left">
          <Button variant="outline" size="sm">Left</Button>
        </Tooltip>
        <Tooltip content="Right tooltip" position="right">
          <Button variant="outline" size="sm">Right</Button>
        </Tooltip>
      </Row>
    </Section>
  );
}

// ============================================================================
// Section: Form Controls
// ============================================================================

function FormControlsSection() {
  const [sliderVal, setSliderVal] = useState(50);
  const [switchVal, setSwitchVal] = useState(false);
  const [switchVal2, setSwitchVal2] = useState(true);
  const [checkVal, setCheckVal] = useState(false);
  const [radioVal, setRadioVal] = useState('a');
  const selectState = useSelectState({ defaultValue: '' });

  return (
    <Section title="Form Controls" value="forms">
      <Row label="Input — sizes">
        <Input size="sm" placeholder="Small input" />
        <Input size="md" placeholder="Medium input" />
        <Input size="lg" placeholder="Large input" />
      </Row>

      <Row label="Input — with icon">
        <Input icon={<Icon name="search" size={16} />} placeholder="Search..." />
      </Row>

      <Row label="Label + Input">
        <div className="w-full max-w-xs space-y-1">
          <Label required>Email address</Label>
          <Input type="email" placeholder="you@example.com" />
        </div>
      </Row>

      <Row label="TextArea">
        <div className="w-full max-w-sm">
          <TextArea placeholder="Enter a longer message..." />
        </div>
      </Row>

      <Row label="Checkbox + Radio">
        <Checkbox
          label="Accept terms"
          checked={checkVal}
          onChange={() => setCheckVal(!checkVal)}
        />
        <Radio
          label="Option A"
          name="demo-radio"
          checked={radioVal === 'a'}
          onChange={() => setRadioVal('a')}
        />
        <Radio
          label="Option B"
          name="demo-radio"
          checked={radioVal === 'b'}
          onChange={() => setRadioVal('b')}
        />
      </Row>

      <Row label="Select">
        <div className="w-full max-w-xs relative">
          <Select.Provider state={selectState.state} actions={selectState.actions}>
            <Select.Trigger placeholder="Choose an option" />
            <Select.Content>
              <Select.Option value="sol">Solana</Select.Option>
              <Select.Option value="eth">Ethereum</Select.Option>
              <Select.Option value="btc">Bitcoin</Select.Option>
            </Select.Content>
          </Select.Provider>
        </div>
      </Row>

      <Row label="Switch — sizes">
        <Switch
          label="Small"
          size="sm"
          checked={switchVal}
          onChange={setSwitchVal}
        />
        <Switch
          label="Medium"
          size="md"
          checked={switchVal2}
          onChange={setSwitchVal2}
        />
        <Switch
          label="Large"
          size="lg"
          checked={!switchVal}
          onChange={(v) => setSwitchVal(!v)}
        />
      </Row>

      <Row label="Slider">
        <div className="w-full max-w-sm">
          <Slider
            value={sliderVal}
            onChange={setSliderVal}
            min={0}
            max={100}
            label="Volume"
            showValue
          />
        </div>
      </Row>
    </Section>
  );
}

// ============================================================================
// Section: Navigation
// ============================================================================

function NavigationSection() {
  const tabsState = useTabsState({ defaultValue: 'overview', variant: 'pill' });
  const tabsLine = useTabsState({ defaultValue: 'tab1', variant: 'line' });
  const accordionState = useAccordionState({ type: 'single', defaultValue: 'faq-1' });

  return (
    <Section title="Navigation" value="navigation">
      <Row label="Tabs — pill variant">
        <div className="w-full">
          <Tabs.Provider state={tabsState.state} actions={tabsState.actions} meta={tabsState.meta}>
            <Tabs.Frame>
              <Tabs.List>
                <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                <Tabs.Trigger value="details">Details</Tabs.Trigger>
                <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="overview">
                <p className="font-mondwest text-sm p-3">Pill tabs with content panels.</p>
              </Tabs.Content>
              <Tabs.Content value="details">
                <p className="font-mondwest text-sm p-3">Details content area.</p>
              </Tabs.Content>
              <Tabs.Content value="settings">
                <p className="font-mondwest text-sm p-3">Settings content area.</p>
              </Tabs.Content>
            </Tabs.Frame>
          </Tabs.Provider>
        </div>
      </Row>

      <Row label="Tabs — line variant">
        <div className="w-full">
          <Tabs.Provider state={tabsLine.state} actions={tabsLine.actions} meta={tabsLine.meta}>
            <Tabs.Frame>
              <Tabs.List>
                <Tabs.Trigger value="tab1">First</Tabs.Trigger>
                <Tabs.Trigger value="tab2">Second</Tabs.Trigger>
                <Tabs.Trigger value="tab3">Third</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="tab1">
                <p className="font-mondwest text-sm p-3">Line-style underlined tabs.</p>
              </Tabs.Content>
              <Tabs.Content value="tab2">
                <p className="font-mondwest text-sm p-3">Second tab content.</p>
              </Tabs.Content>
              <Tabs.Content value="tab3">
                <p className="font-mondwest text-sm p-3">Third tab content.</p>
              </Tabs.Content>
            </Tabs.Frame>
          </Tabs.Provider>
        </div>
      </Row>

      <Row label="Accordion (nested)">
        <div className="w-full">
          <Accordion.Provider state={accordionState.state} actions={accordionState.actions} meta={accordionState.meta}>
            <Accordion.Frame>
              <Accordion.Item value="faq-1">
                <Accordion.Trigger>How does it work?</Accordion.Trigger>
                <Accordion.Content>
                  <p className="font-mondwest text-sm p-2">Compound component with DI state pattern.</p>
                </Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="faq-2">
                <Accordion.Trigger>Can I nest them?</Accordion.Trigger>
                <Accordion.Content>
                  <p className="font-mondwest text-sm p-2">Yes — each Accordion.Provider manages its own state.</p>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Frame>
          </Accordion.Provider>
        </div>
      </Row>
    </Section>
  );
}

// ============================================================================
// Section: Overlays
// ============================================================================

function OverlaysSection() {
  const dialogState = useDialogState();

  return (
    <Section title="Overlays" value="overlays">
      <Row label="Dialog">
        <Dialog.Provider state={dialogState.state} actions={dialogState.actions}>
          <Dialog.Trigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirm Action</Dialog.Title>
              <Dialog.Description>This is a dialog overlay with header, body, and footer.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <p className="font-mondwest text-sm">Are you sure you want to proceed?</p>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button variant="primary">Confirm</Button>
              </Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Provider>
      </Row>

      <Row label="Sheet — sides">
        <Sheet side="right">
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">Right Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Panel Title</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <p className="font-mondwest text-sm">Slide-in panel content.</p>
            </SheetBody>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="ghost">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet side="bottom">
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">Bottom Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Bottom Panel</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <p className="font-mondwest text-sm">Slides up from the bottom.</p>
            </SheetBody>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="ghost">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Row>

      <Row label="Popover">
        <Popover position="bottom">
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-3">
              <p className="font-joystix text-xs mb-2">Popover Content</p>
              <p className="font-mondwest text-sm">Positioned overlay with click-outside dismiss.</p>
            </div>
          </PopoverContent>
        </Popover>
      </Row>

      <Row label="DropdownMenu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" icon={<Icon name="chevron-down" size={14} />}>
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {}}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => {}}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>

      <Row label="ContextMenu (right-click the area)">
        <ContextMenu>
          <div className="w-full h-20 border border-dashed border-edge-primary rounded-md flex items-center justify-center">
            <span className="font-mono text-xs text-content-primary/50">Right-click here</span>
          </div>
          <ContextMenuContent>
            <ContextMenuItem icon={<Icon name="copy-to-clipboard" size={14} />} onClick={() => {}}>Copy</ContextMenuItem>
            <ContextMenuItem icon={<Icon name="download" size={14} />} onClick={() => {}}>Download</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem destructive onClick={() => {}}>Remove</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Row>
    </Section>
  );
}

// ============================================================================
// Section: Feedback
// ============================================================================

function FeedbackSection() {
  return (
    <Section title="Feedback" value="feedback">
      <Row label="Toast (click to trigger)">
        <ToastDemo />
      </Row>
    </Section>
  );
}

function ToastDemo() {
  const { addToast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => addToast({ title: 'Default toast', variant: 'default' })}>
        Default
      </Button>
      <Button variant="outline" size="sm" onClick={() => addToast({ title: 'Success!', description: 'Operation completed.', variant: 'success' })}>
        Success
      </Button>
      <Button variant="outline" size="sm" onClick={() => addToast({ title: 'Warning', description: 'Check your input.', variant: 'warning' })}>
        Warning
      </Button>
      <Button variant="outline" size="sm" onClick={() => addToast({ title: 'Error', description: 'Something failed.', variant: 'error' })}>
        Error
      </Button>
    </div>
  );
}

// ============================================================================
// Section: Specialty
// ============================================================================

function SpecialtySection() {
  return (
    <Section title="Specialty" value="specialty">
      <Row label="Web3ActionBar — disconnected">
        <div className="w-full">
          <Web3ActionBar
            isConnected={false}
            onConnect={() => {}}
          />
        </div>
      </Row>

      <Row label="Web3ActionBar — connected">
        <div className="w-full">
          <Web3ActionBar
            isConnected={true}
            walletAddress="7xKX...9fGh"
            onConnect={() => {}}
            onDisconnect={() => {}}
          >
            <Button variant="primary" size="sm">Mint</Button>
          </Web3ActionBar>
        </div>
      </Row>
    </Section>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ComponentsApp({ windowId }: AppProps) {
  const outerAccordion = useAccordionState({ type: 'multiple', defaultValue: ['actions'] });

  return (
    <ToastProvider>
      <div className="p-4">
        <div className="mb-4">
          <h1 className="font-joystix text-sm uppercase tracking-wide text-content-primary mb-1">
            Component Library
          </h1>
          <p className="font-mondwest text-sm text-content-primary/60">
            Live UI components from @rdna/radiants
          </p>
        </div>

        <Accordion.Provider state={outerAccordion.state} actions={outerAccordion.actions} meta={outerAccordion.meta}>
          <Accordion.Frame>
            <ActionControlsSection />
            <DataDisplaySection />
            <FormControlsSection />
            <NavigationSection />
            <OverlaysSection />
            <FeedbackSection />
            <SpecialtySection />
          </Accordion.Frame>
        </Accordion.Provider>
      </div>
    </ToastProvider>
  );
}

export default ComponentsApp;
