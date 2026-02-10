/**
 * CDP session manager. Lives in the background service worker.
 * Attaches LAZILY on first CDP call — no debugger bar until a feature needs it.
 * Reuses sessions across features, cleans up on tab close.
 */
const sessions = new Map<number, { domains: Set<string> }>();
const pending = new Map<number, Promise<void>>();

// Register cleanup listener ONCE at module level (not per-attach, avoids listener leak)
chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId) sessions.delete(source.tabId);
});

export async function ensureCDP(tabId: number): Promise<void> {
  if (sessions.has(tabId)) return;
  if (pending.has(tabId)) return pending.get(tabId);

  const p = chrome.debugger.attach({ tabId }, '1.3').then(() => {
    sessions.set(tabId, { domains: new Set() });
    pending.delete(tabId);
  }).catch((err) => {
    pending.delete(tabId);
    throw err;
  });

  pending.set(tabId, p);
  return p;
}

export function resetDomains(tabId: number): void {
  const session = sessions.get(tabId);
  if (session) session.domains.clear();
}

export async function cdpCommand(tabId: number, method: string, params?: object): Promise<unknown> {
  await ensureCDP(tabId);
  return chrome.debugger.sendCommand({ tabId }, method, params);
}

export async function detachCDP(tabId: number): Promise<void> {
  if (!sessions.has(tabId)) return;
  await chrome.debugger.detach({ tabId });
  sessions.delete(tabId);
}
