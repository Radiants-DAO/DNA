/**
 * Panel Router - Routes panel:* messages from the DevTools panel to content script features.
 *
 * Message flow:
 * 1. Panel sends panel:* messages on the flow-panel port
 * 2. Background script forwards to the content script's flow-content port
 * 3. This router handles the message and sends a response back
 * 4. Background broadcasts the response to all panel ports
 *
 * Note: panel:mutate-style and panel:text-edit are NOT handled here - they go through
 * the mutation port (flow-mutation) via useMutationBridge.applyStyle() and
 * the text edit handlers in mutationMessageHandler.
 */

import {
  type PanelToBackgroundMessage,
  type SearchResponse,
  type SearchResultItem,
  type AccessibilityResponse,
  type AccessibilityInfo,
  type ContrastInfo,
  type AccessibilityViolation,
  type ImagesResponse,
  type PageImage,
  type ImageSwapResponse,
  type ScreenshotResponse,
  type ContentInspectionResult,
} from '@flow/shared';
import { elementRegistry, generateSelector } from './elementRegistry';
import { inspectElement } from './inspector';
import { registerElement as registerMutationElement } from './mutations/mutationEngine';
import { queryPage, type SearchMode } from './features/search';
import { swapImageSrc } from './features/imageswap';
import {
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
} from './features/accessibility';
import { getSharedFeatureRegistry, type Feature } from './sharedRegistry';
import { ensureOverlayRoot, getOverlayShadow } from './overlays/overlayRoot';
import { addCommentBadge, removeCommentBadge, clearCommentBadges, repositionCommentBadges } from './commentBadges';

// ─── Types ───

/** Response wrapper for panel messages */
type PanelResponse =
  | SearchResponse
  | AccessibilityResponse
  | ImagesResponse
  | ImageSwapResponse
  | ScreenshotResponse
  | ContentInspectionResult
  | ComponentMapResponse
  | FeatureResponse
  | CommentResponse
  | PongResponse
  | StylesInjectedResponse
  | StylesClearedResponse
  | void;

interface PongResponse {
  type: 'content:pong';
}

interface StylesInjectedResponse {
  type: 'styles:injected';
  payload: { success: boolean };
}

interface StylesClearedResponse {
  type: 'styles:cleared';
  payload: { success: boolean };
}


interface ComponentMapResponse {
  type: 'component-map:result';
  payload: {
    components: Array<{
      radflowId: string;
      selector: string;
      componentName: string | null;
    }>;
  };
}

interface FeatureResponse {
  type: 'feature:result';
  payload: {
    featureId: string;
    action: 'activate' | 'deactivate';
    success: boolean;
  };
}

interface CommentResponse {
  type: 'comment:result';
  payload: {
    id: string;
    success: boolean;
  };
}

// ─── State ───

let port: chrome.runtime.Port | null = null;
let highlightElement: HTMLElement | null = null;
let injectedStyleElement: HTMLStyleElement | null = null;

// ─── Highlight Utilities ───

function createHighlightOverlay(): HTMLElement {
  const shadow = getOverlayShadow() ?? ensureOverlayRoot();
  const el = document.createElement('div');
  el.className = 'panel-highlight';
  el.style.cssText = `
    position: fixed;
    border: 2px solid #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    border-radius: 4px;
    pointer-events: none;
    z-index: 2147483647;
    display: none;
  `;
  shadow.appendChild(el);
  return el;
}

function showHighlight(element: Element): void {
  if (!highlightElement) {
    highlightElement = createHighlightOverlay();
  }

  const rect = element.getBoundingClientRect();
  highlightElement.style.top = `${rect.top}px`;
  highlightElement.style.left = `${rect.left}px`;
  highlightElement.style.width = `${rect.width}px`;
  highlightElement.style.height = `${rect.height}px`;
  highlightElement.style.display = 'block';
}

