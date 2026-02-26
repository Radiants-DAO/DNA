'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  TextArea,
  Label,
  Tabs,
  Select,
  Checkbox,
  Radio,
  Badge,
  Progress,
  Spinner,
  Tooltip,
  Divider,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  Alert,
  Breadcrumbs,
  Switch,
  Slider,
  ToastProvider,
  useToast,
  HelpPanel,
  Dialog,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
  CountdownTimer,
} from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';
import { NFTCard } from '@/components/auctions/NFTCard';
import { NFTGrid } from '@/components/auctions/NFTGrid';
import { DataTable } from '@/components/auctions/DataTable';
import { StatCard, StatCardGroup } from '@/components/auctions/StatCard';
import { InfoChip, InfoChipGroup } from '@/components/auctions/InfoChip';

// ============================================================================
// Section Component
// ============================================================================

function Section({ 
  title, 
  children, 
  variant = 'h3', 
  subsectionId, 
  className,
  'data-edit-scope': editScope,
  'data-component': component,
  ...rest 
}: { 
  title: string; 
  children: React.ReactNode; 
  variant?: 'h3' | 'h4'; 
  subsectionId?: string; 
  className?: string;
  'data-edit-scope'?: string;
  'data-component'?: string;
}) {
  const HeadingTag = variant === 'h4' ? 'h4' : 'h3';
  const hasMarginOverride = className?.includes('mb-');
  const isSubsection = variant === 'h4';
  const subsectionClasses = isSubsection ? 'p-4 border border-edge-primary bg-surface-elevated' : '';
  const baseClasses = `${hasMarginOverride ? '' : 'mb-4'} ${subsectionClasses} rounded flex flex-col gap-4`.trim();
  return (
    <div 
      className={`${baseClasses} ${className || ''}`} 
      data-subsection-id={subsectionId}
      data-edit-scope={editScope}
      data-component={component}
      {...rest}
    >
      <HeadingTag>
        {title}
      </HeadingTag>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

function PropsDisplay({ props }: { props: string }) {
  return (
    <code>
      {props}
    </code>
  );
}

function Row({ children, props }: {
  children: React.ReactNode;
  props?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {children}
      </div>
      {props && <PropsDisplay props={props} />}
    </div>
  );
}

// ============================================================================
// Accordion Content Components
// ============================================================================

// Loading button demo component
function LoadingButtonDemo() {
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);

  const handleClick1 = () => {
    setLoading1(true);
    setTimeout(() => setLoading1(false), 2000);
  };

  const handleClick2 = () => {
    setLoading2(true);
    setTimeout(() => setLoading2(false), 2000);
  };

  const handleClick3 = () => {
    setLoading3(true);
    setTimeout(() => setLoading3(false), 2000);
  };

  return (
    <>
      <Button
        variant="primary"
        size="md"
        iconOnly={true}
        icon={<Icon name="refresh" size={16} />}
        loading={loading1}
        onClick={handleClick1}
        data-edit-scope="component-definition"
        data-component="Button"
      >
        {''}
      </Button>
      <Button
        variant="secondary"
        size="md"
        iconOnly={true}
        icon={<Icon name="download" size={16} />}
        loading={loading2}
        onClick={handleClick2}
        data-edit-scope="component-definition"
        data-component="Button"
        data-edit-variant="secondary"
      >
        {''}
      </Button>
      <Button
        variant="primary"
        size="md"
        icon={<Icon name="copy-to-clipboard" size={16} />}
        loading={loading3}
        onClick={handleClick3}
        data-edit-scope="component-definition"
        data-component="Button"
      >
        Copy
      </Button>
    </>
  );
}

function ButtonsContent() {
  return (
    <div className="space-y-6">
      <Section title="Button Variants" variant="h4" subsectionId="button-variants" className="mb-4">
        <Row props='variant="primary" | "secondary" | "outline" | "ghost"'>
          <Button variant="primary" size="md" fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button">Primary</Button>
          <Button variant="primary" size="md" fullWidth={false} iconOnly={false} disabled data-edit-scope="component-definition" data-component="Button">Disabled</Button>
        </Row>
        <Row props='variant="secondary"'>
          <Button variant="secondary" size="md" fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button" data-edit-variant="secondary">Secondary</Button>
          <Button variant="secondary" size="md" fullWidth={false} iconOnly={false} disabled data-edit-scope="component-definition" data-component="Button" data-edit-variant="secondary">Disabled</Button>
        </Row>
        <Row props='variant="outline"'>
          <Button variant="outline" size="md" fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button" data-edit-variant="outline">Outline</Button>
          <Button variant="outline" size="md" fullWidth={false} iconOnly={false} disabled data-edit-scope="component-definition" data-component="Button" data-edit-variant="outline">Disabled</Button>
        </Row>
        <Row props='variant="ghost"'>
          <Button variant="ghost" size="md" fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button" data-edit-variant="ghost">Ghost</Button>
          <Button variant="ghost" size="md" fullWidth={false} iconOnly={false} disabled data-edit-scope="component-definition" data-component="Button" data-edit-variant="ghost">Disabled</Button>
        </Row>
      </Section>

      <Section title="Button Sizes" variant="h4" subsectionId="button-sizes">
        <Row props='size="sm" | "md" | "lg"'>
          <Button variant="primary" size="sm" fullWidth={false} iconOnly={false}>Small</Button>
        </Row>
        <Row props='size="md"'>
          <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>Medium</Button>
        </Row>
        <Row props='size="lg"'>
          <Button variant="primary" size="lg" fullWidth={false} iconOnly={false}>Large</Button>
        </Row>
      </Section>

      <Section title="Button with Icon" variant="h4" subsectionId="button-with-icon">
        <Row props='icon={<Icon name="..." size={16} />}'>
          <Button variant="primary" size="md" icon={<Icon name="download" size={16} />} fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button">
            Download
          </Button>
          <Button variant="secondary" size="md" icon={<Icon name="copy-to-clipboard" size={16} />} fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button" data-edit-variant="secondary">
            Copy
          </Button>
        </Row>
        <Row props='iconOnly={true} icon={<Icon name="..." size={16} />}'>
          <Button variant="primary" size="md" iconOnly={true} icon={<Icon name="close" size={16} />} fullWidth={false} data-edit-scope="component-definition" data-component="Button">{''}</Button>
          <Button variant="primary" size="md" iconOnly={true} icon={<Icon name="copy-to-clipboard" size={16} />} fullWidth={false} data-edit-scope="component-definition" data-component="Button">{''}</Button>
          <Button variant="primary" size="lg" iconOnly={true} icon={<Icon name="copy-to-clipboard" size={16} />} fullWidth={false} data-edit-scope="component-definition" data-component="Button">{''}</Button>
        </Row>
        <Row props='loading={boolean} (only applies to buttons with icons)'>
          <LoadingButtonDemo />
        </Row>
        <Row props='fullWidth={true}'>
          <div className="w-64">
            <Button variant="primary" size="md" fullWidth={true} iconOnly={false} data-edit-scope="component-definition" data-component="Button">Full Width Button</Button>
          </div>
        </Row>
      </Section>
    </div>
  );
}

function CardsContent() {
  return (
    <div className="space-y-6">
      <Section title="Card Variants" variant="h4" subsectionId="card-variants">
        <Row props='variant="default" | "dark" | "raised"'>
          <div className="grid grid-cols-3 gap-4 w-full">
            <Card variant="default" noPadding={false} data-edit-scope="component-definition" data-component="Card">
              <p className="mb-2">Default Card</p>
              <p>
                Cream background with black border
              </p>
            </Card>
            <Card variant="dark" noPadding={false} data-edit-scope="component-definition" data-component="Card" data-edit-variant="dark">
              <p className="mb-2">Dark Card</p>
              <p>
                Black background with cream text
              </p>
            </Card>
            <Card variant="raised" noPadding={false} data-edit-scope="component-definition" data-component="Card" data-edit-variant="raised">
              <p className="mb-2">Raised Card</p>
              <p>
                Pixel shadow effect
              </p>
            </Card>
          </div>
        </Row>
      </Section>

      <Section title="Card with Header/Footer" variant="h4" subsectionId="card-with-header-footer">
        <Row props='noPadding={true} className="max-w-[28rem]"'>
          <Card variant="default" noPadding={true} className="max-w-[28rem]" data-edit-scope="component-definition" data-component="Card">
            <CardHeader>
              <h4>Card Header</h4>
            </CardHeader>
            <CardBody>
              <p>
                This is the card body content. It can contain any elements.
              </p>
            </CardBody>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" size="md" fullWidth={false} iconOnly={false}>Cancel</Button>
              <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>Confirm</Button>
            </CardFooter>
          </Card>
        </Row>
      </Section>
    </div>
  );
}

function FormsContent() {
  const selectState = Select.useSelectState({ defaultValue: '', onChange: () => {} });
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchChecked, setSwitchChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <div className="space-y-6">
      <Section title="Text Inputs" variant="h4" subsectionId="text-inputs">
        <Row props='size="md" error={false} fullWidth={true}'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="input-default">Default Input</Label>
            <Input id="input-default" size="md" error={false} fullWidth={true} placeholder="Enter text..." data-edit-scope="component-definition" data-component="Input" />
          </div>
        </Row>
        <Row props='error={true} fullWidth={true}'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="input-error" required>Error State</Label>
            <Input id="input-error" size="md" error={true} fullWidth={true} placeholder="Invalid input" data-edit-scope="component-definition" data-component="Input" />
          </div>
        </Row>
        <Row props='disabled fullWidth={true}'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="input-disabled">Disabled</Label>
            <Input id="input-disabled" size="md" error={false} fullWidth={true} disabled placeholder="Disabled" data-edit-scope="component-definition" data-component="Input" />
          </div>
        </Row>
      </Section>

      <Section title="Input Sizes" variant="h4" subsectionId="input-sizes">
        <Row props='size="sm" | "md" | "lg"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="input-sm">Small</Label>
            <Input id="input-sm" size="sm" error={false} fullWidth={true} placeholder="Small" data-edit-scope="component-definition" data-component="Input" />
          </div>
        </Row>
        <Row props='size="md"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="input-md">Medium</Label>
            <Input id="input-md" size="md" error={false} fullWidth={true} placeholder="Medium" data-edit-scope="component-definition" data-component="Input" />
          </div>
        </Row>
        <Row props='size="lg"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="input-lg">Large</Label>
            <Input id="input-lg" size="lg" error={false} fullWidth={true} placeholder="Large" data-edit-scope="component-definition" data-component="Input" />
          </div>
        </Row>
      </Section>

      <Section title="TextArea" variant="h4" subsectionId="textarea">
        <Row props='error={false} fullWidth={true} rows={4}'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="textarea">Description</Label>
            <TextArea id="textarea" error={false} fullWidth={true} rows={4} placeholder="Enter description..." data-edit-scope="component-definition" data-component="TextArea" />
          </div>
        </Row>
      </Section>

      <Section title="Select" variant="h4" subsectionId="select">
        <Row props='Select.Provider + Select.Trigger + Select.Content + Select.Option'>
          <div className="max-w-[20rem] w-full relative">
            <Label htmlFor="select">Choose an option</Label>
            <Select.Provider state={selectState.state} actions={selectState.actions}>
              <Select.Trigger placeholder="Select..." fullWidth={true} />
              <Select.Content>
                <Select.Option value="option1">Option One</Select.Option>
                <Select.Option value="option2">Option Two</Select.Option>
                <Select.Option value="option3">Option Three</Select.Option>
                <Select.Option value="disabled" disabled>Disabled Option</Select.Option>
              </Select.Content>
            </Select.Provider>
          </div>
        </Row>
      </Section>

      <Section title="Checkbox & Radio" variant="h4" subsectionId="checkbox-radio">
        <Row props='label="..." checked={boolean} onChange={fn} disabled={boolean}'>
          <Checkbox
            label="Check me"
            checked={checkboxChecked}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckboxChecked(e.target.checked)}
            disabled={false}
            data-edit-scope="component-definition"
            data-component="Checkbox"
          />
          <Checkbox label="Disabled" checked={false} onChange={() => {}} disabled={true} data-edit-scope="component-definition" data-component="Checkbox" />
          <Checkbox label="Checked & Disabled" checked={true} onChange={() => {}} disabled={true} data-edit-scope="component-definition" data-component="Checkbox" />
        </Row>
        <Row props='name="..." value="..." label="..." checked={boolean} onChange={fn}'>
          <Radio
            name="radio-group"
            value="option1"
            label="Option 1"
            checked={radioValue === 'option1'}
            onChange={() => setRadioValue('option1')}
            data-edit-scope="component-definition"
            data-component="Radio"
          />
          <Radio
            name="radio-group"
            value="option2"
            label="Option 2"
            checked={radioValue === 'option2'}
            onChange={() => setRadioValue('option2')}
            data-edit-scope="component-definition"
            data-component="Radio"
          />
          <Radio
            name="radio-group"
            value="option3"
            label="Option 3"
            checked={radioValue === 'option3'}
            onChange={() => setRadioValue('option3')}
            data-edit-scope="component-definition"
            data-component="Radio"
          />
        </Row>
      </Section>

      <Section title="Switch" variant="h4" subsectionId="switch">
        <Row props='checked={boolean} onChange={fn} size="sm" | "md" | "lg" label="..." labelPosition="left" | "right"'>
          <Switch
            checked={switchChecked}
            onChange={setSwitchChecked}
            size="md"
            label="Enable notifications"
            labelPosition="right"
            data-edit-scope="component-definition"
            data-component="Switch"
          />
          <Switch
            checked={!switchChecked}
            onChange={() => setSwitchChecked(!switchChecked)}
            size="md"
            label="Disabled"
            labelPosition="right"
            disabled={true}
            data-edit-scope="component-definition"
            data-component="Switch"
          />
        </Row>
        <Row props='size="sm" | "md" | "lg"'>
          <Switch checked={true} onChange={() => {}} size="sm" data-edit-scope="component-definition" data-component="Switch" />
          <Switch checked={true} onChange={() => {}} size="md" data-edit-scope="component-definition" data-component="Switch" />
          <Switch checked={true} onChange={() => {}} size="lg" data-edit-scope="component-definition" data-component="Switch" />
        </Row>
        <Row props='labelPosition="left"'>
          <Switch
            checked={switchChecked}
            onChange={setSwitchChecked}
            size="md"
            label="Label on left"
            labelPosition="left"
            data-edit-scope="component-definition"
            data-component="Switch"
          />
        </Row>
      </Section>

      <Section title="Slider" variant="h4" subsectionId="slider">
        <Row props='value={number} onChange={fn} min={number} max={number} step={number} size="sm" | "md" | "lg" showValue={boolean} label="..."'>
          <div className="max-w-[28rem] w-full">
            <Slider
              value={sliderValue}
              onChange={setSliderValue}
              min={0}
              max={100}
              step={1}
              size="md"
              label="Volume"
              showValue={true}
              data-edit-scope="component-definition"
              data-component="Slider"
            />
          </div>
        </Row>
        <Row props='size="sm" | "md" | "lg"'>
          <div className="max-w-[28rem] w-full">
            <Slider value={30} onChange={() => {}} size="sm" showValue={true} data-edit-scope="component-definition" data-component="Slider" />
          </div>
        </Row>
        <Row props='size="md"'>
          <div className="max-w-[28rem] w-full">
            <Slider value={60} onChange={() => {}} size="md" showValue={true} data-edit-scope="component-definition" data-component="Slider" />
          </div>
        </Row>
        <Row props='size="lg"'>
          <div className="max-w-[28rem] w-full">
            <Slider value={80} onChange={() => {}} size="lg" showValue={true} data-edit-scope="component-definition" data-component="Slider" />
          </div>
        </Row>
        <Row props='disabled'>
          <div className="max-w-[28rem] w-full">
            <Slider value={50} onChange={() => {}} disabled={true} showValue={true} data-edit-scope="component-definition" data-component="Slider" />
          </div>
        </Row>
      </Section>
    </div>
  );
}

