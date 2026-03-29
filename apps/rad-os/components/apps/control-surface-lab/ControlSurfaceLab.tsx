'use client';

import { useMemo, useState } from 'react';
import {
  AppWindowPane,
  AppWindowSplitView,
  Badge,
  Button,
  ScrollArea,
} from '@rdna/radiants/components/core';
import {
  CONTROL_SURFACE_FIXTURES,
  CONTROL_SURFACE_SCENARIOS,
  type ControlSurfaceScenario,
  type SurfaceFixture,
} from './fixtures';
import * as Mocks from './mocks';
import * as Shells from './shells';

type CompareSide = 'legacy' | 'rdna';
type SurfaceComponent = React.ComponentType;

const MOCK_MAP: Record<ControlSurfaceScenario, Record<string, SurfaceComponent>> = {
  controls: {
    'color-picker': Mocks.ColorPickerMock,
    'shadow-editor': Mocks.ShadowEditorMock,
    'box-spacing': Mocks.BoxSpacingMock,
    'border-radius': Mocks.BorderRadiusMock,
  },
  annotations: {
    'composer-shell': Mocks.ComposerShellMock,
    'annotation-composer': Mocks.AnnotationComposerMock,
    'annotation-detail': Mocks.AnnotationDetailMock,
    'annotation-pin': Mocks.AnnotationPinMock,
  },
  overlays: {
    'hover-overlay': Mocks.HoverOverlayMock,
    'inspect-toolbar': Mocks.InspectToolbarMock,
    'comment-popover': Mocks.CommentPopoverMock,
  },
};

const SHELL_MAP: Record<ControlSurfaceScenario, Record<string, SurfaceComponent>> = {
  controls: {
    'color-picker': Shells.ColorPickerShell,
    'shadow-editor': Shells.ShadowEditorShell,
    'box-spacing': Shells.BoxSpacingShell,
    'border-radius': Shells.BorderRadiusShell,
  },
  annotations: {
    'composer-shell': Shells.ComposerShellRdna,
    'annotation-composer': Shells.AnnotationComposerRdna,
    'annotation-detail': Shells.AnnotationDetailRdna,
    'annotation-pin': Shells.AnnotationPinRdna,
  },
  overlays: {
    'hover-overlay': Shells.HoverOverlayRdna,
    'inspect-toolbar': Shells.InspectToolbarRdna,
    'comment-popover': Shells.CommentPopoverRdna,
  },
};

function PaneHeader({
  title,
  summary,
  badge,
  badgeVariant,
}: {
  title: string;
  summary: string;
  badge: string;
  badgeVariant: 'warning' | 'success';
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-rule px-3 py-3">
      <div className="space-y-1">
        <div className="font-heading text-xs uppercase tracking-wide text-mute">{title}</div>
        <p className="max-w-[42ch] text-sm text-mute">{summary}</p>
      </div>
      <Badge variant={badgeVariant} size="sm">
        {badge}
      </Badge>
    </div>
  );
}

function ControlPreview({ side }: { side: CompareSide }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-tight text-mute">
        <span>Exposure</span>
        <span>{side === 'legacy' ? '0.72' : 'token'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded border border-rule bg-page">
        <div className={`h-full ${side === 'legacy' ? 'w-2/3 bg-warning' : 'w-1/2 bg-accent'}`} />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 shrink-0 rounded border border-line bg-warning/70" />
        <div className="flex-1 rounded border border-rule bg-page px-2 py-1 font-mono text-[11px] text-mute">
          {side === 'legacy' ? '#f5c542' : 'oklch(0.82 0.13 88)'}
        </div>
      </div>
    </div>
  );
}

function AnnotationPreview({ side }: { side: CompareSide }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Badge size="sm" variant={side === 'legacy' ? 'warning' : 'success'}>
          {side === 'legacy' ? 'pin' : 'rdna'}
        </Badge>
        <Badge size="sm" variant="default">
          P2
        </Badge>
      </div>
      <div className="rounded border border-rule bg-page p-2">
        <div className="mb-2 h-2 w-2/3 rounded bg-rule" />
        <div className="mb-1 h-2 w-full rounded bg-rule/80" />
        <div className="h-2 w-3/4 rounded bg-rule/70" />
      </div>
      <div className="flex gap-1">
        <div className="h-6 flex-1 rounded border border-line bg-card" />
        <div className={`h-6 w-16 rounded border ${side === 'legacy' ? 'border-warning bg-warning/20' : 'border-accent bg-accent/20'}`} />
      </div>
    </div>
  );
}

function OverlayPreview({ side }: { side: CompareSide }) {
  return (
    <div className="relative h-24 overflow-hidden rounded border border-dashed border-rule bg-page">
      <div className={`absolute left-2 top-2 rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-tight ${side === 'legacy' ? 'border-warning bg-warning/20 text-main' : 'border-accent bg-accent/20 text-main'}`}>
        hover target
      </div>
      <div className="absolute bottom-2 left-2 right-2 rounded border border-line bg-card p-2">
        <div className="mb-2 h-2 w-1/2 rounded bg-rule" />
        <div className="h-2 w-4/5 rounded bg-rule/80" />
      </div>
    </div>
  );
}