function clearHighlight(): void {
  if (highlightElement) {
    highlightElement.style.display = 'none';
  }
}

// ─── Message Handlers ───

async function handleInspect(
  selector: string
): Promise<ContentInspectionResult | void> {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn('[panelRouter] Element not found:', selector);
    return;
  }

  // Register element with mutation engine so designer edits can apply
  // Use 'selected' as the ref to match the Alt+click flow
  registerMutationElement('selected', element as HTMLElement);

  const result = await inspectElement(element);
  return {
    type: 'flow:content:inspection-result',
    tabId: 0, // Background script routes by port, not tabId
    result,
    elementRef: 'selected',
  };
}

async function handleSearch(
  query: string,
  mode: string
): Promise<SearchResponse> {
  // Validate and cast mode to SearchMode, defaulting to 'selector'
  const searchMode: SearchMode =
    mode === 'text' || mode === 'fuzzy' || mode === 'attribute' ? mode : 'selector';

  const elements = await queryPage(query, searchMode);
  const results: SearchResultItem[] = elements.slice(0, 100).map((el, i) => {
    const index = elementRegistry.register(el);
    const attrs: Record<string, string> = {};
    for (const attr of el.attributes) {
      attrs[attr.name] = attr.value;
    }

    return {
      index,
      selector: generateSelector(el),
      tagName: el.tagName.toLowerCase(),
      id: el.id,
      classList: [...el.classList],
      textPreview: (el.textContent?.trim() ?? '').slice(0, 80),
      attributes: attrs,
    };
  });

  return {
    type: 'search:results',
    payload: {
      query,
      results,
      count: elements.length,
    },
  };
}

function handleAccessibility(selector: string): AccessibilityResponse {
  const element = document.querySelector(selector);
  if (!element) {
    return {
      type: 'accessibility:result',
      payload: {
        info: {
          role: null,
          ariaLabel: null,
          ariaDescribedBy: null,
          ariaLabelledBy: null,
          ariaHidden: false,
          tabIndex: null,
          isInteractive: false,
          hasFocusIndicator: false,
        },
        contrast: null,
        violations: [],
      },
    };
  }

  const computedStyle = getComputedStyle(element);
  const info: AccessibilityInfo = {
    role: element.getAttribute('role'),
    ariaLabel: element.getAttribute('aria-label'),
    ariaDescribedBy: element.getAttribute('aria-describedby'),
    ariaLabelledBy: element.getAttribute('aria-labelledby'),
    ariaHidden: element.getAttribute('aria-hidden') === 'true',
    tabIndex: element.hasAttribute('tabindex')
      ? parseInt(element.getAttribute('tabindex') ?? '0', 10)
      : null,
    isInteractive: isInteractiveElement(element),
    hasFocusIndicator: hasFocusStyles(element),
  };

  // Calculate contrast if element has text content
  let contrast: ContrastInfo | null = null;
  if (element.textContent?.trim()) {
    const fgColor = computedStyle.color;
    const bgColor = getEffectiveBackground(element);
    if (fgColor && bgColor) {
      try {
        const ratio = getContrastRatio(fgColor, bgColor);
        const fontSize = parseFloat(computedStyle.fontSize);
        const fontWeight = parseInt(computedStyle.fontWeight, 10);
        const largeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

        contrast = {
          foreground: fgColor,
          background: bgColor,
          ratio,
          passesAA: meetsWcagAA(fgColor, bgColor, largeText),
          passesAAA: meetsWcagAAA(fgColor, bgColor, largeText),
          largeText,
        };
      } catch {
        // Color parsing failed
      }
    }
  }

  // Check for common violations
  const violations = checkAccessibilityViolations(element, info, contrast);

  return {
    type: 'accessibility:result',
    payload: {
      info,
      contrast,
      violations,
    },
  };
}

