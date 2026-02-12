/**
 * Drag handles for margin and padding adjustment.
 *
 * Renders draggable edge handles on the selected element for box model visualization.
 * Lives in the content script's Shadow DOM overlay layer.
 * On drag, applies live element.style updates and captures diffs.
 */

import type { MutationDiff } from '@flow/shared';
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine';

export interface SpacingHandlesOptions {
  /** The Shadow DOM root to render handles into (from Phase 1 overlay layer) */
  shadowRoot: ShadowRoot;
  /** Unified mutation engine for applying style mutations */
  engine: UnifiedMutationEngine;
  /** Callback when a mutation diff is produced */
  onDiff: (diff: MutationDiff) => void;
}

interface HandleState {
  container: HTMLDivElement;
  target: HTMLElement | null;
  handles: Map<string, HTMLDivElement>;
  /** Track active drag to cancel if element changes */
  activeDrag: {
    cleanup: () => void;
  } | null;
}

const EDGES = ['top', 'right', 'bottom', 'left'] as const;
type Edge = (typeof EDGES)[number];

const HANDLE_THICKNESS = 6;

export function createSpacingHandles(options: SpacingHandlesOptions): {
  attach: (element: HTMLElement) => void;
  detach: () => void;
  destroy: () => void;
} {
  const { shadowRoot, engine, onDiff } = options;

  const state: HandleState = {
    container: document.createElement('div'),
    target: null,
    handles: new Map(),
    activeDrag: null,
  };

  // Container for all handles
  state.container.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483646;';
  shadowRoot.appendChild(state.container);

  // Create 8 handles: 4 margin edges + 4 padding edges
  for (const type of ['margin', 'padding'] as const) {
    for (const edge of EDGES) {
      const handle = document.createElement('div');
      handle.dataset.type = type;
      handle.dataset.edge = edge;
      handle.style.cssText = `
        position: fixed;
        pointer-events: auto;
        cursor: ${edge === 'top' || edge === 'bottom' ? 'ns-resize' : 'ew-resize'};
        background: ${type === 'margin' ? 'rgba(255, 165, 0, 0.4)' : 'rgba(0, 128, 0, 0.4)'};
        transition: background 0.15s ease-out;
        display: none;
      `;
      handle.addEventListener('mouseenter', () => {
        handle.style.background =
          type === 'margin'
            ? 'rgba(255, 165, 0, 0.7)'
            : 'rgba(0, 128, 0, 0.7)';
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background =
          type === 'margin'
            ? 'rgba(255, 165, 0, 0.4)'
            : 'rgba(0, 128, 0, 0.4)';
      });

      setupDragHandler(handle, type, edge, state, engine, onDiff, positionHandles);

      state.handles.set(`${type}-${edge}`, handle);
      state.container.appendChild(handle);
    }
  }

  function positionHandles(): void {
    if (!state.target) return;

    const rect = state.target.getBoundingClientRect();
    const computed = getComputedStyle(state.target);

    for (const type of ['margin', 'padding'] as const) {
      for (const edge of EDGES) {
        const handle = state.handles.get(`${type}-${edge}`)!;
        const value =
          parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0;

        if (type === 'margin') {
          positionMarginHandle(handle, rect, edge, value);
        } else {
          positionPaddingHandle(handle, rect, edge, value);
        }
      }
    }
  }

  function positionMarginHandle(
    handle: HTMLDivElement,
    rect: DOMRect,
    edge: Edge,
    value: number
  ): void {
    const t = HANDLE_THICKNESS;
    handle.style.display = 'block';
    switch (edge) {
      case 'top':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.top - value}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'bottom':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.bottom}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'left':
        handle.style.left = `${rect.left - value}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
      case 'right':
        handle.style.left = `${rect.right}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
    }
  }

  function positionPaddingHandle(
    handle: HTMLDivElement,
    rect: DOMRect,
    edge: Edge,
    value: number
  ): void {
    const t = HANDLE_THICKNESS;
    handle.style.display = 'block';
    switch (edge) {
      case 'top':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'bottom':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.bottom - Math.max(value, t)}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'left':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
      case 'right':
        handle.style.left = `${rect.right - Math.max(value, t)}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
    }
  }

  // Use scroll/resize listeners instead of continuous rAF loop for better performance
  function startPositionListeners(): void {
    positionHandles(); // Initial position
    window.addEventListener('scroll', positionHandles, { passive: true });
    window.addEventListener('resize', positionHandles, { passive: true });
  }

  function stopPositionListeners(): void {
    window.removeEventListener('scroll', positionHandles);
    window.removeEventListener('resize', positionHandles);
  }

  function hideAllHandles(): void {
    for (const handle of state.handles.values()) {
      handle.style.display = 'none';
    }
  }

  function cancelActiveDrag(): void {
    if (state.activeDrag) {
      state.activeDrag.cleanup();
      state.activeDrag = null;
    }
  }

  return {
    attach(element: HTMLElement) {
      // Cancel any active drag from previous element
      cancelActiveDrag();

      state.target = element;
      state.container.style.display = '';
      startPositionListeners();
    },
    detach() {
      // Cancel any active drag
      cancelActiveDrag();

      state.target = null;
      stopPositionListeners();
      hideAllHandles();
      state.container.style.display = 'none';
    },
    destroy() {
      cancelActiveDrag();
      stopPositionListeners();
      state.container.remove();
    },
  };
}

function setupDragHandler(
  handle: HTMLDivElement,
  type: 'margin' | 'padding',
  edge: Edge,
  state: HandleState,
  engine: UnifiedMutationEngine,
  onDiff: SpacingHandlesOptions['onDiff'],
  onPosition: () => void
): void {
  let startY = 0;
  let startX = 0;
  let startValue = 0;
  let originalInlineValue = '';
  let dragTarget: HTMLElement | null = null;

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.target) return;

    // Capture the target at drag start (in case element changes mid-drag)
    dragTarget = state.target;

    const property = `${type}-${edge}`;
    const computed = getComputedStyle(dragTarget);
    startValue = parseFloat(computed.getPropertyValue(property)) || 0;
    startX = e.clientX;
    startY = e.clientY;

    // Capture original inline style value for proper diff capture
    originalInlineValue = dragTarget.style.getPropertyValue(property);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });

    // Register cleanup function so drag can be cancelled if element changes
    state.activeDrag = {
      cleanup: () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        // Revert to original value if drag was cancelled
        if (dragTarget) {
          if (originalInlineValue) {
            dragTarget.style.setProperty(property, originalInlineValue);
          } else {
            dragTarget.style.removeProperty(property);
          }
        }
        dragTarget = null;
      },
    };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragTarget) return;

    let delta: number;
    if (edge === 'top' || edge === 'bottom') {
      delta = e.clientY - startY;
      if (edge === 'top') delta = -delta; // dragging up increases top margin/padding
    } else {
      delta = e.clientX - startX;
      if (edge === 'left') delta = -delta;
    }

    const newValue = Math.max(0, startValue + delta);
    const property = `${type}-${edge}`;

    // Apply live visual feedback during drag
    dragTarget.style.setProperty(property, `${newValue}px`);
    onPosition();
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    state.activeDrag = null;

    if (!dragTarget) return;

    const property = `${type}-${edge}`;
    const finalValue = dragTarget.style.getPropertyValue(property);

    // Reset to original inline value before calling engine.applyStyle
    // so the engine captures the correct "before" state
    if (originalInlineValue) {
      dragTarget.style.setProperty(property, originalInlineValue);
    } else {
      dragTarget.style.removeProperty(property);
    }

    // Now apply via unified engine to get proper diff with correct oldValue
    const diff = engine.applyStyle(dragTarget, { [property]: finalValue });
    if (diff) onDiff(diff);
    onPosition();

    dragTarget = null;
  };

  handle.addEventListener('mousedown', onMouseDown);
}