function SurfacePreview({
  scenario,
  side,
}: {
  scenario: ControlSurfaceScenario;
  side: CompareSide;
}) {
  if (scenario === 'annotations') {
    return <AnnotationPreview side={side} />;
  }
  if (scenario === 'overlays') {
    return <OverlayPreview side={side} />;
  }
  return <ControlPreview side={side} />;
}

/** Renders the real mock or shell component, falling back to generic preview */
function SurfaceRendered({
  scenario,
  surface,
  side,
}: {
  scenario: ControlSurfaceScenario;
  surface: SurfaceFixture;
  side: CompareSide;
}) {
  const map = side === 'legacy' ? MOCK_MAP : SHELL_MAP;
  const Component = map[scenario]?.[surface.id];
  if (Component) return <Component />;
  return <SurfacePreview scenario={scenario} side={side} />;
}

function SurfaceCard({
  scenario,
  surface,
  side,
}: {
  scenario: ControlSurfaceScenario;
  surface: SurfaceFixture;
  side: CompareSide;
}) {
  const pathLabel = side === 'legacy' ? surface.legacyLabel : surface.rdnaLabel;
  const pathValue = side === 'legacy' ? surface.legacyPath : surface.rdnaPath;
  const status = side === 'legacy' ? 'reference mock' : 'target scaffold';

  return (
    <article className="space-y-3 rounded border border-line bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm text-main">{surface.title}</h3>
          <p className="text-sm text-mute">{surface.summary}</p>
        </div>
        <Badge size="sm" variant={side === 'legacy' ? 'warning' : 'success'}>
          {status}
        </Badge>
      </div>

      <SurfaceRendered scenario={scenario} surface={surface} side={side} />

      <div className="rounded border border-rule bg-page px-2 py-2">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-tight text-mute">
          {pathLabel}
        </div>
        <div className="font-mono text-[11px] leading-relaxed text-main break-all">
          {pathValue}
        </div>
      </div>
    </article>
  );
}

function ComparePane({
  title,
  summary,
  badge,
  badgeVariant,
  scenario,
  surfaces,
  side,
}: {
  title: string;
  summary: string;
  badge: string;
  badgeVariant: 'warning' | 'success';
  scenario: ControlSurfaceScenario;
  surfaces: SurfaceFixture[];
  side: CompareSide;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PaneHeader title={title} summary={summary} badge={badge} badgeVariant={badgeVariant} />
      <ScrollArea.Root className="flex-1 min-h-0">
        <ScrollArea.Viewport>
          <div className="space-y-2 p-3">
            {surfaces.map((surface) => (
              <SurfaceCard
                key={`${side}-${surface.id}`}
                scenario={scenario}
                surface={surface}
                side={side}
              />
            ))}
          </div>
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    </div>
  );
}

export function ControlSurfaceLab() {
  const [scenario, setScenario] = useState<ControlSurfaceScenario>('controls');

  const scenarioMeta = useMemo(
    () => CONTROL_SURFACE_SCENARIOS.find((item) => item.id === scenario) ?? CONTROL_SURFACE_SCENARIOS[0],
    [scenario],
  );
  const surfaces = CONTROL_SURFACE_FIXTURES[scenario];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-page to-cream/40 dark:from-page dark:to-card">
      <div className="border-b border-rule px-3 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-heading text-xs uppercase tracking-wide text-mute">Control Surface Lab</div>
            <p className="max-w-[64ch] text-sm text-mute">
              Dedicated RadOS compare launcher for donor mocks on the left and RDNA package targets on the right.
            </p>
          </div>
          <Badge variant="warning">phase 0 scaffold</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {CONTROL_SURFACE_SCENARIOS.map((item) => (
            <Button
              key={item.id}
              size="sm"
              compact
              quiet={scenario !== item.id}
              onClick={() => setScenario(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mt-2 font-mono text-[11px] uppercase tracking-tight text-mute">
          {scenarioMeta.description}
        </div>
      </div>

      <AppWindowSplitView className="pt-2">
        <AppWindowPane padding="none" noScroll>
          <ComparePane
            title="Legacy Reference"
            summary="App-local mock shells for DialKit, Interface Kit, playground donors, and old flow surfaces."
            badge="left"
            badgeVariant="warning"
            scenario={scenario}
            surfaces={surfaces}
            side="legacy"
          />
        </AppWindowPane>

        <AppWindowPane padding="none" noScroll>
          <ComparePane
            title="RDNA Target"
            summary="Real Radiants component destinations and scaffolds that will replace the legacy reference side."
            badge="right"
            badgeVariant="success"
            scenario={scenario}
            surfaces={surfaces}
            side="rdna"
          />
        </AppWindowPane>
      </AppWindowSplitView>
    </div>
  );
}

export default ControlSurfaceLab;