function handleScanImages(): ImagesResponse {
  const images = document.querySelectorAll('img');
  const pageImages: PageImage[] = [];

  images.forEach((img, i) => {
    const index = elementRegistry.register(img);
    pageImages.push({
      index,
      selector: generateSelector(img),
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  });

  return {
    type: 'images:list',
    payload: {
      images: pageImages,
    },
  };
}

function handleSwapImage(selector: string, newSrc: string): ImageSwapResponse {
  const img = document.querySelector(selector) as HTMLImageElement | null;
  if (!img || img.tagName !== 'IMG') {
    return {
      type: 'imageswap:result',
      payload: {
        success: false,
        imageIndex: -1,
        oldSrc: '',
        newSrc,
      },
    };
  }

  const index = elementRegistry.getId(img) ?? elementRegistry.register(img);
  const { oldSrc } = swapImageSrc(img, newSrc);

  return {
    type: 'imageswap:result',
    payload: {
      success: true,
      imageIndex: index,
      oldSrc,
      newSrc,
    },
  };
}

// TODO: Stub — ScreenshotPanel still sends panel:screenshot here. Wire panel to screenshotService.ts (CDP) then remove.
async function handleScreenshot(
  mode: string,
  selector?: string
): Promise<ScreenshotResponse> {
  // Screenshots require background script coordination via chrome.tabs.captureVisibleTab
  // For now, return an error - this will be implemented via background messaging
  return {
    type: 'screenshot:result',
    payload: {
      success: false,
      dataUrl: '',
      width: 0,
      height: 0,
      error: 'Screenshot capture requires background script coordination',
    },
  };
}

function handleHighlight(radflowId: string): void {
  // Find element by data-radflow-id or by elementRegistry index
  let element: Element | null = document.querySelector(
    `[data-radflow-id="${radflowId}"]`
  );

  if (!element) {
    // Try parsing as numeric index
    const index = parseInt(radflowId, 10);
    if (!isNaN(index)) {
      element = elementRegistry.getElement(index) ?? null;
    }
  }

  if (element) {
    showHighlight(element);
  }
}

function handleClearHighlight(): void {
  clearHighlight();
}

// TODO: Dead code — no panel code sends panel:get-component-map (useBridgeConnection is unused). Remove when confirmed safe.
function handleGetComponentMap(): ComponentMapResponse {
  // Find all elements with data-radflow-id attribute
  const elements = document.querySelectorAll('[data-radflow-id]');
  const components: ComponentMapResponse['payload']['components'] = [];

  elements.forEach((el) => {
    const radflowId = el.getAttribute('data-radflow-id');
    if (radflowId) {
      components.push({
        radflowId,
        selector: generateSelector(el),
        componentName: el.getAttribute('data-component-name'),
      });
    }
  });

  return {
    type: 'component-map:result',
    payload: {
      components,
    },
  };
}

function handleFeature(featureId: string, action: 'activate' | 'deactivate'): FeatureResponse {
  const registry = getSharedFeatureRegistry();
  let success = false;

  if (action === 'activate') {
    success = registry.activate(featureId);
  } else {
    registry.deactivate();
    success = true;
  }

  return {
    type: 'feature:result',
    payload: {
      featureId,
      action,
      success,
    },
  };
}

function handleComment(payload: {
  id: string;
  type: string;
  selector: string;
  componentName: string;
  content: string;
}): CommentResponse {
  addCommentBadge({
    id: payload.id,
    selector: payload.selector,
    index: 0, // Will be recalculated during render
    type: payload.type as 'comment' | 'question',
    content: payload.content,
    componentName: payload.componentName,
  });

  return {
    type: 'comment:result',
    payload: {
      id: payload.id,
      success: true,
    },
  };
}

function handlePing(): PongResponse {
  return {
    type: 'content:pong',
  };
}

function handleInjectStyle(css: string): StylesInjectedResponse {
  try {
    // Remove existing injected styles
    if (injectedStyleElement) {
      injectedStyleElement.remove();
    }

    // Create new style element
    injectedStyleElement = document.createElement('style');
    injectedStyleElement.setAttribute('data-flow-injected', 'true');
    injectedStyleElement.textContent = css;
    document.head.appendChild(injectedStyleElement);

    return {
      type: 'styles:injected',
      payload: { success: true },
    };
  } catch (error) {
    console.error('[panelRouter] Failed to inject styles:', error);
    return {
      type: 'styles:injected',
      payload: { success: false },
    };
  }
}

function handleClearStyles(): StylesClearedResponse {
  try {
    if (injectedStyleElement) {
      injectedStyleElement.remove();
      injectedStyleElement = null;
    }

    // Also remove any orphaned flow-injected styles
    const orphanedStyles = document.querySelectorAll('style[data-flow-injected]');
    orphanedStyles.forEach((el) => el.remove());

    return {
      type: 'styles:cleared',
      payload: { success: true },
    };
  } catch (error) {
    console.error('[panelRouter] Failed to clear styles:', error);
    return {
      type: 'styles:cleared',
      payload: { success: false },
    };
  }
}

// ─── Helper Functions ───

function isInteractiveElement(element: Element): boolean {
  const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (interactiveTags.includes(element.tagName)) return true;

  const role = element.getAttribute('role');
  const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'textbox', 'menuitem'];
  if (role && interactiveRoles.includes(role)) return true;

  if (element.hasAttribute('tabindex')) {
    const tabIndex = parseInt(element.getAttribute('tabindex') ?? '-1', 10);
    return tabIndex >= 0;
  }

  return false;
}

function hasFocusStyles(element: Element): boolean {
  // Check if element has custom focus styles by comparing focus and non-focus states
  // This is a simplified check - a full implementation would need to actually focus the element
  const style = getComputedStyle(element);
  return (
    style.outlineStyle !== 'none' ||
    style.boxShadow !== 'none' ||
    element.matches(':focus-visible')
  );
}

function getEffectiveBackground(element: Element): string {
  let current: Element | null = element;
  while (current) {
    const style = getComputedStyle(current);
    const bg = style.backgroundColor;
    // Check if background is not transparent
    if (bg && !bg.includes('rgba(0, 0, 0, 0)') && bg !== 'transparent') {
      return bg;
    }
    current = current.parentElement;
  }
  return 'rgb(255, 255, 255)'; // Default to white
}

function checkAccessibilityViolations(
  element: Element,
  info: AccessibilityInfo,
  contrast: ContrastInfo | null
): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];

  // Check contrast
  if (contrast && !contrast.passesAA) {
    violations.push({
      id: 'color-contrast',
      severity: 'error',
      message: `Insufficient color contrast ratio: ${contrast.ratio.toFixed(2)}:1 (minimum ${contrast.largeText ? '3' : '4.5'}:1 required)`,
      suggestion: 'Increase the contrast between text and background colors',
    });
  }

  // Check for missing alt text on images
  if (element.tagName === 'IMG' && !(element as HTMLImageElement).alt) {
    violations.push({
      id: 'img-alt',
      severity: 'error',
      message: 'Image is missing alt attribute',
      suggestion: 'Add descriptive alt text or alt="" for decorative images',
    });
  }

  // Check for buttons without accessible names
  if (
    (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') &&
    !info.ariaLabel &&
    !element.textContent?.trim()
  ) {
    violations.push({
      id: 'button-name',
      severity: 'error',
      message: 'Button has no accessible name',
      suggestion: 'Add text content or aria-label to the button',
    });
  }

  // Check for links without accessible names
  if (
    element.tagName === 'A' &&
    !info.ariaLabel &&
    !element.textContent?.trim()
  ) {
    violations.push({
      id: 'link-name',
      severity: 'error',
      message: 'Link has no accessible name',
      suggestion: 'Add text content or aria-label to the link',
    });
  }

  // Check for interactive elements without focus indicator
  if (info.isInteractive && !info.hasFocusIndicator) {
    violations.push({
      id: 'focus-indicator',
      severity: 'warning',
      message: 'Interactive element may lack visible focus indicator',
      suggestion: 'Ensure the element has visible focus styles',
    });
  }

  // Check for aria-hidden on interactive elements
  if (info.ariaHidden && info.isInteractive) {
    violations.push({
      id: 'aria-hidden-interactive',
      severity: 'error',
      message: 'Interactive element is hidden from assistive technology',
      suggestion: 'Remove aria-hidden or make element non-interactive',
    });
  }

  return violations;
}

