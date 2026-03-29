'use client';

export type ControlSurfaceScenario = 'controls' | 'annotations' | 'overlays';

export interface SurfaceFixture {
  id: string;
  title: string;
  summary: string;
  legacyLabel: string;
  legacyPath: string;
  rdnaLabel: string;
  rdnaPath: string;
}

export const CONTROL_SURFACE_SCENARIOS: Array<{
  id: ControlSurfaceScenario;
  label: string;
  description: string;
}> = [
  {
    id: 'controls',
    label: 'Controls',
    description: 'DialKit and Interface Kit style controls against RDNA control-surface targets.',
  },
  {
    id: 'annotations',
    label: 'Annotations',
    description: 'Comment boxes, pins, and detail cards from playground and flow donors.',
  },
  {
    id: 'overlays',
    label: 'Overlays',
    description: 'Hover surfaces, inspect chrome, and toolbar-style compare shells.',
  },
];

export const CONTROL_SURFACE_FIXTURES: Record<ControlSurfaceScenario, SurfaceFixture[]> = {
  controls: [
    {
      id: 'color-picker',
      title: 'Color Picker',
      summary: 'Compound color control with swatch, value readout, and expanded editing surface.',
      legacyLabel: 'Sandbox donor',
      legacyPath:
        'sandbox/flow/packages/extension/src/panel/components/designer/ColorPicker.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/ColorPicker/ColorPicker.tsx',
    },
    {
      id: 'shadow-editor',
      title: 'Shadow Editor',
      summary: 'Layered shadow editing surface with rows for offsets, blur, spread, and color.',
      legacyLabel: 'Sandbox donor',
      legacyPath:
        'sandbox/flow/packages/extension/src/panel/components/designer/ShadowEditor.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/ShadowEditor/ShadowEditor.tsx',
    },
    {
      id: 'box-spacing',
      title: 'Box Spacing',
      summary: 'Linked and unlinked box model control for padding, margin, and gap style inputs.',
      legacyLabel: 'Sandbox donor',
      legacyPath:
        'sandbox/flow/packages/extension/src/panel/components/designer/sections/SpacingSection.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/BoxSpacing/BoxSpacing.tsx',
    },
    {
      id: 'border-radius',
      title: 'Border Radius Editor',
      summary: 'Corner radius compare view for linked and independent radius controls.',
      legacyLabel: 'Sandbox donor',
      legacyPath:
        'sandbox/flow/packages/extension/src/panel/components/designer/sections/BordersSection.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/BorderRadiusEditor/BorderRadiusEditor.tsx',
    },
    {
      id: 'dialkit-full-panel',
      title: 'DialKit Full Panel',
      summary: 'Complete DialKit parameter panel — every control type: slider, toggle, color, text, select, spring, action, folder.',
      legacyLabel: 'DialKit panel',
      legacyPath:
        'node_modules/dialkit — useDialKit + DialRoot',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/controls/src/panel/ControlPanel.tsx',
    },
    {
      id: 'interface-kit-full-panel',
      title: 'Interface Kit Full Panel',
      summary: 'Complete Interface Kit design panel — Style, Typography, and Layout tabs with all controls.',
      legacyLabel: 'Interface Kit panel',
      legacyPath:
        'node_modules/interface-kit — InterfaceKit component',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/controls/src/panel/ControlPanel.tsx',
    },
  ],
  annotations: [
    {
      id: 'composer-shell',
      title: 'Composer Shell',
      summary: 'Anchored shell for comments, prompts, and follow-up actions.',
      legacyLabel: 'Playground donor',
      legacyPath:
        'tools/playground/app/playground/components/ComposerShell.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/AnnotationSurface/ComposerShell.tsx',
    },
    {
      id: 'annotation-composer',
      title: 'Annotation Composer',
      summary: 'Form-level annotation entry surface with intent and priority controls.',
      legacyLabel: 'Playground donor',
      legacyPath:
        'tools/playground/app/playground/components/AnnotationComposer.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/AnnotationSurface/AnnotationComposer.tsx',
    },
    {
      id: 'annotation-detail',
      title: 'Annotation Detail',
      summary: 'Pinned comment detail card with message, resolution, and timestamp zones.',
      legacyLabel: 'Playground donor',
      legacyPath:
        'tools/playground/app/playground/components/AnnotationDetail.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/AnnotationSurface/AnnotationDetail.tsx',
    },
    {
      id: 'annotation-pin',
      title: 'Annotation Pin',
      summary: 'Compact pin and badge language for anchored feedback markers.',
      legacyLabel: 'Playground donor',
      legacyPath:
        'tools/playground/app/playground/components/AnnotationPin.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/AnnotationSurface/AnnotationPin.tsx',
    },
  ],
  overlays: [
    {
      id: 'hover-overlay',
      title: 'Hover Overlay',
      summary: 'Lightweight hover shell for inspect and preview affordances.',
      legacyLabel: 'Flow reference',
      legacyPath:
        'sandbox/flow/packages/extension/src/content/modes/tools/inspectTooltip.ts',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/AnnotationSurface/OverlayHoverCard.tsx',
    },
    {
      id: 'inspect-toolbar',
      title: 'Inspect Toolbar',
      summary: 'Floating mode toolbar and compare shell for inspect and edit actions.',
      legacyLabel: 'Flow-0 reference',
      legacyPath:
        'archive/flow-0/app/components/FloatingModeBar.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/ControlPanel/ControlPanel.tsx',
    },
    {
      id: 'comment-popover',
      title: 'Comment Popover',
      summary: 'Anchored overlay shape for feedback and note entry without persistence yet.',
      legacyLabel: 'Flow-0 reference',
      legacyPath:
        'archive/flow-0/app/components/CommentPopover.tsx',
      rdnaLabel: 'RDNA target',
      rdnaPath:
        'packages/radiants/components/core/AnnotationSurface/AnnotationBadge.tsx',
    },
  ],
};
