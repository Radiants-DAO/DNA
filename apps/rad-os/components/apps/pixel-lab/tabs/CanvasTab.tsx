'use client';

import { useMemo } from 'react';
import { ColorSwatch as CtrlColorSwatch, ControlPanel, IconCell, PropertyRow, Toggle, Tooltip } from '@rdna/ctrl';
import { AppWindow } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { useControlSurfaceSlot } from '@/components/Rad_os/AppWindow';
import {
  StudioRailDropdown,
  StudioRailSection,
} from '@/components/apps/studio/StudioRailSection';

const RESERVED_TOOLS = [
  ['pencil', 'Pen'],
  ['interface-essential-eraser', 'Eraser'],
  ['design-color-bucket', 'Fill'],
  ['slash-small', 'Line'],
  ['outline-box', 'Rect'],
  ['interface-essential-cursor-select', 'Select'],
] as const;

const CANVAS_ACTIONS = [
  ['interface-essential-navigation-left-circle-1', 'Undo'],
  ['interface-essential-navigation-right-circle-1', 'Redo'],
  ['interface-essential-bin', 'Clear'],
  ['sparkles', 'Random'],
] as const;

const CANVAS_COLORS = [
  '#0f0e0c',
  '#f6eed8',
  '#fee28a',
  'transparent',
] as const;

export function CanvasTab() {
  const leftPanel = useMemo(
    () => (
      <StudioRailSection>
        <StudioRailDropdown
          title="CANVAS"
          collapsedIcon={<Icon name="interface-essential-dial-pad-1" />}
          collapsedTooltip="Canvas"
        >
          <ControlPanel density="compact" className="!p-0">
            <div className="grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px">
              <span className="col-span-2 flex h-8 items-center justify-center bg-ctrl-cell-bg font-mono text-xs text-main uppercase tabular-nums">
                64 × 64
              </span>
              <Tooltip side="right" content="Grid reserved">
                <div className="col-span-2 flex h-8 items-center justify-between gap-1 bg-ctrl-cell-bg px-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider text-main">Grid</span>
                  <Toggle
                    value={true}
                    onChange={() => undefined}
                    label="ON"
                    size="sm"
                    disabled
                  />
                </div>
              </Tooltip>
              {CANVAS_ACTIONS.map(([icon, label]) => (
                <IconCell key={label} label={label} size="xl" chromeless disabled>
                  <Icon name={icon} large={icon.includes('interface-essential') || icon.includes('design-')} />
                </IconCell>
              ))}
            </div>
          </ControlPanel>
        </StudioRailDropdown>
        <StudioRailDropdown
          title="TOOLS"
          collapsedIcon={<Icon name="pencil" />}
          collapsedTooltip="Tools"
        >
          <ControlPanel density="compact" className="!p-0">
            <div className="flex h-6 items-center justify-center bg-ctrl-cell-bg font-mono text-xs uppercase text-main">
              Pen
            </div>
            <div className="grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px">
              {RESERVED_TOOLS.map(([icon, label]) => (
                <IconCell key={label} label={label} size="xl" chromeless disabled>
                  <Icon name={icon} large={icon.includes('interface-essential') || icon.includes('design-')} />
                </IconCell>
              ))}
            </div>
          </ControlPanel>
        </StudioRailDropdown>
        <StudioRailDropdown
          title="COLORS"
          collapsedIcon={<Icon name="design-color-painting-palette" />}
          collapsedTooltip="Colors"
        >
          <ControlPanel density="compact" className="!p-0">
            <div
              aria-label="Reserved brush colors"
              className="grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px"
            >
              {CANVAS_COLORS.map((color, index) => (
                <CtrlColorSwatch
                  key={color}
                  color={color}
                  size="xl"
                  borderless
                  selected={index === 0}
                />
              ))}
            </div>
          </ControlPanel>
        </StudioRailDropdown>
      </StudioRailSection>
    ),
    [],
  );

  const rightPanel = useMemo(
    () => (
      <StudioRailSection>
        <StudioRailDropdown
          title="LAYERS"
          collapsedIcon={<Icon name="grid-3x3" />}
          collapsedTooltip="Layers"
        >
          {['Layer 3', 'Layer 2', 'Layer 1'].map((label) => (
            <PropertyRow key={label} label={label.toUpperCase()} chrome="flush" size="xl" divider={false}>
              <span className="font-mono text-[0.625rem] uppercase text-ctrl-label">Reserved</span>
            </PropertyRow>
          ))}
        </StudioRailDropdown>
        <StudioRailDropdown
          title="DETAILS"
          collapsedIcon={<Icon name="info" />}
          collapsedTooltip="Details"
        >
          <PropertyRow label="SIZE" chrome="flush" size="xl" divider={false}>
            <span className="font-mono text-[0.625rem] text-ctrl-text-active">64 x 64</span>
          </PropertyRow>
          <PropertyRow label="MODE" chrome="flush" size="xl" divider={false}>
            <span className="font-mono text-[0.625rem] uppercase text-ctrl-label">Canvas</span>
          </PropertyRow>
        </StudioRailDropdown>
      </StudioRailSection>
    ),
    [],
  );

  const bottomPanel = useMemo(
    () => (
      <ControlPanel density="compact" className="w-full">
        <div className="grid gap-px font-mono text-[0.625rem] uppercase tracking-normal sm:grid-cols-4">
          {['64 x 64', 'Zoom 100%', 'Tool pen', 'Layer 1'].map((label) => (
            <div key={label} className="bg-ctrl-cell-bg px-2 py-1 text-ctrl-label">
              {label}
            </div>
          ))}
        </div>
      </ControlPanel>
    ),
    [],
  );

  const leftSlot = useMemo(
    () => ({
      side: 'left' as const,
      maxWidth: 148,
      label: 'Canvas',
      hideTab: true,
      isOpen: true,
      children: leftPanel,
    }),
    [leftPanel],
  );
  const rightSlot = useMemo(
    () => ({
      side: 'right' as const,
      maxWidth: 320,
      label: 'Details',
      hideTab: true,
      isOpen: true,
      children: rightPanel,
    }),
    [rightPanel],
  );
  const bottomSlot = useMemo(
    () => ({
      side: 'bottom' as const,
      variant: 'drawer' as const,
      label: 'Status',
      hideTab: true,
      isOpen: true,
      children: bottomPanel,
    }),
    [bottomPanel],
  );

  useControlSurfaceSlot(leftSlot);
  useControlSurfaceSlot(rightSlot);
  useControlSurfaceSlot(bottomSlot);

  return (
    <AppWindow.Content layout="single" className="bg-brand-stage">
      <div className="flex-1 min-w-0 min-h-0 p-2">
        <AppWindow.Island
          corners="pixel"
          padding="none"
          noScroll
          className="mx-auto aspect-square h-full max-h-full max-w-full"
        >
          <section
            aria-label="Reserved canvas surface"
            aria-labelledby="pixel-lab-canvas-title"
            className="h-full min-h-0 bg-page text-ctrl-label"
          >
            <h2 id="pixel-lab-canvas-title" className="sr-only">
              Canvas workbench reserved
            </h2>
            <div className="flex h-full min-h-0 items-center justify-center bg-page p-4">
              <div className="grid aspect-square h-full max-h-full max-w-full grid-cols-8 grid-rows-8 gap-px bg-rule p-px">
                {Array.from({ length: 64 }, (_, index) => (
                  <div key={index} className="bg-page" />
                ))}
              </div>
            </div>
          </section>
        </AppWindow.Island>
      </div>
    </AppWindow.Content>
  );
}

export default CanvasTab;
