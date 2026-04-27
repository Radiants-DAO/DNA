'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ditherBands } from '@rdna/pixel/dither';
import { Button } from '../Button/Button';
import { Icon } from '../../../icons/Icon';
import { ScrollArea } from '../ScrollArea/ScrollArea';

import { Tabs } from '../Tabs/Tabs';
import { Tooltip } from '../Tooltip/Tooltip';
import { WindowManagerMenu, type SnapRegion } from './WindowManagerMenu';

export type { SnapRegion } from './WindowManagerMenu';

// Stepped Bayer-dither chrome: 17 stacked equal-height density bands.
// Each band is a static n×n Bayer tile that repeats at native pixel scale,
// so resizing the window only changes the band height — not the dither cells.
// Fill = --color-window-chrome-from, base = --color-window-chrome-to.
const CHROME_DITHER_BANDS = ditherBands({ matrix: 4, steps: 17, direction: 'up' });
const CHROME_DITHER_PIXEL_SCALE = 1;

type WindowDimension = number | string;
type AppWindowPresentation = 'window' | 'fullscreen' | 'mobile';
type AppWindowShellStyle = React.CSSProperties & {
  '--app-content-max-height': string;
};

interface AppWindowPosition {
  x: number;
  y: number;
}

interface AppWindowSize {
  width: WindowDimension;
  height: WindowDimension;
}

interface AppWindowActionButton {
  text: string;
  iconName?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
}

/** Side of the window a control-surface dock attaches to.
 *  - `left` / `right` / `bottom`: supported by both `drawer` and `inset` variants.
 *  - `top`: inset-only — there is no top drawer.
 *  - `taskbar`: inset-only — renders inside the toolbar as a non-collapsable strip. */
export type AppWindowControlSurfaceSide =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'taskbar';

/** Presentation mode for a control surface.
 *  - `drawer` (default): protrudes outside the window shell as a rounded drawer
 *    with eject tab, drop shadow, and tuck. Sides: `left` | `right` | `bottom`.
 *  - `inset`: renders inside the window shell with no drawer chrome. Sides:
 *    all five, including `top` and `taskbar`. */
export type AppWindowControlSurfaceVariant = 'drawer' | 'inset';

/** Inset-only layout strategy.
 *  - `offset` (default): takes space from the content area (flex sibling).
 *  - `overlay`: absolute-positioned above content, does not reflow islands. */
export type AppWindowControlSurfaceLayout = 'offset' | 'overlay';

/**
 * A docked tray attached to (or inside) the window shell. Consumers register
 * their tray UI via the rad-os `useControlSurfaceSlot` hook; the core
 * component owns the shell-relationship chrome.
 *
 * `variant` controls presentation:
 * - `drawer`: classic rail that protrudes outside the shell with bezel, drop
 *   shadow, tuck, and eject tab. Only `left` / `right` / `bottom` sides.
 * - `inset`: renders inside the shell with no drawer chrome. Supports all
 *   five sides; taskbar is always-open and hides its toggle.
 */
export interface AppWindowControlSurface {
  /** Stable identifier for the surface (used by React key + tab aria-controls). */
  id: string;
  side: AppWindowControlSurfaceSide;
  /** Drawer (outside) vs inset (inside) presentation. Default: `drawer`. */
  variant?: AppWindowControlSurfaceVariant;
  /** Inset-only. `offset` (default) reflows islands; `overlay` floats above. */
  layout?: AppWindowControlSurfaceLayout;
  children: React.ReactNode;
  /**
   * Width in px for vertical rails (`left` / `right`). Defaults to 260 for
   * drawer variant. Ignored for horizontal rails and taskbar.
   */
  width?: number;
  /**
   * When set (and `width` is omitted), the rail width is driven by its
   * content, capped at this many px. Vertical rails only.
   */
  maxWidth?: number;
  /**
   * Height in px for horizontal rails (`top` / `bottom`). Defaults to 180 for
   * drawer-bottom. Ignored for vertical rails and taskbar.
   */
  height?: number;
  /** Collapsed by the consumer. Ignored for `taskbar` (always open). */
  isOpen?: boolean;
  /** Hide the built-in drawer eject tab. Use only when the consumer renders
   *  another control that can restore hidden surfaces. */
  hideTab?: boolean;
  /** Accessible label for this surface's toggle (drawer variant only). */
  label?: string;
}

const DEFAULT_CONTROL_SURFACE_WIDTH = 260;
const DEFAULT_CONTROL_SURFACE_HEIGHT = 180;
/** Eject-tab thickness; the rail's tab stays visible outside the window
 *  when the rail is collapsed behind the window. */
const CONTROL_SURFACE_TAB_PX = 20;
/** How far the tab tucks behind the drawer on its drawer-facing side —
 *  makes the tab read as emerging from behind the drawer (same trick the
 *  drawer uses to tuck into the window shell). */
const CONTROL_SURFACE_TAB_TUCK_PX = 12;
/** Clearance below the titlebar (+ chrome gap) where the rail starts. */
const CONTROL_SURFACE_TOP_INSET_PX = 44;
/** Clearance from the window's left/right for a bottom dock. */
const CONTROL_SURFACE_HORIZONTAL_INSET_PX = 8;
/** How far the drawer tucks into the window shell on its anchored edge —
 *  large enough to hide the `pixel-rounded-8` corner mask (9×9) so the
 *  drawer reads as flowing out from behind the window chrome. */
const CONTROL_SURFACE_TUCK_PX = 8;
/** Size of the drawer's `pixel-rounded-8` corner mask. Used to offset the
 *  tab's chevron down past the drawer's rounded top corner so it visually
 *  aligns with the start of the drawer's straight edge. */
const CONTROL_SURFACE_DRAWER_CORNER_PX = 9;
/** How far the tab is pulled back toward the drawer on its outward edge,
 *  so it doesn't stick out quite as far as the raw `TAB_PX` width. */
const CONTROL_SURFACE_TAB_INSET_PX = 2;
/** Drawer padding on each side (Tailwind `p-1`). */
const CONTROL_SURFACE_DRAWER_PAD_PX = 4;
/** Dark-mode island padding on each side — LCD renders flush to its bezel. */
const CONTROL_SURFACE_ISLAND_PAD_PX = 0;
/** Extra padding on the drawer's INWARD (canvas-facing) edge. This is the
 *  thickest side — it hosts the checkerboard "window shadow" strip plus
 *  visual breathing room between the island contents and the canvas. */
const CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX = 8;
/** Inset for the window-shadow strip from the drawer's INWARD edge. Moves
 *  the shadow inward (toward the canvas / app-window content area) so it
 *  sits within the inward-padding zone rather than spilling onto the island. */
const CONTROL_SURFACE_SHADOW_INSET_PX = 4;
/** Total horizontal chrome a content-driven rail needs on top of its content
 *  width: drawer padding (both sides) + inward extra + island padding. */
const CONTROL_SURFACE_CHROME_H_PX =
  CONTROL_SURFACE_DRAWER_PAD_PX * 2 +
  CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX +
  CONTROL_SURFACE_ISLAND_PAD_PX * 2;

// ---------------------------------------------------------------------------
// RailContentMeasurer
//
// Wraps the rail's surface children and reports the wrapper's content-box
// size to a parent-provided callback via a ResizeObserver. The wrapper is a
// semantic no-op: when `applyMaxContent` is set, the wrapper takes the
// natural width of its children (used by content-driven `maxWidth` rails);
// otherwise it inherits the normal flow width. Height is always reported so
// the core can vertically stack multiple rails on the same side.
// ---------------------------------------------------------------------------
export interface RailContentSize {
  width: number;
  height: number;
}
interface RailContentMeasurerProps {
  id: string;
  onMeasure: (id: string, size: RailContentSize) => void;
  applyMaxContent?: boolean;
  children: React.ReactNode;
}

