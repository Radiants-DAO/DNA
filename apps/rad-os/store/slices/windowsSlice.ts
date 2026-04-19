import { StateCreator } from 'zustand';
import { getWindowChrome, supportsAmbientWidget } from '@/lib/apps';
import { resolveWindowSize, remToPx } from '@/lib/windowSizing';

export type SnapRegion =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface PreSnapState {
  position: { x: number; y: number };
  size?: { width: number; height: number };
  isFullscreen: boolean;
}

export interface WindowState {
  id: string;
  isOpen: boolean;
  isFullscreen: boolean;
  isWidget: boolean;
  zIndex: number;
  position: { x: number; y: number };
  /** Runtime size in px (set by resize dragging) */
  size?: { width: number; height: number };
  /** Active tab within the window (if the app uses tabs) */
  activeTab?: string;
  /** Snapshot captured before first snap/fill action; null once restored or user-modified */
  preSnapState?: PreSnapState | null;
}

export interface ZoomAnimation {
  appId: string;
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number; height: number };
}

export interface WindowsSlice {
  // State
  windows: WindowState[];
  nextZIndex: number;
  zoomAnimation: ZoomAnimation | null;

  // Actions
  openWindow: (id: string) => void;
  openWindowWithZoom: (id: string, sourceRect: { x: number; y: number; width: number; height: number }) => void;
  clearZoomAnimation: () => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  toggleWidget: (id: string) => void;
  centerWindow: (id: string) => void;
  snapWindow: (id: string, region: SnapRegion) => void;
  restoreWindowSize: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  setActiveTab: (id: string, tabId: string) => void;
  getWindow: (id: string) => WindowState | undefined;
  getOpenWindows: () => WindowState[];
}

const CASCADE_OFFSET = 30;
const TASKBAR_HEIGHT = 48; // bottom-12 = 48px

function getDesktopSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 800 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight - TASKBAR_HEIGHT,
  };
}

function computeSnapRect(
  region: SnapRegion,
  desktop: { width: number; height: number },
): { position: { x: number; y: number }; size: { width: number; height: number } } {
  const w = desktop.width;
  const h = desktop.height;
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);

  switch (region) {
    case 'left':
      return { position: { x: 0, y: 0 }, size: { width: halfW, height: h } };
    case 'right':
      return { position: { x: halfW, y: 0 }, size: { width: w - halfW, height: h } };
    case 'top':
      return { position: { x: 0, y: 0 }, size: { width: w, height: halfH } };
    case 'bottom':
      return { position: { x: 0, y: halfH }, size: { width: w, height: h - halfH } };
    case 'top-left':
      return { position: { x: 0, y: 0 }, size: { width: halfW, height: halfH } };
    case 'top-right':
      return { position: { x: halfW, y: 0 }, size: { width: w - halfW, height: halfH } };
    case 'bottom-left':
      return { position: { x: 0, y: halfH }, size: { width: halfW, height: h - halfH } };
    case 'bottom-right':
      return { position: { x: halfW, y: halfH }, size: { width: w - halfW, height: h - halfH } };
  }
}

/**
 * Calculate centered position for a new window.
 * Centers in the visible desktop area (accounting for taskbar).
 * Falls back to cascade positioning if viewport is not available.
 */
