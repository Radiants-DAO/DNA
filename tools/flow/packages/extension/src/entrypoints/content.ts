import {
  FLOW_MESSAGE_SOURCE,
  FLOW_PORT_NAME,
  type ContentToBackgroundMessage,
  type WindowMessage,
  type ElementSelectedMessage,
  type ContentInspectionResult,
  isFlowWindowMessage,
} from '@flow/shared';
import {
  elementRegistry,
  generateSelector,
  dispatchElementSelected,
} from '../content/elementRegistry';
import { removeOverlayRoot } from '../content/overlays/overlayRoot';
import { inspectElement } from '../content/inspector';
import { ensureOverlayRoot } from '../content/overlays/overlayRoot';
import { createSelectionEngine } from '../content/selection/selectionEngine';
import { createGuidesState } from '../content/guides/guides';
import { registerElement as registerMutationElement, unregisterElement as unregisterMutationElement } from '../content/mutations/mutationEngine';
import { createUnifiedMutationEngine } from '../content/mutations/unifiedMutationEngine';
import { initMutationMessageHandler } from '../content/mutations/mutationMessageHandler';
import { initTextEditMode } from '../content/mutations/textEditMode';
import { initPanelRouter } from '../content/panelRouter';
import { registerSharedFeature } from '../content/sharedRegistry';
import { initStateBridge } from '../content/ui/stateBridge';
import { mountContentUI } from '../content/ui/contentRoot';
import { destroyToolbar } from '../content/ui/toolbar';
import { initSpotlight } from '../content/ui/spotlight';
import { createLeftSidebar } from '../content/ui/leftSidebar';
import { createModeController } from '../content/modes/modeController';
import { registerModeHotkeys } from '../content/modes/modeHotkeys';
import { interceptsEvents, showsHoverOverlay } from '../content/modes/types';
import {
  enableEventInterception,
  disableEventInterception,
  getInterceptorElement,
} from '../content/modes/eventInterceptor';
import { createColorTool } from '../content/modes/tools/colorTool';
import { createEffectsTool } from '../content/modes/tools/effectsTool';
import { createPositionTool } from '../content/modes/tools/positionTool';
import { createSpacingTool } from '../content/modes/tools/spacingTool';
import { createFlexTool } from '../content/modes/tools/flexTool';
import { createMoveTool } from '../content/modes/tools/moveTool';

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
    let port = chrome.runtime.connect({ name: FLOW_PORT_NAME });

    // ── Initialize unified mutation engine and message handler ──
    const unifiedMutationEngine = createUnifiedMutationEngine();
    initMutationMessageHandler(port);
    initTextEditMode();
    initPanelRouter(port);

    // ── On-page UI: state bridge, toolbar, spotlight ──
    initStateBridge(port);
    const overlayRoot = ensureOverlayRoot();
    mountContentUI(overlayRoot);
    initSpotlight(overlayRoot);
    createLeftSidebar(overlayRoot);

    // ── Mode system ──
    const modeController = createModeController({
      onModeChange: (state) => {
        if (interceptsEvents(state.topLevel)) {
          // Place interceptor in overlayRoot (same shadow DOM as toolbar)
          // so z-index stacking works — toolbar stays clickable above interceptor
          enableEventInterception(overlayRoot, {
            onClick: (e) => onClick(e),
            onMouseMove: (e) => onMouseMove(e),
            onMouseLeave: () => onMouseLeave(),
          });
        } else {
          disableEventInterception();
        }
        port.postMessage({ type: 'mode:changed', payload: state });
      },
    });

    const cleanupHotkeys = registerModeHotkeys({
      setTopLevel: modeController.setTopLevel,
      setDesignSubMode: modeController.setDesignSubMode,
      getTopLevel: () => modeController.getState().topLevel,
    });

    // ── Design sub-mode tools ──
    const colorTool = createColorTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        // Notify panel of mutation changes
        port.postMessage({ type: 'mutation:updated', payload: null });
      },
    });

    const effectsTool = createEffectsTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        port.postMessage({ type: 'mutation:updated', payload: null });
      },
    });

    const positionTool = createPositionTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        port.postMessage({ type: 'mutation:updated', payload: null });
      },
    });

    const spacingTool = createSpacingTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        port.postMessage({ type: 'mutation:updated', payload: null });
      },
    });

    const flexTool = createFlexTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        port.postMessage({ type: 'mutation:updated', payload: null });
      },
    });

    const moveTool = createMoveTool({
      shadowRoot: overlayRoot,
      engine: unifiedMutationEngine,
      onUpdate: () => {
        port.postMessage({ type: 'mutation:updated', payload: null });
      },
    });

    // Track whether tools are currently attached
    let colorToolAttached = false;
    let effectsToolAttached = false;
    let positionToolAttached = false;
    let spacingToolAttached = false;
    let flexToolAttached = false;
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

      // Spacing tool
      if (state.topLevel === 'design' && state.designSubMode === 'spacing' && selectedElement) {
        if (!spacingToolAttached) {
          spacingTool.attach(selectedElement as HTMLElement);
          spacingToolAttached = true;
        }
      } else if (spacingToolAttached) {
        spacingTool.detach();
        spacingToolAttached = false;
      }

      // Flex tool
      if (state.topLevel === 'design' && state.designSubMode === 'flex' && selectedElement) {
        if (!flexToolAttached) {
          flexTool.attach(selectedElement as HTMLElement);
          flexToolAttached = true;
        }
      } else if (flexToolAttached) {
        flexTool.detach();
        flexToolAttached = false;
      }

      // Move tool
      if (state.topLevel === 'design' && state.designSubMode === 'move' && selectedElement) {
        if (!moveToolAttached) {
          moveTool.attach(selectedElement as HTMLElement);
          moveToolAttached = true;
        }
      } else if (moveToolAttached) {
        moveTool.detach();
        moveToolAttached = false;
      }
    });

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

    function getTextPreview(el: Element): string {
      const text = el.textContent?.trim() ?? '';
      return text.length > 80 ? text.slice(0, 80) + '...' : text;
    }

    // ── Mouse event handlers (throttled to rAF per spec section 13.6) ──

    function onMouseMove(e: MouseEvent): void {
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
        port.postMessage(msg);
      });
    }

    function onMouseLeave(): void {
      currentElement = null;
      hideOverlay();
      const msg: ContentToBackgroundMessage = {
        type: 'element:unhovered',
        payload: null,
      };
      port.postMessage(msg);
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // ── Click handler for element selection ──
    async function onClick(e: MouseEvent): Promise<void> {
      const isIntercepting = interceptsEvents(modeController.getState().topLevel);

      // In default mode, require Alt+click; in intercepting modes, handle directly
      if (!isIntercepting && !e.altKey) return;

      const el = deepElementFromPoint(e.clientX, e.clientY);

      // Skip Flow overlay elements
      if (!el || isFlowElement(el)) return;

      e.preventDefault();
      e.stopPropagation();

      // Unregister previous selection
      if (selectedElement) {
        elementRegistry.unregister(selectedElement);
        unregisterMutationElement('selected');
      }

      // Register new selection (both in elementRegistry and mutationEngine)
      selectedElement = el;

      // Attach design tools if we're in their sub-mode
      const currentState = modeController.getState();
      if (currentState.topLevel === 'design' && currentState.designSubMode === 'color') {
        colorTool.detach();
        colorTool.attach(el as HTMLElement);
        colorToolAttached = true;
      }
      if (currentState.topLevel === 'design' && currentState.designSubMode === 'effects') {
        effectsTool.detach();
        effectsTool.attach(el as HTMLElement);
        effectsToolAttached = true;
      }
      if (currentState.topLevel === 'design' && currentState.designSubMode === 'position') {
        positionTool.detach();
        positionTool.attach(el as HTMLElement);
        positionToolAttached = true;
      }
      if (currentState.topLevel === 'design' && currentState.designSubMode === 'spacing') {
        spacingTool.detach();
        spacingTool.attach(el as HTMLElement);
        spacingToolAttached = true;
      }
      if (currentState.topLevel === 'design' && currentState.designSubMode === 'flex') {
        flexTool.detach();
        flexTool.attach(el as HTMLElement);
        flexToolAttached = true;
      }
      if (currentState.topLevel === 'design' && currentState.designSubMode === 'move') {
        moveTool.detach();
        moveTool.attach(el as HTMLElement);
        moveToolAttached = true;
      }

      const elementIndex = elementRegistry.register(el);
      registerMutationElement('selected', el as HTMLElement);
      const rect = el.getBoundingClientRect();

      const meta = {
        elementIndex,
        selector: generateSelector(el),
        rect: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };

      // Dispatch local event for other content script consumers
      dispatchElementSelected(meta);

      // Send quick selection notification to panel
      const selectionMsg: ElementSelectedMessage = {
        type: 'element:selected',
        payload: {
          ...meta,
          elementRef: 'selected',
          tagName: el.tagName.toLowerCase(),
          id: el.id,
          classList: [...el.classList],
          textPreview: getTextPreview(el),
        },
      };
      port.postMessage(selectionMsg);

      // Run full inspection pipeline
      try {
        const result = await inspectElement(el);
        const inspectionMsg: ContentInspectionResult = {
          type: 'flow:content:inspection-result',
          tabId: 0, // Service worker fills in the real tabId
          result,
        };
        port.postMessage(inspectionMsg);
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
        port.postMessage(bgMsg);
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

        if (anyMsg.type === 'panel:set-mode') {
          const payload = anyMsg.payload as { mode: string };
          modeController.setTopLevel(payload.mode as import('@flow/shared').TopLevelMode);
        }

        if (anyMsg.type === 'panel:set-sub-mode') {
          const payload = anyMsg.payload as { subMode: string };
          modeController.setDesignSubMode(payload.subMode as import('@flow/shared').DesignSubMode);
        }
      });
    }

    // ── Reconnection on port disconnect ──
    function setupDisconnectHandler(p: chrome.runtime.Port): void {
      p.onDisconnect.addListener(() => {
        // Attempt to reconnect after service worker wake
        setTimeout(() => {
          try {
            port = chrome.runtime.connect({ name: FLOW_PORT_NAME });
            // Re-init services that hold port references
            initMutationMessageHandler(port);
            initPanelRouter(port);
            initStateBridge(port);
            handlePortMessages(port);
            setupDisconnectHandler(port);
          } catch {
            // Extension was fully unloaded — clean up everything
            cleanupHotkeys();
            destroyToolbar();
            cleanupToolWiring();
            colorTool.destroy();
            effectsTool.destroy();
            positionTool.destroy();
            spacingTool.destroy();
            flexTool.destroy();
            moveTool.destroy();
            disableEventInterception();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('click', onClick, { capture: true });
            observer.disconnect();
            if (selectedElement) {
              elementRegistry.unregister(selectedElement);
              unregisterMutationElement('selected');
            }
            removeOverlayRoot();
            host.remove();
          }
        }, 1000);
      });
    }

    setupDisconnectHandler(port);
  },
});