function FeedbackContent() {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      <Section title="Alert" variant="h4" subsectionId="alert">
        <Row props='Alert.Root variant="default"'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="default">
              <Alert.Content><Alert.Title>Default Alert</Alert.Title><Alert.Description>This is a default alert message.</Alert.Description></Alert.Content>
            </Alert.Root>
          </div>
        </Row>
        <Row props='variant="success"'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="success">
              <Alert.Content><Alert.Title>Success</Alert.Title><Alert.Description>Operation completed successfully!</Alert.Description></Alert.Content>
            </Alert.Root>
          </div>
        </Row>
        <Row props='variant="warning"'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="warning">
              <Alert.Content><Alert.Title>Warning</Alert.Title><Alert.Description>Please review this information carefully.</Alert.Description></Alert.Content>
            </Alert.Root>
          </div>
        </Row>
        <Row props='variant="error"'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="error">
              <Alert.Content><Alert.Title>Error</Alert.Title><Alert.Description>Something went wrong. Please try again.</Alert.Description></Alert.Content>
            </Alert.Root>
          </div>
        </Row>
        <Row props='variant="info"'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="info">
              <Alert.Content><Alert.Title>Info</Alert.Title><Alert.Description>Here&apos;s some helpful information for you.</Alert.Description></Alert.Content>
            </Alert.Root>
          </div>
        </Row>
        <Row props='Alert.Icon (custom icon slot)'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="success">
              <Alert.Icon><span>&#x2713;</span></Alert.Icon>
              <Alert.Content><Alert.Title>Custom Icon</Alert.Title><Alert.Description>Using a custom icon instead of the variant default.</Alert.Description></Alert.Content>
            </Alert.Root>
          </div>
        </Row>
        <Row props='Alert.Close'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="default">
              <Alert.Content><Alert.Title>Closable Alert</Alert.Title><Alert.Description>This alert can be closed by clicking the X button.</Alert.Description></Alert.Content>
              <Alert.Close />
            </Alert.Root>
          </div>
        </Row>
        <Row props='No title'>
          <div className="max-w-[28rem] w-full">
            <Alert.Root variant="default">
              <Alert.Content><Alert.Description>Alert without a title - just the message content.</Alert.Description></Alert.Content>
            </Alert.Root>
          </div>
        </Row>
      </Section>

      <Section title="Badge Variants" variant="h4" subsectionId="badge-variants">
        <Row props='variant="default" | "success" | "warning" | "error" | "info" size="md"'>
          <Badge variant="default" size="md" data-edit-scope="component-definition" data-component="Badge">Default</Badge>
          <Badge variant="success" size="md" data-edit-scope="component-definition" data-component="Badge" data-edit-variant="success">Success</Badge>
          <Badge variant="warning" size="md" data-edit-scope="component-definition" data-component="Badge" data-edit-variant="warning">Warning</Badge>
          <Badge variant="error" size="md" data-edit-scope="component-definition" data-component="Badge" data-edit-variant="error">Error</Badge>
          <Badge variant="info" size="md" data-edit-scope="component-definition" data-component="Badge" data-edit-variant="info">Info</Badge>
        </Row>
        <Row props='size="sm" | "md"'>
          <Badge variant="default" size="sm" data-edit-scope="component-definition" data-component="Badge">Small</Badge>
          <Badge variant="success" size="sm" data-edit-scope="component-definition" data-component="Badge" data-edit-variant="success">Success</Badge>
          <Badge variant="error" size="sm" data-edit-scope="component-definition" data-component="Badge" data-edit-variant="error">Error</Badge>
        </Row>
      </Section>

      <Section title="Progress" variant="h4" subsectionId="progress">
        <Row props='value={number} variant="default" size="md" showLabel={false}'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="progress-default">Default (50%)</Label>
            <Progress value={50} variant="default" size="md" showLabel={false} data-edit-scope="component-definition" data-component="Progress" />
          </div>
        </Row>
        <Row props='variant="success"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="progress-success">Success (75%)</Label>
            <Progress value={75} variant="success" size="md" showLabel={false} data-edit-scope="component-definition" data-component="Progress" data-edit-variant="success" />
          </div>
        </Row>
        <Row props='variant="warning"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="progress-warning">Warning (25%)</Label>
            <Progress value={25} variant="warning" size="md" showLabel={false} data-edit-scope="component-definition" data-component="Progress" data-edit-variant="warning" />
          </div>
        </Row>
        <Row props='showLabel={true}'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="progress-label">Error with Label</Label>
            <Progress value={90} variant="error" size="md" showLabel={true} data-edit-scope="component-definition" data-component="Progress" data-edit-variant="error" />
          </div>
        </Row>
      </Section>

      <Section title="Progress Sizes" variant="h4" subsectionId="progress-sizes">
        <Row props='size="sm" | "md" | "lg"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="progress-sm">Small</Label>
            <Progress value={60} variant="default" size="sm" showLabel={false} />
          </div>
        </Row>
        <Row props='size="md"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="progress-md">Medium</Label>
            <Progress value={60} variant="default" size="md" showLabel={false} />
          </div>
        </Row>
        <Row props='size="lg"'>
          <div className="max-w-[28rem] w-full">
            <Label htmlFor="progress-lg">Large</Label>
            <Progress value={60} variant="default" size="lg" showLabel={false} />
          </div>
        </Row>
      </Section>

      <Section title="Spinner" variant="h4" subsectionId="spinner">
        <Row props='size={number}'>
          <Spinner size={16} data-edit-scope="component-definition" data-component="Spinner" />
          <Spinner size={24} data-edit-scope="component-definition" data-component="Spinner" />
          <Spinner size={32} data-edit-scope="component-definition" data-component="Spinner" />
        </Row>
      </Section>

      <Section title="Toast" variant="h4" subsectionId="toast">
        <Row props='useToast() hook - addToast({ title, description?, variant?, duration? })'>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="md"
             
              fullWidth={false}
              iconOnly={false}
              onClick={() => addToast({ title: 'Default Toast', variant: 'default' })}
            >
              Default Toast
            </Button>
            <Button
              variant="primary"
              size="md"
             
              fullWidth={false}
              iconOnly={false}
              onClick={() => addToast({ title: 'Success!', description: 'Operation completed successfully.', variant: 'success' })}
            >
              Success Toast
            </Button>
            <Button
              variant="primary"
              size="md"
             
              fullWidth={false}
              iconOnly={false}
              onClick={() => addToast({ title: 'Warning', description: 'Please review this carefully.', variant: 'warning' })}
            >
              Warning Toast
            </Button>
            <Button
              variant="primary"
              size="md"
             
              fullWidth={false}
              iconOnly={false}
              onClick={() => addToast({ title: 'Error', description: 'Something went wrong.', variant: 'error' })}
            >
              Error Toast
            </Button>
            <Button
              variant="primary"
              size="md"
             
              fullWidth={false}
              iconOnly={false}
              onClick={() => addToast({ title: 'Info', description: 'Here\'s some helpful information.', variant: 'info' })}
            >
              Info Toast
            </Button>
          </div>
        </Row>
      </Section>

      <Section title="Tooltip" variant="h4" subsectionId="tooltip">
        <Row props='content="..." position="top" | "bottom" | "left" | "right" size="sm" | "md" | "lg"'>
          <Tooltip content="Top tooltip" position="top" size="sm" data-edit-scope="component-definition" data-component="Tooltip">
            <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>Top</Button>
          </Tooltip>
          <Tooltip content="Bottom tooltip" position="bottom" size="sm" data-edit-scope="component-definition" data-component="Tooltip">
            <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>Bottom</Button>
          </Tooltip>
          <Tooltip content="Left tooltip" position="left" size="sm" data-edit-scope="component-definition" data-component="Tooltip">
            <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>Left</Button>
          </Tooltip>
          <Tooltip content="Right tooltip" position="right" size="sm" data-edit-scope="component-definition" data-component="Tooltip">
            <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>Right</Button>
          </Tooltip>
        </Row>
      </Section>
    </div>
  );
}

