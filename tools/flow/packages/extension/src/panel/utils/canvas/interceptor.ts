/**
 * Canvas Event Interceptor
 *
 * Ported from Flow 0 with adaptations for the extension:
 * - Prevents form submission in design mode
 * - Intercepts link clicks
 * - Prevents input focus in design mode
 * - Allows through in preview mode
 *
 * This module provides utilities for intercepting and preventing default
 * browser behaviors that would interfere with the design experience.
 */

export type InterceptorMode = "design" | "preview";

/**
 * Elements that should have focus prevented in design mode.
 */
const FOCUSABLE_SELECTORS = [
  "input",
  "textarea",
  "select",
  "button[type='submit']",
  "[contenteditable]",
].join(",");

/**
 * Check if an element is a link that should be intercepted.
 */
function isNavigationLink(element: Element): element is HTMLAnchorElement {
  return (
    element.tagName === "A" &&
    element.hasAttribute("href") &&
    !element.getAttribute("href")?.startsWith("#")
  );
}

/**
 * Check if an element is a form element that should have focus prevented.
 */
function isFocusableFormElement(element: Element): boolean {
  return element.matches(FOCUSABLE_SELECTORS);
}

/**
 * Event handler for click events - intercepts links in design mode.
 */
function handleClick(event: MouseEvent, mode: InterceptorMode): void {
  if (mode === "preview") return;

  const target = event.target;
  if (!target || !(target instanceof Element)) return;

  // Find closest link element
  const link = target.closest("a");
  if (link && isNavigationLink(link)) {
    event.preventDefault();
    event.stopPropagation();
    console.debug("[Interceptor] Blocked navigation to:", link.href);
  }
}

/**
 * Event handler for submit events - prevents form submission in design mode.
 */
function handleSubmit(event: Event, mode: InterceptorMode): void {
  if (mode === "preview") return;

  event.preventDefault();
  event.stopPropagation();
  console.debug("[Interceptor] Blocked form submission");
}

/**
 * Event handler for focus events - prevents focus on form elements in design mode.
 */
function handleFocus(event: FocusEvent, mode: InterceptorMode): void {
  if (mode === "preview") return;

  const target = event.target;
  if (!target || !(target instanceof Element)) return;

  if (isFocusableFormElement(target)) {
    // Remove focus but don't prevent the event entirely
    // This allows selection to work while preventing editing
    (target as HTMLElement).blur?.();
    console.debug("[Interceptor] Blocked focus on:", target.tagName);
  }
}

/**
 * Event handler for keydown events - prevents text input in design mode.
 */
function handleKeyDown(event: KeyboardEvent, mode: InterceptorMode): void {
  if (mode === "preview") return;

  const target = event.target;
  if (!target || !(target instanceof Element)) return;

  // Allow certain keys even in design mode
  const allowedKeys = ["Escape", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (allowedKeys.includes(event.key)) return;

  // Block text input in form elements
  if (isFocusableFormElement(target)) {
    event.preventDefault();
    console.debug("[Interceptor] Blocked keydown in:", target.tagName);
  }
}

/**
 * Event handler for drag start - prevents dragging in design mode.
 */
function handleDragStart(event: DragEvent, mode: InterceptorMode): void {
  if (mode === "preview") return;

  // Prevent native drag behavior which can interfere with our custom interactions
  event.preventDefault();
}

/**
 * Create all event handlers bound to a specific mode.
 */
function createHandlers(mode: InterceptorMode) {
  return {
    click: (e: MouseEvent) => handleClick(e, mode),
    submit: (e: Event) => handleSubmit(e, mode),
    focusin: (e: FocusEvent) => handleFocus(e, mode),
    keydown: (e: KeyboardEvent) => handleKeyDown(e, mode),
    dragstart: (e: DragEvent) => handleDragStart(e, mode),
  };
}

/**
 * Interceptor instance for managing event interception on a document.
 */
export interface Interceptor {
  /** Current mode */
  mode: InterceptorMode;
  /** Update the mode (design/preview) */
  setMode: (mode: InterceptorMode) => void;
  /** Remove all event listeners and cleanup */
  destroy: () => void;
}

/**
 * Create an interceptor for a document.
 *
 * @param doc - The document to intercept events on (typically iframe.contentDocument)
 * @param initialMode - Initial mode (default: "design")
 * @returns Interceptor instance
 *
 * @example
 * ```ts
 * const interceptor = createInterceptor(iframe.contentDocument, "design");
 *
 * // Switch to preview mode
 * interceptor.setMode("preview");
 *
 * // Cleanup
 * interceptor.destroy();
 * ```
 */
export function createInterceptor(
  doc: Document,
  initialMode: InterceptorMode = "design"
): Interceptor {
  let currentMode = initialMode;
  let handlers = createHandlers(currentMode);

  // Add all event listeners
  const addListeners = () => {
    doc.addEventListener("click", handlers.click, { capture: true });
    doc.addEventListener("submit", handlers.submit, { capture: true });
    doc.addEventListener("focusin", handlers.focusin, { capture: true });
    doc.addEventListener("keydown", handlers.keydown, { capture: true });
    doc.addEventListener("dragstart", handlers.dragstart, { capture: true });
  };

  // Remove all event listeners
  const removeListeners = () => {
    doc.removeEventListener("click", handlers.click, { capture: true });
    doc.removeEventListener("submit", handlers.submit, { capture: true });
    doc.removeEventListener("focusin", handlers.focusin, { capture: true });
    doc.removeEventListener("keydown", handlers.keydown, { capture: true });
    doc.removeEventListener("dragstart", handlers.dragstart, { capture: true });
  };

  // Initialize listeners
  addListeners();

  return {
    get mode() {
      return currentMode;
    },

    setMode(mode: InterceptorMode) {
      if (mode === currentMode) return;

      // Remove old listeners
      removeListeners();

      // Update mode and handlers
      currentMode = mode;
      handlers = createHandlers(mode);

      // Add new listeners
      addListeners();

      console.debug("[Interceptor] Mode changed to:", mode);
    },

    destroy() {
      removeListeners();
      console.debug("[Interceptor] Destroyed");
    },
  };
}

/**
 * Apply pointer-events styles to prevent interaction in design mode.
 * This is an alternative approach using CSS instead of event interception.
 *
 * @param doc - The document to apply styles to
 * @param mode - Current mode
 */
export function applyPointerEventsStyle(doc: Document, mode: InterceptorMode): void {
  const styleId = "flow-interceptor-styles";
  let styleElement = doc.getElementById(styleId) as HTMLStyleElement | null;

  if (mode === "design") {
    // Add style to disable pointer events on interactive elements
    if (!styleElement) {
      styleElement = doc.createElement("style");
      styleElement.id = styleId;
      doc.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      /* Flow Design Mode - Disable interactions */
      a, button, input, textarea, select, [contenteditable] {
        pointer-events: none !important;
      }

      /* But allow our canvas tools to receive events */
      [data-flow-canvas-tool] {
        pointer-events: auto !important;
      }
    `;
  } else {
    // Remove the style in preview mode
    if (styleElement) {
      styleElement.remove();
    }
  }
}

export default createInterceptor;
