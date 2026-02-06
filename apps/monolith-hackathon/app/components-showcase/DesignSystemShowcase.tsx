'use client';

import { useState } from 'react';
import CrtAccordion from '../components/CrtAccordion';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import CrtTabs from '../components/CrtTabs';
import { CalendarGrid, CATEGORY_COLORS } from '../components/CalendarGrid';
import type { CalendarEvent } from '../components/CalendarGrid';
import { CountdownTimer } from '../components/CountdownTimer';
import { AnimatedSubtitle } from '../components/AnimatedSubtitle';
import { AppWindow } from '../components/AppWindow';
import { useWindowManager } from '../hooks/useWindowManager';

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
// Sample Data
// ============================================================================

const SAMPLE_EVENTS: CalendarEvent[] = [
  { label: 'Hackathon Launch', category: 'launch', time: '12:00 UTC', description: 'Monolith hackathon begins' },
  { label: 'Vibe Coding Session', category: 'vibecoding', time: '18:00 UTC', description: 'Community build session' },
  { label: 'Dev Workshop', category: 'devshop', time: '15:00 UTC', description: 'Solana SDK deep dive' },
  { label: 'Submission Deadline', category: 'deadline', time: '23:59 UTC', description: 'Final submissions due' },
  { label: 'Demo Day', category: 'milestone', time: '17:00 UTC', description: 'Project presentations' },
  { label: 'mtnDAO Summit', category: 'mtndao', time: '09:00 MST', description: 'Mountain DAO gathering' },
];

function buildSampleEventMap(): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  const today = new Date();
  SAMPLE_EVENTS.forEach((ev, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i * 3);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    map.set(key, [ev]);
  });
  return map;
}

// ============================================================================
// Main Component
// ============================================================================