function TabsPreview() {
  const [variant, setVariant] = useState<'pill' | 'line'>('pill');
  const [layout, setLayout] = useState<'default' | 'bottom-tabs'>('default');
  const tabs = Tabs.useTabsState({ defaultValue: 'tab1', variant, layout });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-joystix text-xs uppercase text-content-muted">Variant</span>
          <div className="flex gap-1">
            {(['pill', 'line'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className={`px-2 py-1 font-joystix text-xs uppercase border border-edge-primary rounded-sm transition-colors ${
                  variant === v ? 'bg-surface-secondary text-content-inverted' : 'bg-transparent text-content-primary hover:bg-surface-muted'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-joystix text-xs uppercase text-content-muted">Layout</span>
          <div className="flex gap-1">
            {(['default', 'bottom-tabs'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                className={`px-2 py-1 font-joystix text-xs uppercase border border-edge-primary rounded-sm transition-colors ${
                  layout === l ? 'bg-surface-secondary text-content-inverted' : 'bg-transparent text-content-primary hover:bg-surface-muted'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Card variant="default" noPadding={false} className="max-w-[32rem]">
        <Tabs.Provider {...tabs}>
          <Tabs.Frame data-edit-scope="component-definition" data-component="Tabs" data-edit-variant={variant}>
            {layout === 'bottom-tabs' ? (
              <div className="flex flex-col h-48">
                <div className="flex-1 overflow-auto">
                  <Tabs.Content value="tab1" className="p-2"><p>Content for Tab One</p></Tabs.Content>
                  <Tabs.Content value="tab2" className="p-2"><p>Content for Tab Two</p></Tabs.Content>
                  <Tabs.Content value="tab3" className="p-2"><p>Content for Tab Three</p></Tabs.Content>
                </div>
                <Tabs.List className="">
                  <Tabs.Trigger value="tab1" className="">Tab One</Tabs.Trigger>
                  <Tabs.Trigger value="tab2" className="">Tab Two</Tabs.Trigger>
                  <Tabs.Trigger value="tab3" className="">Tab Three</Tabs.Trigger>
                </Tabs.List>
              </div>
            ) : (
              <>
                <Tabs.List className="">
                  <Tabs.Trigger value="tab1" className="">Tab One</Tabs.Trigger>
                  <Tabs.Trigger value="tab2" className="">Tab Two</Tabs.Trigger>
                  <Tabs.Trigger value="tab3" className="">Tab Three</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="tab1" className="mt-4"><p>Content for Tab One</p></Tabs.Content>
                <Tabs.Content value="tab2" className="mt-4"><p>Content for Tab Two</p></Tabs.Content>
                <Tabs.Content value="tab3" className="mt-4"><p>Content for Tab Three</p></Tabs.Content>
              </>
            )}
          </Tabs.Frame>
        </Tabs.Provider>
      </Card>
    </div>
  );
}

function NavigationContent() {
  return (
    <div className="space-y-6">
      <Section title="Breadcrumbs" variant="h4" subsectionId="breadcrumbs">
        <Row props='items={[{ label: string, href?: string }]} separator={string}'>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '#' },
              { label: 'Products', href: '#' },
              { label: 'Electronics', href: '#' },
              { label: 'Current Page' },
            ]}
            data-edit-scope="component-definition"
            data-component="Breadcrumbs"
          />
        </Row>
        <Row props='separator="→"'>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '#' },
              { label: 'About', href: '#' },
              { label: 'Team' },
            ]}
            separator="→"
          />
        </Row>
        <Row props='separator="•"'>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '#' },
              { label: 'Settings', href: '#' },
              { label: 'Profile' },
            ]}
            separator="•"
          />
        </Row>
        <Row props='Single item'>
          <Breadcrumbs items={[{ label: 'Home' }]} />
        </Row>
      </Section>

      <Section title="Tabs" variant="h4" subsectionId="tabs-pill-variant">
        <Row props='variant="pill" | "line" layout="default" | "bottom-tabs"'>
          <TabsPreview />
        </Row>
      </Section>

      <Section title="Dividers" variant="h4" subsectionId="dividers">
        <Row props='variant="solid" | "dashed" | "decorated" orientation="horizontal"'>
          <div className="w-full max-w-[28rem]">
            <Label htmlFor="divider-solid">Solid</Label>
            <Divider orientation="horizontal" variant="solid" data-edit-scope="component-definition" data-component="Divider" />
          </div>
        </Row>
        <Row props='variant="dashed"'>
          <div className="w-full max-w-[28rem]">
            <Label htmlFor="divider-dashed">Dashed</Label>
            <Divider orientation="horizontal" variant="dashed" data-edit-scope="component-definition" data-component="Divider" data-edit-variant="dashed" />
          </div>
        </Row>
        <Row props='variant="decorated"'>
          <div className="w-full max-w-[28rem]">
            <Label htmlFor="divider-decorated">Decorated</Label>
            <Divider orientation="horizontal" variant="decorated" data-edit-scope="component-definition" data-component="Divider" data-edit-variant="decorated" />
          </div>
        </Row>
      </Section>

      <Section title="Vertical Divider" variant="h4" subsectionId="vertical-divider">
        <Row props='orientation="vertical"'>
          <div className="flex items-center h-12 gap-4">
            <span className="font-mondwest text-base">Left</span>
            <Divider orientation="vertical" variant="solid" />
            <span className="font-mondwest text-base">Right</span>
          </div>
        </Row>
      </Section>
    </div>
  );
}

function OverlaysContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialog = Dialog.useDialogState({ open: dialogOpen, onOpenChange: setDialogOpen });
  const [sheetOpen, setSheetOpen] = useState(false);
  const helpPanelState = HelpPanel.useHelpPanelState();

  return (
    <div className="space-y-6">
      <Section title="Dialog" variant="h4" subsectionId="dialog">
        <Row props='open={boolean} onOpenChange={fn} defaultOpen={boolean}'>
          <Dialog.Provider {...dialog}>
            <Dialog.Trigger asChild>
              <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>
                Open Dialog
              </Button>
            </Dialog.Trigger>
            <Dialog.Content data-edit-scope="component-definition" data-component="Dialog">
              <Dialog.Header>
                <Dialog.Title>Dialog Title</Dialog.Title>
                <Dialog.Description>
                  This is a description of what the dialog does.
                </Dialog.Description>
              </Dialog.Header>
              <Dialog.Body>
                <p>
                  Dialog content goes here. You can put any content in the body.
                </p>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="md" fullWidth={false} iconOnly={false}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>
                    Confirm
                  </Button>
                </Dialog.Close>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Provider>
        </Row>
      </Section>

      <Section title="Dropdown Menu" variant="h4" subsectionId="dropdown-menu">
        <Row props='open={boolean} onOpenChange={fn} position="bottom-start" | "bottom-end" | "top-start" | "top-end"'>
          <DropdownMenu data-edit-scope="component-definition" data-component="DropdownMenu">
            <DropdownMenuTrigger asChild>
              <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>
                Open Menu ▼
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => alert('Copy clicked!')} destructive={false} disabled={false}>
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert('Cut clicked!')} destructive={false} disabled={false}>
                Cut
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert('Paste clicked!')} destructive={false} disabled={false}>
                Paste
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alert('Delete clicked!')} destructive={true} disabled={false}>
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert('Disabled item')} destructive={false} disabled={true}>
                Disabled Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Row>
      </Section>

      <Section title="Popover" variant="h4" subsectionId="popover">
        <Row props='open={boolean} onOpenChange={fn} position="top" | "bottom" | "left" | "right" align="start" | "center" | "end"'>
          <Popover data-edit-scope="component-definition" data-component="Popover">
            <PopoverTrigger asChild>
              <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>
                Open Popover
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <p className="mb-2">Popover Title</p>
              <p>
                This is popover content. It can contain any elements.
              </p>
            </PopoverContent>
          </Popover>
        </Row>
        <Row props='position="top"'>
          <Popover position="top" data-edit-scope="component-definition" data-component="Popover">
            <PopoverTrigger asChild>
              <Button variant="outline" size="md" fullWidth={false} iconOnly={false}>
                Top Popover
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <p>Popover appears above</p>
            </PopoverContent>
          </Popover>
        </Row>
      </Section>

      <Section title="Sheet" variant="h4" subsectionId="sheet">
        <Row props='open={boolean} onOpenChange={fn} side="left" | "right" | "top" | "bottom"'>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="right" data-edit-scope="component-definition" data-component="Sheet">
            <SheetTrigger asChild>
              <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>
                Open Sheet (Right)
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
                <SheetDescription>
                  This is a description of the sheet content.
                </SheetDescription>
              </SheetHeader>
              <SheetBody>
                <p>
                  Sheet content goes here. This is a slide-in panel from the right side.
                </p>
              </SheetBody>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="ghost" size="md" fullWidth={false} iconOnly={false}>
                    Cancel
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button variant="primary" size="md" fullWidth={false} iconOnly={false}>
                    Save
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </Row>
        <Row props='side="left"'>
          <Sheet side="left" data-edit-scope="component-definition" data-component="Sheet">
            <SheetTrigger asChild>
              <Button variant="outline" size="md" fullWidth={false} iconOnly={false}>
                Open Sheet (Left)
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Left Side Sheet</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <p>Sheet slides in from the left</p>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </Row>
      </Section>

      <Section title="Help Panel" variant="h4" subsectionId="help-panel">
        <Row props='isOpen={boolean} onClose={fn} title={string}'>
          <div className="relative w-full max-w-[28rem] h-64 border border-edge-primary rounded-sm bg-surface-primary overflow-hidden">
            <div className="p-4">
              <Button
                variant="primary"
                size="md"
               
                fullWidth={false}
                iconOnly={false}
                onClick={helpPanelState.actions.open}
              >
                Open Help Panel
              </Button>
            </div>
            <HelpPanel.Provider state={helpPanelState.state} actions={helpPanelState.actions}>
              <HelpPanel.Content title="Help">
                <div>
                  <p className="mb-2">Help Content</p>
                  <p className="mb-4">
                    This is a contextual help panel that slides in from the right side of its container.
                  </p>
                  <p>
                    It's useful for providing contextual help within app windows or modals.
                  </p>
                </div>
              </HelpPanel.Content>
            </HelpPanel.Provider>
          </div>
        </Row>
      </Section>

      <Section title="Context Menu" variant="h4" subsectionId="context-menu">
        <Row props='onClick={fn} destructive={boolean} disabled={boolean}'>
              <p className="mb-4 w-full">
            Right-click on the card below to see the context menu:
          </p>
          <ContextMenu data-edit-scope="component-definition" data-component="ContextMenu">
            <Card variant="default" noPadding={false} className="max-w-[20rem] cursor-context-menu">
              <p className="mb-2">Right-click me!</p>
              <p>
                This card has a context menu attached.
              </p>
            </Card>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => alert('Copy clicked!')} destructive={false} disabled={false}>
                Copy
              </ContextMenuItem>
              <ContextMenuItem onClick={() => alert('Paste clicked!')} destructive={false} disabled={false}>
                Paste
              </ContextMenuItem>
              <ContextMenuItem onClick={() => alert('Duplicate clicked!')} destructive={false} disabled={false}>
                Duplicate
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => alert('Delete clicked!')} destructive={true} disabled={false}>
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Row>
      </Section>
    </div>
  );
}

