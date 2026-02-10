import { cdp } from './cdpBridge';
import { onPageNavigated } from './navigationWatcher';

let cachedNodeId: number | null = null;

// Clear cached node ID on page navigation
onPageNavigated(() => clearCachedNodeId());

/**
 * Resolve the currently selected element to a CDP nodeId.
 *
 * The content script stores the selected element on window.__flow_selectedElement
 * in the ISOLATED world. We use inspectedWindow.eval with useContentScriptContext
 * to access it, then push the reference to MAIN world via Runtime.evaluate so CDP
 * can resolve it to a nodeId.
 */
export async function resolveSelectedNodeId(): Promise<number | null> {
  try {
    // First, copy the element reference from ISOLATED → MAIN world via the agent script.
    // The content script sets __flow_selectedElement in ISOLATED world;
    // we use inspectedWindow.eval with useContentScriptContext to generate a
    // unique selector, then resolve that selector in MAIN world via CDP.
    const selector = await new Promise<string | null>((resolve) => {
      chrome.devtools.inspectedWindow.eval(
        `(function() {
          var el = window.__flow_selectedElement;
          if (!el) return null;
          // Build a unique selector for CDP resolution
          if (el.id) return '#' + el.id;
          var path = [];
          var node = el;
          while (node && node !== document.documentElement) {
            var parent = node.parentElement;
            if (!parent) break;
            var index = 1;
            var sib = parent.firstElementChild;
            while (sib && sib !== node) { if (sib.tagName === node.tagName) index++; sib = sib.nextElementSibling; }
            path.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + index + ')');
            node = parent;
          }
          return path.length ? path.join(' > ') : null;
        })()`,
        { useContentScriptContext: true },
        (result: unknown, err: unknown) => {
          if (err || typeof result !== 'string') resolve(null);
          else resolve(result);
        },
      );
    });

    if (!selector) return null;

    await cdp('DOM.enable');

    // Get the document root
    const { root } = await cdp('DOM.getDocument', { depth: 0 }) as { root: { nodeId: number } };
    if (!root?.nodeId) return null;

    // Resolve the selector to a CDP nodeId
    const { nodeId } = await cdp('DOM.querySelector', {
      nodeId: root.nodeId,
      selector,
    }) as { nodeId: number };

    if (!nodeId) return null;

    cachedNodeId = nodeId;
    return nodeId;
  } catch (e) {
    console.error('[elementResolver] Failed to resolve nodeId:', e);
    return null;
  }
}

/** Get the last resolved nodeId without a new CDP round-trip. */
export function getCachedNodeId(): number | null {
  return cachedNodeId;
}

/** Clear the cached nodeId (e.g., on navigation). */
export function clearCachedNodeId(): void {
  cachedNodeId = null;
}