function RailContentMeasurer({
  id,
  onMeasure,
  applyMaxContent,
  children,
}: RailContentMeasurerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onMeasure(id, {
          width: Math.ceil(entry.contentRect.width),
          height: Math.ceil(entry.contentRect.height),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [id, onMeasure]);
  return (
    <div ref={ref} style={applyMaxContent ? { width: 'max-content' } : undefined}>
      {children}
    </div>
  );
}

/** Gap between stacked same-side rails. */
const CONTROL_SURFACE_STACK_GAP_PX = 8;

interface AppWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  position?: AppWindowPosition;
  defaultPosition?: AppWindowPosition;
  size?: AppWindowSize;
  defaultSize?: AppWindowSize;
  resizable?: boolean;
  className?: string;
  icon?: React.ReactNode;
  contentPadding?: boolean;
  showWidgetButton?: boolean;
  widgetActive?: boolean;
  showCopyButton?: boolean;
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  showActionButton?: boolean;
  actionButton?: AppWindowActionButton;
  focused?: boolean;
  zIndex?: number;
  presentation?: AppWindowPresentation;
  /** When true, the window renders chromeless: no titlebar, no shell background/shadow/corners.
   * Children must provide their own visual frame. Drag is preserved via [data-drag-handle] inside children.
   * Window controls are exposed to children via the `useAppWindowControls()` hook so they can build a custom titlebar. */
  chromeless?: boolean;
  minSize?: { width: number; height: number };
  /**
   * When set, the content area below the titlebar/toolbar is locked to this
   * width:height ratio during resize. Chrome height is measured live and
   * added back to the shell dims, so the caller describes content only.
   * Example: `1` for a square content area, `34 / 21` for golden.
   */
  aspectRatio?: number;
  viewportBottomInset?: number;
  viewportMargin?: number;
  autoCenter?: boolean;
  cascadeIndex?: number;
  onWidget?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  onFullscreen?: () => void;
  onCenter?: () => void;
  onSnap?: (region: SnapRegion) => void;
  onRestore?: () => void;
  canRestore?: boolean;
  onPositionChange?: (position: AppWindowPosition) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  /** Registered control-surface "rail" docks — rendered around the window shell. */
  controlSurfaces?: AppWindowControlSurface[];
  /** Toggle handler for a single side's eject tab. */
  onToggleSide?: (side: AppWindowControlSurfaceSide) => void;
}

interface AppWindowBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  bgClassName?: string;
  noScroll?: boolean;
}

// --- Compound Children Types ---

interface AppWindowNavProps {
  value: string;
  onChange: (value: string) => void;
  /** Render inactive tab labels alongside icons. Default is false (icon-only when inactive). */
  showInactiveLabels?: boolean;
  children: React.ReactNode;
}

interface AppWindowNavItemProps {
  value: string;
  icon?: React.ReactNode;
  /** Accessible label — required when children is not a plain string (e.g., icon-only tabs). */
  label?: string;
  children: React.ReactNode;
}

interface AppWindowToolbarProps {
  children: React.ReactNode;
  className?: string;
}

interface AppWindowContentProps {
  children: React.ReactNode;
  className?: string;
  layout?: ContentLayout;
}

type ContentLayout = 'single' | 'split' | 'sidebar' | 'three' | 'bleed';

interface AppWindowIslandProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bgClassName?: string;
  noScroll?: boolean;
  /** Corner style. 'standard' = CSS rounded + border (default). 'pixel' = pixel-corner mask + border (no CSS border). 'none' = no corners or border. */
  corners?: 'standard' | 'pixel' | 'none';
  width?: string;
  className?: string;
}

const DEFAULT_MIN_SIZE = { width: 300, height: 200 };
const DEFAULT_BOTTOM_INSET = 48;
const DEFAULT_VIEWPORT_MARGIN = 8;
const TITLE_BAR_HEIGHT = 40;
const CHROME_PADDING = 16;
const DEFAULT_CASCADE_OFFSET = 30;
const SNAP_CORNER_ZONE = 48;
const SNAP_EDGE_ZONE = 16;
const WINDOW_DRAG_CANCEL_SELECTOR = '[data-aw-controls-no-drag], [data-aw="titlebar-nav"]';

/** Layouts that need an inner [data-aw="layout"] row/column wrapper with gap. */
const MULTI_COLUMN_LAYOUTS: ReadonlySet<ContentLayout> = new Set(['split', 'sidebar', 'three']);

function getDragViewport(viewportBottomInset: number) {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight - viewportBottomInset,
  };
}

function computeDragSnapZone(
  clientX: number,
  clientY: number,
  viewportBottomInset: number,
): SnapRegion | null {
  const { width, height } = getDragViewport(viewportBottomInset);
  if (!width || !height) return null;
  const nearLeftCorner = clientX < SNAP_CORNER_ZONE;
  const nearRightCorner = clientX > width - SNAP_CORNER_ZONE;
  const nearTop = clientY < SNAP_CORNER_ZONE;
  const nearBottom = clientY > height - SNAP_CORNER_ZONE;
  if (nearTop && nearLeftCorner) return 'top-left';
  if (nearTop && nearRightCorner) return 'top-right';
  if (nearBottom && nearLeftCorner) return 'bottom-left';
  if (nearBottom && nearRightCorner) return 'bottom-right';
  if (clientX < SNAP_EDGE_ZONE) return 'left';
  if (clientX > width - SNAP_EDGE_ZONE) return 'right';
  return null;
}

function getSnapRect(
  region: SnapRegion,
  viewportBottomInset: number,
): { x: number; y: number; width: number; height: number } {
  const { width, height } = getDragViewport(viewportBottomInset);
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);
  switch (region) {
    case 'left':
      return { x: 0, y: 0, width: halfW, height };
    case 'right':
      return { x: halfW, y: 0, width: width - halfW, height };
    case 'top':
      return { x: 0, y: 0, width, height: halfH };
    case 'bottom':
      return { x: 0, y: halfH, width, height: height - halfH };
    case 'top-left':
      return { x: 0, y: 0, width: halfW, height: halfH };
    case 'top-right':
      return { x: halfW, y: 0, width: width - halfW, height: halfH };
    case 'bottom-left':
      return { x: 0, y: halfH, width: halfW, height: height - halfH };
    case 'bottom-right':
      return { x: halfW, y: halfH, width: width - halfW, height: height - halfH };
  }
}

function readClientPoint(event: DraggableEvent): { x: number; y: number } | null {
  if ('touches' in event && event.touches && event.touches[0]) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  if ('clientX' in event && 'clientY' in event) {
    return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
  }
  return null;
}

const PADDING_MAP: Record<NonNullable<AppWindowBodyProps['padding']>, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

// --- AppWindow context for compound children (state-registration) ---

export interface AppWindowControls {
  onClose?: () => void;
  onFullscreen?: () => void;
  onWidget?: () => void;
  onCenter?: () => void;
  onSnap?: (region: SnapRegion) => void;
  onRestore?: () => void;
  canRestore: boolean;
  isFullscreen: boolean;
  widgetActive: boolean;
}

interface AppWindowChromeContext {
  setNav: (content: React.ReactNode) => void;
  setToolbar: (content: { children: React.ReactNode; className: string } | null) => void;
  contentPadding: boolean;
  chromeless: boolean;
  controls: AppWindowControls;
}

const AppWindowChromeCtx = React.createContext<AppWindowChromeContext | null>(null);

/** Access window controls from within an AppWindow child (e.g., for chromeless custom titlebars). */
export function useAppWindowControls(): AppWindowControls | null {
  const chrome = React.useContext(AppWindowChromeCtx);
  return chrome?.controls ?? null;
}
const AppWindowContentDepthCtx = React.createContext(0);

function getMaxWindowSize(viewportBottomInset: number, viewportMargin: number): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 800 };
  }

  return {
    width: Math.floor(window.innerWidth - viewportMargin * 2),
    height: Math.floor(window.innerHeight - viewportBottomInset),
  };
}

function dimensionToPx(value: WindowDimension | undefined): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (trimmed.endsWith('px')) {
    return Number.parseFloat(trimmed);
  }
  if (trimmed.endsWith('rem')) {
    const remValue = Number.parseFloat(trimmed);
    if (Number.isNaN(remValue)) return undefined;
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
    return remValue * rootFontSize;
  }

  return undefined;
}

function getMaxContentHeight(viewportBottomInset: number): number {
  const maxWindow = getMaxWindowSize(viewportBottomInset, DEFAULT_VIEWPORT_MARGIN);
  return maxWindow.height - TITLE_BAR_HEIGHT - CHROME_PADDING;
}

// --- Toolbar node (shared by in-chrome and standalone render paths) ---

function ToolbarNode({
  children,
  className = '',
  nodeRef,
}: {
  children: React.ReactNode;
  className?: string;
  nodeRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={nodeRef}
      className={className.trim()}
      data-aw="toolbar"
      data-window-toolbar=""
    >
      {children}
    </div>
  );
}

// --- Resize handles (8 direction handles in one place) ---

