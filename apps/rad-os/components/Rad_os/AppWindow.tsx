'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppWindow as CoreAppWindow } from '@rdna/radiants/components/core';
import type {
  AppWindowControlSurface,
  AppWindowControlSurfaceLayout,
  AppWindowControlSurfaceVariant,
} from '@rdna/radiants/components/core';
import { useWindowManager } from '@/hooks/useWindowManager';
import type { ControlSurfaceSide, SnapRegion } from '@/hooks/useWindowManager';
import { resolveWindowSize } from '@/lib/windowSizing';
import type { WindowSizeTier, WindowSize } from '@/lib/windowSizing';

export type { ControlSurfaceSide } from '@/hooks/useWindowManager';

/**
 * Descriptor a child component can push into the control-surface dock via
 * {@link useControlSurfaceSlot}. The wrapper merges these with the window
 * store's per-side `controlSurfaceOpen` state before handing the result to
 * the core AppWindow.
 */
export interface ControlSurfaceSlot {
  side?: ControlSurfaceSide;
  /** Drawer (outside) vs inset (inside) presentation. Default `drawer` for
   *  left/right/bottom; `top` and `taskbar` are inset-only. */
  variant?: AppWindowControlSurfaceVariant;
  /** Inset-only. `offset` reflows islands (default); `overlay` floats above. */
  layout?: AppWindowControlSurfaceLayout;
  width?: number;
  /** Content-driven width cap for vertical rails. Ignored when `width` is set. */
  maxWidth?: number;
  /** Height in px for horizontal rails. Ignored for vertical rails and taskbar. */
  height?: number;
  /** Short descriptive label shown vertically on the rail's eject tab
   *  (e.g. "TOOLS", "COLORS"). Also used as the tab's aria-label. */
  label?: string;
  /** Controlled open state for this specific slot. When omitted, the window's
   *  per-side control-surface state is used. */
  isOpen?: boolean;
  /** Hide the built-in drawer eject tab. Use with a custom visible control
   *  that can restore the slot when closed. */
  hideTab?: boolean;
  children: React.ReactNode;
}

interface ControlSurfaceSlotContextValue {
  set: (slotId: string, slot: ControlSurfaceSlot | null) => void;
}

const ControlSurfaceSlotCtx = createContext<ControlSurfaceSlotContextValue | null>(null);

/**
 * Register a control-surface dock from inside an AppWindow child. Three
 * calling forms are supported:
 *
 * ```ts
 * // Side-aware (recommended for dual-dock apps):
 * useControlSurfaceSlot('left', <OutputPanel />);
 * useControlSurfaceSlot('right', <ControlsPanel />);
 *
 * // Legacy single-arg form (defaults to the right dock):
 * useControlSurfaceSlot({ width: 260, children: <Controls /> });
 * useControlSurfaceSlot({ side: 'left', children: <Output /> });
 *
 * // Pass `null` (or stop rendering the hook) to clear the dock.
 * useControlSurfaceSlot('right', null);
 * useControlSurfaceSlot(null);
 * ```
 */
export function useControlSurfaceSlot(
  side: ControlSurfaceSide,
  node: React.ReactNode | null,
): void;
export function useControlSurfaceSlot(slot: ControlSurfaceSlot | null): void;
export function useControlSurfaceSlot(
  sideOrSlot: ControlSurfaceSide | ControlSurfaceSlot | null,
  node?: React.ReactNode | null,
): void {
  const ctx = useContext(ControlSurfaceSlotCtx);
  // Stable id so the same hook call can register multiple dynamic slots on
  // the same side (e.g. two right-side rails) without clobbering each other.
  const slotId = React.useId();

  // Normalize the overloaded arguments into a single (side, slot) pair.
  // Supplying only the first argument keeps legacy callers working — they pass
  // the full `ControlSurfaceSlot` descriptor (or `null` to clear).
  const slot = useMemo<ControlSurfaceSlot | null>(() => {
    if (typeof sideOrSlot === 'string') {
      const resolvedSide = sideOrSlot;
      if (node == null) return null;
      return { side: resolvedSide, children: node };
    }
    if (sideOrSlot == null) return null;
    const resolvedSide = sideOrSlot.side ?? 'right';
    return { ...sideOrSlot, side: resolvedSide };
  }, [sideOrSlot, node]);

  useEffect(() => {
    if (!ctx || slot == null) return;
    ctx.set(slotId, slot);
    return () => ctx.set(slotId, null);
  }, [ctx, slotId, slot]);
}

