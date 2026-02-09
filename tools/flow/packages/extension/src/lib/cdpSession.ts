/**
 * CDP session manager. Lives in the background service worker.
 * Attaches LAZILY on first CDP call — no debugger bar until a feature needs it.
 * Reuses sessions across features, cleans up on tab close.
 */
const sessions = new Map<number, { domains: Set<string> }>();

// Register cleanup listener ONCE at module level (not per-attach, avoids listener leak)
chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId) sessions.delete(source.tabId);
});

export async function ensureCDP(tabId: number): Promise<void> {
  if (sessions.has(tabId)) return;
  await chrome.debugger.attach({ tabId }, '1.3');
  sessions.set(tabId, { domains: new Set() });
}

export async function enableDomain(tabId: number, domain: string): Promise<void> {
  await ensureCDP(tabId);
  const session = sessions.get(tabId)!;
  if (session.domains.has(domain)) return;
  await chrome.debugger.sendCommand({ tabId }, `${domain}.enable`);
  session.domains.add(domain);
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