// ─── Message Router ───

async function routeMessage(
  msg: PanelToBackgroundMessage
): Promise<PanelResponse> {
  switch (msg.type) {
    case 'panel:inspect':
      return handleInspect(msg.payload.selector);

    case 'panel:search':
      return handleSearch(msg.payload.query, msg.payload.mode);

    case 'panel:accessibility':
      return handleAccessibility(msg.payload.selector);

    case 'panel:scan-images':
      return handleScanImages();

    case 'panel:swap-image':
      return handleSwapImage(msg.payload.selector, msg.payload.newSrc);

    case 'panel:screenshot':
      return handleScreenshot(msg.payload.mode, msg.payload.selector);

    case 'panel:highlight':
      handleHighlight(msg.payload.radflowId);
      return;

    case 'panel:clear-highlight':
      handleClearHighlight();
      return;

    case 'panel:get-component-map':
      return handleGetComponentMap();

    case 'panel:feature':
      return handleFeature(msg.payload.featureId, msg.payload.action);

    case 'panel:comment':
      return handleComment(msg.payload);

    case 'panel:comment-remove':
      removeCommentBadge(msg.payload.id);
      return;

    case 'panel:comment-clear':
      clearCommentBadges();
      return;

    case 'panel:ping':
      return handlePing();

    case 'panel:inject-style':
      return handleInjectStyle(msg.payload.css);

    case 'panel:clear-styles':
      return handleClearStyles();

    // Note: panel:mutate-style and panel:text-edit are NOT handled here
    // Style mutations go through the mutation port via useMutationBridge.applyStyle()
    // Text edit goes through textEditMode via initMutationMessageHandler

    default:
      // Pass through to background script for other messages
      return;
  }
}

