'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ColorSwatch as CtrlColorSwatch } from '@rdna/ctrl';
import { AppWindow } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import {
  type DottingRef,
  type LayerProps,
  type PixelModifyItem,
  BrushTool,
  useBrush,
  useDotting,
  useLayers,
} from '@/lib/dotting';
import { useControlSurfaceSlot } from '@/components/Rad_os/AppWindow';
import { CanvasArea } from './CanvasArea';
import { StudioLeftRail } from './StudioLeftRail';
import { StudioRightRail, type StudioLayerOption } from './StudioRightRail';
import { StudioBottomRail } from './StudioBottomRail';
import { StudioExportPanel } from './StudioExportPanel';
import { StudioRailDropdown, StudioRailSection } from './StudioRailSection';
import { CANVAS_BG_COLOR, CANVAS_SIZE, DEFAULT_BRUSH_COLOR, PALETTE_COLORS, TOOL_DEFS } from './constants';
import { pickRandomRadiant } from './radnom';

function createEmptyLayer(): LayerProps {
  const origin = -Math.floor(CANVAS_SIZE / 2);
  const data: PixelModifyItem[][] = [];
  for (let r = 0; r < CANVAS_SIZE; r++) {
    const row: PixelModifyItem[] = [];
    for (let c = 0; c < CANVAS_SIZE; c++) {
      row.push({
        rowIndex: origin + r,
        columnIndex: origin + c,
        color: CANVAS_BG_COLOR,
      });
    }
    data.push(row);
  }
  return { id: 'default', data };
}

function layerIdToLabel(id: string): string {
  if (id === 'default') return 'Layer 1';
  const m = /^layer-(\d+)$/.exec(id);
  if (m) return `Layer ${m[1]}`;
  return id;
}

// ─── State hook ───────────────────────────────────────────────────────────

function useStudioState() {
  const dottingRef = useRef<DottingRef>(null);
  const { brushTool, brushColor, changeBrushTool, changeBrushColor } = useBrush(dottingRef);
  const { undo, redo, clear } = useDotting(dottingRef);
  const {
    layers,
    currentLayer,
    addLayer,
    removeLayer,
    showLayer,
    hideLayer,
    setCurrentLayer,
    changeLayerPosition,
  } = useLayers(dottingRef);

  const [isGridVisible, setIsGridVisible] = useState(true);
  const [initLayers, setInitLayers] = useState<LayerProps[]>(() => [createEmptyLayer()]);
  const [canvasKey, setCanvasKey] = useState(0);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});

  const activeTool = brushTool ?? BrushTool.DOT;
  const activeColor = brushColor || DEFAULT_BRUSH_COLOR;

  const onRadnom = useCallback(async () => {
    try {
      const data = await pickRandomRadiant();
      setInitLayers([{ id: 'default', data }]);
      setCanvasKey((k) => k + 1);
    } catch (err) {
      console.error('radnom failed', err);
    }
  }, []);

  // Layer actions — counter persists via ref so IDs don't collide after deletes.
  const layerCounterRef = useRef(layers?.length ?? 1);
  const onAddLayer = useCallback(() => {
    layerCounterRef.current += 1;
    const id = `layer-${layerCounterRef.current}`;
    const position = layers ? layers.length : 0;
    addLayer(id, position);
  }, [addLayer, layers]);

  const onRemoveLayer = useCallback(
    (id: string) => {
      removeLayer(id);
    },
    [removeLayer],
  );

  const onToggleLayerVisibility = useCallback(
    (id: string) => {
      const target = layers?.find((l) => l.id === id);
      if (!target) return;
      if (target.isVisible === false) showLayer(id);
      else hideLayer(id);
    },
    [layers, showLayer, hideLayer],
  );

  const onMoveLayerUp = useCallback(
    (id: string) => {
      if (!layers) return;
      const idx = layers.findIndex((l) => l.id === id);
      if (idx < layers.length - 1) changeLayerPosition(id, idx + 1);
    },
    [layers, changeLayerPosition],
  );

  const onMoveLayerDown = useCallback(
    (id: string) => {
      if (!layers) return;
      const idx = layers.findIndex((l) => l.id === id);
      if (idx > 0) changeLayerPosition(id, idx - 1);
    },
    [layers, changeLayerPosition],
  );

  const onSelectLayer = useCallback(
    (id: string) => setCurrentLayer(id),
    [setCurrentLayer],
  );

  const onRenameLayer = useCallback((id: string, label: string) => {
    setCustomLabels((prev) => ({ ...prev, [id]: label }));
  }, []);

  const layerOptions: ReadonlyArray<StudioLayerOption> = useMemo(
    () =>
      (layers ?? []).map((l) => ({
        id: l.id,
        label: customLabels[l.id] ?? layerIdToLabel(l.id),
        visible: l.isVisible !== false,
      })),
    [layers, customLabels],
  );

  // Tool keyboard shortcuts. Mirror of the original handler — ignore when the
  // user is typing into a field or when modifier keys other than Shift are held.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      const match = TOOL_DEFS.find(
        (def) =>
          def.shortcut &&
          def.shortcut.key === key &&
          Boolean(def.shortcut.shift) === e.shiftKey,
      );
      if (!match) return;
      e.preventDefault();
      changeBrushTool(match.tool);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [changeBrushTool]);

  const leftRailProps = {
    tools: TOOL_DEFS,
    activeTool,
    onToolChange: changeBrushTool,
  };

  const colorsRailProps = {
    paletteColors: PALETTE_COLORS,
    activeColor,
    onColorChange: changeBrushColor,
  };

  const rightRailProps = {
    layers: layerOptions,
    currentLayerId: currentLayer?.id,
    onSelectLayer,
    onAddLayer,
    onRemoveLayer,
    onToggleLayerVisibility,
    onMoveLayerUp,
    onMoveLayerDown,
    onRenameLayer,
  };

  const footerControls = {
    isGridVisible,
    onGridToggle: setIsGridVisible,
    onClear: () => clear(),
    onRadnom,
    onUndo: () => undo(),
    onRedo: () => redo(),
  };

  return {
    // Canvas refs & props
    dottingRef,
    canvasKey,
    initLayers,
    activeTool,
    activeColor,
    isGridVisible,
    // Rail props (shaped per-side / per-drawer)
    leftRailProps,
    colorsRailProps,
    rightRailProps,
    // Bottom-bar controls (canvas + history + export)
    footerControls,
  };
}

