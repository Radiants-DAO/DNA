'use client';

// =============================================================================
// PixelPlaygroundControls — left-dock control surface for PixelPlayground.
//
// Presentational. All state + handlers live in the parent (PixelPlayground).
// Sections mirror the existing playground UI:
//   1. MODE     — ButtonStrip: Corners / Patterns / Icons
//   2. SIZE     — LCD readout + decrement/increment
//   3. TOOL     — IconCell grid of brush tools (Pen / Eraser / Fill / …)
//   4. EDIT     — Undo / Redo / Clear + grid-visibility toggle
//   5. LIBRARY  — RegistryRow list for the active mode (+New + per-entry)
// =============================================================================

import { useId, useMemo, useState } from 'react';
import {
  ActionButton,
  ButtonStrip,
  ControlPanel,
  IconCell,
  PropertyRow,
  RegistryRow,
  Section,
  Slider,
  Stepper,
  Toggle as CtrlToggle,
  Tooltip,
} from '@rdna/ctrl';
import {
  Button,
  Input,
  ScrollArea,
  Switch,
  ToggleGroup,
} from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import type { PixelGrid } from '@rdna/pixel';
import { BrushTool } from '@/lib/dotting';
import {
  iconInventoryIconToPixelGrid,
  type IconInventoryIcon,
} from '@/lib/icon-inventory';
import {
  DEFAULT_CORNER_PREVIEW_SETTINGS,
  type CornerPreviewSettings,
  type PixelMode,
} from './types';
import { MODE_CONFIG, TOOL_DEFS } from './constants';
import {
  filterIconMappingEntries,
  isIconMappingModeActive,
  type IconMappingState,
} from './icon-mapping';
import { PixelThumb } from './PixelThumb';

// ─── Types ───────────────────────────────────────────────────────────────

export interface PixelPlaygroundControlsProps {
  // MODE
  mode: PixelMode;
  availableModes: ReadonlyArray<PixelMode>;
  onModeChange: (mode: PixelMode) => void;
  showModeControl?: boolean;

  // SIZE
  gridSize: number;
  sizeMin: number;
  sizeMax: number;
  onSizeDecrement: () => void;
  onSizeIncrement: () => void;
  onSizeChange?: (size: number) => void;

  // TOOL
  activeTool: BrushTool;
  onToolChange: (tool: BrushTool) => void;

