/**
 * Send a CDP command from the panel through the background service worker.
 * Uses chrome.runtime.sendMessage (not ports) for one-shot request/response.
 *
 * This is separate from the port-based pipeline (sendToContent/onContentMessage)
 * which handles streaming events like hover, selection, and inspection results.
 * CDP commands are one-shot request/response — sendMessage is the right fit.
 *
 * All calls have a 5s timeout — if the background service worker is asleep,
 * chrome.debugger.attach hangs, or the page is restricted, callers get a
 * clean rejection instead of an infinite hang.
 */

const CDP_TIMEOUT_MS = 5000;

export async function cdp<T = unknown>(method: string, params?: object): Promise<T> {
  const tabId = chrome.devtools.inspectedWindow.tabId;

  const response = await Promise.race([
    chrome.runtime.sendMessage({
      type: 'cdp:command',
      tabId,
      payload: { method, params },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`CDP timeout (${CDP_TIMEOUT_MS}ms): ${method}`)), CDP_TIMEOUT_MS)
    ),
  ]);

  if (response?.error) throw new Error(response.error);
  return response?.result;
}