export default function DesignSystemShowcase() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { openWindow, isWindowOpen } = useWindowManager();

  const eventsByDate = buildSampleEventMap();
  const postCountByDate = new Map<string, number>();
  eventsByDate.forEach((events, key) => postCountByDate.set(key, events.length));

  const now = new Date();

  return (
    <div
      className="min-h-screen bg-[var(--color-surface-body)] text-white p-[2em]"
      style={{
        // Provide panel-accent vars outside the door overlay context
        '--panel-accent': '#b494f7',
        '--panel-accent-65': 'rgba(180, 148, 247, 0.65)',
        '--panel-accent-50': 'rgba(180, 148, 247, 0.5)',
        '--panel-accent-40': 'rgba(180, 148, 247, 0.4)',
        '--panel-accent-30': 'rgba(180, 148, 247, 0.3)',
        '--panel-accent-20': 'rgba(180, 148, 247, 0.2)',
        '--panel-accent-15': 'rgba(180, 148, 247, 0.15)',
        '--panel-accent-08': 'rgba(180, 148, 247, 0.08)',
      } as React.CSSProperties}
    >
      <div className="max-w-[60em] mx-auto">
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

          {/* ── Buttons ── */}
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

          {/* ── Cards ── */}
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

          {/* ── Badge ── */}
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

          {/* ── CrtAccordion ── */}
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

          {/* ── CrtTabs ── */}
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

          {/* ── CalendarGrid ── */}
          <Section title="CalendarGrid" value="calendar-grid">
            <Row label="monthly view with category events">
              <div className="w-full max-w-[28em]">
                <CalendarGrid
                  year={now.getFullYear()}
                  month={now.getMonth()}
                  eventsByDate={eventsByDate}
                  postCountByDate={postCountByDate}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </div>
            </Row>
            <Row label="category colors">
              <div className="flex flex-wrap gap-[0.75em]">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-[0.35em]">
                    <span className="w-[0.5em] h-[0.5em] rounded-full" style={{ background: color }} />
                    <span className="font-ui text-[0.75em] uppercase text-content-secondary">{cat}</span>
                  </div>
                ))}
              </div>
            </Row>
          </Section>

          {/* ── CountdownTimer ── */}
          <Section title="CountdownTimer" value="countdown">
            <Row label="format: numeric | text">
              <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" label="ENDS:" />
              <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="text" label="TIME LEFT:" />
            </Row>
            <Row label="placement: inline | block | watermark">
              <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" placement="inline" label="INLINE:" />
              <div className="w-full">
                <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" placement="block" label="BLOCK:" />
              </div>
            </Row>
            <Row label="size: sm | md | lg">
              <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" size="sm" />
              <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" size="md" />
              <CountdownTimer targetDate="2026-03-09T23:59:59Z" format="numeric" size="lg" />
            </Row>
          </Section>

          {/* ── AnimatedSubtitle ── */}
          <Section title="AnimatedSubtitle" value="animated-subtitle">
            <Row label="default lines (cycles through 3 headlines)">
              <AnimatedSubtitle />
            </Row>
            <Row label="custom lines">
              <AnimatedSubtitle lines={['CUSTOM TEXT', 'SCRAMBLE TRANSITION', 'CONFIGURABLE FPS']} />
            </Row>
          </Section>

          {/* ── AppWindow ── */}
          <Section title="AppWindow" value="app-window">
            <Row label="draggable, resizable window">
              <div className="w-full">
                <Button
                  variant="mono"
                  onClick={() => openWindow('demo-window', { width: 500, height: 300 })}
                >
                  {isWindowOpen('demo-window') ? 'Window Open' : 'Open Demo Window'}
                </Button>
                <p className="font-body text-[0.8125em] text-content-secondary mt-[0.5em]">
                  Click to open a draggable, resizable AppWindow. Drag the title bar to move it. Uses Zustand for window state management.
                </p>
              </div>
            </Row>
            <Row label="props">
              <pre className="font-mono text-[0.75em] text-[var(--panel-accent)] p-[0.5em] bg-[rgba(0,0,0,0.4)] w-full">
{`interface AppWindowProps {
  id: string;          // Unique window identifier
  title: string;       // Title bar text
  children: ReactNode; // Window content
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  resizable?: boolean; // Enable resize handles
  onClose?: () => void;
  actionButton?: { text: string; onClick?: () => void; href?: string };
}`}
              </pre>
            </Row>
          </Section>

          {/* ── OrbitalNav ── */}
          <Section title="OrbitalNav" value="orbital-nav">
            <Row label="props (complex animation component — see home page for live demo)">
              <pre className="font-mono text-[0.75em] text-[var(--panel-accent)] p-[0.5em] bg-[rgba(0,0,0,0.4)] w-full">
{`interface OrbitalNavProps {
  items: OrbitalItem[];     // Array of nav items
  onSelect: (id) => void;   // Selection callback
  isWindowOpen: boolean;     // Triggers dismiss animation
  activeId: string | null;   // Currently active item
}

interface OrbitalItem {
  id: string;
  icon: string;             // Icon path
  label: string;            // Text label
  phaseOffset: number;      // Radians offset on orbit
  glowColor: string;        // Hover glow color
  iconScale?: number;       // Scale multiplier
}`}
              </pre>
            </Row>
          </Section>

          {/* ── ShaderBackground ── */}
          <Section title="ShaderBackground" value="shader-bg">
            <Row label="WebGL dithering shader (see home page for live demo)">
              <p className="font-body text-[0.8125em] text-content-secondary">
                Full-viewport WebGL shader using @paper-design/shaders-react Dithering component.
                Supports animatable scale, rotation, color transitions, and mobile-specific settings with reduced motion.
              </p>
            </Row>
            <Row label="shape presets">
              <div className="flex flex-wrap gap-[0.5em]">
                {['sphere', 'wave', 'dots', 'ripple', 'swirl', 'warp'].map((shape) => (
                  <Badge key={shape} variant="default">{shape}</Badge>
                ))}
              </div>
            </Row>
            <Row label="dither types">
              <div className="flex flex-wrap gap-[0.5em]">
                {['2x2', '4x4', '8x8', 'random'].map((type) => (
                  <Badge key={type} variant="default">{type}</Badge>
                ))}
              </div>
            </Row>
          </Section>

        </CrtAccordion>
      </div>

      {/* Floating AppWindow demo (rendered outside the accordion) */}
      <AppWindow
        id="demo-window"
        title="DEMO.EXE"
        defaultSize={{ width: 500, height: 300 }}
        resizable
      >
        <div className="p-[1em]">
          <h3 className="font-heading text-[1.125em] text-content-primary mb-[0.5em]">AppWindow Demo</h3>
          <p className="font-body text-[0.875em] text-content-secondary mb-[1em]">
            This is a draggable, resizable window component. Drag the title bar to move it.
            Resize by grabbing the edges or corners.
          </p>
          <div className="flex gap-[0.5em]">
            <Badge variant="success">Draggable</Badge>
            <Badge variant="info">Resizable</Badge>
            <Badge variant="custom" color="#6939ca">Zustand</Badge>
          </div>
        </div>
      </AppWindow>
    </div>
  );
}