// ============================================================================
// Search Index
// ============================================================================

export interface SearchableItem {
  text: string;
  sectionId: string;
  subsectionTitle?: string;
  type: 'section' | 'subsection' | 'button' | 'label' | 'checkbox' | 'radio' | 'switch' | 'slider' | 'badge' | 'alert' | 'toast' | 'tooltip' | 'breadcrumb' | 'tab' | 'divider' | 'menu';
}

export const SEARCH_INDEX: SearchableItem[] = [
  // Buttons section
  { text: 'Buttons', sectionId: 'buttons', type: 'section' },
  { text: 'Button Variants', sectionId: 'buttons', subsectionTitle: 'Button Variants', type: 'subsection' },
  { text: 'Button Sizes', sectionId: 'buttons', subsectionTitle: 'Button Sizes', type: 'subsection' },
  { text: 'Button with Icon', sectionId: 'buttons', subsectionTitle: 'Button with Icon', type: 'subsection' },
  { text: 'Primary', sectionId: 'buttons', type: 'button' },
  { text: 'Secondary', sectionId: 'buttons', type: 'button' },
  { text: 'Outline', sectionId: 'buttons', type: 'button' },
  { text: 'Ghost', sectionId: 'buttons', type: 'button' },
  { text: 'Disabled', sectionId: 'buttons', type: 'button' },
  { text: 'Small', sectionId: 'buttons', type: 'button' },
  { text: 'Medium', sectionId: 'buttons', type: 'button' },
  { text: 'Large', sectionId: 'buttons', type: 'button' },
  { text: 'Download', sectionId: 'buttons', type: 'button' },
  { text: 'Copy', sectionId: 'buttons', type: 'button' },
  { text: 'Full Width Button', sectionId: 'buttons', type: 'button' },
  
  // Cards section
  { text: 'Cards', sectionId: 'cards', type: 'section' },
  { text: 'Card Variants', sectionId: 'cards', subsectionTitle: 'Card Variants', type: 'subsection' },
  { text: 'Card with Header/Footer', sectionId: 'cards', subsectionTitle: 'Card with Header/Footer', type: 'subsection' },
  { text: 'Default Card', sectionId: 'cards', type: 'label' },
  { text: 'Dark Card', sectionId: 'cards', type: 'label' },
  { text: 'Raised Card', sectionId: 'cards', type: 'label' },
  { text: 'Card Header', sectionId: 'cards', type: 'label' },
  { text: 'Cancel', sectionId: 'cards', type: 'button' },
  { text: 'Confirm', sectionId: 'cards', type: 'button' },
  
  // Forms section
  { text: 'Forms', sectionId: 'forms', type: 'section' },
  { text: 'Text Inputs', sectionId: 'forms', subsectionTitle: 'Text Inputs', type: 'subsection' },
  { text: 'Input Sizes', sectionId: 'forms', subsectionTitle: 'Input Sizes', type: 'subsection' },
  { text: 'TextArea', sectionId: 'forms', subsectionTitle: 'TextArea', type: 'subsection' },
  { text: 'Select', sectionId: 'forms', subsectionTitle: 'Select', type: 'subsection' },
  { text: 'Checkbox & Radio', sectionId: 'forms', subsectionTitle: 'Checkbox & Radio', type: 'subsection' },
  { text: 'Switch', sectionId: 'forms', subsectionTitle: 'Switch', type: 'subsection' },
  { text: 'Slider', sectionId: 'forms', subsectionTitle: 'Slider', type: 'subsection' },
  { text: 'Default Input', sectionId: 'forms', type: 'label' },
  { text: 'Error State', sectionId: 'forms', type: 'label' },
  { text: 'Description', sectionId: 'forms', type: 'label' },
  { text: 'Choose an option', sectionId: 'forms', type: 'label' },
  { text: 'Check me', sectionId: 'forms', type: 'checkbox' },
  { text: 'Checked & Disabled', sectionId: 'forms', type: 'checkbox' },
  { text: 'Option 1', sectionId: 'forms', type: 'radio' },
  { text: 'Option 2', sectionId: 'forms', type: 'radio' },
  { text: 'Option 3', sectionId: 'forms', type: 'radio' },
  { text: 'Enable notifications', sectionId: 'forms', type: 'switch' },
  { text: 'Label on left', sectionId: 'forms', type: 'switch' },
  { text: 'Volume', sectionId: 'forms', type: 'slider' },
  { text: 'Default (50%)', sectionId: 'forms', type: 'label' },
  { text: 'Success (75%)', sectionId: 'forms', type: 'label' },
  { text: 'Warning (25%)', sectionId: 'forms', type: 'label' },
  { text: 'Error with Label', sectionId: 'forms', type: 'label' },
  
  // Feedback section
  { text: 'Feedback', sectionId: 'feedback', type: 'section' },
  { text: 'Alert', sectionId: 'feedback', subsectionTitle: 'Alert', type: 'subsection' },
  { text: 'Badge Variants', sectionId: 'feedback', subsectionTitle: 'Badge Variants', type: 'subsection' },
  { text: 'Progress', sectionId: 'feedback', subsectionTitle: 'Progress', type: 'subsection' },
  { text: 'Progress Sizes', sectionId: 'feedback', subsectionTitle: 'Progress Sizes', type: 'subsection' },
  { text: 'Spinner', sectionId: 'feedback', subsectionTitle: 'Spinner', type: 'subsection' },
  { text: 'Toast', sectionId: 'feedback', subsectionTitle: 'Toast', type: 'subsection' },
  { text: 'Tooltip', sectionId: 'feedback', subsectionTitle: 'Tooltip', type: 'subsection' },
  { text: 'Default Alert', sectionId: 'feedback', type: 'alert' },
  { text: 'Success', sectionId: 'feedback', type: 'alert' },
  { text: 'Warning', sectionId: 'feedback', type: 'alert' },
  { text: 'Error', sectionId: 'feedback', type: 'alert' },
  { text: 'Info', sectionId: 'feedback', type: 'alert' },
  { text: 'Closable Alert', sectionId: 'feedback', type: 'alert' },
  { text: 'Default Toast', sectionId: 'feedback', type: 'toast' },
  { text: 'Success Toast', sectionId: 'feedback', type: 'toast' },
  { text: 'Warning Toast', sectionId: 'feedback', type: 'toast' },
  { text: 'Error Toast', sectionId: 'feedback', type: 'toast' },
  { text: 'Info Toast', sectionId: 'feedback', type: 'toast' },
  { text: 'Top', sectionId: 'feedback', type: 'tooltip' },
  { text: 'Bottom', sectionId: 'feedback', type: 'tooltip' },
  { text: 'Left', sectionId: 'feedback', type: 'tooltip' },
  { text: 'Right', sectionId: 'feedback', type: 'tooltip' },
  
  // Navigation section
  { text: 'Navigation', sectionId: 'navigation', type: 'section' },
  { text: 'Breadcrumbs', sectionId: 'navigation', subsectionTitle: 'Breadcrumbs', type: 'subsection' },
  { text: 'Tabs - Pill Variant', sectionId: 'navigation', subsectionTitle: 'Tabs - Pill Variant', type: 'subsection' },
  { text: 'Tabs - Line Variant', sectionId: 'navigation', subsectionTitle: 'Tabs - Line Variant', type: 'subsection' },
  { text: 'Dividers', sectionId: 'navigation', subsectionTitle: 'Dividers', type: 'subsection' },
  { text: 'Vertical Divider', sectionId: 'navigation', subsectionTitle: 'Vertical Divider', type: 'subsection' },
  { text: 'Home', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Products', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Electronics', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Current Page', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'About', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Team', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Dashboard', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Settings', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Profile', sectionId: 'navigation', type: 'breadcrumb' },
  { text: 'Tab One', sectionId: 'navigation', type: 'tab' },
  { text: 'Tab Two', sectionId: 'navigation', type: 'tab' },
  { text: 'Tab Three', sectionId: 'navigation', type: 'tab' },
  { text: 'First', sectionId: 'navigation', type: 'tab' },
  { text: 'Second', sectionId: 'navigation', type: 'tab' },
  { text: 'Third', sectionId: 'navigation', type: 'tab' },
  { text: 'Solid', sectionId: 'navigation', type: 'divider' },
  { text: 'Dashed', sectionId: 'navigation', type: 'divider' },
  { text: 'Decorated', sectionId: 'navigation', type: 'divider' },
  
  // Overlays section
  { text: 'Overlays', sectionId: 'overlays', type: 'section' },
  { text: 'Dialog', sectionId: 'overlays', subsectionTitle: 'Dialog', type: 'subsection' },
  { text: 'Dropdown Menu', sectionId: 'overlays', subsectionTitle: 'Dropdown Menu', type: 'subsection' },
  { text: 'Popover', sectionId: 'overlays', subsectionTitle: 'Popover', type: 'subsection' },
  { text: 'Sheet', sectionId: 'overlays', subsectionTitle: 'Sheet', type: 'subsection' },
  { text: 'Help Panel', sectionId: 'overlays', subsectionTitle: 'Help Panel', type: 'subsection' },
  { text: 'Context Menu', sectionId: 'overlays', subsectionTitle: 'Context Menu', type: 'subsection' },
  { text: 'Open Dialog', sectionId: 'overlays', type: 'button' },
  { text: 'Open Menu', sectionId: 'overlays', type: 'button' },
  { text: 'Open Popover', sectionId: 'overlays', type: 'button' },
  { text: 'Top Popover', sectionId: 'overlays', type: 'button' },
  { text: 'Open Sheet (Right)', sectionId: 'overlays', type: 'button' },
  { text: 'Open Sheet (Left)', sectionId: 'overlays', type: 'button' },
  { text: 'Open Help Panel', sectionId: 'overlays', type: 'button' },
  { text: 'Save', sectionId: 'overlays', type: 'button' },
  { text: 'Actions', sectionId: 'overlays', type: 'menu' },
  { text: 'Cut', sectionId: 'overlays', type: 'menu' },
  { text: 'Paste', sectionId: 'overlays', type: 'menu' },
  { text: 'Duplicate', sectionId: 'overlays', type: 'menu' },
  { text: 'Disabled Item', sectionId: 'overlays', type: 'menu' },
];

// Section title lookup map
const SECTION_TITLES: Record<string, string> = {
  buttons: 'Buttons',
  cards: 'Cards',
  forms: 'Forms',
  feedback: 'Feedback',
  navigation: 'Navigation',
  overlays: 'Overlays',
};

// Subsection title to ID mapping
const SUBSECTION_ID_MAP: Record<string, string> = {
  'Button Variants': 'button-variants',
  'Button Sizes': 'button-sizes',
  'Button with Icon': 'button-with-icon',
  'Card Variants': 'card-variants',
  'Card with Header/Footer': 'card-with-header-footer',
  'Text Inputs': 'text-inputs',
  'Input Sizes': 'input-sizes',
  'TextArea': 'textarea',
  'Select': 'select',
  'Checkbox & Radio': 'checkbox-radio',
  'Switch': 'switch',
  'Slider': 'slider',
  'Alert': 'alert',
  'Badge Variants': 'badge-variants',
  'Progress': 'progress',
  'Progress Sizes': 'progress-sizes',
  'Spinner': 'spinner',
  'Toast': 'toast',
  'Tooltip': 'tooltip',
  'Breadcrumbs': 'breadcrumbs',
  'Tabs - Pill Variant': 'tabs-pill-variant',
  'Tabs - Line Variant': 'tabs-line-variant',
  'Dividers': 'dividers',
  'Vertical Divider': 'vertical-divider',
  'Dialog': 'dialog',
  'Dropdown Menu': 'dropdown-menu',
  'Popover': 'popover',
  'Sheet': 'sheet',
  'Help Panel': 'help-panel',
  'Context Menu': 'context-menu',
};

// ============================================================================
// Autocomplete Component
// ============================================================================

interface AutocompleteProps {
  query: string;
  suggestions: SearchableItem[];
  selectedIndex: number;
  onSelect: (item: SearchableItem) => void;
  onClose: () => void;
}

function Autocomplete({ query, suggestions, selectedIndex, onSelect, onClose }: AutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, suggestions.length]);

  if (suggestions.length === 0 || !query) {
    return null;
  }

  const highlightText = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-sun-yellow">{text.substring(index, index + query.length)}</span>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <div
      ref={listRef}
      className="absolute z-50 w-full mt-1 bg-surface-primary border border-edge-primary rounded-sm shadow-[4px_4px_0_0_var(--color-edge-primary)] max-h-64 overflow-y-auto"
    >
      {suggestions.map((item, index) => {
        const sectionTitle = SECTION_TITLES[item.sectionId];
        const isSubsection = item.subsectionTitle !== undefined;
        const displayTitle = isSubsection ? item.subsectionTitle : sectionTitle;
        
        return (
          <button
            key={`${item.sectionId}-${item.text}-${index}`}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full text-left px-3 py-2 font-mondwest text-sm transition-colors ${
              index === selectedIndex
                ? 'bg-sun-yellow text-content-primary'
                : 'bg-surface-primary text-content-primary hover:bg-surface-muted'
            } ${isSubsection ? 'pl-6' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                {displayTitle && (
                  <span className="font-joystix text-sm font-bold text-content-muted uppercase">
                    {displayTitle}
                  </span>
                )}
                <span>{highlightText(item.text, query)}</span>
              </div>
              <span className="text-sm text-content-muted uppercase">{item.type}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Auction & Data Display Content Components
// ============================================================================

function CountdownTimerContent() {
  // Demo end time: 2 hours from now
  const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;
  const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const startingSoon = Date.now() + 30 * 60 * 1000;

  return (
    <>
      <Section title="CountdownTimer" variant="h4" subsectionId="countdown-variants">
        <Row props='variant="default" endTime={twoHoursFromNow} label="Auction ends in"'>
          <CountdownTimer variant="default" endTime={twoHoursFromNow} label="Auction ends in" />
        </Row>
        <Row props='variant="compact" endTime={twoHoursFromNow}'>
          <CountdownTimer variant="compact" endTime={twoHoursFromNow} />
        </Row>
        <Row props='variant="large" endTime={threeDaysFromNow} label="Time remaining"'>
          <CountdownTimer variant="large" endTime={threeDaysFromNow} label="Time remaining" />
        </Row>
      </Section>
      <Section title="Countdown States" variant="h4" subsectionId="countdown-states">
        <Row props='endTime={Date.now() - 1000} endedMessage="Auction Ended"'>
          <CountdownTimer endTime={Date.now() - 1000} endedMessage="Auction Ended" />
        </Row>
        <Row props='endTime={startingSoon} startTime={startingSoon} (upcoming)'>
          <CountdownTimer endTime={Date.now() + 60 * 60 * 1000} startTime={startingSoon} />
        </Row>
      </Section>
    </>
  );
}

function NFTCardContent() {
  const mockNFT = {
    name: 'Radiant #1234',
    collection: 'Radiants Collection',
    price: '12.5',
    tokenId: '1234',
    attributes: [
      { trait_type: 'Background', value: 'Cosmic' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Element', value: 'Fire' },
    ],
  };

  return (
    <>
      <Section title="NFTCard Sizes" variant="h4" subsectionId="nft-card-sizes">
        <div className="flex flex-wrap gap-4 items-end">
          <NFTCard {...mockNFT} size="sm" />
          <NFTCard {...mockNFT} size="md" />
          <NFTCard {...mockNFT} size="lg" />
        </div>
      </Section>
      <Section title="NFTCard Variants" variant="h4" subsectionId="nft-card-variants">
        <div className="flex flex-wrap gap-4">
          <NFTCard {...mockNFT} variant="default" />
          <NFTCard {...mockNFT} variant="compact" />
          <NFTCard {...mockNFT} variant="selectable" selected={false} />
          <NFTCard {...mockNFT} variant="selectable" selected={true} badge="1/1" />
        </div>
      </Section>
    </>
  );
}

function NFTGridContent() {
  const mockNFTs = [
    { id: '1', name: 'Radiant #1', collection: 'Radiants', price: '10' },
    { id: '2', name: 'Radiant #2', collection: 'Radiants', price: '12' },
    { id: '3', name: 'Radiant #3', collection: 'Radiants', price: '8', badge: 'RARE' },
    { id: '4', name: 'Radiant #4', collection: 'Radiants', price: '15' },
    { id: '5', name: 'Radiant #5', collection: 'Radiants', price: '11' },
    { id: '6', name: 'Radiant #6', collection: 'Radiants', price: '9' },
  ];

  const [selectedIds, setSelectedIds] = useState<string[]>(['2', '4']);

  return (
    <>
      <Section title="NFTGrid" variant="h4" subsectionId="nft-grid-default">
        <Row props='columns={3} cardSize="sm" items={mockNFTs}'>
          <NFTGrid items={mockNFTs.slice(0, 3)} columns={3} cardSize="sm" />
        </Row>
      </Section>
      <Section title="Selectable Grid" variant="h4" subsectionId="nft-grid-selectable">
        <Row props='selectable selectedIds={selectedIds} onSelectionChange={...}'>
          <NFTGrid
            items={mockNFTs}
            columns={3}
            cardSize="sm"
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </Row>
      </Section>
    </>
  );
}

function DataTableContent() {
  const mockAdmins = [
    { id: '1', name: 'Kemosabe', wallet: 'fx8dfdsa...', role: 'Owner' },
    { id: '2', name: 'Devour', wallet: 'kj3nf82...', role: 'Admin' },
    { id: '3', name: 'Maroo', wallet: '9xm2kd1...', role: 'Admin' },
  ];

  const mockTimelocks = [
    { id: '1', duration: '3 months', multiplier: '1.25x' },
    { id: '2', duration: '6 months', multiplier: '1.5x' },
    { id: '3', duration: '1 Year', multiplier: '1.75x' },
  ];

  return (
    <>
      <Section title="DataTable" variant="h4" subsectionId="datatable-basic">
        <DataTable
          data={mockAdmins}
          keyAccessor="id"
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Wallet', accessor: 'wallet' },
            { header: 'Role', accessor: 'role' },
          ]}
          actions={[
            { label: 'Edit', onClick: () => {}, variant: 'default' },
            { label: 'Remove', onClick: () => {}, variant: 'danger' },
          ]}
        />
      </Section>
      <Section title="DataTable Variants" variant="h4" subsectionId="datatable-variants">
        <DataTable
          data={mockTimelocks}
          keyAccessor="id"
          headerVariant="yellow"
          compact
          columns={[
            { header: 'Duration', accessor: 'duration' },
            { header: 'Multiplier', accessor: 'multiplier' },
          ]}
          actions={[
            { label: 'Edit', onClick: () => {} },
          ]}
        />
      </Section>
    </>
  );
}

function StatCardContent() {
  return (
    <>
      <Section title="StatCard" variant="h4" subsectionId="statcard-basic">
        <Row props='value="$184.84" label="Solana Price"'>
          <StatCard value="$184.84" label="Solana Price" />
        </Row>
        <Row props='value="7.84" suffix="%" label="Validator APY"'>
          <StatCard value="7.84" suffix="%" label="Validator APY" />
        </Row>
      </Section>
      <Section title="StatCard Variants & Sizes" variant="h4" subsectionId="statcard-variants">
        <div className="flex flex-wrap gap-4">
          <StatCard value="42" label="NFTs" size="sm" />
          <StatCard value="1,234" label="Users" variant="highlight" />
          <StatCard value="99.9" suffix="%" label="Uptime" variant="dark" />
        </div>
      </Section>
      <Section title="StatCard with Trend" variant="h4" subsectionId="statcard-trend">
        <StatCardGroup columns={2}>
          <StatCard
            value="$184.84"
            label="Solana Price"
            trend={{ direction: 'up', value: '+5.2%' }}
          />
          <StatCard
            value="7.84"
            suffix="%"
            label="APY"
            trend={{ direction: 'down', value: '-0.3%' }}
          />
        </StatCardGroup>
      </Section>
    </>
  );
}

function InfoChipContent() {
  return (
    <>
      <Section title="InfoChip" variant="h4" subsectionId="infochip-basic">
        <Row props='children="1XP = $0.0001"'>
          <InfoChipGroup>
            <InfoChip>1XP = $0.0001</InfoChip>
            <InfoChip>Total stake: 90 SOL</InfoChip>
            <InfoChip>Average Lock duration: 1.5 years</InfoChip>
          </InfoChipGroup>
        </Row>
      </Section>
      <Section title="InfoChip Variants" variant="h4" subsectionId="infochip-variants">
        <Row props='variant="default" | "outline" | "filled"'>
          <InfoChipGroup>
            <InfoChip variant="default">Default</InfoChip>
            <InfoChip variant="outline">Outline</InfoChip>
            <InfoChip variant="filled">Filled</InfoChip>
          </InfoChipGroup>
        </Row>
      </Section>
      <Section title="Interactive InfoChips" variant="h4" subsectionId="infochip-interactive">
        <Row props='onClick={() => {...}}'>
          <InfoChipGroup>
            <InfoChip onClick={() => alert('Clicked!')}>Click me</InfoChip>
            <InfoChip onClick={() => {}} disabled>Disabled</InfoChip>
          </InfoChipGroup>
        </Row>
      </Section>
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

// Component sections for search filtering
const COMPONENT_SECTIONS = [
  { id: 'buttons', title: 'Buttons', content: <ButtonsContent /> },
  { id: 'cards', title: 'Cards', content: <CardsContent /> },
  { id: 'forms', title: 'Forms', content: <FormsContent /> },
  { id: 'feedback', title: 'Feedback', content: <FeedbackContent /> },
  { id: 'navigation', title: 'Navigation', content: <NavigationContent /> },
  { id: 'overlays', title: 'Overlays', content: <OverlaysContent /> },
  { id: 'countdown', title: 'Countdown Timer', content: <CountdownTimerContent /> },
  { id: 'nft-cards', title: 'NFT Cards', content: <NFTCardContent /> },
  { id: 'nft-grid', title: 'NFT Grid', content: <NFTGridContent /> },
  { id: 'data-table', title: 'Data Table', content: <DataTableContent /> },
  { id: 'stat-cards', title: 'Stat Cards', content: <StatCardContent /> },
  { id: 'info-chips', title: 'Info Chips', content: <InfoChipContent /> },
];

interface DesignSystemTabProps {
  searchQuery?: string;
}

export function DesignSystemTab({ searchQuery: propSearchQuery = '' }: DesignSystemTabProps) {
  const searchQuery = propSearchQuery;

  // Get matching suggestions (for autocomplete in footer)
  const suggestions = searchQuery
    ? SEARCH_INDEX.filter((item) =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  // Filter sections based on search query
  const filteredSections = searchQuery
    ? (() => {
        const queryLower = searchQuery.toLowerCase().trim();
        
        // Check for exact match first (case-insensitive)
        const exactMatch = SEARCH_INDEX.find(
          (item) => item.text.toLowerCase() === queryLower
        );
        
        if (exactMatch) {
          // If exact match is a subsection, we'll filter subsections via CSS
          if (exactMatch.subsectionTitle) {
            // Show the section containing this subsection
            return COMPONENT_SECTIONS.filter(
              (section) => section.id === exactMatch.sectionId
            );
          }
          // If exact match is a section title, show all subsections in that section
          if (exactMatch.type === 'section') {
            return COMPONENT_SECTIONS.filter(
              (section) => section.id === exactMatch.sectionId
            );
          }
          // Otherwise, only show the section containing that item
          return COMPONENT_SECTIONS.filter(
            (section) => section.id === exactMatch.sectionId
          );
        }
        
        // Check if query matches a subsection title
        const subsectionMatch = Object.keys(SUBSECTION_ID_MAP).find(
          (title) => title.toLowerCase() === queryLower
        );
        
        if (subsectionMatch) {
          const subsectionId = SUBSECTION_ID_MAP[subsectionMatch];
          // Find which section contains this subsection
          const subsectionItem = SEARCH_INDEX.find(
            (item) => item.subsectionTitle === subsectionMatch
          );
          if (subsectionItem) {
            return COMPONENT_SECTIONS.filter(
              (section) => section.id === subsectionItem.sectionId
            );
          }
        }
        
        // Check if query matches a section title
        const sectionMatch = Object.values(SECTION_TITLES).find(
          (title) => title.toLowerCase() === queryLower
        );
        
        if (sectionMatch) {
          // Show all subsections in that section
          const sectionId = Object.keys(SECTION_TITLES).find(
            (id) => SECTION_TITLES[id] === sectionMatch
          );
          if (sectionId) {
            return COMPONENT_SECTIONS.filter(
              (section) => section.id === sectionId
            );
          }
        }
        
        // Otherwise, use the existing fuzzy matching logic
        return COMPONENT_SECTIONS.filter((section) => {
          // Check if section title matches
          if (section.title.toLowerCase().includes(queryLower)) {
            return true;
          }
          // Check if any searchable item in this section matches
          return SEARCH_INDEX.some(
            (item) =>
              item.sectionId === section.id &&
              item.text.toLowerCase().includes(queryLower)
          );
        });
      })()
    : COMPONENT_SECTIONS;

  // Determine which subsection to show (if any)
  const activeSubsectionId = searchQuery
    ? (() => {
        const queryLower = searchQuery.toLowerCase().trim();
        const exactMatch = SEARCH_INDEX.find(
          (item) => item.text.toLowerCase() === queryLower
        );
        if (exactMatch?.subsectionTitle) {
          return SUBSECTION_ID_MAP[exactMatch.subsectionTitle];
        }
        const subsectionMatch = Object.keys(SUBSECTION_ID_MAP).find(
          (title) => title.toLowerCase() === queryLower
        );
        if (subsectionMatch) {
          return SUBSECTION_ID_MAP[subsectionMatch];
        }
        return null;
      })()
    : null;


  return (
    <ToastProvider>
      <div className="flex flex-col h-full overflow-auto pt-4 pb-4 pl-4 pr-2">
        {/* Component Sections */}
        {activeSubsectionId && (
          <style>{`
            div[data-subsection-id]:not([data-subsection-id="${activeSubsectionId}"]) {
              display: none !important;
            }
          `}</style>
        )}
        <div className="space-y-0">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <div key={section.id} className="mb-6">
                <Section title={section.title}>{section.content}</Section>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-content-muted font-mondwest text-base">
              No components match "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
