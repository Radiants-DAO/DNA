import {
  FLOW_MESSAGE_SOURCE,
  FLOW_PORT_NAME,
  type ContentToBackgroundMessage,
  type WindowMessage,
  type ElementSelectedMessage,
  type ContentInspectionResult,
  type DesignSubMode,
  isFlowWindowMessage,
} from '@flow/shared';
import {
  elementRegistry,
  generateSelector,
  dispatchElementSelected,
} from '../content/elementRegistry';
import { removeOverlayRoot } from '../content/overlays/overlayRoot';
import {
  addPersistentSelection,
  removePersistentSelection,
  hasPersistentSelection,
  clearPersistentSelections,
  destroyPersistentSelections,
  pulsePersistentSelection,
  getPersistentSelectionSelectors,
  onPersistentSelectionChange,
} from '../content/overlays/persistentSelections';
import { inspectElement } from '../content/inspector';
import { ensureOverlayRoot } from '../content/overlays/overlayRoot';
import { createSelectionEngine } from '../content/selection/selectionEngine';
import { createGuidesState } from '../content/guides/guides';
import { createUnifiedMutationEngine } from '../content/mutations/unifiedMutationEngine';
import { createMultiSelectProxy } from '../content/mutations/multiSelectProxy';
import { initMutationMessageHandler, broadcastMutationState } from '../content/mutations/mutationMessageHandler';
import { initTextEditMode } from '../content/mutations/textEditMode';
import { initPanelRouter } from '../content/panelRouter';
import { registerSharedFeature } from '../content/sharedRegistry';
import { initStateBridge } from '../content/ui/stateBridge';
import { mountContentUI } from '../content/ui/contentRoot';
import {
  createToolbar,
  connectToolbarToModeSystem,
  destroyToolbar,
  expandToolbar,
  collapseToolbar,
  isToolbarExpanded,
  setFabBadge,
  setFabClickHandler,
} from '../content/ui/toolbar';
import { initSpotlight } from '../content/ui/spotlight';
import { createModeIndicator } from '../content/ui/modeIndicator';
import { createModeController } from '../content/modes/modeController';
import { registerModeHotkeys } from '../content/modes/modeHotkeys';
import { interceptsEvents, showsHoverOverlay } from '../content/modes/types';
import { shouldIgnoreKeyboardShortcut } from '../content/features/keyboardGuards';
import {
  enableEventInterception,
  disableEventInterception,
  getInterceptorElement,
} from '../content/modes/eventInterceptor';
import { createColorTool } from '../content/modes/tools/colorTool';
import { createEffectsTool } from '../content/modes/tools/effectsTool';
import { createPositionTool } from '../content/modes/tools/positionTool';
import { createLayoutTool } from '../content/modes/tools/layoutTool';
import { createTypographyTool } from '../content/modes/tools/typographyTool';
import { createAssetTool } from '../content/modes/tools/assetTool';
import { createMoveTool } from '../content/modes/tools/moveTool';
import toolThemeStyles from '../content/modes/tools/toolTheme.css?inline';
import { getOverlayHost } from '../content/overlays/overlayRoot';
import {
  isRuntimeMessagingError,
  safePortPostMessage,
  safeRuntimeConnect,
} from '../utils/runtimeSafety';