const RESIZE_HANDLES: ReadonlyArray<{ dir: string; className: string }> = [
  { dir: 'nw', className: 'top-0 left-0 w-3 h-3 cursor-nwse-resize' },
  { dir: 'ne', className: 'top-0 right-0 w-3 h-3 cursor-nesw-resize' },
  { dir: 'sw', className: 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize' },
  { dir: 'se', className: 'bottom-0 right-0 w-3 h-3 cursor-nwse-resize' },
  { dir: 'n', className: 'top-0 left-3 right-3 h-2 cursor-ns-resize' },
  { dir: 's', className: 'bottom-0 left-3 right-3 h-2 cursor-ns-resize' },
  { dir: 'w', className: 'left-0 top-3 bottom-3 w-2 cursor-ew-resize' },
  { dir: 'e', className: 'right-0 top-3 bottom-3 w-2 cursor-ew-resize' },
];

function ResizeHandles({
  onPointerDown,
}: {
  onPointerDown: (event: React.PointerEvent, direction: string) => void;
}) {
  return (
    <>
      {RESIZE_HANDLES.map(({ dir, className }) => (
        <div
          key={dir}
          className={`absolute z-10 ${className}`}
          data-resize-handle={dir}
          style={{ touchAction: 'none' }}
          onPointerDown={(event) => onPointerDown(event, dir)}
        />
      ))}
    </>
  );
}

// --- Titlebar ---

/**
 * Inset-taskbar viewport — wraps a horizontal strip of inset-taskbar surfaces
 * inside a dark LCD island that:
 *  - is always horizontally scrollable (native scrollbar hidden)
 *  - fades to transparent at both edges via a mask gradient
 *  - reveals a chevron indicator on whichever edge has off-screen content
 *
 * Overflow is computed from the scroll viewport's `scrollLeft`, `clientWidth`,
 * and `scrollWidth`. A ResizeObserver keeps state fresh as the window or
 * content reflows, and a scroll listener tracks position changes.
 */
function TitlebarTaskbarStrip({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState<{ left: boolean; right: boolean }>(
    { left: false, right: false },
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      // 1px tolerance for sub-pixel rounding.
      setOverflow({
        left: scrollLeft > 1,
        right: scrollLeft + clientWidth < scrollWidth - 1,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      data-aw="titlebar-taskbar"
      data-aw-controls-no-drag=""
      className="relative dark bg-page pixel-rounded-6 flex-1 min-w-0 h-6"
    >
      <div
        ref={scrollRef}
        data-aw="titlebar-taskbar-scroll"
        className="h-full w-full overflow-x-scroll overflow-y-hidden flex items-stretch [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
          maskImage:
            'linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
        }}
      >
        {children}
      </div>
      {overflow.left ? (
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center pointer-events-none text-ctrl-label [&_svg]:size-3"
        >
          <Icon name="chevron-left" />
        </div>
      ) : null}
      {overflow.right ? (
        <div
          aria-hidden
          className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center pointer-events-none text-ctrl-label [&_svg]:size-3"
        >
          <Icon name="chevron-right" />
        </div>
      ) : null}
    </div>
  );
}

function AppWindowTitleBar({
  id,
  title,
  icon: _icon,
  showCopyButton = true,
  showCloseButton = true,
  showFullscreenButton = true,
  showWidgetButton = false,
  showActionButton = false,
  actionButton,
  widgetActive = false,
  presentation,
  navContent,
  taskbarInset,
  onClose,
  onFullscreen,
  onCenter,
  onSnap,
  onRestore,
  canRestore = false,
  onWidget,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  showCopyButton?: boolean;
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  showWidgetButton?: boolean;
  showActionButton?: boolean;
  actionButton?: AppWindowActionButton;
  widgetActive?: boolean;
  presentation: AppWindowPresentation;
  navContent?: React.ReactNode;
  /** Inset-taskbar surfaces — rendered inline in the titlebar's middle zone,
   *  wrapped in a dark LCD island for visual continuity with drawer rails. */
  taskbarInset?: React.ReactNode;
  onClose?: () => void;
  onFullscreen?: () => void;
  onCenter?: () => void;
  onSnap?: (region: SnapRegion) => void;
  onRestore?: () => void;
  canRestore?: boolean;
  onWidget?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  }, [id]);

  const hasControls =
    (showCloseButton && onClose) ||
    (showFullscreenButton && onFullscreen) ||
    showCopyButton ||
    (showWidgetButton && onWidget) ||
    (showActionButton && actionButton);

  return (
    <div
      data-aw="titlebar"
      data-draggable={presentation === 'window' ? 'true' : 'false'}
      data-drag-handle={presentation === 'window' ? '' : undefined}
      style={presentation === 'window' ? { touchAction: 'none' } : undefined}
    >
      {hasControls ? (
        <div data-aw="titlebar-controls" data-aw-controls-no-drag="">
          {showCloseButton && onClose ? (
            <Tooltip content="Close">
              <Button
                tone="danger"
                size="sm"
                rounded="sm"
                iconOnly
                icon="close"
                onClick={onClose}
                aria-label={`Close ${title}`}
              />
            </Tooltip>
          ) : null}

          {showFullscreenButton && onFullscreen ? (
            onCenter || onSnap || onRestore ? (
              <WindowManagerMenu
                title={title}
                isFullscreen={presentation === 'fullscreen'}
                canRestore={canRestore}
                onFullscreen={onFullscreen}
                onCenter={onCenter}
                onSnap={onSnap}
                onRestore={onRestore}
              />
            ) : (
              <Tooltip content={presentation === 'fullscreen' ? 'Exit fullscreen' : 'Enter fullscreen'}>
                <Button
                  tone="accent"
                  size="sm"
                  rounded="sm"
                  iconOnly
                  icon={presentation === 'fullscreen' ? 'collapse' : 'expand'}
                  onClick={onFullscreen}
                  aria-label={`${presentation === 'fullscreen' ? 'Exit' : 'Enter'} fullscreen ${title}`}
                />
              </Tooltip>
            )
          ) : null}

          {showCopyButton ? (
            <Tooltip content="Copy link">
              <Button
                tone="success"
                size="sm"
                rounded="sm"
                iconOnly
                icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
                onClick={handleCopyLink}
                aria-label={`Copy link to ${title}`}
              />
            </Tooltip>
          ) : null}

          {showWidgetButton && onWidget ? (
            <Tooltip content={widgetActive ? 'Exit widget mode' : 'Widget mode'}>
              <Button
                size="sm"
                iconOnly
                icon="picture-in-picture"
                onClick={onWidget}
                aria-label={`${widgetActive ? 'Exit' : 'Enter'} widget mode for ${title}`}
              />
            </Tooltip>
          ) : null}

          {showActionButton && actionButton ? (
            actionButton.href ? (
              <Button
                mode="pattern"
                size="sm"
                icon={actionButton.iconName ?? undefined}
                className="shrink-0"
                href={actionButton.href}
                target={actionButton.target}
                rel={actionButton.target === '_blank' ? 'noopener noreferrer' : undefined}
                onClick={actionButton.onClick}
              >
                {actionButton.text}
              </Button>
            ) : (
              <Button
                mode="pattern"
                size="sm"
                icon={actionButton.iconName ?? undefined}
                className="shrink-0"
                onClick={actionButton.onClick}
              >
                {actionButton.text}
              </Button>
            )
          ) : null}
        </div>
      ) : null}

      {/* Nav slot: registered nav content sits in the growing middle zone.
          When there's no nav, the portal fallback uses display:contents so it
          contributes no box — the flex gap between controls and title collapses
          the middle, which matches the pre-refactor look. */}
      {navContent ? (
        <div data-aw="titlebar-nav">{navContent}</div>
      ) : (
        <div id={`window-titlebar-slot-${id}`} className="contents" />
      )}

      {/* Taskbar inset — sits inline with controls + title in its own dark
          LCD island, locked to `h-6` so the strip tracks size="sm" titlebar
          buttons. Always horizontally scrollable; native scrollbar hidden in
          favor of edge-fade masking + scroll-aware chevron indicators. */}
      {taskbarInset ? (
        <TitlebarTaskbarStrip>{taskbarInset}</TitlebarTaskbarStrip>
      ) : null}

      <span
        id={`window-title-${id}`}
        className="shrink-0 font-joystix text-xs uppercase tracking-tight text-head whitespace-nowrap px-2 py-0.5"
      >
        {title}
      </span>
    </div>
  );
}

// --- Compound Sub-Components ---

function AppWindowNavItem({ value: _value, icon: _icon, label: _label, children: _children }: AppWindowNavItemProps) {
  // Data carrier — rendered by AppWindowNav, not standalone
  return null;
}
AppWindowNavItem.displayName = 'AppWindow.Nav.Item';

function AppWindowNav({ value, onChange, showInactiveLabels, children }: AppWindowNavProps) {
  const chrome = React.useContext(AppWindowChromeCtx);

  const items: AppWindowNavItemProps[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AppWindowNavItem) {
      items.push(child.props as AppWindowNavItemProps);
    }
  });

  const navContent = useMemo(
    () => (
      <Tabs value={value} onValueChange={onChange} mode="chrome" align="center" showInactiveLabels={showInactiveLabels}>
        <Tabs.List>
          {items.map((item) => (
            <Tabs.Trigger key={item.value} value={item.value} icon={item.icon}>
              {item.children}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>
    ),
    [items, onChange, value, showInactiveLabels],
  );

  // Register nav content with AppWindow via context; render nothing here
  useEffect(() => {
    chrome?.setNav(navContent);
    return () => chrome?.setNav(null);
  }, [chrome, navContent]);

  if (!chrome) return navContent;
  return null;
}
AppWindowNav.displayName = 'AppWindow.Nav';
AppWindowNav.Item = AppWindowNavItem;

function AppWindowToolbar({ children, className = '' }: AppWindowToolbarProps) {
  const chrome = React.useContext(AppWindowChromeCtx);
  const toolbarContent = useMemo(() => ({ children, className }), [children, className]);

  // Register toolbar content with AppWindow via context; render nothing here
  useEffect(() => {
    chrome?.setToolbar(toolbarContent);
    return () => chrome?.setToolbar(null);
  }, [chrome, toolbarContent]);

  if (!chrome) {
    return <ToolbarNode className={className}>{children}</ToolbarNode>;
  }
  return null;
}
AppWindowToolbar.displayName = 'AppWindow.Toolbar';

function AppWindowIsland({
  children,
  padding = 'lg',
  bgClassName = 'bg-card',
  noScroll = false,
  corners = 'standard',
  width,
  className = '',
}: AppWindowIslandProps) {
  // sizeClass no longer carries min-h-0 — CSS ([data-aw="island"]) owns it.
  const sizeClass = width ? `shrink-0 ${width}` : 'flex-1 min-w-0';
  const paddingClass = PADDING_MAP[padding];
  const cornerClass =
    corners === 'pixel'
      ? 'pixel-rounded-6'
      : corners === 'standard'
        ? 'border border-line rounded'
        : '';

  return (
    <div
      className={`${sizeClass} ${cornerClass} ${bgClassName} ${className}`.trim()}
      data-aw="island"
      data-corners={corners}
      data-scroll={noScroll ? 'none' : 'auto'}
      data-pad={padding}
    >
      {noScroll ? (
        paddingClass ? <div className={paddingClass} data-aw="island-pad" data-fill="true">{children}</div> : children
      ) : (
        <ScrollArea.Root className="" data-aw="island-scroll">
          {paddingClass ? <div className={paddingClass} data-aw="island-pad">{children}</div> : children}
        </ScrollArea.Root>
      )}
    </div>
  );
}
AppWindowIsland.displayName = 'AppWindow.Island';

function AppWindowContent({ children, layout = 'single', className = '' }: AppWindowContentProps) {
  const chrome = React.useContext(AppWindowChromeCtx);
  const contentDepth = React.useContext(AppWindowContentDepthCtx);

  useEffect(() => {
    if (contentDepth > 0 && process.env.NODE_ENV !== 'production') {
      console.warn('AppWindow.Content should not be nested inside another AppWindow.Content. Use AppWindow.Island or a plain layout wrapper instead.');
    }
  }, [contentDepth]);

  const needsInnerLayout = MULTI_COLUMN_LAYOUTS.has(layout);

  return (
    <AppWindowContentDepthCtx.Provider value={contentDepth + 1}>
      <div
        className={className.trim()}
        data-aw="stage"
        data-layout={layout}
        data-content-padding={chrome?.contentPadding ? 'true' : 'false'}
      >
        {needsInnerLayout ? (
          <div data-aw="layout" data-layout={layout}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </AppWindowContentDepthCtx.Provider>
  );
}
AppWindowContent.displayName = 'AppWindow.Content';

// --- Main AppWindow component ---

function AppWindow({
  id,
  title,
  children,
  open = true,
  position,
  defaultPosition = { x: 100, y: 50 },
  size,
  defaultSize,
  resizable = true,
  className = '',
  icon,
  contentPadding = true,
  showWidgetButton = false,
  widgetActive = false,
  showCopyButton = true,
  showCloseButton = true,
  showFullscreenButton = true,
  showActionButton = false,
  actionButton,
  focused = false,
  zIndex = 100,
  presentation = 'window',
  chromeless = false,
  minSize = DEFAULT_MIN_SIZE,
  aspectRatio,
  viewportBottomInset = DEFAULT_BOTTOM_INSET,
  viewportMargin = DEFAULT_VIEWPORT_MARGIN,
  autoCenter = false,
  cascadeIndex = 0,
  onWidget,
  onClose,
  onFocus,
  onFullscreen,
  onCenter,
  onSnap,
  onRestore,
  canRestore = false,
  onPositionChange,
  onSizeChange,
  controlSurfaces,
  onToggleSide,
}: AppWindowProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const lastCenteredSizeRef = useRef<{ width: number; height: number } | null>(null);

  // Measured rail content sizes — width feeds content-driven `maxWidth`
  // rails; height feeds vertical stacking of multiple rails on the same side.
  const [railSizes, setRailSizes] = useState<Record<string, RailContentSize>>({});
  const handleRailMeasure = useCallback(
    (id: string, size: RailContentSize) => {
      setRailSizes((prev) => {
        const existing = prev[id];
        if (existing && existing.width === size.width && existing.height === size.height) {
          return prev;
        }
        return { ...prev, [id]: size };
      });
    },
    [],
  );

  // Pre-compute per-surface vertical stacking offset so multiple vertical
  // rails on the same side stack top-to-bottom instead of overlapping.
  const verticalStackOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    const cum: { left: number; right: number } = { left: 0, right: 0 };
    const chrome =
      // drawer padding (top + bottom) + island padding (top + bottom)
      CONTROL_SURFACE_DRAWER_PAD_PX * 2 + CONTROL_SURFACE_ISLAND_PAD_PX * 2;
    for (const s of controlSurfaces ?? []) {
      if (s.side !== 'left' && s.side !== 'right') continue;
      if (s.hideTab && s.isOpen === false) continue;
      offsets[s.id] = cum[s.side];
      const measured = railSizes[s.id];
      if (measured) {
        cum[s.side] += measured.height + chrome + CONTROL_SURFACE_STACK_GAP_PX;
      }
    }
    return offsets;
  }, [controlSurfaces, railSizes]);

  // --- Context for compound children (state-registration) ---
  const [navContent, setNavContent] = useState<React.ReactNode>(null);
  const [toolbarContent, setToolbarContent] = useState<{ children: React.ReactNode; className: string } | null>(null);

  const chromeCtx = useMemo<AppWindowChromeContext>(
    () => ({
      setNav: setNavContent,
      setToolbar: setToolbarContent,
      contentPadding,
      chromeless,
      controls: {
        onClose,
        onFullscreen,
        onWidget,
        onCenter,
        onSnap,
        onRestore,
        canRestore,
        isFullscreen: presentation === 'fullscreen',
        widgetActive,
      },
    }),
    [contentPadding, chromeless, onClose, onFullscreen, onWidget, onCenter, onSnap, onRestore, canRestore, presentation, widgetActive],
  );

  // --- Toolbar height measurement via ref callback ---
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const toolbarObserverRef = useRef<ResizeObserver | null>(null);

  const toolbarRef = useCallback((node: HTMLDivElement | null) => {
    if (toolbarObserverRef.current) {
      toolbarObserverRef.current.disconnect();
      toolbarObserverRef.current = null;
    }
    if (!node) {
      setToolbarHeight(0);
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setToolbarHeight(entry.contentRect.height + /* border-b */ 1);
    });
    observer.observe(node);
    toolbarObserverRef.current = observer;
  }, []);
  const [internalPosition, setInternalPosition] = useState(defaultPosition);
  const [internalSize, setInternalSize] = useState<AppWindowSize | undefined>(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [dragSnapZone, setDragSnapZone] = useState<SnapRegion | null>(null);
  const [resizeDirection, setResizeDirection] = useState('');
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
    chromeWidth: 0,
    chromeHeight: 0,
  });

  const effectivePosition = position ?? internalPosition;
  const effectiveSize = size ?? internalSize;
  const isPositionControlled = position !== undefined;
  const isSizeControlled = size !== undefined;
  const effectiveMax = useMemo(
    () => getMaxWindowSize(viewportBottomInset, viewportMargin),
    [viewportBottomInset, viewportMargin],
  );

  const commitPosition = useCallback(
    (next: AppWindowPosition) => {
      if (!isPositionControlled) {
        setInternalPosition(next);
      }
      onPositionChange?.(next);
    },
    [isPositionControlled, onPositionChange],
  );

  const commitSize = useCallback(
    (next: { width: number; height: number }) => {
      if (!isSizeControlled) {
        setInternalSize(next);
      }
      onSizeChange?.(next);
    },
    [isSizeControlled, onSizeChange],
  );

  useEffect(() => {
    if (open) return;
    setHasUserInteracted(false);
    setInternalPosition(defaultPosition);
    setInternalSize(defaultSize);
    lastCenteredSizeRef.current = null;
  }, [defaultPosition, defaultSize, open]);

  const handleFocus = useCallback(() => {
    if (focused) return;
    onFocus?.();
  }, [focused, onFocus]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback(
    (event: DraggableEvent) => {
      if (!onSnap) return;
      const point = readClientPoint(event);
      if (!point) return;
      setDragSnapZone(computeDragSnapZone(point.x, point.y, viewportBottomInset));
    },
    [onSnap, viewportBottomInset],
  );

  const handleDragStop = useCallback(
    (_event: DraggableEvent, data: DraggableData) => {
      setIsDragging(false);
      setHasUserInteracted(true);
      if (dragSnapZone && onSnap) {
        onSnap(dragSnapZone);
        setDragSnapZone(null);
        return;
      }
      setDragSnapZone(null);
      commitPosition({ x: data.x, y: data.y });
    },
    [commitPosition, dragSnapZone, onSnap],
  );

  const handleResizeStart = useCallback(
    (event: React.PointerEvent, direction: string) => {
      event.preventDefault();
      event.stopPropagation();

      const measureNode = windowRef.current ?? nodeRef.current;
      if (!measureNode) return;

      const rect = measureNode.getBoundingClientRect();

      // Measure AppWindow's own chrome (titlebar + toolbar) once at drag start.
      // Stored in resizeStart so the aspect-ratio branch of handlePointerMove
      // can convert between content dims (which the caller describes via
      // aspectRatio) and shell dims (which resize operates on).
      const titlebarEl = measureNode.querySelector<HTMLElement>(
        '[data-aw="titlebar"]',
      );
      const titlebarH = titlebarEl?.getBoundingClientRect().height ?? 0;
      const chromeHeight = titlebarH + toolbarHeight;

      setIsResizing(true);
      setHasUserInteracted(true);
      setResizeDirection(direction);
      setResizeStart({
        x: event.clientX,
        y: event.clientY,
        width: rect.width,
        height: rect.height,
        positionX: effectivePosition.x,
        positionY: effectivePosition.y,
        chromeWidth: 0,
        chromeHeight,
      });

      handleFocus();
    },
    [effectivePosition.x, effectivePosition.y, handleFocus, toolbarHeight],
  );

  useEffect(() => {
    if (!isResizing || presentation !== 'window') return;

    const handlePointerMove = (event: PointerEvent) => {
      let newX = resizeStart.positionX;
      let newY = resizeStart.positionY;

      const deltaX = event.clientX - resizeStart.x;
      const deltaY = event.clientY - resizeStart.y;

      const hasH = resizeDirection.includes('e') || resizeDirection.includes('w');
      const hasV = resizeDirection.includes('n') || resizeDirection.includes('s');

      // Raw per-axis targets from the cursor. Ratio-lock and clamping happen
      // below; separating the steps keeps the branch simple.
      const widthFromDrag = resizeDirection.includes('e')
        ? resizeStart.width + deltaX
        : resizeDirection.includes('w')
          ? resizeStart.width - deltaX
          : resizeStart.width;
      const heightFromDrag = resizeDirection.includes('s')
        ? resizeStart.height + deltaY
        : resizeDirection.includes('n')
          ? resizeStart.height - deltaY
          : resizeStart.height;

      let newWidth: number;
      let newHeight: number;

      if (aspectRatio) {
        const { chromeWidth, chromeHeight } = resizeStart;
        const minContentW = Math.max(1, minSize.width - chromeWidth);
        const minContentH = Math.max(1, minSize.height - chromeHeight);
        const maxContentW = Math.max(1, effectiveMax.width - chromeWidth);
        const maxContentH = Math.max(1, effectiveMax.height - chromeHeight);

        // Pick the driver axis, then derive the other from the ratio.
        // For corner drags, whichever axis has the larger content-space delta
        // wins — avoids surprising snaps when the user drags mostly on one axis.
        let contentW: number;
        if (hasH && hasV) {
          const dW = Math.abs(widthFromDrag - resizeStart.width);
          const dH = Math.abs(heightFromDrag - resizeStart.height);
          contentW = dW >= dH
            ? widthFromDrag - chromeWidth
            : (heightFromDrag - chromeHeight) * aspectRatio;
        } else if (hasH) {
          contentW = widthFromDrag - chromeWidth;
        } else {
          contentW = (heightFromDrag - chromeHeight) * aspectRatio;
        }

        // Ratio-aware clamp: both content dims must stay within their own
        // min/max, so narrow the allowed contentW range to honor both.
        const boundedMinW = Math.max(minContentW, minContentH * aspectRatio);
        const boundedMaxW = Math.min(maxContentW, maxContentH * aspectRatio);
        contentW = Math.min(Math.max(contentW, boundedMinW), boundedMaxW);
        const contentH = contentW / aspectRatio;

        newWidth = contentW + chromeWidth;
        newHeight = contentH + chromeHeight;
      } else {
        newWidth = hasH
          ? Math.min(Math.max(widthFromDrag, minSize.width), effectiveMax.width)
          : resizeStart.width;
        newHeight = hasV
          ? Math.min(Math.max(heightFromDrag, minSize.height), effectiveMax.height)
          : resizeStart.height;
      }

      if (resizeDirection.includes('w')) {
        newX = resizeStart.positionX + (resizeStart.width - newWidth);
      }
      if (resizeDirection.includes('n')) {
        newY = resizeStart.positionY + (resizeStart.height - newHeight);
      }

      commitSize({ width: Math.round(newWidth), height: Math.round(newHeight) });

      if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
        commitPosition({ x: Math.round(newX), y: Math.round(newY) });
      }
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    aspectRatio,
    commitPosition,
    commitSize,
    effectiveMax.height,
    effectiveMax.width,
    isResizing,
    minSize.height,
    minSize.width,
    presentation,
    resizeDirection,
    resizeStart,
  ]);

  useEffect(() => {
    const measureNode = windowRef.current ?? nodeRef.current;
    if (!autoCenter || presentation !== 'window' || hasUserInteracted || effectiveSize || !measureNode) {
      return;
    }

    const centerWindow = (width: number, height: number) => {
      const clampedWidth = Math.min(Math.max(width, minSize.width), effectiveMax.width);
      const clampedHeight = Math.min(Math.max(height, minSize.height), effectiveMax.height);
      const desktopHeight = window.innerHeight - viewportBottomInset;

      let x = (window.innerWidth - clampedWidth) / 2 + cascadeIndex * DEFAULT_CASCADE_OFFSET;
      let y = (desktopHeight - clampedHeight) / 2 + cascadeIndex * DEFAULT_CASCADE_OFFSET;

      x = Math.max(0, Math.min(x, window.innerWidth - clampedWidth));
      y = Math.max(0, Math.min(y, desktopHeight - clampedHeight));

      commitPosition({ x: Math.round(x), y: Math.round(y) });
      lastCenteredSizeRef.current = { width: clampedWidth, height: clampedHeight };
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const lastSize = lastCenteredSizeRef.current;
      if (
        lastSize &&
        Math.abs(width - lastSize.width) < 10 &&
        Math.abs(height - lastSize.height) < 10
      ) {
        return;
      }

      centerWindow(width, height);
    });

    observer.observe(measureNode);
    const rect = measureNode.getBoundingClientRect();
    centerWindow(rect.width, rect.height);

    return () => observer.disconnect();
  }, [
    autoCenter,
    cascadeIndex,
    commitPosition,
    effectiveMax.height,
    effectiveMax.width,
    effectiveSize,
    hasUserInteracted,
    minSize.height,
    minSize.width,
    presentation,
    viewportBottomInset,
  ]);

  if (!open || widgetActive) {
    return null;
  }

  // --- Compute shell props (shared by chromeless + standard paths) ---
  const isWindowPresentation = presentation === 'window';
  const isMobilePresentation = presentation === 'mobile';
  const isChromelessWindow = chromeless && isWindowPresentation;
  const hasExplicitWidth = effectiveSize?.width !== undefined;

  const actualWindowHeight = dimensionToPx(effectiveSize?.height);
  const maxContentHeight = actualWindowHeight
    ? actualWindowHeight - TITLE_BAR_HEIGHT - toolbarHeight - CHROME_PADDING
    : getMaxContentHeight(viewportBottomInset) - toolbarHeight;

  // Standard (non-chromeless) windows wrap the dialog in a positioning shell so
  // a sibling shadow layer can render outside the dialog's pixel-corner mask.
  const isStandardWindow = !isChromelessWindow && isWindowPresentation;

  const shellStyle: AppWindowShellStyle = isChromelessWindow
    ? {
        zIndex,
        width: effectiveSize?.width ?? 'fit-content',
        height: effectiveSize?.height ?? 'fit-content',
        '--app-content-max-height': `${maxContentHeight}px`,
      }
    : {
        background: isMobilePresentation
          ? 'var(--color-page)'
          : 'var(--color-window-chrome-to)',
        '--app-content-max-height': `${maxContentHeight}px`,
      };

  if (!isChromelessWindow && !isStandardWindow) {
    // Mobile / fullscreen — zIndex stays on the dialog (no wrapper).
    shellStyle.zIndex = zIndex;
  }

  // Standard window: dialog fills the wrapper, wrapper owns dimensions + zIndex.
  const wrapperStyle: React.CSSProperties | null = isStandardWindow
    ? {
        position: 'absolute',
        zIndex,
        width: effectiveSize?.width ?? 'fit-content',
        height: effectiveSize?.height ?? 'fit-content',
        minWidth: minSize.width,
        minHeight: minSize.height,
        maxWidth: effectiveMax.width,
        maxHeight: effectiveMax.height,
        isolation: 'isolate',
      }
    : null;

  if (isStandardWindow) {
    shellStyle.position = 'relative';
    shellStyle.width = '100%';
    shellStyle.height = '100%';
  }

  const shellClassName = isChromelessWindow
    ? className
    : `${isWindowPresentation ? 'pixel-rounded-8 ' : ''}${hasExplicitWidth ? '@container ' : ''}${className}`.trim();

  // Partition surfaces by variant. Drawer surfaces render OUTSIDE the dialog
  // as absolute siblings of the window shell (existing behavior). Inset
  // surfaces render INSIDE the dialog in specific slots below.
  const allControlSurfaces = controlSurfaces ?? [];
  // Drawer variant only supports left/right/bottom sides. `top` and `taskbar`
  // are coerced to inset regardless of variant prop.
  const drawerSurfaces = allControlSurfaces.filter(
    (s) =>
      (s.variant ?? 'drawer') === 'drawer' &&
      (s.side === 'left' || s.side === 'right' || s.side === 'bottom'),
  );
  const insetSurfaces = allControlSurfaces.filter(
    (s) =>
      s.variant === 'inset' || s.side === 'top' || s.side === 'taskbar',
  );
  const insetBySide: Record<AppWindowControlSurfaceSide, AppWindowControlSurface[]> = {
    left: [],
    right: [],
    top: [],
    bottom: [],
    taskbar: [],
  };
  for (const s of insetSurfaces) insetBySide[s.side].push(s);

  // --- Inset renderer -------------------------------------------------------
  //
  // Inset surfaces render naked inside the dialog. They skip ALL drawer chrome:
  // no drop shadow, no bezel, no LCD island (consumer can add their own), no
  // eject tab, no tuck positioning. Taskbar is always-open and emits no toggle.
  // Other inset sides read `isOpen` but, in this first cut, simply hide their
  // content when closed; collapse affordance is left to the consumer.
  const renderInsetSurface = (
    surface: AppWindowControlSurface,
    extraClassName = '',
  ): React.ReactNode => {
    const effectiveOpen = surface.side === 'taskbar' ? true : surface.isOpen !== false;
    if (!effectiveOpen) return null;
    return (
      <div
        key={`inset:${surface.id}`}
        data-aw="control-surface-inset"
        data-aw-surface-id={surface.id}
        data-aw-side={surface.side}
        data-aw-layout={surface.layout ?? 'offset'}
        className={extraClassName}
      >
        {surface.children}
      </div>
    );
  };

  const taskbarInsetNode = insetBySide.taskbar.length > 0 ? (
    <div
      data-aw="control-surface-taskbar-group"
      className="flex flex-1 min-w-0 items-stretch"
    >
      {insetBySide.taskbar.map((s) =>
        renderInsetSurface(s, 'flex-1 min-w-0 flex items-stretch'),
      )}
    </div>
  ) : null;

  const topInsetNode = insetBySide.top.length > 0 ? (
    <div data-aw="control-surface-inset-top" className="shrink-0 flex flex-col">
      {insetBySide.top.map((s) => renderInsetSurface(s))}
    </div>
  ) : null;

  const bottomInsetNode = insetBySide.bottom.length > 0 ? (
    <div
      data-aw="control-surface-inset-bottom"
      className="shrink-0 flex flex-col"
    >
      {insetBySide.bottom.map((s) => renderInsetSurface(s))}
    </div>
  ) : null;

  // Inset left/right — absolute-positioned inside the dialog, anchored below
  // the titlebar+toolbar and above the bottom edge. `overlay` layout floats
  // above content; `offset` is not yet wired into the content grid — falls
  // back to overlay positioning (consumer can pad content manually).
  const renderVerticalInsetGroup = (
    side: 'left' | 'right',
    group: AppWindowControlSurface[],
  ): React.ReactNode => {
    if (group.length === 0) return null;
    return (
      <div
        key={`inset-vert:${side}`}
        data-aw="control-surface-inset-vertical"
        data-aw-side={side}
        className="absolute flex flex-col gap-1 pointer-events-auto"
        style={{
          [side]: 0,
          top: TITLE_BAR_HEIGHT + toolbarHeight,
          bottom: CHROME_PADDING,
          width: group[0].width ?? group[0].maxWidth ?? DEFAULT_CONTROL_SURFACE_WIDTH,
          zIndex: 5,
        }}
      >
        {group.map((s) => renderInsetSurface(s))}
      </div>
    );
  };
  const leftInsetNode = renderVerticalInsetGroup('left', insetBySide.left);
  const rightInsetNode = renderVerticalInsetGroup('right', insetBySide.right);

  const dialog = (
    <div
      ref={isStandardWindow ? windowRef : nodeRef}
      role="dialog"
      aria-labelledby={`window-title-${id}`}
      className={shellClassName}
      style={shellStyle}
      onPointerDown={handleFocus}
      onClick={handleFocus}
      tabIndex={-1}
      data-app-window={id}
      data-aw="window"
      data-presentation={presentation}
      data-chromeless={isChromelessWindow ? 'true' : undefined}
      data-fullscreen={presentation === 'fullscreen' ? 'true' : undefined}
      data-resizable={!isChromelessWindow && isWindowPresentation && resizable ? 'true' : undefined}
      data-focused={focused || undefined}
    >
      {isChromelessWindow ? (
        <AppWindowChromeCtx.Provider value={chromeCtx}>
          {children}
        </AppWindowChromeCtx.Provider>
      ) : (
        <>
          {isStandardWindow ? (
            <div
              aria-hidden
              data-appwindow-chrome-dither
              className="pointer-events-none"
              style={{ position: 'absolute', inset: 0 }}
            >
              {CHROME_DITHER_BANDS.bands.map((band) => {
                const tilePx =
                  CHROME_DITHER_BANDS.matrix * CHROME_DITHER_PIXEL_SCALE;
                return (
                  <div
                    key={band.index}
                    aria-hidden
                    data-appwindow-chrome-dither-band={band.index}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${(band.index / CHROME_DITHER_BANDS.steps) * 100}%`,
                      height: `${100 / CHROME_DITHER_BANDS.steps}%`,
                      backgroundColor: 'var(--color-window-chrome-from)',
                      WebkitMaskImage: band.mask.maskImage,
                      maskImage: band.mask.maskImage,
                      WebkitMaskSize: `${tilePx}px ${tilePx}px`,
                      maskSize: `${tilePx}px ${tilePx}px`,
                      WebkitMaskRepeat: 'repeat',
                      maskRepeat: 'repeat',
                      imageRendering: 'pixelated',
                    }}
                  />
                );
              })}
            </div>
          ) : null}
          {!focused && isWindowPresentation ? (
            <div
              aria-hidden
              className="z-20 pointer-events-none rdna-pat rdna-pat--diagonal-dots"
              style={{
                ['--pat-color' as string]: 'var(--color-ink)',
                position: 'absolute',
                inset: 0,
              }}
            />
          ) : null}

          <AppWindowTitleBar
            id={id}
            title={title}
            icon={icon}
            showCopyButton={isMobilePresentation ? false : showCopyButton}
            showCloseButton={showCloseButton}
            showFullscreenButton={isMobilePresentation ? false : showFullscreenButton}
            showWidgetButton={isMobilePresentation ? false : showWidgetButton}
            showActionButton={isMobilePresentation ? false : showActionButton}
            actionButton={actionButton}
            widgetActive={widgetActive}
            presentation={presentation}
            navContent={navContent}
            taskbarInset={taskbarInsetNode}
            onClose={onClose}
            onFullscreen={onFullscreen}
            onCenter={onCenter}
            onSnap={onSnap}
            onRestore={onRestore}
            canRestore={canRestore}
            onWidget={onWidget}
          />

          {topInsetNode}

          {toolbarContent ? (
            <ToolbarNode
              nodeRef={toolbarRef}
              className={toolbarContent.className}
            >
              {toolbarContent.children}
            </ToolbarNode>
          ) : null}

          <AppWindowChromeCtx.Provider value={chromeCtx}>
            {children}
          </AppWindowChromeCtx.Provider>

          {bottomInsetNode}

          {leftInsetNode}
          {rightInsetNode}

          {isWindowPresentation && resizable ? (
            <ResizeHandles onPointerDown={handleResizeStart} />
          ) : null}
        </>
      )}
    </div>
  );

  // Control surface dock — each registered DRAWER side renders as a sibling
  // of the window shell inside the drag wrapper. The wrapper owns dragging;
  // each rail carries its own bezel, rails, recessed LCD screen, and eject tab.
  const controlSurfaceNodes = drawerSurfaces.length > 0
    ? drawerSurfaces.map((surface) => {
        const side = surface.side;
        const isVertical = side === 'left' || side === 'right';
        const effectiveOpen = surface.isOpen !== false;
        if (surface.hideTab && !effectiveOpen) return null;
        // Vertical rails are either fixed-width (`width` prop) or
        // content-driven-with-cap (`maxWidth` prop). If neither is set,
        // fall back to the default fixed width so existing callers keep
        // their legacy behavior.
        const isAutoWidth =
          isVertical && surface.width == null && surface.maxWidth != null;
        // In auto mode, use the measured content width (plus the cream lip)
        // clamped by `maxWidth`. Before the first measurement lands, use
        // `maxWidth` as the initial width so the rail is visible (and the
        // peek/transform math works) while content is being measured.
        const measuredContentWidth = isAutoWidth
          ? railSizes[surface.id]?.width
          : undefined;
        const autoWidth = isAutoWidth
          ? (measuredContentWidth != null
              ? Math.min(surface.maxWidth!, measuredContentWidth + CONTROL_SURFACE_CHROME_H_PX)
              : surface.maxWidth)
          : undefined;
        const surfaceWidth =
          isVertical
            ? (isAutoWidth
                ? autoWidth
                : (surface.width ?? DEFAULT_CONTROL_SURFACE_WIDTH))
            : undefined;
        const requestedSurfaceHeight =
          !isVertical
            ? (surface.height ?? DEFAULT_CONTROL_SURFACE_HEIGHT)
            : undefined;
        const maxBottomSurfaceHeight = actualWindowHeight
          ? Math.max(1, Math.floor(actualWindowHeight / 2))
          : undefined;
        const surfaceHeight =
          requestedSurfaceHeight != null
            ? Math.min(
                requestedSurfaceHeight,
                maxBottomSurfaceHeight ?? requestedSurfaceHeight,
              )
            : undefined;

        // Vertical rails are top-aligned with the window's content area —
        // they sit below the titlebar + any toolbar (same gap as the window
        // chrome reserves for its menubar) and shrink to fit their content
        // rather than filling the whole vertical extent. The anchored edge
        // tucks TUCK_PX into the window shell so the drawer's rounded
        // corners on that side sit behind the chrome, reading as connected.
        // Bottom rails are height-anchored via `surfaceHeight` and keep
        // the legacy layout with the same tuck trick on their top edge.
        const positionStyle: React.CSSProperties = {};
        const stackOffset = verticalStackOffsets[surface.id] ?? 0;
        const verticalTopInset =
          CONTROL_SURFACE_TOP_INSET_PX + toolbarHeight + stackOffset;
        const maxVerticalSurfaceHeight = actualWindowHeight
          ? Math.max(1, actualWindowHeight - verticalTopInset)
          : undefined;
        const tuckPx = CONTROL_SURFACE_TUCK_PX + (effectiveOpen ? 0 : 2);
        const tuck = `calc(100% - ${tuckPx}px)`;
        if (side === 'left') {
          positionStyle.right = tuck;
          positionStyle.top = verticalTopInset;
          if (surfaceWidth != null) positionStyle.width = surfaceWidth;
          positionStyle.maxHeight = maxVerticalSurfaceHeight ?? '100%';
        } else if (side === 'right') {
          positionStyle.left = tuck;
          positionStyle.top = verticalTopInset;
          if (surfaceWidth != null) positionStyle.width = surfaceWidth;
          positionStyle.maxHeight = maxVerticalSurfaceHeight ?? '100%';
        } else {
          positionStyle.top = tuck;
          positionStyle.left = CONTROL_SURFACE_HORIZONTAL_INSET_PX;
          positionStyle.right = CONTROL_SURFACE_HORIZONTAL_INSET_PX;
          positionStyle.height = surfaceHeight;
          positionStyle.maxHeight = maxBottomSurfaceHeight ?? '50%';
        }

        const peekState = !effectiveOpen ? 'closed' : 'open';
        const tabLabel = surface.label ?? `Toggle ${side} dock`;
        const handleTabClick = () => {
          onToggleSide?.(side);
        };
        const lcdOrientation = isVertical ? 'vertical' : 'both';

        // Drawer geometry — the drawer is in-flow (position: relative) so
        // the rail container's intrinsic height tracks the drawer's content
        // height. The drop shadow sibling below is absolute-positioned and
        // sizes to the container, which inherits the drawer's height.
        //
        // Padding: base `p-2` (8px) on all sides via className; the
        // anchored side gets an ADDITIONAL TUCK_PX on top of that (inline)
        // so the island clears the portion of the drawer that's tucked
        // behind the window chrome.
        const drawerStyle: React.CSSProperties = { position: 'relative' };
        const drawerInnerMaxHeight =
          maxVerticalSurfaceHeight != null
            ? Math.max(
                1,
                maxVerticalSurfaceHeight -
                  CONTROL_SURFACE_DRAWER_PAD_PX * 2 -
                  CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX,
              )
            : undefined;
        const scrollAreaStyle: React.CSSProperties = {};
        const islandStyle: React.CSSProperties = {};
        if (side === 'left') {
          drawerStyle.paddingRight =
            CONTROL_SURFACE_DRAWER_PAD_PX +
            CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX;
          drawerStyle.maxHeight = maxVerticalSurfaceHeight ?? '100%';
          drawerStyle.overflow = 'hidden';
          islandStyle.maxHeight = drawerInnerMaxHeight ?? '100%';
          scrollAreaStyle.maxHeight = drawerInnerMaxHeight ?? '100%';
        } else if (side === 'right') {
          drawerStyle.paddingLeft =
            CONTROL_SURFACE_DRAWER_PAD_PX +
            CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX;
          drawerStyle.maxHeight = maxVerticalSurfaceHeight ?? '100%';
          drawerStyle.overflow = 'hidden';
          islandStyle.maxHeight = drawerInnerMaxHeight ?? '100%';
          scrollAreaStyle.maxHeight = drawerInnerMaxHeight ?? '100%';
        } else {
          drawerStyle.paddingTop =
            CONTROL_SURFACE_DRAWER_PAD_PX +
            CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX;
          drawerStyle.height = '100%';
          drawerStyle.overflow = 'hidden';
          islandStyle.height = '100%';
          scrollAreaStyle.height = '100%';
        }
        const drawerClassName = !isVertical ? 'relative h-full' : 'relative';
        const scrollAreaClassName = !isVertical ? 'h-full' : '';

        // Window-shadow strip — checkerboard pattern painted in the visible
        // extra-padding zone on the drawer's anchored side, reading as a
        // pixelated shadow the window casts onto the drawer's contents.
        const windowShadowStyle: React.CSSProperties = {
          position: 'absolute',
          backgroundColor: 'var(--color-shadow-pat)',
          maskImage: 'var(--pat-checkerboard)',
          WebkitMaskImage: 'var(--pat-checkerboard)',
          maskSize: '8px 8px',
          WebkitMaskSize: '8px 8px',
          maskRepeat: 'repeat',
          WebkitMaskRepeat: 'repeat',
          pointerEvents: 'none',
          imageRendering: 'pixelated',
        };
        if (side === 'left') {
          windowShadowStyle.right = CONTROL_SURFACE_SHADOW_INSET_PX;
          windowShadowStyle.top = 0;
          windowShadowStyle.bottom = 0;
          windowShadowStyle.width = CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX;
        } else if (side === 'right') {
          windowShadowStyle.left = CONTROL_SURFACE_SHADOW_INSET_PX;
          windowShadowStyle.top = 0;
          windowShadowStyle.bottom = 0;
          windowShadowStyle.width = CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX;
        } else {
          windowShadowStyle.top = CONTROL_SURFACE_SHADOW_INSET_PX;
          windowShadowStyle.left = 0;
          windowShadowStyle.right = 0;
          windowShadowStyle.height = CONTROL_SURFACE_ANCHOR_EXTRA_PAD_PX;
        }

        return (
          <div
            key={`${surface.id}:${side}`}
            data-aw="control-surface"
            data-aw-surface-id={surface.id}
            data-aw-side={side}
            data-aw-peek={peekState}
            className="absolute pointer-events-auto"
            style={positionStyle}
          >
            <div
              data-aw="control-surface-drawer"
              className={drawerClassName}
            >
              {/* Drawer drop shadow — a separate patterned silhouette behind the
                  drawer, matching the AppWindow shell shadow. */}
              <div
                aria-hidden
                className="pat-pixel-shadow pixel-rounded-8"
                style={{
                  ...(side === 'bottom'
                    ? {
                        inset: 'auto 2px -4px 2px',
                        height: 4,
                        transform: 'none',
                      }
                    : {
                        transform: 'translate(0, 4px)',
                      }),
                }}
              >
                <div className="pat-pixel-shadow__fill" />
              </div>
              {/* Drawer — rounded like the app window shell, hosts a themed
                  island that renders the actual rail content. In-flow so the
                  container's intrinsic height fits the drawer. */}
              <div
                data-aw="control-surface-body"
                className="pixel-rounded-8 bg-card p-1"
                style={drawerStyle}
              >
                {/* The island inherits the ambient Radiants mode so ctrl tokens
                    flip with Rad OS light/dark instead of forcing `.dark`. */}
                <div
                  data-aw="control-surface-island"
                  className="pixel-rounded-6"
                  style={islandStyle}
                >
                  <ScrollArea.Root
                    className={scrollAreaClassName}
                    orientation={lcdOrientation}
                    style={scrollAreaStyle}
                  >
                    {isVertical ? (
                      <RailContentMeasurer
                        id={surface.id}
                        onMeasure={handleRailMeasure}
                        applyMaxContent={isAutoWidth}
                      >
                        {surface.children}
                      </RailContentMeasurer>
                    ) : (
                      surface.children
                    )}
                  </ScrollArea.Root>
                </div>
              </div>
            </div>
            {/* Window-edge shadow — checkerboard strip pinned to the rail
                container (which is itself locked to the appwindow's outer
                edge), not to the drawer body. So if/when the drawer
                animates open/close, the shadow stays put in screen space
                and the drawer slides beneath it — reading as a shadow the
                appwindow casts, rather than a decoration on the drawer.
                Rendered after the drawer so it paints on top; its x-range
                sits inside the container bounds so it cannot bleed onto
                the desktop. */}
            <div
              data-aw="control-surface-window-shadow"
              aria-hidden
              style={windowShadowStyle}
            />

            {!surface.hideTab ? (
              <div
                data-aw="control-surface-tab"
                className="absolute"
                style={(() => {
                  // Tab sits behind the drawer (z-index:-1) so the drawer's
                  // pixel-rounded body can paint over the tucked portion and
                  // the visible portion reads as emerging from behind.
                  if (side === 'left') {
                    return {
                      left: -(CONTROL_SURFACE_TAB_PX - CONTROL_SURFACE_TAB_INSET_PX),
                      top: CONTROL_SURFACE_DRAWER_CORNER_PX,
                      width: CONTROL_SURFACE_TAB_PX + CONTROL_SURFACE_TAB_TUCK_PX,
                      minHeight: 72,
                      zIndex: -1,
                    };
                  }
                  if (side === 'right') {
                    return {
                      right: -(CONTROL_SURFACE_TAB_PX - CONTROL_SURFACE_TAB_INSET_PX),
                      top: CONTROL_SURFACE_DRAWER_CORNER_PX,
                      width: CONTROL_SURFACE_TAB_PX + CONTROL_SURFACE_TAB_TUCK_PX,
                      minHeight: 72,
                      zIndex: -1,
                    };
                  }
                  return {
                    bottom: -CONTROL_SURFACE_TAB_PX,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 48,
                    height: CONTROL_SURFACE_TAB_PX,
                  };
                })()}
              >
                {isVertical ? (
                  <button
                    type="button"
                    data-aw="control-surface-tab-button"
                    onClick={handleTabClick}
                    aria-label={tabLabel}
                    title={tabLabel}
                    className="pixel-rounded-6 flex h-full w-full flex-col items-center justify-center py-1 transition-colors hover:brightness-95"
                    style={(() => {
                      // Push content to the visible side so the tucked portion
                      // stays covered by the drawer without pulling the chevron
                      // behind it. When the rail is open, nudge the chevron
                      // `TAB_INSET_PX` inward (toward the drawer) for visual
                      // balance with the tab body, which also sits inset on
                      // its outward edge.
                      const openInward = effectiveOpen ? CONTROL_SURFACE_TAB_INSET_PX : 0;
                      return {
                        paddingLeft: side === 'right'
                          ? CONTROL_SURFACE_TAB_TUCK_PX - openInward
                          : openInward,
                        paddingRight: side === 'left'
                          ? CONTROL_SURFACE_TAB_TUCK_PX - openInward
                          : openInward,
                      };
                    })()}
                  >
                    <Icon
                      name={(() => {
                        // Icon points toward the collapse direction when open
                        // (inward to the window) and toward the expand
                        // direction when closed (outward from the window).
                        if (side === 'left') {
                          return effectiveOpen ? 'chevron-right' : 'chevron-left';
                        }
                        return effectiveOpen ? 'chevron-left' : 'chevron-right';
                      })()}
                    />
                  </button>
                ) : (
                  <Tooltip content={tabLabel}>
                    <Button
                      size="sm"
                      rounded="sm"
                      iconOnly
                      icon={effectiveOpen ? 'arrow-up-thin' : 'chevron-down'}
                      onClick={handleTabClick}
                      aria-label={tabLabel}
                    />
                  </Tooltip>
                )}
              </div>
            ) : null}
          </div>
        );
      })
    : null;

  const shell = isStandardWindow && wrapperStyle ? (
    <div
      ref={nodeRef}
      style={wrapperStyle}
      data-aw-shell="wrapper"
      data-dragging={isDragging || undefined}
      data-focused={focused || undefined}
    >
      <div aria-hidden className="pat-pixel-shadow pixel-rounded-8">
        <div className="pat-pixel-shadow__fill" />
      </div>
      {/* Rails render BEFORE the dialog so collapsed rails slide behind the
          window (dialog occludes body); tab sits outside the dialog's bounds
          and stays visible. */}
      {controlSurfaceNodes}
      {dialog}
    </div>
  ) : (
    dialog
  );

  if (!isWindowPresentation) {
    return shell;
  }

  const snapPreviewRect = dragSnapZone ? getSnapRect(dragSnapZone, viewportBottomInset) : null;

  return (
    <>
      <Draggable
        nodeRef={nodeRef}
        handle="[data-drag-handle]"
        cancel={WINDOW_DRAG_CANCEL_SELECTOR}
        position={effectivePosition}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        bounds="parent"
        disabled={isResizing}
      >
        {shell}
      </Draggable>
      {snapPreviewRect ? (
        <div
          aria-hidden
          className="fixed pointer-events-none pixel-rounded-8 bg-accent-soft"
          style={{
            left: snapPreviewRect.x,
            top: snapPreviewRect.y,
            width: snapPreviewRect.width,
            height: snapPreviewRect.height,
            zIndex: 9999,
          }}
        />
      ) : null}
    </>
  );
}

// Compound export — attaches sub-components as static properties
const AppWindowCompound = Object.assign(AppWindow, {
  Nav: Object.assign(AppWindowNav, { Item: AppWindowNavItem }),
  Toolbar: AppWindowToolbar,
  Content: AppWindowContent,
  Island: AppWindowIsland,
});

export { AppWindowCompound as AppWindow };
