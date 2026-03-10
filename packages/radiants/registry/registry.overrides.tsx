'use client';

import React, { useState } from 'react';
import type { DisplayMeta } from './types';
import {
  Card, CardHeader, CardBody, CardFooter,
  Alert,
  Button,
  Tooltip,
  Accordion, useAccordionState,
  Breadcrumbs,
  Progress,
  Checkbox,
  Switch,
  Slider,
  Input, Label,
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

  // ── Curated variants for simple components ─────────────────────────

  Button: {
    variants: [
      { label: 'Primary', props: { children: 'Primary', variant: 'primary' } },
      { label: 'Secondary', props: { children: 'Secondary', variant: 'secondary' } },
      { label: 'Outline', props: { children: 'Outline', variant: 'outline' } },
      { label: 'Ghost', props: { children: 'Ghost', variant: 'ghost' } },
      { label: 'Destructive', props: { children: 'Destructive', variant: 'destructive' } },
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