export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    // ── Shadow DOM host for overlay ──
    const host = document.createElement('flow-overlay');
    const shadow = host.attachShadow({ mode: 'closed' });

    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483647;
      }

      .highlight {
        position: fixed;
        border: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.08);
        border-radius: 2px;
        pointer-events: none;
        transition: all 0.05s ease-out;
        display: none;

        /* Positioned via CSS custom properties (VisBug pattern, spec section 20) */
        top: var(--flow-top, 0);
        left: var(--flow-left, 0);
        width: var(--flow-width, 0);
        height: var(--flow-height, 0);
      }

      .highlight[data-visible] {
        display: block;
      }

      .label {
        position: fixed;
        top: var(--flow-label-top, 0);
        left: var(--flow-label-left, 0);
        background: #3b82f6;
        color: white;
        font: 11px/1.4 ui-monospace, monospace;
        padding: 2px 6px;
        border-radius: 2px;
        pointer-events: none;
        white-space: nowrap;
        display: none;
      }

      .label[data-visible] {
        display: block;
      }
    `);
    shadow.adoptedStyleSheets = [styles];

    const highlight = document.createElement('div');
    highlight.className = 'highlight';
    shadow.appendChild(highlight);

    const label = document.createElement('div');
    label.className = 'label';
    shadow.appendChild(label);

    document.documentElement.appendChild(host);

    // ── Connect to service worker (with reconnection) ──
    const initialPort = safeRuntimeConnect(FLOW_PORT_NAME, (error) => {
      if (isRuntimeMessagingError(error)) {
        console.warn('[Flow] Runtime unavailable during content script init.');
      } else {
        console.error('[Flow] Failed to connect runtime port:', error);
      }
    });
    if (!initialPort) {
      // Stale content script context (common after extension reload). Exit cleanly.
      host.remove();
      return;
    }
    let port: chrome.runtime.Port = initialPort;

    // ── Initialize unified mutation engine and message handler ──
    const rawEngine = createUnifiedMutationEngine();
    const unifiedMutationEngine = createMultiSelectProxy(rawEngine, getPersistentSelectionSelectors);
    // Panel mutation handler gets the RAW engine (panel targets specific selectors)
    initMutationMessageHandler(port, rawEngine);
    initTextEditMode(rawEngine);
    initPanelRouter(port);

    // ── Broadcast selection changes to panel ──
    const cleanupSelectionChange = onPersistentSelectionChange((selectors) => {
      safePortPostMessage(port, {
        type: 'selection:multi-state',
        payload: { selectors },
      });
    });

    // ── On-page UI: state bridge, toolbar, spotlight ──
    initStateBridge(port);
    const overlayRoot = ensureOverlayRoot();

    // Inject shared theme CSS into overlay root (before tool creation)
    const themeStyle = document.createElement('style');
    themeStyle.textContent = toolThemeStyles;
    overlayRoot.insertBefore(themeStyle, overlayRoot.firstChild);

    mountContentUI(overlayRoot);
    initSpotlight(overlayRoot);
    const toolbar = createToolbar(overlayRoot);
    const modeIndicator = createModeIndicator(overlayRoot);
    let flowEnabled = false;

    function postToPort(message: unknown): void {
      safePortPostMessage(port, message, (error) => {
        if (isRuntimeMessagingError(error)) {
          flowEnabled = false;
          disableEventInterception();
          collapseToolbar();
          hideOverlay();
          return;
        }
        console.error('[Flow] Failed to post message to runtime port:', error);
      });
    }

    // ── Mode system ──
    const modeController = createModeController({
      onModeChange: (state) => {
        if (flowEnabled && interceptsEvents(state.topLevel)) {
          // Place interceptor in overlayRoot (same shadow DOM as toolbar)
          // so z-index stacking works — toolbar stays clickable above interceptor
          enableEventInterception(overlayRoot, {
            onClick: (e) => onClick(e),
            onMouseDown: (e) => onMouseDownHandler(e),
            onMouseMove: (e) => onMouseMove(e),
            onMouseMoveDrag: (e) => onMouseMoveDragHandler(e),
            onMouseUp: (e) => onMouseUpHandler(e),
            onMouseLeave: () => onMouseLeave(),
          });
        } else {
          disableEventInterception();
        }
        modeIndicator.update(state);
        postToPort({ type: 'mode:changed', payload: state });
      },
    });

    const cleanupHotkeys = registerModeHotkeys({
      setTopLevel: (mode) => {
        if (!flowEnabled) return;
        modeController.setTopLevel(mode);
      },
      setDesignSubMode: (subMode) => {
        if (!flowEnabled) return;
        modeController.setDesignSubMode(subMode);
      },
      getTopLevel: () => (flowEnabled ? modeController.getState().topLevel : 'default'),
    });

    // Undo/redo keyboard shortcuts in design mode + Escape to collapse
    const handleUndoRedoKeydown = (e: KeyboardEvent) => {
      // Escape collapses toolbar and disables Flow
      if (e.key === 'Escape' && flowEnabled && isToolbarExpanded()) {
        e.preventDefault();
        setFlowEnabled(false);
        return;
      }

      if (!flowEnabled) return;
      const currentMode = modeController.getState().topLevel;
      if (currentMode !== 'design') return;
      if (shouldIgnoreKeyboardShortcut(e)) return;

      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          unifiedMutationEngine.redo();
        } else {
          unifiedMutationEngine.undo();
        }
        // State broadcast handled by engine.subscribe → debounced mutation:state
      }
    };

    document.addEventListener('keydown', handleUndoRedoKeydown, true);

    const cleanupToolbarMode = connectToolbarToModeSystem(
      modeController.setTopLevel,
      modeController.subscribe,
    );

    // ── FAB click → toggle Flow on/off ──
    setFabClickHandler(() => {
      setFlowEnabled(!flowEnabled);
    });

    // ── Mutation badge: show undo count on FAB ──
    const cleanupMutationBadge = unifiedMutationEngine.subscribe(() => {
      setFabBadge(unifiedMutationEngine.undoCount);
    });

    // ── Design sub-mode tools ──
    const colorTool = createColorTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        broadcastMutationState();
      },
    });

    const effectsTool = createEffectsTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        broadcastMutationState();
      },
    });

    const positionTool = createPositionTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        broadcastMutationState();
      },
    });

    const layoutTool = createLayoutTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        broadcastMutationState();
      },
    });

    const typographyTool = createTypographyTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        broadcastMutationState();
      },
    });

    const assetTool = createAssetTool({
      shadowRoot: overlayRoot,
    });

    const moveTool = createMoveTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        broadcastMutationState();
      },
    });

    // Track whether tools are currently attached
    let colorToolAttached = false;
    let effectsToolAttached = false;
    let positionToolAttached = false;
    let layoutToolAttached = false;
    let typographyToolAttached = false;
    let assetToolAttached = false;
    let moveToolAttached = false;

    // Subscribe to mode changes to attach/detach design tools
    const cleanupToolWiring = modeController.subscribe((state) => {
      // Color tool
      if (state.topLevel === 'design' && state.designSubMode === 'color' && selectedElement) {
        if (!colorToolAttached) {
          colorTool.attach(selectedElement as HTMLElement);
          colorToolAttached = true;
        }
      } else if (colorToolAttached) {
        colorTool.detach();
        colorToolAttached = false;
      }

      // Effects tool
      if (state.topLevel === 'design' && state.designSubMode === 'effects' && selectedElement) {
        if (!effectsToolAttached) {
          effectsTool.attach(selectedElement as HTMLElement);
          effectsToolAttached = true;
        }
      } else if (effectsToolAttached) {
        effectsTool.detach();
        effectsToolAttached = false;
      }

      // Position tool
      if (state.topLevel === 'design' && state.designSubMode === 'position' && selectedElement) {
        if (!positionToolAttached) {
          positionTool.attach(selectedElement as HTMLElement);
          positionToolAttached = true;
        }
      } else if (positionToolAttached) {
        positionTool.detach();
        positionToolAttached = false;
      }

      // Layout tool
      if (state.topLevel === 'design' && state.designSubMode === 'layout' && selectedElement) {
        if (!layoutToolAttached) {
          layoutTool.attach(selectedElement as HTMLElement);
          layoutToolAttached = true;
        }
      } else if (layoutToolAttached) {
        layoutTool.detach();
        layoutToolAttached = false;
      }

      // Typography tool
      if (state.topLevel === 'design' && state.designSubMode === 'typography' && selectedElement) {
        if (!typographyToolAttached) {
          typographyTool.attach(selectedElement as HTMLElement);
          typographyToolAttached = true;
        }
      } else if (typographyToolAttached) {
        typographyTool.detach();
        typographyToolAttached = false;
      }

      // Asset tool — top-level mode, not a design sub-mode
      if (state.topLevel === 'asset' && selectedElement) {
        if (!assetToolAttached) {
          assetTool.attach(selectedElement as HTMLElement);
          assetToolAttached = true;
        }
      } else if (assetToolAttached) {
        assetTool.detach();
        assetToolAttached = false;
      }

      // Move tool — top-level mode
      if (state.topLevel !== 'move' && moveToolAttached) {
        moveTool.deselect();
        moveToolAttached = false;
      }

    });

    // ── Listen for sub-mode switch requests from tool panel headers ──
    const onRequestSubMode = ((e: CustomEvent) => {
      if (!flowEnabled) return;
      const subMode = e.detail?.subMode as DesignSubMode | undefined;
      if (subMode) {
        modeController.setDesignSubMode(subMode);
      }
    }) as EventListener;
    overlayRoot.addEventListener('flow:request-sub-mode', onRequestSubMode);

    // ── Element picker state ──
    let currentElement: Element | null = null;
    let selectedElement: Element | null = null;
    let rafId: number | null = null;

    /**
     * Check if an element belongs to Flow's overlay infrastructure.
     */
    function isFlowElement(el: Element): boolean {
      if (el === host || host.contains(el)) return true;
      const tag = el.tagName.toLowerCase();
      return tag === 'flow-overlay' || tag === 'flow-overlay-root';
    }

    /**
     * Penetrate shadow DOM boundaries to find the deepest element at point.
     * Pattern from VisBug (spec section 20): deepElementFromPoint.
     *
     * Temporarily hides the event interceptor from hit-testing so
     * elementFromPoint returns the actual page element beneath it.
     */
    function deepElementFromPoint(x: number, y: number): Element | null {
      // Peek through the interceptor overlay
      const interceptor = getInterceptorElement();
      if (interceptor) interceptor.style.pointerEvents = 'none';

      let el = document.elementFromPoint(x, y);

      if (interceptor) interceptor.style.pointerEvents = 'auto';

      if (!el) return null;

      while (el?.shadowRoot) {
        const deeper = el.shadowRoot.elementFromPoint(x, y);
        if (!deeper || deeper === el) break;
        el = deeper;
      }
      return el;
    }

    function updateOverlay(el: Element): void {
      const rect = el.getBoundingClientRect();

      highlight.style.setProperty('--flow-top', `${rect.top}px`);
      highlight.style.setProperty('--flow-left', `${rect.left}px`);
      highlight.style.setProperty('--flow-width', `${rect.width}px`);
      highlight.style.setProperty('--flow-height', `${rect.height}px`);
      highlight.toggleAttribute('data-visible', true);

      // Label above element, or below if near top of viewport
      const labelTop = rect.top > 24 ? rect.top - 22 : rect.bottom + 4;
      label.style.setProperty('--flow-label-top', `${labelTop}px`);
      label.style.setProperty('--flow-label-left', `${rect.left}px`);

      const tagName = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls =
        el.classList.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
      label.textContent = `${tagName}${id}${cls}`;
      label.toggleAttribute('data-visible', true);
    }

    function hideOverlay(): void {
      highlight.removeAttribute('data-visible');
      label.removeAttribute('data-visible');
    }

    function setFlowEnabled(enabled: boolean): void {
      flowEnabled = enabled;

      if (enabled) {
        expandToolbar();
        // Enable into design mode so click-to-select works immediately.
        modeController.setTopLevel('design');
      } else {
        collapseToolbar();
        clearPersistentSelections();
        modeController.setTopLevel('default');
        currentElement = null;
        hideOverlay();
        const msg: ContentToBackgroundMessage = {
          type: 'element:unhovered',
          payload: null,
        };
        postToPort(msg);
      }
    }

    function getTextPreview(el: Element): string {
      const text = el.textContent?.trim() ?? '';
      return text.length > 80 ? text.slice(0, 80) + '...' : text;
    }

    // ── Mouse event handlers (throttled to rAF per spec section 13.6) ──

    function onMouseMove(e: MouseEvent): void {
      if (!flowEnabled) return;
      updateMarqueeRect(e);
      if (!showsHoverOverlay(modeController.getState().topLevel)) return;
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const el = deepElementFromPoint(e.clientX, e.clientY);

        // Skip Flow overlay elements
        if (!el || isFlowElement(el)) return;
        if (el === currentElement) return;

        currentElement = el;
        updateOverlay(el);

        const rect = el.getBoundingClientRect();
        const msg: ContentToBackgroundMessage = {
          type: 'element:hovered',
          payload: {
            tagName: el.tagName.toLowerCase(),
            id: el.id,
            classList: [...el.classList],
            rect: {
              top: Math.round(rect.top),
              left: Math.round(rect.left),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            textPreview: getTextPreview(el),
          },
        };
        postToPort(msg);
      });
    }

    function onMouseLeave(): void {
      if (!flowEnabled) {
        hideOverlay();
        return;
      }
      currentElement = null;
      hideOverlay();
      const msg: ContentToBackgroundMessage = {
        type: 'element:unhovered',
        payload: null,
      };
      postToPort(msg);
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // ── Helpers ──
    function findLCA(a: Element, b: Element): Element {
      const ancestors = new Set<Element>();
      let node: Element | null = a;
      while (node) {
        ancestors.add(node);
        node = node.parentElement;
      }
      node = b;
      while (node) {
        if (ancestors.has(node)) return node;
        node = node.parentElement;
      }
      return document.documentElement;
    }

    // ── Shift+drag marquee selection ──
    let marqueeStart: { x: number; y: number } | null = null;
    let marqueeRect: HTMLDivElement | null = null;
    let marqueeDidDrag = false;
    const MARQUEE_THRESHOLD = 5; // px before drag is considered a marquee

    function onMarqueeDown(e: MouseEvent): void {
      if (!flowEnabled || !e.shiftKey) return;
      marqueeStart = { x: e.clientX, y: e.clientY };
      marqueeDidDrag = false;
    }

    function onMarqueeUp(e: MouseEvent): void {
      if (!marqueeStart) return;
      const dx = e.clientX - marqueeStart.x;
      const dy = e.clientY - marqueeStart.y;

      if (Math.abs(dx) < MARQUEE_THRESHOLD && Math.abs(dy) < MARQUEE_THRESHOLD) {
        // Below threshold — let click handler handle it
        marqueeStart = null;
        removeMarqueeRect();
        return;
      }

      marqueeDidDrag = true;

      // Compute selection rectangle
      const left = Math.min(marqueeStart.x, e.clientX);
      const top = Math.min(marqueeStart.y, e.clientY);
      const right = Math.max(marqueeStart.x, e.clientX);
      const bottom = Math.max(marqueeStart.y, e.clientY);

      // Find elements within the marquee, then select at the sibling level.
      // 1. Point-sample to discover leaf candidates
      // 2. Find their lowest common ancestor (LCA)
      // 3. Select only direct children of the LCA whose center is in the marquee
      const candidates = new Set<Element>();
      const step = 20;
      for (let x = left; x <= right; x += step) {
        for (let y = top; y <= bottom; y += step) {
          const el = deepElementFromPoint(x, y);
          if (!el || isFlowElement(el)) continue;
          if (el === document.documentElement || el === document.body) continue;
          candidates.add(el);
        }
      }

      if (candidates.size > 0) {
        // Find lowest common ancestor
        const els = [...candidates];
        let lca: Element = els[0];
        for (let i = 1; i < els.length; i++) {
          lca = findLCA(lca, els[i]);
        }
        // If LCA is body/html, try one level deeper — use the first candidate's parent
        if (lca === document.body || lca === document.documentElement) {
          const firstParent = els[0].parentElement;
          if (firstParent && firstParent !== document.body && firstParent !== document.documentElement) {
            lca = firstParent;
          }
        }

        // Select direct children of the LCA whose center falls in the marquee
        for (const child of lca.children) {
          if (isFlowElement(child)) continue;
          const r = child.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) continue;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
            addPersistentSelection(child, generateSelector(child));
          }
        }
      }

      marqueeStart = null;
      removeMarqueeRect();
    }

    function updateMarqueeRect(e: MouseEvent): void {
      if (!marqueeStart || !e.shiftKey) {
        if (marqueeStart) {
          marqueeStart = null;
          removeMarqueeRect();
        }
        return;
      }
      const dx = e.clientX - marqueeStart.x;
      const dy = e.clientY - marqueeStart.y;
      if (Math.abs(dx) < MARQUEE_THRESHOLD && Math.abs(dy) < MARQUEE_THRESHOLD) return;

      if (!marqueeRect) {
        marqueeRect = document.createElement('div');
        marqueeRect.style.cssText = `
          position: fixed;
          border: 1.5px dashed rgba(59, 130, 246, 0.8);
          background: rgba(59, 130, 246, 0.06);
          pointer-events: none;
          z-index: 2147483646;
        `;
        overlayRoot.appendChild(marqueeRect);
      }

      const left = Math.min(marqueeStart.x, e.clientX);
      const top = Math.min(marqueeStart.y, e.clientY);
      const width = Math.abs(dx);
      const height = Math.abs(dy);
      marqueeRect.style.left = `${left}px`;
      marqueeRect.style.top = `${top}px`;
      marqueeRect.style.width = `${width}px`;
      marqueeRect.style.height = `${height}px`;
    }

    function removeMarqueeRect(): void {
      marqueeRect?.remove();
      marqueeRect = null;
    }

    // ── Move mode drag wrapper handlers ──

    function onMouseDownHandler(e: MouseEvent): void {
      // Move mode: initiate drag tracking
      if (flowEnabled && modeController.getState().topLevel === 'move') {
        const el = deepElementFromPoint(e.clientX, e.clientY);
        if (el && !isFlowElement(el) && el instanceof HTMLElement) {
          moveTool.beginDrag(el, e.clientX, e.clientY);
          return;
        }
      }
      // Default: marquee selection
      onMarqueeDown(e);
    }

    function onMouseMoveDragHandler(e: MouseEvent): void {
      if (!flowEnabled) return;
      if (moveTool.isDragging() || (modeController.getState().topLevel === 'move')) {
        moveTool.updateDrag(e.clientX, e.clientY, e.metaKey || e.ctrlKey);
        if (moveTool.isDragging()) {
          e.preventDefault(); // suppress text selection during drag
        }
      }
    }

    function onMouseUpHandler(e: MouseEvent): void {
      // Move mode: finish drag if active
      if (moveTool.isDragging()) {
        moveTool.endDrag();
        return;
      }
      // If move mode began drag tracking but threshold wasn't crossed,
      // endDrag treats it as a click (select for keyboard)
      if (flowEnabled && modeController.getState().topLevel === 'move') {
        moveTool.endDrag();
        // Don't fall through to marquee — move mode handled it
        return;
      }
      // Default: marquee selection
      onMarqueeUp(e);
    }

    // ── Click handler for element selection ──
    async function onClick(e: MouseEvent): Promise<void> {
      if (!flowEnabled) return;
      const topLevelMode = modeController.getState().topLevel;
      const isIntercepting = interceptsEvents(topLevelMode);
      const isTextEditMode = topLevelMode === 'editText';

      // In default mode, require Alt+click; intercepting modes and editText mode handle directly.
      if (!isIntercepting && !isTextEditMode && !e.altKey) return;

      const el = deepElementFromPoint(e.clientX, e.clientY);

      // Skip Flow overlay elements
      if (!el || isFlowElement(el)) return;

      e.preventDefault();
      e.stopPropagation();

      // Skip if this click ended a marquee drag
      if (marqueeDidDrag) {
        marqueeDidDrag = false;
        return;
      }

      // Move mode handles selection via mousedown/mouseup, skip click
      if (topLevelMode === 'move') {
        moveToolAttached = true;
        return;
      }

      const selector = generateSelector(el);

      // Shift-click toggle: deselect if already selected
      if (e.shiftKey && hasPersistentSelection(selector)) {
        removePersistentSelection(selector);
        return;
      }

      // Unregister previous selection
      if (selectedElement) {
        elementRegistry.unregister(selectedElement);
      }

      // Register new selection in elementRegistry
      selectedElement = el;

      const elementIndex = elementRegistry.register(el);
      const rect = el.getBoundingClientRect();

      const meta = {
        elementIndex,
        selector,
        rect: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };
      if (!e.shiftKey) {
        clearPersistentSelections();
      }
      addPersistentSelection(el, meta.selector);
      pulsePersistentSelection(meta.selector);

      // Store element reference for CDP nodeId resolution (Phase 5)
      (window as any).__flow_selectedElement = el;

      // Dispatch local event for other content script consumers
      dispatchElementSelected(meta);

      // Send quick selection notification to panel immediately.
      // Keep this before tool attach so panel state is resilient if a tool throws.
      const selectionMsg: ElementSelectedMessage = {
        type: 'element:selected',
        payload: {
          ...meta,
          elementRef: 'selected',
          tagName: el.tagName.toLowerCase(),
          id: el.id,
          classList: [...el.classList],
          textPreview: getTextPreview(el),
          clickPoint: {
            x: Math.round(e.clientX),
            y: Math.round(e.clientY),
          },
        },
      };
      postToPort(selectionMsg);

      if (isTextEditMode) {
        postToPort({
          type: 'flow:focus-typography',
          payload: { selector: meta.selector },
        });
      }

      // Attach design tools if we're in their sub-mode
      const currentState = modeController.getState();
      if (currentState.topLevel === 'design') {
        if (!(el instanceof HTMLElement)) {
          console.warn('[Flow] Selected node is not an HTMLElement; skipping design tool attach.');
        } else {
          try {
            if (currentState.designSubMode === 'color') {
              colorTool.detach();
              colorTool.attach(el);
              colorToolAttached = true;
            }
            if (currentState.designSubMode === 'effects') {
              effectsTool.detach();
              effectsTool.attach(el);
              effectsToolAttached = true;
            }
            if (currentState.designSubMode === 'position') {
              positionTool.detach();
              positionTool.attach(el);
              positionToolAttached = true;
            }
            if (currentState.designSubMode === 'layout') {
              layoutTool.detach();
              layoutTool.attach(el);
              layoutToolAttached = true;
            }
            if (currentState.designSubMode === 'typography') {
              typographyTool.detach();
              typographyTool.attach(el);
              typographyToolAttached = true;
            }
          } catch (error) {
            console.error('[Flow] Failed to attach design tool for selected element:', error);
          }
        }
      }

      if (currentState.topLevel === 'asset') {
        if (!(el instanceof HTMLElement)) {
          console.warn('[Flow] Selected node is not an HTMLElement; skipping asset tool attach.');
        } else {
          try {
            assetTool.detach();
            assetTool.attach(el);
            assetToolAttached = true;
          } catch (error) {
            console.error('[Flow] Failed to attach asset tool:', error);
          }
        }
      }

      // Run full inspection pipeline
      try {
        const result = await inspectElement(el);
        const inspectionMsg: ContentInspectionResult = {
          type: 'flow:content:inspection-result',
          tabId: 0, // Service worker fills in the real tabId
          result,
        };
        postToPort(inspectionMsg);
      } catch (error) {
        console.error('[Flow] Inspection failed:', error);
      }
    }

    document.addEventListener('click', onClick, { capture: true });

    // ── MutationObserver: reposition overlay if DOM changes (spec section 20) ──
    const observer = new MutationObserver(() => {
      if (currentElement && currentElement.isConnected) {
        updateOverlay(currentElement);
      } else {
        hideOverlay();
        currentElement = null;
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // ── Listen for agent script messages (spec section 5.1) ──
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isFlowWindowMessage(event)) return;

      const msg = event.data;
      if (msg.type === 'agent:pong') {
        const bgMsg: ContentToBackgroundMessage = {
          type: 'agent:ready',
          payload: { globals: msg.payload.globals },
        };
        postToPort(bgMsg);
      }
    });

    // ── Ping agent script with retry (agent may not be injected yet) ──
    function pingAgent(retries = 3): void {
      const pingMsg: WindowMessage = {
        type: 'content:ping',
        source: FLOW_MESSAGE_SOURCE,
        payload: { timestamp: Date.now() },
      };
      window.postMessage(pingMsg, window.location.origin);

      if (retries > 0) {
        setTimeout(() => pingAgent(retries - 1), 500);
      }
    }

    // Start pinging after a short delay to let agent inject
    setTimeout(() => pingAgent(), 200);

    // Wire up port message handler (also called on reconnect)
    handlePortMessages(port);

    // ── Phase 3a Core Infrastructure ──
    const coreOverlayRoot = ensureOverlayRoot();
    const selectionEngine = createSelectionEngine();
    const guidesState = createGuidesState();

    // Suppress unused variable warnings until Phase 3b wires these up
    void coreOverlayRoot;

    // ── Register features with the shared registry ──
    // Features can be activated via panel:feature messages through panelRouter
    registerSharedFeature('guides', {
      activate: () => {
        guidesState.visible = true;
        return () => {
          guidesState.visible = false;
        };
      },
    });

    registerSharedFeature('selection', {
      activate: () => {
        // Selection engine is stateless - clear returns it to initial state
        return () => selectionEngine.clear();
      },
    });

    registerSharedFeature('component-id', {
      activate: () => {
        // Component ID mode: show overlays for all elements with data-radflow-id
        const overlays: HTMLElement[] = [];
        const overlayStyles = document.createElement('style');
        overlayStyles.textContent = `
          .flow-component-id-overlay {
            position: absolute;
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            padding: 2px 6px;
            font: 10px/1.3 ui-monospace, SFMono-Regular, monospace;
            border-radius: 3px;
            z-index: 2147483646;
            pointer-events: none;
            white-space: nowrap;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `;
        document.head.appendChild(overlayStyles);

        // Find all elements with data-radflow-id and create overlays
        document.querySelectorAll('[data-radflow-id]').forEach((el) => {
          const radflowId = el.getAttribute('data-radflow-id');
          const componentName = el.getAttribute('data-component') || el.getAttribute('data-component-name');
          const displayText = componentName || radflowId || 'unknown';

          const overlay = document.createElement('div');
          overlay.className = 'flow-component-id-overlay';
          overlay.textContent = displayText;

          const rect = el.getBoundingClientRect();
          overlay.style.top = `${rect.top + window.scrollY}px`;
          overlay.style.left = `${rect.left + window.scrollX}px`;
          document.body.appendChild(overlay);
          overlays.push(overlay);
        });

        // Return cleanup function
        return () => {
          overlays.forEach((o) => o.remove());
          overlayStyles.remove();
        };
      },
    });

    // ── Port message handler (extracted for reconnection) ──
    function handlePortMessages(p: chrome.runtime.Port): void {
      p.onMessage.addListener((msg: unknown) => {
        if (typeof msg !== 'object' || msg === null) return;
        const anyMsg = msg as Record<string, unknown>;

        if (anyMsg.type === 'panel:flow-toggle') {
          const payload = anyMsg.payload as { enabled: boolean };
          // setFlowEnabled handles expand/collapse internally
          setFlowEnabled(Boolean(payload.enabled));
        }

        if (anyMsg.type === 'panel:set-mode') {
          if (!flowEnabled) return;
          const payload = anyMsg.payload as { mode: string };
          modeController.setTopLevel(payload.mode as import('@flow/shared').TopLevelMode);
        }

        if (anyMsg.type === 'panel:set-sub-mode') {
          if (!flowEnabled) return;
          const payload = anyMsg.payload as { subMode: string };
          modeController.setDesignSubMode(payload.subMode as import('@flow/shared').DesignSubMode);
        }

        if (anyMsg.type === 'panel:set-theme') {
          const payload = anyMsg.payload as { theme: 'dark' | 'light' };
          const overlayHost = getOverlayHost();
          if (overlayHost) {
            overlayHost.setAttribute('data-theme', payload.theme);
          }
        }
      });
    }

    // ── Reconnection on port disconnect ──
    function setupDisconnectHandler(p: chrome.runtime.Port): void {
      p.onDisconnect.addListener(() => {
        // Attempt to reconnect after service worker wake
        setTimeout(() => {
          try {
            const nextPort = safeRuntimeConnect(FLOW_PORT_NAME);
            if (!nextPort) {
              throw new Error('Runtime port unavailable during reconnect');
            }
            port = nextPort;
            // Re-init services that hold port references
            initMutationMessageHandler(port, rawEngine);
            initPanelRouter(port);
            initStateBridge(port);
            handlePortMessages(port);
            setupDisconnectHandler(port);
          } catch {
            // Extension was fully unloaded — clean up everything
            cleanupHotkeys();
            cleanupToolbarMode();
            cleanupMutationBadge();
            modeIndicator.destroy();
            destroyToolbar();
            cleanupToolWiring();
            overlayRoot.removeEventListener('flow:request-sub-mode', onRequestSubMode);
            colorTool.destroy();
            effectsTool.destroy();
            positionTool.destroy();
            layoutTool.destroy();
            typographyTool.destroy();
            assetTool.destroy();
            moveTool.destroy();
            disableEventInterception();
            document.removeEventListener('keydown', handleUndoRedoKeydown, true);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('click', onClick, { capture: true });
            observer.disconnect();
            if (selectedElement) {
              elementRegistry.unregister(selectedElement);
            }
            cleanupSelectionChange();
            destroyPersistentSelections();
            removeOverlayRoot();
            host.remove();
          }
        }, 1000);
      });
    }

    setupDisconnectHandler(port);
  },
});