// ─── Component ────────────────────────────────────────────────────────────

export default function PixelArtEditor() {
  const state = useStudioState();
  const activeToolLabel = useMemo(
    () => TOOL_DEFS.find((def) => def.tool === state.activeTool)?.label ?? 'Pen',
    [state.activeTool],
  );

  const exportPanel = useMemo(
    () => (
      <StudioExportPanel
        dottingRef={state.dottingRef}
        canvasKey={state.canvasKey}
      />
    ),
    [state.dottingRef, state.canvasKey],
  );
  const canvasControlsSlot = useMemo(
    () => ({
      side: 'left' as const,
      maxWidth: 148,
      label: 'Canvas',
      hideTab: true,
      isOpen: true,
      children: (
        <StudioRailSection>
          <StudioRailDropdown
            title="CANVAS"
            collapsedIcon={<Icon name="interface-essential-dial-pad-1" />}
            collapsedTooltip="Canvas"
          >
            <StudioBottomRail
              dottingRef={state.dottingRef}
              activeTool={state.activeTool}
              activeColor={state.activeColor}
              isGridVisible={state.footerControls.isGridVisible}
              onGridToggle={state.footerControls.onGridToggle}
              onClear={state.footerControls.onClear}
              onRadnom={state.footerControls.onRadnom}
              onUndo={state.footerControls.onUndo}
              onRedo={state.footerControls.onRedo}
              orientation="vertical"
              showToolStatus={false}
            />
          </StudioRailDropdown>
          <StudioRailDropdown
            title="TOOLS"
            collapsedIcon={<Icon name={TOOL_DEFS.find((def) => def.tool === state.activeTool)?.icon ?? 'pencil'} />}
            collapsedTooltip="Tools"
          >
            <StudioLeftRail
              {...state.leftRailProps}
              columns={2}
              className="w-fit"
              header={
                <div className="flex h-6 items-center justify-center bg-ctrl-cell-bg font-mono text-xs uppercase text-main">
                  {activeToolLabel}
                </div>
              }
              trailing={<CtrlColorSwatch color={state.activeColor} size="sm" borderless />}
            />
          </StudioRailDropdown>
          <StudioRailDropdown
            title="COLORS"
            collapsedIcon={<Icon name="design-color-painting-palette" />}
            collapsedTooltip="Colors"
          >
            <div
              role="radiogroup"
              aria-label="Brush color"
              className="grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px"
            >
              {state.colorsRailProps.paletteColors.map((c) => (
                <CtrlColorSwatch
                  key={c.hex}
                  color={c.hex}
                  size="xl"
                  borderless
                  selected={state.activeColor.toLowerCase() === c.hex.toLowerCase()}
                  onClick={() => state.colorsRailProps.onColorChange(c.hex)}
                />
              ))}
            </div>
          </StudioRailDropdown>
        </StudioRailSection>
      ),
    }),
    [
      state.dottingRef,
      state.activeTool,
      state.activeColor,
      activeToolLabel,
      state.footerControls,
      state.leftRailProps,
      state.colorsRailProps,
    ],
  );
  const layersSlot = useMemo(
    () => ({
      side: 'right' as const,
      maxWidth: 320,
      label: 'Layers',
      hideTab: true,
      isOpen: true,
      children: <StudioRightRail {...state.rightRailProps} />,
    }),
    [state.rightRailProps],
  );
  const exportSlot = useMemo(
    () => ({
      side: 'right' as const,
      maxWidth: 320,
      label: 'Export',
      hideTab: true,
      isOpen: true,
      children: <StudioRailSection>{exportPanel}</StudioRailSection>,
    }),
    [exportPanel],
  );
  useControlSurfaceSlot(canvasControlsSlot);
  useControlSurfaceSlot(layersSlot);
  useControlSurfaceSlot(exportSlot);

  return (
    <>
      <AppWindow.Content layout="single">
        {/* Square canvas, centered in the remaining content area. */}
        <div className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
          <AppWindow.Island
            width="h-full aspect-square max-w-full"
            corners="pixel"
            padding="none"
            noScroll
          >
            <CanvasArea
              key={state.canvasKey}
              dottingRef={state.dottingRef}
              brushTool={state.activeTool}
              brushColor={state.activeColor}
              isGridVisible={state.isGridVisible}
              initLayers={state.initLayers}
            />
          </AppWindow.Island>
        </div>
      </AppWindow.Content>

    </>
  );
}
