/**
 * Event Interception Overlay
 *
 * Creates a transparent full-viewport overlay inside a provided shadow root
 * that captures all mouse events when an active mode has interceptsEvents: true.
 * Clicks are routed to Flow's selection/tool logic instead of the page.
 *
 * The interceptor sits inside a shadow root whose host has pointer-events: none,
 * but the interceptor itself has pointer-events: auto, so it captures events.
 *
 * Because the interceptor lives in a shadow DOM, events on it do NOT propagate
 * to `document` listeners in the light DOM. Callers must pass event handlers
 * via the `handlers` option so they are attached directly to the interceptor.
 *
 * For deepElementFromPoint to "see through" the interceptor, callers should
 * temporarily set pointer-events: none on the interceptor element before
 * calling elementFromPoint, then restore it. Use getInterceptorElement()
 * to get the reference.
 */

let interceptorElement: HTMLDivElement | null = null

export interface InterceptorHandlers {
  onClick?: (e: MouseEvent) => void
  onMouseMove?: (e: MouseEvent) => void
  onMouseLeave?: () => void
}

/**
 * Enable event interception. Creates a full-viewport transparent overlay
 * that captures all mouse/pointer events inside the given shadow root.
 *
 * Event handlers must be provided here because shadow DOM prevents events
 * from reaching document-level listeners.
 */
export function enableEventInterception(
  shadowRoot: ShadowRoot,
  handlers?: InterceptorHandlers,
): void {
  if (interceptorElement) return

  interceptorElement = document.createElement('div')
  interceptorElement.setAttribute('data-flow-interceptor', 'true')
  interceptorElement.style.cssText = `
    position: fixed;
    inset: 0;
    cursor: crosshair;
    pointer-events: auto;
    z-index: 1;
  `

  if (handlers?.onClick) {
    interceptorElement.addEventListener('click', handlers.onClick)
  }
  if (handlers?.onMouseMove) {
    interceptorElement.addEventListener('mousemove', handlers.onMouseMove, { passive: true })
  }
  if (handlers?.onMouseLeave) {
    interceptorElement.addEventListener('mouseleave', handlers.onMouseLeave)
  }

  shadowRoot.appendChild(interceptorElement)
}

/**
 * Disable event interception. Removes the overlay so page events pass through.
 */
export function disableEventInterception(): void {
  if (interceptorElement) {
    interceptorElement.remove()
    interceptorElement = null
  }
}

/**
 * Get the interceptor element (for temporarily hiding it during elementFromPoint).
 */
export function getInterceptorElement(): HTMLDivElement | null {
  return interceptorElement
}
