'use client';

import { useState } from 'react';
import CrtAccordion from '../CrtAccordion';
import { Button } from '../Button';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Badge } from '../Badge';
import CrtTabs from '../CrtTabs';
import { CountdownTimer } from '../CountdownTimer';
import { AnimatedSubtitle } from '../AnimatedSubtitle';

// ============================================================================
// Helpers
// ============================================================================

function Section({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <CrtAccordion.Item value={value}>
      <CrtAccordion.Trigger>{title}</CrtAccordion.Trigger>
      <CrtAccordion.Content>{children}</CrtAccordion.Content>
    </CrtAccordion.Item>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[0.5em] mb-[1em]">
      <code className="font-mono text-[0.75em] text-[var(--panel-accent-65)] uppercase">{label}</code>
      <div className="flex flex-wrap items-center gap-[0.5em]">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ComponentLibraryContent() {
  return (
    <div className="p-[1.5em]">
      {/* Header */}
      <div className="mb-[2em]">
        <h1 className="font-heading text-[2em] text-content-primary uppercase tracking-wider mb-[0.25em]">
          Component Library
        </h1>
        <p className="font-ui text-[0.875em] text-content-secondary uppercase tracking-wider">
          @rdna/monolith design system components
        </p>
      </div>

      {/* Accordion showcase */}
      <CrtAccordion type="multiple" defaultValue={['buttons']}>

        {/* Buttons */}
        <Section title="Button" value="buttons">
          <Row label="variant: primary | secondary | outline | ghost | mono">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="mono">Mono</Button>
          </Row>
          <Row label="size: sm | md | lg">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Row>
          <Row label="states: disabled | loading">
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" loading>Loading</Button>
          </Row>
          <Row label="fullWidth">
            <div className="w-full">
              <Button variant="mono" fullWidth>Full Width Mono</Button>
            </div>
          </Row>
          <Row label="href (renders as link)">
            <Button variant="outline" href="https://solanamobile.com" target="_blank">Visit Solana Mobile</Button>
          </Row>
        </Section>

        {/* Cards */}
        <Section title="Card" value="cards">
          <Row label="variant: default | elevated | glass">
            <div className="grid grid-cols-3 gap-[1em] w-full">
              <Card variant="default">
                <CardHeader><CardTitle>Default</CardTitle></CardHeader>
                <CardContent>Standard card with subtle shadow.</CardContent>
              </Card>
              <Card variant="elevated">
                <CardHeader><CardTitle>Elevated</CardTitle></CardHeader>
                <CardContent>Elevated card with deeper shadow.</CardContent>
              </Card>
              <Card variant="glass">
                <CardHeader><CardTitle>Glass</CardTitle></CardHeader>
                <CardContent>Glassmorphic card with blur.</CardContent>
              </Card>
            </div>
          </Row>
          <Row label="padding: sm | md | lg">
            <Card variant="default" padding="sm"><CardContent>sm padding</CardContent></Card>
            <Card variant="default" padding="md"><CardContent>md padding</CardContent></Card>
            <Card variant="default" padding="lg"><CardContent>lg padding</CardContent></Card>
          </Row>
        </Section>

        {/* Badge */}
        <Section title="Badge" value="badges">
          <Row label="variant: default | success | warning | error | info | custom">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="custom" color="#6939ca">Custom</Badge>
          </Row>
          <Row label="size: sm | md">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
          </Row>
        </Section>

        {/* CrtAccordion */}
        <Section title="CrtAccordion" value="crt-accordion">
          <Row label="type: single (collapsible)">
            <div className="w-full">
              <CrtAccordion type="single" collapsible>
                <CrtAccordion.Item value="demo-1">
                  <CrtAccordion.Trigger>First Section</CrtAccordion.Trigger>
                  <CrtAccordion.Content>Content for the first accordion section. Only one section opens at a time.</CrtAccordion.Content>
                </CrtAccordion.Item>
                <CrtAccordion.Item value="demo-2">
                  <CrtAccordion.Trigger>Second Section</CrtAccordion.Trigger>
                  <CrtAccordion.Content>Content for the second accordion section. Beveled borders and glow effects.</CrtAccordion.Content>
                </CrtAccordion.Item>
              </CrtAccordion>
            </div>
          </Row>
          <Row label="type: multiple">
            <div className="w-full">
              <CrtAccordion type="multiple" defaultValue={['multi-1']}>
                <CrtAccordion.Item value="multi-1">
                  <CrtAccordion.Trigger>Open by default</CrtAccordion.Trigger>
                  <CrtAccordion.Content>This section starts open. Multiple sections can be open simultaneously.</CrtAccordion.Content>
                </CrtAccordion.Item>
                <CrtAccordion.Item value="multi-2">
                  <CrtAccordion.Trigger>Also expandable</CrtAccordion.Trigger>
                  <CrtAccordion.Content>This can open alongside the first section.</CrtAccordion.Content>
                </CrtAccordion.Item>
              </CrtAccordion>
            </div>
          </Row>
        </Section>

        {/* CrtTabs */}
        <Section title="CrtTabs" value="crt-tabs">
          <Row label="uncontrolled with defaultValue">
            <div className="w-full">
              <CrtTabs defaultValue="tab-1">
                <CrtTabs.List>
                  <CrtTabs.Trigger value="tab-1">Overview</CrtTabs.Trigger>
                  <CrtTabs.Trigger value="tab-2">Details</CrtTabs.Trigger>
                  <CrtTabs.Trigger value="tab-3">Code</CrtTabs.Trigger>
                </CrtTabs.List>
                <CrtTabs.Content value="tab-1">
                  <p className="text-content-secondary text-[0.875em]">Overview tab content with CRT-styled triggers and beveled borders.</p>
                </CrtTabs.Content>
                <CrtTabs.Content value="tab-2">
                  <p className="text-content-secondary text-[0.875em]">Details tab with panel-accent glow on active state.</p>
                </CrtTabs.Content>
                <CrtTabs.Content value="tab-3">
                  <pre className="font-mono text-[0.75em] text-[var(--panel-accent)] p-[0.5em] bg-[rgba(0,0,0,0.4)]">
{`<CrtTabs defaultValue="tab-1">
  <CrtTabs.List>
    <CrtTabs.Trigger value="tab-1">Tab</CrtTabs.Trigger>
  </CrtTabs.List>
  <CrtTabs.Content value="tab-1">...</CrtTabs.Content>
</CrtTabs>`}
                  </pre>
                </CrtTabs.Content>
              </CrtTabs>
            </div>
          </Row>
        </Section>

        {/* CountdownTimer */}
        <Section title="CountdownTimer" value="countdown">
          <Row label="format: numeric | text">
            <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" label="ENDS:" />
            <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="text" label="TIME LEFT:" />
          </Row>
          <Row label="size: sm | md | lg">
            <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" size="sm" />
            <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" size="md" />
            <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" size="lg" />
          </Row>
        </Section>

        {/* AnimatedSubtitle */}
        <Section title="AnimatedSubtitle" value="animated-subtitle">
          <Row label="default lines (cycles through 3 headlines)">
            <AnimatedSubtitle />
          </Row>
          <Row label="custom lines">
            <AnimatedSubtitle lines={['CUSTOM TEXT', 'SCRAMBLE TRANSITION', 'CONFIGURABLE FPS']} />
          </Row>
        </Section>

      </CrtAccordion>
    </div>
  );
}
