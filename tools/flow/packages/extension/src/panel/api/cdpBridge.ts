/**
 * Send a CDP command from the panel through the background service worker.
 * Uses chrome.runtime.sendMessage (not ports) for one-shot request/response.
 *
 * This is separate from the port-based pipeline (sendToContent/onContentMessage)
 * which handles streaming events like hover, selection, and inspection results.
 * CDP commands are one-shot request/response — sendMessage is the right fit.
 */
export async function cdp(method: string, params?: object): Promise<any> {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  const response = await chrome.runtime.sendMessage({
    type: 'cdp:command',
    tabId,
    payload: { method, params },
  });
  if (response?.error) throw new Error(response.error);
  return response?.result;
}
