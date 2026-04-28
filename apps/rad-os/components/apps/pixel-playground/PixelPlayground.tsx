'use client';

// =============================================================================
// PixelPlayground — center-canvas workbench.
//
// The editable canvas remains the primary center surface. Operational controls
// are mounted into the left control-surface dock; generated output and visual
// preview/details are mounted into the right dock.
// =============================================================================

import { useCallback, useMemo, useRef, useState } from 'react';
import { BrushTool, useBrush, useData, useDotting, type DottingRef } from '@/lib/dotting';
import { AppWindow } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import type { PixelGrid } from '@rdna/pixel';
import {
  buildIconInventory,
  iconInventoryIconToPixelGrid,
  type IconInventoryIcon,
} from '@/lib/icon-inventory';
import {
  DEFAULT_CORNER_PREVIEW_SETTINGS,
  type PixelMode,
  type PixelPlaygroundState,
} from './types';
import {
  DEFAULT_STATE,
  MODE_CONFIG,
  TOOL_DEFS,
  getCornerShapeFromEntryName,
  getRegistryForMode,
} from './constants';
import {
  applyIconMappingSelection,
  formatIconMappingPatch,
  getInitialIconMappingState,
  isIconMappingModeActive,
  type IconMappingState,
} from './icon-mapping';
import { OneBitCanvas } from './OneBitCanvas';
import { PixelCodeOutput } from './PixelCodeOutput';
import { PixelPlaygroundControls } from './PixelPlaygroundControls';
import { ModePreview } from './previews/ModePreview';
import { bitsFromLayer } from './bits-from-layer';
import { useResolvedColor } from '@/hooks';
import { useControlSurfaceSlot } from '@/components/Rad_os/AppWindow';
import {
  StudioRailDropdown,
  StudioRailSection,
} from '@/components/apps/studio/StudioRailSection';

const MODE_ORDER: ReadonlyArray<PixelMode> = ['corners', 'patterns', 'icons', 'dither'];
const previewFirstModes = new Set<PixelMode>(['patterns', 'icons']);
const inlineWorkbenchModes = new Set<PixelMode>(['corners', 'patterns', 'icons']);

export interface PixelPlaygroundProps {
  initialMode?: PixelMode;
  lockedMode?: boolean;
}

function createInitialState(initialMode: PixelMode | undefined): PixelPlaygroundState {
  if (!initialMode) return DEFAULT_STATE;
  return {
    ...DEFAULT_STATE,
    mode: initialMode,
    gridSize: MODE_CONFIG[initialMode].defaultSize,
    selectedEntry: null,
  };
}

function clampSizeForMode(mode: PixelMode, size: number): number {
  return Math.min(MODE_CONFIG[mode].maxSize, Math.max(MODE_CONFIG[mode].minSize, size));
}

function resizeSelectedEntry(
  mode: PixelMode,
  selectedEntry: PixelGrid | null,
  gridSize: number,
): PixelGrid | null {
  if (mode !== 'corners' || !selectedEntry) return selectedEntry;
  const shape = getCornerShapeFromEntryName(selectedEntry.name);
  if (!shape) return selectedEntry;
  return (
    getRegistryForMode('corners', gridSize).find((entry) => entry.name === `${shape}-${gridSize}`)
    ?? selectedEntry
  );
}

