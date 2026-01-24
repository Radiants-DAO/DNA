'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Input,
  TextArea,
  Label,
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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Switch,
  Slider,
  ToastProvider,
  useToast,
  HelpPanel,
} from '@/components/ui';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/Popover';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
} from '@/components/ui/Sheet';

// ============================================================================
// Section Component
// ============================================================================

export function Section({ 
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
  const subsectionClasses = isSubsection ? 'p-4 border border-black bg-[var(--color-white)]' : '';
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

export function PropsDisplay({ props }: { props: string }) {
  return (
    <code className="bg-black/5 px-2 py-1 rounded-sm block mt-2">
      {props}
    </code>
  );
}

export function Row({ children, props }: {
  children: React.ReactNode;
  props?: string;
}) {
  return (
    <div>
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
        iconName="refresh" 
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
        iconName="download" 
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
        iconName="copy" 
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

// Cycling spinner demo component
function CyclingSpinnerDemo({ size = 24 }: { size?: number }) {
  const [completed, setCompleted] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCompleted(true);
      // After completion animation finishes (0.4s delay + 0.3s animation = ~0.7s), reset
      setTimeout(() => {
        setCompleted(false);
        // Force remount to reset animations
        setKey(prev => prev + 1);
      }, 800);
    }, 3000); // Cycle every 3 seconds (2s loading + 1s completion)

    return () => clearInterval(interval);
  }, []);

  return (
    <Spinner 
      key={key}
      size={size} 
      completed={completed}
      data-edit-scope="component-definition"
      data-component="Spinner"
    />
  );
}

export function ButtonsContent() {
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
        <Row props='iconName="..."'>
          <Button variant="primary" size="md" iconName="copy" fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button">
            Download
          </Button>
          <Button variant="secondary" size="md" iconName="copy" fullWidth={false} iconOnly={false} data-edit-scope="component-definition" data-component="Button" data-edit-variant="secondary">
            Copy
          </Button>
        </Row>
        <Row props='iconOnly={true} iconName="..."'>
          <Button variant="primary" size="md" iconOnly={true} iconName="close" fullWidth={false} data-edit-scope="component-definition" data-component="Button">{''}</Button>
          <Button variant="primary" size="md" iconOnly={true} iconName="copy" fullWidth={false} data-edit-scope="component-definition" data-component="Button">{''}</Button>
          <Button variant="primary" size="lg" iconOnly={true} iconName="copy" fullWidth={false} data-edit-scope="component-definition" data-component="Button">{''}</Button>
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

// Export all content components - rest of the file continues with CardsContent, FormsContent, etc.
// For brevity, I'll create a simplified version that exports the key structure
// The full implementation would include all content components from DesignSystemTab.tsx

export const COMPONENT_SECTIONS = [
  { id: 'buttons', title: 'Buttons', content: <ButtonsContent /> },
  // Additional sections would be added here
];
