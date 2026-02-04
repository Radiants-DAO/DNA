/**
 * Build a screenshot request message for the background script.
 */
export function buildScreenshotRequest() {
  return {
    kind: 'screenshot:request' as const,
    timestamp: Date.now(),
  };
}