export function PixelPlayground({
  initialMode,
  lockedMode = false,
}: PixelPlaygroundProps = {}) {
  const [state, setState] = useState<PixelPlaygroundState>(() => createInitialState(initialMode));
  const dottingRef = useRef<DottingRef>(null);
  const { brushTool, changeBrushTool } = useBrush(dottingRef);
  const { undo, redo, clear } = useDotting(dottingRef);
  const [isGridVisible, setGridVisible] = useState(true);
  // canvasKey is bumped to force <Dotting> to remount (clean slate) on mode
  // switch, size change, or registry entry fork. Pass it to useData as the
  // resetKey so the data-change listener re-registers on the new instance.
  const [canvasKey, setCanvasKey] = useState(0);
  const [iconMappingState, setIconMappingState] = useState<IconMappingState>(
    getInitialIconMappingState,
  );
  const [cornerPreviewSettings, setCornerPreviewSettings] = useState(
    DEFAULT_CORNER_PREVIEW_SETTINGS,
  );
  const { dataArray } = useData(dottingRef, canvasKey);
  const fgColor = useResolvedColor('--color-ink', '#0f0e0c');
  const activeTool = brushTool ?? BrushTool.DOT;
  const activeToolDef = useMemo(
    () => TOOL_DEFS.find((def) => def.tool === activeTool),
    [activeTool],
  );
  const iconInventory = useMemo(() => buildIconInventory(), []);
  const iconMappingActive = state.mode === 'icons' && isIconMappingModeActive(iconMappingState);
  const iconMappingOutput = useMemo(
    () => formatIconMappingPatch(iconMappingState.mappings),
    [iconMappingState.mappings],
  );

  const currentGrid = useMemo<PixelGrid | null>(() => {
    if (!dataArray.length) return null;
    const bits = bitsFromLayer({ data: dataArray }, state.gridSize, fgColor);
    const hasAny = bits.includes('1');
    if (!hasAny && !state.selectedEntry) return null;
    return {
      name: state.selectedEntry?.name ?? 'untitled',
      width: state.gridSize,
      height: state.gridSize,
      bits,
    };
  }, [dataArray, state.gridSize, state.selectedEntry, fgColor]);

  // ─── Handlers wired into PixelPlaygroundControls ──────────────────────

  const handleModeChange = useCallback((mode: PixelMode) => {
    setState((prev) => ({
      ...prev,
      mode,
      gridSize: MODE_CONFIG[mode].defaultSize,
      selectedEntry: null,
    }));
    setCanvasKey((k) => k + 1);
  }, []);

  const handleSizeChange = useCallback((size: number) => {
    setState((prev) => ({
      ...prev,
      gridSize: clampSizeForMode(prev.mode, size),
      selectedEntry: resizeSelectedEntry(
        prev.mode,
        prev.selectedEntry,
        clampSizeForMode(prev.mode, size),
      ),
    }));
    setCanvasKey((k) => k + 1);
  }, []);

  const handleSizeDecrement = useCallback(() => {
    handleSizeChange(state.gridSize - 1);
  }, [handleSizeChange, state.gridSize]);

  const handleSizeIncrement = useCallback(() => {
    handleSizeChange(state.gridSize + 1);
  }, [handleSizeChange, state.gridSize]);

  const handleSelectEntry = useCallback((entry: PixelGrid | null) => {
    setState((prev) => ({
      ...prev,
      selectedEntry: entry,
      gridSize: entry ? entry.width : MODE_CONFIG[prev.mode].defaultSize,
    }));
    setCanvasKey((k) => k + 1);
  }, []);

  const handleIconFilterChange = useCallback(
    (filter: Pick<IconMappingState, 'show21' | 'show16'>) => {
      setIconMappingState((prev) => {
        const next = { ...prev, ...filter };
        return next.show21 && next.show16 ? next : { ...next, mapMode: false };
      });
    },
    [],
  );

  const handleIconMapModeChange = useCallback((mapMode: boolean) => {
    setIconMappingState((prev) => ({
      ...prev,
      mapMode: prev.show21 && prev.show16 ? mapMode : false,
    }));
  }, []);

  const handleSelectIconLibraryEntry = useCallback(
    (entry: IconInventoryIcon) => {
      handleSelectEntry(iconInventoryIconToPixelGrid(entry));
      setIconMappingState((prev) => applyIconMappingSelection(prev, entry));
    },
    [handleSelectEntry],
  );

  // `clear`, `undo`, and `redo` are already stable useCallback references
  // from useDotting — pass them through directly without extra wrappers.

  const registryEntries = useMemo(
    () => getRegistryForMode(state.mode, state.gridSize),
    [state.mode, state.gridSize],
  );
  const usesInlineWorkbench = inlineWorkbenchModes.has(state.mode);
  const previewIsEdgeToEdge = state.mode === 'corners' || state.mode === 'patterns';
  const shouldShowSettingsPanel =
    !lockedMode ||
    MODE_CONFIG[state.mode].minSize !== MODE_CONFIG[state.mode].maxSize ||
    state.mode === 'corners';

  // ─── Dock registration ────────────────────────────────────────────────
  // Left dock = authoring controls. Right dock = passive details/output.

  const controlsPanel = useMemo(
    () => (
      <PixelPlaygroundControls
        mode={state.mode}
        availableModes={lockedMode ? [state.mode] : MODE_ORDER}
        onModeChange={handleModeChange}
        showModeControl={!lockedMode}
        gridSize={state.gridSize}
        sizeMin={MODE_CONFIG[state.mode].minSize}
        sizeMax={MODE_CONFIG[state.mode].maxSize}
        onSizeDecrement={handleSizeDecrement}
        onSizeIncrement={handleSizeIncrement}
        onSizeChange={handleSizeChange}
        activeTool={activeTool}
        onToolChange={changeBrushTool}
        isGridVisible={isGridVisible}
        onGridVisibleChange={setGridVisible}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        registryEntries={registryEntries}
        selectedEntryName={state.selectedEntry?.name ?? null}
        onSelectEntry={handleSelectEntry}
        iconLibraryEntries={state.mode === 'icons' ? iconInventory.icons : undefined}
        iconMappingState={state.mode === 'icons' ? iconMappingState : undefined}
        onIconFilterChange={handleIconFilterChange}
        onIconMapModeChange={handleIconMapModeChange}
        onSelectIconLibraryEntry={handleSelectIconLibraryEntry}
        cornerPreviewSettings={cornerPreviewSettings}
        onCornerPreviewSettingsChange={setCornerPreviewSettings}
        variant={usesInlineWorkbench ? 'toolbar' : 'full'}
      />
    ),
    [
      state.mode,
      state.gridSize,
      state.selectedEntry,
      activeTool,
      changeBrushTool,
      isGridVisible,
      handleModeChange,
      lockedMode,
      handleSizeChange,
      handleSizeDecrement,
      handleSizeIncrement,
      undo,
      redo,
      clear,
      registryEntries,
      handleSelectEntry,
      iconInventory.icons,
      iconMappingState,
      handleIconFilterChange,
      handleIconMapModeChange,
      handleSelectIconLibraryEntry,
      cornerPreviewSettings,
      usesInlineWorkbench,
    ],
  );

  const settingsPanel = useMemo(
    () => (
      <PixelPlaygroundControls
        mode={state.mode}
        availableModes={lockedMode ? [state.mode] : MODE_ORDER}
        onModeChange={handleModeChange}
        showModeControl={!lockedMode}
        gridSize={state.gridSize}
        sizeMin={MODE_CONFIG[state.mode].minSize}
        sizeMax={MODE_CONFIG[state.mode].maxSize}
        onSizeDecrement={handleSizeDecrement}
        onSizeIncrement={handleSizeIncrement}
        onSizeChange={handleSizeChange}
        activeTool={activeTool}
        onToolChange={changeBrushTool}
        isGridVisible={isGridVisible}
        onGridVisibleChange={setGridVisible}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        registryEntries={registryEntries}
        selectedEntryName={state.selectedEntry?.name ?? null}
        onSelectEntry={handleSelectEntry}
        iconLibraryEntries={state.mode === 'icons' ? iconInventory.icons : undefined}
        iconMappingState={state.mode === 'icons' ? iconMappingState : undefined}
        onIconFilterChange={handleIconFilterChange}
        onIconMapModeChange={handleIconMapModeChange}
        onSelectIconLibraryEntry={handleSelectIconLibraryEntry}
        cornerPreviewSettings={cornerPreviewSettings}
        onCornerPreviewSettingsChange={setCornerPreviewSettings}
        variant="settings"
      />
    ),
    [
      state.mode,
      state.gridSize,
      state.selectedEntry,
      lockedMode,
      handleModeChange,
      handleSizeChange,
      handleSizeDecrement,
      handleSizeIncrement,
      activeTool,
      changeBrushTool,
      isGridVisible,
      undo,
      redo,
      clear,
      registryEntries,
      handleSelectEntry,
      iconInventory.icons,
      iconMappingState,
      handleIconFilterChange,
      handleIconMapModeChange,
      handleSelectIconLibraryEntry,
      cornerPreviewSettings,
    ],
  );

  const libraryPanel = useMemo(
    () => (
      <PixelPlaygroundControls
        mode={state.mode}
        availableModes={lockedMode ? [state.mode] : MODE_ORDER}
        onModeChange={handleModeChange}
        showModeControl={!lockedMode}
        gridSize={state.gridSize}
        sizeMin={MODE_CONFIG[state.mode].minSize}
        sizeMax={MODE_CONFIG[state.mode].maxSize}
        onSizeDecrement={handleSizeDecrement}
        onSizeIncrement={handleSizeIncrement}
        onSizeChange={handleSizeChange}
        activeTool={activeTool}
        onToolChange={changeBrushTool}
        isGridVisible={isGridVisible}
        onGridVisibleChange={setGridVisible}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        registryEntries={registryEntries}
        selectedEntryName={state.selectedEntry?.name ?? null}
        onSelectEntry={handleSelectEntry}
        iconLibraryEntries={state.mode === 'icons' ? iconInventory.icons : undefined}
        iconMappingState={state.mode === 'icons' ? iconMappingState : undefined}
        onIconFilterChange={handleIconFilterChange}
        onIconMapModeChange={handleIconMapModeChange}
        onSelectIconLibraryEntry={handleSelectIconLibraryEntry}
        cornerPreviewSettings={cornerPreviewSettings}
        onCornerPreviewSettingsChange={setCornerPreviewSettings}
        variant="library"
      />
    ),
    [
      state.mode,
      state.gridSize,
      state.selectedEntry,
      lockedMode,
      handleModeChange,
      handleSizeChange,
      handleSizeDecrement,
      handleSizeIncrement,
      activeTool,
      changeBrushTool,
      isGridVisible,
      undo,
      redo,
      clear,
      registryEntries,
      handleSelectEntry,
      iconInventory.icons,
      iconMappingState,
      handleIconFilterChange,
      handleIconMapModeChange,
      handleSelectIconLibraryEntry,
      cornerPreviewSettings,
    ],
  );

  const canvasPanel = useMemo(
    () => (
      <PixelPlaygroundControls
        mode={state.mode}
        availableModes={lockedMode ? [state.mode] : MODE_ORDER}
        onModeChange={handleModeChange}
        showModeControl={!lockedMode}
        gridSize={state.gridSize}
        sizeMin={MODE_CONFIG[state.mode].minSize}
        sizeMax={MODE_CONFIG[state.mode].maxSize}
        onSizeDecrement={handleSizeDecrement}
        onSizeIncrement={handleSizeIncrement}
        onSizeChange={handleSizeChange}
        activeTool={activeTool}
        onToolChange={changeBrushTool}
        isGridVisible={isGridVisible}
        onGridVisibleChange={setGridVisible}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        registryEntries={registryEntries}
        selectedEntryName={state.selectedEntry?.name ?? null}
        onSelectEntry={handleSelectEntry}
        iconLibraryEntries={state.mode === 'icons' ? iconInventory.icons : undefined}
        iconMappingState={state.mode === 'icons' ? iconMappingState : undefined}
        onIconFilterChange={handleIconFilterChange}
        onIconMapModeChange={handleIconMapModeChange}
        onSelectIconLibraryEntry={handleSelectIconLibraryEntry}
        cornerPreviewSettings={cornerPreviewSettings}
        onCornerPreviewSettingsChange={setCornerPreviewSettings}
        variant="canvasPane"
      />
    ),
    [
      state.mode,
      state.gridSize,
      state.selectedEntry,
      lockedMode,
      handleModeChange,
      handleSizeChange,
      handleSizeDecrement,
      handleSizeIncrement,
      activeTool,
      changeBrushTool,
      isGridVisible,
      undo,
      redo,
      clear,
      registryEntries,
      handleSelectEntry,
      iconInventory.icons,
      iconMappingState,
      handleIconFilterChange,
      handleIconMapModeChange,
      handleSelectIconLibraryEntry,
      cornerPreviewSettings,
    ],
  );

  const codeOutputPanel = useMemo(
    () => (
      <AppWindow.Island
        corners="pixel"
        padding="none"
        noScroll
        className="flex-1 min-h-0"
      >
        <PixelCodeOutput
          mode={state.mode}
          grid={currentGrid}
          iconMappingActive={iconMappingActive}
          iconMappingOutput={iconMappingOutput}
        />
      </AppWindow.Island>
    ),
    [currentGrid, iconMappingActive, iconMappingOutput, state.mode],
  );

  const modePreviewPanel = useMemo(
    () => (
      <AppWindow.Island
        corners="pixel"
        padding="none"
        noScroll
        className="flex-1 min-h-0"
      >
        <div
          className={[
            'flex h-full min-h-0 flex-col',
            previewIsEdgeToEdge ? '' : 'p-3',
          ].filter(Boolean).join(' ')}
        >
          <ModePreview
            mode={state.mode}
            grid={currentGrid}
            selectedEntry={state.selectedEntry}
            cornerSize={state.gridSize}
            cornerPreviewSettings={cornerPreviewSettings}
          />
        </div>
      </AppWindow.Island>
    ),
    [
      cornerPreviewSettings,
      currentGrid,
      previewIsEdgeToEdge,
      state.gridSize,
      state.mode,
      state.selectedEntry,
    ],
  );

  const detailsPanel = useMemo(
    () => {
      const previewFirst = previewFirstModes.has(state.mode);

      return (
        <div className="flex h-full min-w-[16rem] max-w-[22rem] flex-col gap-1.5">
          {previewFirst ? modePreviewPanel : codeOutputPanel}
          {previewFirst ? codeOutputPanel : modePreviewPanel}
        </div>
      );
    },
    [codeOutputPanel, modePreviewPanel, state.mode],
  );

  const controlsRailPanel = useMemo(
    () => (
      <StudioRailSection>
        {usesInlineWorkbench && (
          <StudioRailDropdown
            title="CANVAS"
            collapsedIcon={<Icon name="interface-essential-dial-pad-1" />}
            collapsedTooltip="Canvas"
          >
            {canvasPanel}
          </StudioRailDropdown>
        )}
        <StudioRailDropdown
          title={usesInlineWorkbench ? 'TOOLS' : 'CONTROLS'}
          collapsedIcon={<Icon name={activeToolDef?.icon ?? 'pencil'} />}
          collapsedTooltip={usesInlineWorkbench ? 'Tools' : 'Controls'}
        >
          {controlsPanel}
        </StudioRailDropdown>
      </StudioRailSection>
    ),
    [activeToolDef?.icon, canvasPanel, controlsPanel, usesInlineWorkbench],
  );

  const detailsRailPanel = useMemo(
    () => {
      const previewFirst = previewFirstModes.has(state.mode);

      return usesInlineWorkbench ? (
        <div className="flex h-full min-w-[16rem] max-w-[22rem] flex-col gap-px">
          {shouldShowSettingsPanel && (
            <StudioRailSection>
              <StudioRailDropdown
                title="SETTINGS"
                collapsedIcon={<Icon name="settings" />}
                collapsedTooltip="Settings"
              >
                {settingsPanel}
              </StudioRailDropdown>
            </StudioRailSection>
          )}
          <StudioRailSection className="min-h-0 flex-1">
            {previewFirst ? modePreviewPanel : codeOutputPanel}
          </StudioRailSection>
          <StudioRailSection className="min-h-0 flex-1">
            {previewFirst ? codeOutputPanel : modePreviewPanel}
          </StudioRailSection>
        </div>
      ) : (
        <StudioRailSection className="h-full">
          {detailsPanel}
        </StudioRailSection>
      );
    },
    [
      codeOutputPanel,
      detailsPanel,
      modePreviewPanel,
      settingsPanel,
      shouldShowSettingsPanel,
      state.mode,
      usesInlineWorkbench,
    ],
  );

  const libraryRailPanel = useMemo(
    () => (
      usesInlineWorkbench ? (
        <StudioRailSection className="h-full min-h-0">
          {libraryPanel}
        </StudioRailSection>
      ) : null
    ),
    [libraryPanel, usesInlineWorkbench],
  );

  const controlsSlot = useMemo(
    () => ({
      side: 'left' as const,
      maxWidth: usesInlineWorkbench ? 148 : 320,
      label: usesInlineWorkbench ? 'Canvas' : 'Tools',
      hideTab: true,
      isOpen: true,
      children: controlsRailPanel,
    }),
    [controlsRailPanel, usesInlineWorkbench],
  );
  const detailsSlot = useMemo(
    () => (
      usesInlineWorkbench
        ? {
            side: 'right' as const,
            maxWidth: 380,
            label: 'Output',
            hideTab: true,
            isOpen: true,
            children: detailsRailPanel,
          }
        : {
            side: 'right' as const,
            maxWidth: 380,
            label: 'Details',
            hideTab: true,
            isOpen: true,
            children: detailsRailPanel,
          }
    ),
    [detailsRailPanel, usesInlineWorkbench],
  );
  const librarySlot = useMemo(
    () => (
      usesInlineWorkbench && libraryRailPanel
        ? {
            side: 'bottom' as const,
            variant: 'drawer' as const,
            height: state.mode === 'icons' ? 360 : 300,
            label: 'Library',
            hideTab: true,
            isOpen: true,
            children: libraryRailPanel,
          }
        : null
    ),
    [libraryRailPanel, state.mode, usesInlineWorkbench],
  );

  useControlSurfaceSlot(controlsSlot);
  useControlSurfaceSlot(detailsSlot);
  useControlSurfaceSlot(librarySlot);

  if (usesInlineWorkbench) {
    return (
      <AppWindow.Content layout="single" className="bg-brand-stage">
        <div className="flex-1 min-h-0 min-w-0">
          <AppWindow.Island
            corners="pixel"
            padding="none"
            noScroll
            className="mx-auto aspect-square h-full max-h-full max-w-full"
          >
            <OneBitCanvas
              dottingRef={dottingRef}
              gridSize={state.gridSize}
              brushTool={activeTool}
              brushIsFg={true}
              isGridVisible={isGridVisible}
              canvasKey={canvasKey}
              initialBits={state.selectedEntry?.bits}
            />
          </AppWindow.Island>
        </div>
      </AppWindow.Content>
    );
  }

  return (
    <AppWindow.Content layout="single" className="bg-brand-stage">
      <div className="flex-1 min-h-0 min-w-0">
        <AppWindow.Island
          corners="pixel"
          padding="none"
          noScroll
          className="mx-auto aspect-square h-full max-h-full max-w-full"
        >
          <OneBitCanvas
            dottingRef={dottingRef}
            gridSize={state.gridSize}
            brushTool={activeTool}
            brushIsFg={true}
            isGridVisible={isGridVisible}
            canvasKey={canvasKey}
            initialBits={state.selectedEntry?.bits}
          />
        </AppWindow.Island>
      </div>
    </AppWindow.Content>
  );
}
