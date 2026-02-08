---
title: Port Reconnection Listener Tracking
category: integration-issues
date: 2026-02-05
tags: [chrome-extension, message-passing, service-worker, port-management, reconnection]
---

# Port Reconnection Listener Tracking

## Symptom

After Chrome's service worker restarted (due to inactivity timeout), the DevTools panel stopped receiving messages. Hover, selection, and inspection updates silently stopped working.

## Investigation

1. **Checked port lifecycle** — Port disconnected when service worker slept
2. **Checked reconnection** — `setTimeout(connectPort, 1000)` successfully reconnected
3. **Found listener loss** — New port had no message listeners attached

## Root Cause

`onContentMessage()` captured the port reference at subscription time:

```typescript
export function onContentMessage(callback: (msg: unknown) => void): () => void {
  const currentPort = port;  // Captured at subscription time
  if (!currentPort) return () => {};

  const listener = (msg: unknown) => callback(msg);
  currentPort.onMessage.addListener(listener);  // Only on THIS port

  return () => {
    currentPort.onMessage.removeListener(listener);
  };
}
```

When the port disconnected and reconnected, `port` was a new instance, but all listeners were attached to the old (disconnected) port.

## Solution

Track active listeners and reattach them on reconnection:

```typescript
// packages/extension/src/panel/api/contentBridge.ts

const messageListeners = new Set<(msg: unknown) => void>();

function connectPort(): void {
  if (!tabId) return;
  port = chrome.runtime.connect({ name: FLOW_PANEL_PORT_NAME });
  port.postMessage({ type: "panel:init", payload: { tabId } });

  // Reattach all tracked listeners to the new port
  for (const listener of messageListeners) {
    port.onMessage.addListener(listener);
  }

  port.onDisconnect.addListener(() => {
    port = null;
    setTimeout(connectPort, 1000);  // Reconnect after delay
  });
}

export function onContentMessage(callback: (msg: unknown) => void): () => void {
  const listener = (msg: unknown) => callback(msg);
  messageListeners.add(listener);

  // Attach to current port if connected
  if (port) {
    port.onMessage.addListener(listener);
  }

  return () => {
    messageListeners.delete(listener);
    if (port) {
      port.onMessage.removeListener(listener);
    }
  };
}

export function disconnectContentBridge(): void {
  messageListeners.clear();  // Clean up on explicit disconnect
  if (port) {
    port.disconnect();
    port = null;
  }
}
```

Also ensure Panel.tsx uses `onContentMessage()` instead of direct port listener:

```typescript
// Panel.tsx
const unsubscribe = onContentMessage((msg) => {
  if (!isBackgroundToPanelMessage(msg)) return;
  // ... handle message
});

return () => {
  unsubscribe();
  disconnectContentBridge();
};
```

## Prevention

1. **Use the abstraction**: Always use `onContentMessage()`, never `port.onMessage.addListener()` directly
2. **Track subscriptions**: Maintain a Set of active listeners for reattachment
3. **Test reconnection**: Integration tests should simulate service worker restart

## Related

- `packages/extension/src/panel/api/contentBridge.ts` — Port management implementation
- `packages/extension/src/entrypoints/panel/Panel.tsx` — Consumer using `onContentMessage()`
- Chrome MV3 documentation on service worker lifecycle
