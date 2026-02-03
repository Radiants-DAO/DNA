import {
  FLOW_MESSAGE_SOURCE,
  FLOW_PORT_NAME,
  type ContentToBackgroundMessage,
  type WindowMessage,
  isFlowWindowMessage,
} from '@flow/shared';

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

    // ── Connect to service worker ──
    const port = chrome.runtime.connect({ name: FLOW_PORT_NAME });

    // ── Element picker state ──
    let currentElement: Element | null = null;
    let rafId: number | null = null;

    /**
     * Penetrate shadow DOM boundaries to find the deepest element at point.
     * Pattern from VisBug (spec section 20): deepElementFromPoint.
     */
    function deepElementFromPoint(x: number, y: number): Element | null {
      let el = document.elementFromPoint(x, y);
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
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const el = deepElementFromPoint(e.clientX, e.clientY);

        // Skip our own overlay host
        if (!el || el === host || host.contains(el)) return;
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

    // ── Cleanup on port disconnect ──
    port.onDisconnect.addListener(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      observer.disconnect();
      host.remove();
    });
  },
});