function calculateCenteredPosition(
  openCount: number,
  estimatedSize?: { width: number; height: number }
): { x: number; y: number } {
  // SSR safety check
  if (typeof window === 'undefined') {
    return {
      x: 50 + openCount * CASCADE_OFFSET,
      y: 50 + openCount * CASCADE_OFFSET,
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const desktopHeight = viewportHeight - TASKBAR_HEIGHT;

  // Default window size estimate if not provided
  const windowWidth = estimatedSize?.width ?? 600;
  const windowHeight = estimatedSize?.height ?? 400;

  // Calculate centered position
  let x = Math.max(0, (viewportWidth - windowWidth) / 2);
  let y = Math.max(0, (desktopHeight - windowHeight) / 2);

  // Apply cascade offset if multiple windows are open
  if (openCount > 0) {
    x += openCount * CASCADE_OFFSET;
    y += openCount * CASCADE_OFFSET;
  }

  // Ensure window doesn't go off-screen
  x = Math.min(x, viewportWidth - Math.min(windowWidth, 300));
  y = Math.min(y, desktopHeight - Math.min(windowHeight, 200));

  return { x: Math.round(x), y: Math.round(y) };
}

export const createWindowsSlice: StateCreator<WindowsSlice, [], [], WindowsSlice> = (
  set,
  get
) => ({
  windows: [],
  nextZIndex: 1,
  zoomAnimation: null,

  openWindowWithZoom: (id, sourceRect) => {
    const { windows, zoomAnimation } = get();

    // If another zoom is in progress, complete it immediately
    if (zoomAnimation) {
      get().openWindow(zoomAnimation.appId);
    }

    const existingWindow = windows.find((w) => w.id === id);

    // If already open, just focus — no animation
    if (existingWindow?.isOpen) {
      get().focusWindow(id);
      return;
    }

    // Compute target size from catalog defaults
    const defaults = getWindowChrome(id);
    const cssSize = defaults?.defaultSize ? resolveWindowSize(defaults.defaultSize) : undefined;
    const pxEstimate = cssSize
      ? { width: remToPx(cssSize.width), height: remToPx(cssSize.height) }
      : { width: 600, height: 400 };

    // Compute target position
    let targetPosition: { x: number; y: number };
    if (existingWindow && !existingWindow.isOpen) {
      // Re-opening: use stored position
      targetPosition = existingWindow.position;
    } else {
      const openCount = windows.filter((w) => w.isOpen).length;
      targetPosition = calculateCenteredPosition(openCount, pxEstimate);
    }

    const targetSize = existingWindow?.size ?? pxEstimate;

    set({
      zoomAnimation: {
        appId: id,
        from: sourceRect,
        to: {
          x: targetPosition.x,
          y: targetPosition.y,
          width: targetSize.width,
          height: targetSize.height,
        },
      },
    });
  },

  clearZoomAnimation: () => set({ zoomAnimation: null }),

  openWindow: (id) => {
    const { windows, nextZIndex } = get();
    const existingWindow = windows.find((w) => w.id === id);

    if (existingWindow) {
      // If window exists but is closed, restore it
      if (!existingWindow.isOpen) {
        set({
          windows: windows.map((w) =>
            w.id === id
              ? { ...w, isOpen: true, zIndex: nextZIndex }
              : w
          ),
          nextZIndex: nextZIndex + 1,
        });
      } else {
        // Just focus it
        get().focusWindow(id);
      }
      return;
    }

    // Resolve size from catalog defaults
    const defaults = getWindowChrome(id);
    const cssSize = defaults?.defaultSize ? resolveWindowSize(defaults.defaultSize) : undefined;
    const pxEstimate = cssSize
      ? { width: remToPx(cssSize.width), height: remToPx(cssSize.height) }
      : undefined;

    // Calculate centered position (with cascade offset for multiple windows)
    const openCount = windows.filter((w) => w.isOpen).length;
    const cascadePosition = calculateCenteredPosition(openCount, pxEstimate);

    // Warn if more than 5 windows (soft limit)
    if (openCount >= 5) {
      console.warn('RadOS: More than 5 windows open may affect performance');
    }

    const newWindow: WindowState = {
      id,
      isOpen: true,
      isFullscreen: false,
      isWidget: false,
      zIndex: nextZIndex,
      position: cascadePosition,
    };

    set({
      windows: [...windows, newWindow],
      nextZIndex: nextZIndex + 1,
    });
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isOpen: false, isFullscreen: false, isWidget: false } : w
      ),
    }));
  },

  focusWindow: (id) => {
    set((state) => {
      const targetWindow = state.windows.find((window) => window.id === id);

      if (!targetWindow?.isOpen) {
        return state;
      }

      const topZIndex = state.windows.reduce(
        (max, window) => (window.isOpen ? Math.max(max, window.zIndex) : max),
        0,
      );

      if (targetWindow.zIndex === topZIndex) {
        return state;
      }

      return {
        windows: state.windows.map((window) =>
          window.id === id ? { ...window, zIndex: state.nextZIndex } : window,
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    });
  },

  toggleFullscreen: (id) => {
    const { windows, nextZIndex } = get();
    set({
      windows: windows.map((w) =>
        w.id === id
          ? { ...w, isFullscreen: !w.isFullscreen, zIndex: nextZIndex }
          : w
      ),
      nextZIndex: nextZIndex + 1,
    });
  },

  toggleWidget: (id) => {
    if (!supportsAmbientWidget(id)) return;
    const targetIsWidget = !get().getWindow(id)?.isWidget;
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, isWidget: targetIsWidget, isFullscreen: false }
          : targetIsWidget && w.isWidget
            ? { ...w, isWidget: false }
            : w
      ),
    }));
  },

  centerWindow: (id) => {
    const target = get().getWindow(id);
    if (!target) return;
    const desktop = getDesktopSize();
    const fallbackSize = { width: 600, height: 400 };
    const currentSize = target.size ?? fallbackSize;
    const x = Math.max(0, Math.round((desktop.width - currentSize.width) / 2));
    const y = Math.max(0, Math.round((desktop.height - currentSize.height) / 2));
    const preSnapState: PreSnapState = target.preSnapState ?? {
      position: target.position,
      size: target.size,
      isFullscreen: target.isFullscreen,
    };
    const { nextZIndex } = get();
    set({
      windows: get().windows.map((w) =>
        w.id === id
          ? {
              ...w,
              position: { x, y },
              isFullscreen: false,
              preSnapState,
              zIndex: nextZIndex,
            }
          : w,
      ),
      nextZIndex: nextZIndex + 1,
    });
  },

  snapWindow: (id, region) => {
    const target = get().getWindow(id);
    if (!target) return;
    const desktop = getDesktopSize();
    const { position, size } = computeSnapRect(region, desktop);
    const preSnapState: PreSnapState = target.preSnapState ?? {
      position: target.position,
      size: target.size,
      isFullscreen: target.isFullscreen,
    };
    const { nextZIndex } = get();
    set({
      windows: get().windows.map((w) =>
        w.id === id
          ? {
              ...w,
              position,
              size,
              isFullscreen: false,
              preSnapState,
              zIndex: nextZIndex,
            }
          : w,
      ),
      nextZIndex: nextZIndex + 1,
    });
  },

  restoreWindowSize: (id) => {
    const target = get().getWindow(id);
    if (!target?.preSnapState) return;
    const { position, size, isFullscreen } = target.preSnapState;
    const { nextZIndex } = get();
    set({
      windows: get().windows.map((w) =>
        w.id === id
          ? {
              ...w,
              position,
              size,
              isFullscreen,
              preSnapState: null,
              zIndex: nextZIndex,
            }
          : w,
      ),
      nextZIndex: nextZIndex + 1,
    });
  },

  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position, preSnapState: null } : w
      ),
    }));
  },

  updateWindowSize: (id, size) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, size, preSnapState: null } : w
      ),
    }));
  },

  setActiveTab: (id, tabId) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, activeTab: tabId } : w
      ),
    }));
  },

  getWindow: (id) => {
    return get().windows.find((w) => w.id === id);
  },

  getOpenWindows: () => {
    return get().windows.filter((w) => w.isOpen);
  },
});