  // EDIT
  isGridVisible: boolean;
  onGridVisibleChange: (visible: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;

  // LIBRARY
  registryEntries: readonly PixelGrid[];
  selectedEntryName: string | null;
  onSelectEntry: (entry: PixelGrid | null) => void;
  iconLibraryEntries?: readonly IconInventoryIcon[];
  iconMappingState?: IconMappingState;
  onIconFilterChange?: (filter: Pick<IconMappingState, 'show21' | 'show16'>) => void;
  onIconMapModeChange?: (mapMode: boolean) => void;
  onSelectIconLibraryEntry?: (entry: IconInventoryIcon) => void;
  cornerPreviewSettings?: CornerPreviewSettings;
  onCornerPreviewSettingsChange?: (settings: CornerPreviewSettings) => void;

  variant?: 'full' | 'toolbar' | 'canvasPane' | 'settings' | 'library';
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────

export function PixelPlaygroundControls({
  mode,
  availableModes,
  onModeChange,
  showModeControl,

  gridSize,
  sizeMin,
  sizeMax,
  onSizeDecrement,
  onSizeIncrement,
  onSizeChange,

  activeTool,
  onToolChange,

  isGridVisible,
  onGridVisibleChange,
  onUndo,
  onRedo,
  onClear,

  registryEntries,
  selectedEntryName,
  onSelectEntry,
  iconLibraryEntries,
  iconMappingState,
  onIconFilterChange,
  onIconMapModeChange,
  onSelectIconLibraryEntry,
  cornerPreviewSettings,
  onCornerPreviewSettingsChange,

  variant = 'full',
  className = '',
}: PixelPlaygroundControlsProps) {
  const panelId = useId();
  const libraryHintId = useId();
  const [libraryView, setLibraryView] = useState<'grid' | 'list'>('grid');

  // Sequential section counter — matches LogoMakerControls.
  let secCounter = 0;
  const nextSec = () => ++secCounter;

  const isFixedSize = sizeMin === sizeMax;
  const visibleTools = TOOL_DEFS.filter((t) => !t.hidden);
  const activeToolLabel = visibleTools.find((def) => def.tool === activeTool)?.label ?? 'Pen';
  const [libraryQuery, setLibraryQuery] = useState('');
  const usesIconInventoryLibrary = mode === 'icons' && Boolean(iconLibraryEntries);
  const filteredIconEntries = useMemo(() => {
    if (!usesIconInventoryLibrary || !iconMappingState) return [];
    const iconEntries = iconLibraryEntries ?? [];
    const q = libraryQuery.trim().toLowerCase();
    const filteredBySize = filterIconMappingEntries(iconEntries, iconMappingState);
    if (!q) return filteredBySize;
    return filteredBySize.filter((entry) => entry.name.toLowerCase().includes(q));
  }, [iconLibraryEntries, iconMappingState, libraryQuery, usesIconInventoryLibrary]);
  const filteredRegistryEntries = useMemo(() => {
    if (usesIconInventoryLibrary) return [];
    const q = libraryQuery.trim().toLowerCase();
    if (!q) return registryEntries;
    return registryEntries.filter((entry) => entry.name.toLowerCase().includes(q));
  }, [libraryQuery, registryEntries, usesIconInventoryLibrary]);
  const libraryCount = usesIconInventoryLibrary
    ? filteredIconEntries.length
    : filteredRegistryEntries.length;
  const canMapIcons = Boolean(iconMappingState?.show21 && iconMappingState.show16);
  const mappingModeActive = iconMappingState ? isIconMappingModeActive(iconMappingState) : false;
  const resolvedCornerPreviewSettings =
    cornerPreviewSettings ?? DEFAULT_CORNER_PREVIEW_SETTINGS;

  const updateCornerPreviewSetting = (
    nextValue: number,
    min: number,
    max: number,
  ) => {
    onCornerPreviewSettingsChange?.({
      ...resolvedCornerPreviewSettings,
      pixelScale: Math.min(max, Math.max(min, nextValue)),
    });
  };

  if (variant === 'toolbar') {
    return (
      <ControlPanel
        density="compact"
        className={['!p-0', className].filter(Boolean).join(' ')}
      >
        <div
          role="radiogroup"
          aria-label="Brush tool"
          className="grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px"
        >
          <div className="col-span-2 flex h-6 items-center justify-center bg-ctrl-cell-bg font-mono text-xs uppercase text-main">
            {activeToolLabel}
          </div>
          {visibleTools.map((def) => (
            <Tooltip key={def.tool} side="right" content={def.label}>
              <span className="inline-flex">
                <IconCell
                  mode="radio"
                  size="xl"
                  chromeless
                  selected={def.tool === activeTool}
                  label={def.label}
                  onClick={() => onToolChange(def.tool)}
                >
                  {def.large ? <Icon name={def.icon} large /> : <Icon name={def.icon} />}
                </IconCell>
              </span>
            </Tooltip>
          ))}
        </div>
      </ControlPanel>
    );
  }

  if (variant === 'canvasPane') {
    return (
      <ControlPanel
        density="compact"
        className={['!p-0', className].filter(Boolean).join(' ')}
      >
        <div
          data-rdna="pixel-canvas-pane"
          className="grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px"
          role="group"
          aria-label="Canvas controls"
        >
          <span className="col-span-2 flex h-8 items-center justify-center bg-ctrl-cell-bg font-mono text-xs text-main uppercase tabular-nums">
            {gridSize} × {gridSize}
          </span>
          {!isFixedSize && onSizeChange && (
            <div className="col-span-2 bg-ctrl-cell-bg px-1 py-1.5">
              <Slider
                ariaLabel="Canvas size"
                min={sizeMin}
                max={sizeMax}
                step={1}
                ticks={0}
                size="lg"
                variant="lcd"
                value={gridSize}
                onChange={onSizeChange}
              />
            </div>
          )}
          <Tooltip side="right" content={isGridVisible ? 'Hide grid' : 'Show grid'}>
            <div className="col-span-2 flex h-8 items-center justify-between gap-1 bg-ctrl-cell-bg px-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-main">Grid</span>
              <CtrlToggle
                value={isGridVisible}
                onChange={onGridVisibleChange}
                label={isGridVisible ? 'ON' : 'OFF'}
                size="sm"
              />
            </div>
          </Tooltip>
          <Tooltip side="right" content="Undo">
            <span className="inline-flex">
              <IconCell mode="button" size="xl" chromeless label="Undo" onClick={onUndo}>
                <Icon name="interface-essential-navigation-left-circle-1" large />
              </IconCell>
            </span>
          </Tooltip>
          <Tooltip side="right" content="Redo">
            <span className="inline-flex">
              <IconCell mode="button" size="xl" chromeless label="Redo" onClick={onRedo}>
                <Icon name="interface-essential-navigation-right-circle-1" large />
              </IconCell>
            </span>
          </Tooltip>
          <Tooltip side="right" content="Clear">
            <span className="inline-flex">
              <IconCell mode="button" size="xl" chromeless label="Clear" onClick={onClear}>
                <Icon name="interface-essential-bin" large />
              </IconCell>
            </span>
          </Tooltip>
        </div>
      </ControlPanel>
    );
  }

  if (variant === 'settings') {
    return (
      <ControlPanel
        density="compact"
        className={['!p-0 w-full min-w-[15rem] max-w-[20rem]', className].filter(Boolean).join(' ')}
      >
        {showModeControl !== false && (
          <Section title={`${nextSec()}. MODE`} simpleHeader contentClassName="!p-px !gap-px">
            <PropertyRow label="KIND" chrome="flush" size="xl" divider={false}>
              <ButtonStrip
                value={mode}
                onChange={(v) => onModeChange(v as PixelMode)}
                options={availableModes.map((m) => ({
                  value: m,
                  label: MODE_CONFIG[m].label.toUpperCase(),
                }))}
                size="sm"
                className="w-full"
              />
            </PropertyRow>
          </Section>
        )}

        {mode === 'corners' && (
          <Section title={`${nextSec()}. SCALE`} simpleHeader contentClassName="!p-px !gap-px">
            <PropertyRow label="SCALE" chrome="flush" size="xl" divider={false}>
              <Slider
                ariaLabel="Preview pixel scale"
                min={2}
                max={12}
                step={1}
                ticks={0}
                size="lg"
                variant="lcd"
                value={resolvedCornerPreviewSettings.pixelScale}
                onChange={(value) => updateCornerPreviewSetting(value, 2, 12)}
                className="min-w-0 flex-1"
              />
              <span
                className="inline-flex min-w-7 justify-end font-mono tabular-nums text-ctrl-text-active text-xs"
                style={{ textShadow: 'var(--ctrl-text-glow-active)' }}
              >
                {resolvedCornerPreviewSettings.pixelScale}
              </span>
              <span className="font-mono text-ctrl-label text-[0.5rem] uppercase tracking-wider">
                X
              </span>
            </PropertyRow>
          </Section>
        )}

      </ControlPanel>
    );
  }

  if (variant === 'library') {
    return (
      <section
        aria-labelledby={panelId}
        className={['flex h-full min-h-0 w-full flex-col bg-page text-main', className]
          .filter(Boolean)
          .join(' ')}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-rule px-3 py-2">
          <h2
            id={panelId}
            className="font-heading text-xs uppercase tracking-wide text-mute"
          >
            Library
          </h2>
          <div className="flex items-center gap-2">
            <ToggleGroup
              value={[libraryView]}
              onValueChange={(values) => {
                if (values[0] === 'grid' || values[0] === 'list') {
                  setLibraryView(values[0]);
                }
              }}
              size="xs"
            >
              <ToggleGroup.Item value="grid">Grid</ToggleGroup.Item>
              <ToggleGroup.Item value="list">List</ToggleGroup.Item>
            </ToggleGroup>
            <span className="font-mono text-[0.625rem] uppercase tracking-normal text-mute">
              {libraryCount} found
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          {mode === 'icons' && (
            <div className="flex shrink-0 flex-col gap-2">
              <Input
                type="search"
                value={libraryQuery}
                onChange={(event) => setLibraryQuery(event.target.value)}
                placeholder="Search icons"
                aria-label="Search icons"
                size="sm"
                fullWidth
                icon={<Icon name="search" />}
              />

              {iconMappingState && (
                <div
                  role="group"
                  aria-label="Icon mapping filters"
                  className="flex items-center justify-between gap-2 border border-rule bg-depth px-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={iconMappingState.show21}
                      onChange={(show21) =>
                        onIconFilterChange?.({ show21, show16: iconMappingState.show16 })
                      }
                      label="21PX"
                      size="sm"
                    />
                    <Switch
                      checked={iconMappingState.show16}
                      onChange={(show16) =>
                        onIconFilterChange?.({ show21: iconMappingState.show21, show16 })
                      }
                      label="16PX"
                      size="sm"
                    />
                  </div>
                  <Button
                    type="button"
                    active={mappingModeActive}
                    disabled={!canMapIcons}
                    onClick={() => onIconMapModeChange?.(!iconMappingState.mapMode)}
                    size="sm"
                    mode="flat"
                    compact
                  >
                    Map
                  </Button>
                </div>
              )}
            </div>
          )}
          <ScrollArea.Root
            role="radiogroup"
            aria-label="Registry entries"
            aria-describedby={libraryHintId}
            className={[
              'min-h-0 flex-1 bg-white',
              libraryView === 'grid'
                ? 'grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] content-start gap-2 p-2'
                : 'flex flex-col gap-px p-2',
            ].join(' ')}
          >
            <button
              type="button"
              role="radio"
              aria-checked={selectedEntryName === null}
              aria-label="New"
              onClick={() => onSelectEntry(null)}
              className={
                libraryView === 'grid'
                  ? [
                      'flex aspect-square items-center justify-center bg-white text-ink transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-ctrl-glow',
                      selectedEntryName === null ? 'text-main' : 'text-mute hover:text-main',
                    ].join(' ')
                  : [
                      'flex min-h-10 items-center gap-2 bg-page px-2 py-1 text-left transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-ctrl-glow',
                      selectedEntryName === null ? 'text-main' : 'text-mute hover:text-main',
                    ].join(' ')
              }
            >
              <Icon name="plus" />
              {libraryView === 'list' && (
                <span className="max-w-full truncate font-mono text-[0.625rem] uppercase tracking-normal">
                  New
                </span>
              )}
            </button>
            {usesIconInventoryLibrary
              ? filteredIconEntries.map((entry) => {
                  const selected = selectedEntryName === entry.name;
                  const grid = iconInventoryIconToPixelGrid(entry);
                  const isMappingSource = iconMappingState?.source24Name === entry.name;
                  const isMappingTarget = iconMappingState?.target16Name === entry.name;
                  return (
                    <button
                      key={entry.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${entry.size === 24 ? '21px' : '16px'} ${entry.name}`}
                      title={entry.name}
                      onClick={() => onSelectIconLibraryEntry?.(entry)}
                      className={
                        libraryView === 'grid'
                          ? [
                              'relative flex aspect-square items-center justify-center bg-white transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-ctrl-glow',
                              selected || isMappingSource || isMappingTarget
                                ? 'text-main'
                                : 'text-mute hover:text-main',
                            ].join(' ')
                          : [
                              'flex min-h-10 items-center gap-2 bg-page px-2 py-1 text-left transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-ctrl-glow',
                              selected || isMappingSource || isMappingTarget
                                ? 'text-main'
                                : 'text-mute hover:text-main',
                            ].join(' ')
                      }
                    >
                      <PixelThumb
                        grid={grid}
                        size={libraryView === 'grid' ? 32 : 24}
                        bg={libraryView === 'grid' ? 'white' : undefined}
                      />
                      {libraryView === 'grid' && (
                        <span className="absolute bottom-1 right-1 bg-page px-1 font-mono text-[0.5rem] leading-3 text-mute">
                          {entry.size === 24 ? '21' : '16'}
                        </span>
                      )}
                      {libraryView === 'list' && (
                        <>
                          <span className="shrink-0 font-mono text-[0.5rem] uppercase tracking-normal text-mute">
                            {entry.size === 24 ? '21' : '16'}px
                          </span>
                          <span className="max-w-full truncate font-mono text-[0.625rem] uppercase tracking-normal">
                            {entry.name}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })
              : filteredRegistryEntries.map((entry) => {
              const selected = selectedEntryName === entry.name;
              return (
                <button
                  key={entry.name}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={entry.name}
                  title={entry.name}
                  onClick={() => onSelectEntry(entry)}
                  className={
                    libraryView === 'grid'
                      ? [
                          'flex aspect-square items-center justify-center bg-white transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-ctrl-glow',
                          selected ? 'text-main' : 'text-mute hover:text-main',
                        ].join(' ')
                      : [
                          'flex min-h-10 items-center gap-2 bg-page px-2 py-1 text-left transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-ctrl-glow',
                          selected ? 'text-main' : 'text-mute hover:text-main',
                        ].join(' ')
                  }
                >
                  <PixelThumb
                    grid={entry}
                    size={libraryView === 'grid' ? 32 : 24}
                    bg={libraryView === 'grid' ? 'white' : undefined}
                  />
                  {libraryView === 'list' && (
                    <span className="max-w-full truncate font-mono text-[0.625rem] uppercase tracking-normal">
                      {entry.name}
                    </span>
                  )}
                </button>
              );
            })}
          </ScrollArea.Root>
          <span id={libraryHintId} className="sr-only">
            Select a registry entry to fork, or &ldquo;New&rdquo; to start from blank.
          </span>
        </div>
      </section>
    );
  }

  return (
    <ControlPanel
      density="compact"
      className={['w-full min-w-[15rem] max-w-[20rem]', className].filter(Boolean).join(' ')}
    >
      {showModeControl !== false && (
        <Section title={`${nextSec()}. MODE`}>
          <PropertyRow label="KIND">
            <ButtonStrip
              value={mode}
              onChange={(v) => onModeChange(v as PixelMode)}
              options={availableModes.map((m) => ({
                value: m,
                label: MODE_CONFIG[m].label.toUpperCase(),
              }))}
              size="sm"
              className="w-full"
            />
          </PropertyRow>
        </Section>
      )}

      {!isFixedSize && (
        <Section title={`${nextSec()}. SIZE`}>
          <PropertyRow label="SIZE">
            <Stepper
              value={gridSize}
              min={sizeMin}
              max={sizeMax}
              step={1}
              onChange={(value) => {
                if (onSizeChange) {
                  onSizeChange(value);
                  return;
                }
                if (value < gridSize) onSizeDecrement();
                if (value > gridSize) onSizeIncrement();
              }}
              decrementIcon={<Icon name="chevron-left" />}
              incrementIcon={<Icon name="chevron-right" />}
              suffix={
                <span className="flex items-center px-1 font-mono text-ctrl-label text-[0.5rem] uppercase tracking-wider">
                  PX
                </span>
              }
              className="w-full"
            />
          </PropertyRow>
        </Section>
      )}

      {/* ── TOOL ───────────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. TOOL`}>
        <div
          role="radiogroup"
          aria-label="Brush tool"
          className="grid grid-cols-5 gap-[--ctrl-cell-gap] px-1"
        >
          {visibleTools.map((def) => (
            <IconCell
              key={def.tool}
              mode="radio"
              selected={def.tool === activeTool}
              label={def.label}
              onClick={() => onToolChange(def.tool)}
            >
              {def.large ? <Icon name={def.icon} large /> : <Icon name={def.icon} />}
            </IconCell>
          ))}
        </div>
      </Section>

      {/* ── EDIT ───────────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. EDIT`}>
        <div className="flex items-stretch gap-[--ctrl-cell-gap] px-1">
          <ActionButton
            label="Undo"
            icon={<Icon name="seek-back" />}
            onClick={onUndo}
          />
          <ActionButton
            label="Redo"
            icon={<Icon name="go-forward" />}
            onClick={onRedo}
          />
          <ActionButton
            label="Clear"
            icon={<Icon name="trash" />}
            onClick={onClear}
          />
        </div>
        <PropertyRow label="GRID">
          <CtrlToggle
            value={isGridVisible}
            onChange={onGridVisibleChange}
            label={isGridVisible ? 'ON' : 'OFF'}
            size="sm"
          />
        </PropertyRow>
      </Section>

      {/* ── LIBRARY ────────────────────────────────────────────────── */}
      <Section title={`${nextSec()}. LIBRARY`} count={registryEntries.length}>
        <div
          role="radiogroup"
          aria-label="Registry entries"
          aria-describedby={panelId}
          className="flex flex-col max-h-[12rem] overflow-y-auto px-1"
        >
          <RegistryRow
            mode="radio"
            label="New"
            selected={selectedEntryName === null}
            onSelect={() => onSelectEntry(null)}
            thumb={<Icon name="plus" />}
          />
          {registryEntries.map((entry) => (
            <RegistryRow
              key={entry.name}
              mode="radio"
              label={entry.name}
              selected={selectedEntryName === entry.name}
              onSelect={() => onSelectEntry(entry)}
              thumb={<PixelThumb grid={entry} size={16} />}
            />
          ))}
        </div>
        <span id={panelId} className="sr-only">
          Select a registry entry to fork, or &ldquo;New&rdquo; to start from blank.
        </span>
      </Section>
    </ControlPanel>
  );
}
