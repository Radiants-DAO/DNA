import { cdp } from './cdpBridge';
import { resolveSelectedNodeId } from './elementResolver';

/** Chrome DevTools-style box model highlight colors. */
const HIGHLIGHT_CONFIG = {
  showInfo: true,
  contentColor: { r: 111, g: 168, b: 220, a: 0.66 },
  paddingColor: { r: 147, g: 196, b: 125, a: 0.55 },
  borderColor: { r: 255, g: 229, b: 153, a: 0.66 },
  marginColor: { r: 246, g: 178, b: 107, a: 0.66 },
};

/**
 * Highlight an element by CSS selector via CDP Overlay.
 * Used for hover highlighting (panel list items → page element).
 * Best-effort: fails silently if selector doesn't match.
 */
export async function highlightBySelector(selector: string): Promise<void> {
  try {
    await cdp('DOM.enable');
    await cdp('Overlay.enable');

    const { root } = await cdp('DOM.getDocument', { depth: 0 }) as {
      root: { nodeId: number };
    };
    const { nodeId } = await cdp('DOM.querySelector', {
      nodeId: root.nodeId,
      selector,
    }) as { nodeId: number };

    if (!nodeId) return;

    await cdp('Overlay.highlightNode', {
      highlightConfig: HIGHLIGHT_CONFIG,
      nodeId,
    });
  } catch {
    // Fail silently — hover highlighting is best-effort
  }
}

/**
 * Highlight the currently selected element via CDP Overlay.
 * Uses the resolved CDP nodeId (no selector needed).
 */
export async function highlightSelected(): Promise<void> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return;

  try {
    await cdp('Overlay.enable');
    await cdp('Overlay.highlightNode', {
      highlightConfig: HIGHLIGHT_CONFIG,
      nodeId,
    });
  } catch {
    // Fail silently
  }
}

/** Clear all highlights from the page. */
export async function clearHighlight(): Promise<void> {
  try {
    await cdp('Overlay.hideHighlight');
  } catch {
    // Fail silently
  }
}