// ─── Port Setup ───

function onMessage(msg: PanelToBackgroundMessage): void {
  routeMessage(msg)
    .then((response) => {
      if (response && port) {
        port.postMessage(response);
      }
    })
    .catch((error) => {
      console.error('[panelRouter] Error handling message:', error);
    });
}

function onDisconnect(): void {
  port = null;
  clearHighlight();
  if (highlightElement) {
    highlightElement.remove();
    highlightElement = null;
  }
  // Clean up injected styles on disconnect
  if (injectedStyleElement) {
    injectedStyleElement.remove();
    injectedStyleElement = null;
  }
}

/**
 * Initialize the panel router.
 * Listens on the FLOW_PANEL_PORT_NAME port for panel:* messages.
 */
export function initPanelRouter(existingPort: chrome.runtime.Port): void {
  // Use the existing port from content.ts instead of creating a new connection
  // The background script routes panel messages to the content script
  port = existingPort;

  port.onMessage.addListener(onMessage as (msg: unknown) => void);
  port.onDisconnect.addListener(onDisconnect);

  // Reposition comment badges on scroll/resize
  window.addEventListener('scroll', () => repositionCommentBadges(), { passive: true });
  window.addEventListener('resize', () => repositionCommentBadges(), { passive: true });
}

/**
 * Register a feature with the shared feature registry.
 */
export function registerFeature(id: string, feature: Feature): void {
  getSharedFeatureRegistry().register(id, feature);
}

/**
 * Get the shared feature registry.
 */
export { getSharedFeatureRegistry as getPanelFeatureRegistry };