interface AppWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: WindowSizeTier | WindowSize;
  minSize?: { width: number; height: number };
  aspectRatio?: number;
  resizable?: boolean;
  className?: string;
  icon?: React.ReactNode;
  contentPadding?: boolean;
  showWidgetButton?: boolean;
  onWidget?: () => void;
  chromeless?: boolean;
  /** Optional attached dock(s). The wrapper owns the open/close state via the window store,
   * so callers should not pass `open` here. Pass a single slot or an array (one per side).
   * Children rendered inside this AppWindow can also register dock slots dynamically via
   * {@link useControlSurfaceSlot}; dynamic slots take priority per-side when present. */
  controlSurface?: ControlSurfaceSlot | ControlSurfaceSlot[];
}

export function AppWindow({
  id,
  title,
  children,
  defaultPosition = { x: 100, y: 50 },
  defaultSize,
  minSize,
  aspectRatio,
  resizable = true,
  className = '',
  icon,
  contentPadding = true,
  showWidgetButton = false,
  onWidget,
  chromeless = false,
  controlSurface,
}: AppWindowProps) {
  const {
    getWindowState,
    closeWindow,
    toggleFullscreen,
    focusWindow,
    centerWindow,
    snapWindow,
    restoreWindowSize,
    canRestoreWindow,
    updateWindowPosition,
    updateWindowSize,
    toggleControlSurface,
    openWindows,
  } = useWindowManager();

  const windowState = getWindowState(id);
  const resolvedSize = defaultSize ? resolveWindowSize(defaultSize) : undefined;
  const topZIndex = openWindows.reduce((max, windowItem) => Math.max(max, windowItem.zIndex), 0);
  const cascadeIndex = openWindows.filter((windowItem) => windowItem.id !== id).length;
  const handleClose = useCallback(() => closeWindow(id), [closeWindow, id]);
  const handleFocus = useCallback(() => focusWindow(id), [focusWindow, id]);
  const handleFullscreen = useCallback(() => toggleFullscreen(id), [toggleFullscreen, id]);
  const handleCenter = useCallback(() => centerWindow(id), [centerWindow, id]);
  const handleSnap = useCallback(
    (region: SnapRegion) => snapWindow(id, region),
    [id, snapWindow],
  );
  const handleRestore = useCallback(() => restoreWindowSize(id), [id, restoreWindowSize]);
  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => updateWindowPosition(id, position),
    [id, updateWindowPosition],
  );
  const handleSizeChange = useCallback(
    (size: { width: number; height: number }) => updateWindowSize(id, size),
    [id, updateWindowSize],
  );
  const handleToggleSide = useCallback(
    (side: ControlSurfaceSide) => toggleControlSurface(id, side),
    [id, toggleControlSurface],
  );

  // Dynamic slots keyed by React-generated id — each useControlSurfaceSlot
  // call gets its own entry so an app can mount multiple rails per side.
  const [dynamicSlots, setDynamicSlots] = useState<
    Record<string, ControlSurfaceSlot>
  >({});
  const slotCtx = useMemo<ControlSurfaceSlotContextValue>(
    () => ({
      set: (slotId, slot) => {
        setDynamicSlots((prev) => {
          if (slot == null) {
            if (prev[slotId] == null) return prev;
            const next = { ...prev };
            delete next[slotId];
            return next;
          }
          return { ...prev, [slotId]: slot };
        });
      },
    }),
    [],
  );

  // Prop-provided surfaces (legacy / array) retain their per-side keying —
  // only one static prop surface per side. Dynamic hook-registered slots can
  // stack without bound.
  const propSurfaces = useMemo(() => {
    const list = controlSurface
      ? Array.isArray(controlSurface)
        ? controlSurface
        : [controlSurface]
      : [];
    return list.map((s, idx) => {
      const side = s.side ?? 'right';
      return { key: `prop:${side}:${idx}`, slot: { ...s, side } };
    });
  }, [controlSurface]);

  const mergedSurfaces: AppWindowControlSurface[] = useMemo(() => {
    const openState = windowState?.controlSurfaceOpen ?? {};
    const surfaces: AppWindowControlSurface[] = [];
    const resolveVariant = (
      slot: ControlSurfaceSlot,
      side: ControlSurfaceSide,
    ): AppWindowControlSurfaceVariant => {
      if (slot.variant) return slot.variant;
      // `top` and `taskbar` have no drawer form — coerce to inset.
      return side === 'top' || side === 'taskbar' ? 'inset' : 'drawer';
    };
    for (const { key, slot } of propSurfaces) {
      const side = slot.side ?? 'right';
      const variant = resolveVariant(slot, side);
      surfaces.push({
        id: `${id}:${key}`,
        side,
        variant,
        layout: slot.layout,
        children: slot.children,
        width: slot.width,
        maxWidth: slot.maxWidth,
        height: slot.height,
        label: slot.label,
        hideTab: slot.hideTab,
        // Taskbar is always open; other sides honor per-side toggle state.
        isOpen: slot.isOpen ?? (side === 'taskbar' ? true : (openState[side] ?? true)),
      });
    }
    for (const [slotId, slot] of Object.entries(dynamicSlots)) {
      const side = slot.side ?? 'right';
      const variant = resolveVariant(slot, side);
      surfaces.push({
        id: `${id}:dyn:${slotId}`,
        side,
        variant,
        layout: slot.layout,
        children: slot.children,
        width: slot.width,
        maxWidth: slot.maxWidth,
        height: slot.height,
        label: slot.label,
        hideTab: slot.hideTab,
        isOpen: slot.isOpen ?? (side === 'taskbar' ? true : (openState[side] ?? true)),
      });
    }
    return surfaces;
  }, [propSurfaces, dynamicSlots, windowState?.controlSurfaceOpen, id]);

  const hasAnySurface = mergedSurfaces.length > 0;
  const resolvedControlSurfaces = hasAnySurface ? mergedSurfaces : undefined;

  return (
    <CoreAppWindow
      id={id}
      title={title}
      open={windowState?.isOpen ?? false}
      presentation={windowState?.isFullscreen ? 'fullscreen' : 'window'}
      position={windowState?.position}
      defaultPosition={defaultPosition}
      size={windowState?.size ?? resolvedSize}
      defaultSize={resolvedSize}
      minSize={minSize}
      aspectRatio={aspectRatio}
      resizable={resizable}
      className={className}
      icon={icon}
      contentPadding={contentPadding}
      chromeless={chromeless}
      showWidgetButton={showWidgetButton}
      widgetActive={windowState?.isWidget ?? false}
      focused={(windowState?.zIndex ?? 0) === topZIndex}
      zIndex={windowState?.zIndex}
      autoCenter={!windowState?.size && !resolvedSize}
      cascadeIndex={cascadeIndex}
      onWidget={onWidget}
      onClose={handleClose}
      onFocus={handleFocus}
      onFullscreen={handleFullscreen}
      onCenter={handleCenter}
      onSnap={handleSnap}
      onRestore={handleRestore}
      canRestore={canRestoreWindow(id)}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
      controlSurfaces={resolvedControlSurfaces}
      onToggleSide={hasAnySurface ? handleToggleSide : undefined}
    >
      <ControlSurfaceSlotCtx.Provider value={slotCtx}>
        {children}
      </ControlSurfaceSlotCtx.Provider>
    </CoreAppWindow>
  );
}
