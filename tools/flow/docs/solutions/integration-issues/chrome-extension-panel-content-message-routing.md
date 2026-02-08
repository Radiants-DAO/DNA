---
title: Chrome Extension Panel-to-Content Message Routing
category: integration-issues
date: 2026-02-05
tags: [chrome-extension, devtools-panel, content-script, message-passing, port-management, mutation-engine, wxt]
---

# Chrome Extension Panel-to-Content Message Routing

## Symptom

DevTools panel commands (inspect, search, style mutations) appeared to send successfully but produced no effect on the page. Console showed no errors. The panel UI updated as if actions completed, but:

- Search results returned empty
- Designer style edits didn't apply
- Inspection from SearchPanel didn't update the inspector

## Investigation

1. **Checked message sending** — `sendToContent()` was being called with correct payloads
2. **Checked background script** — Messages arrived at background but weren't forwarded
3. **Found dual port issue** — Panel.tsx and contentBridge.ts both created `flow-panel` ports; background only stored one per tab
4. **Found missing content router** — Content script only handled `mutation:*` messages, not `panel:*`
5. **Found element registration gap** — `panel:inspect` found elements but didn't register them with mutation engine

## Root Cause

Five interconnected issues:

1. **Dual port creation**: Both `initContentBridge()` and `Panel.tsx` created separate `chrome.runtime.connect()` ports with the same name. Background's `portMap.set(tabId, port)` overwrote the first, so responses went to the wrong listener.

2. **Missing content router**: Content script's message handler only processed `mutation:*` commands. All `panel:*` messages (inspect, search, accessibility, etc.) were silently dropped.

3. **Inspection result type mismatch**: Content returned `{ type: 'inspection:result' }` but Panel listened for `flow:content:inspection-result`.

4. **Element not registered for mutations**: Alt+click registered elements in `elementRefMap`, but `panel:inspect` (from SearchPanel) didn't. `applyStyleMutation()` returned null because element wasn't in the map.

5. **Selection/inspection divergence**: When inspection result arrived, existing `selectedElement` wasn't updated, causing edits to target the previous element.

## Solution

### 1. Unify port creation

```typescript
// contentBridge.ts
export function initContentBridge(inspectedTabId: number): chrome.runtime.Port {
  tabId = inspectedTabId;
  connectPort();
  return port!;
}

// Panel.tsx - use returned port instead of creating another
const port = initContentBridge(tabId);
portRef.current = port;
// Don't create: chrome.runtime.connect({ name: FLOW_PANEL_PORT_NAME })
```

### 2. Create content-side panel router

```typescript
// packages/extension/src/content/panelRouter.ts
export async function handlePanelMessage(message: PanelMessage): Promise<PanelResponse | void> {
  switch (message.type) {
    case 'panel:inspect':
      return handleInspect(message.payload.selector);
    case 'panel:search':
      return handleSearch(message.payload.query, message.payload.mode);
    case 'panel:accessibility':
      return handleAccessibility(message.payload.selector);
    // ... 12 more handlers
  }
}
```

### 3. Fix inspection result type

```typescript
// panelRouter.ts - handleInspect
return {
  type: 'flow:content:inspection-result',  // Match what Panel listens for
  tabId: 0,
  result,
  elementRef: 'selected',
};
```

### 4. Register element with mutation engine

```typescript
// panelRouter.ts
import { registerElement } from './mutations/mutationEngine';

async function handleInspect(selector: string) {
  const element = document.querySelector(selector);
  if (!element) return;

  // Register so mutations can find it
  registerElement('selected', element as HTMLElement);

  const result = await inspectElement(element);
  return { type: 'flow:content:inspection-result', result, elementRef: 'selected' };
}
```

### 5. Sync selection with inspection (preserving metadata)

```typescript
// Panel.tsx
case 'flow:content:inspection-result':
  setInspectionResult(msg.result);
  setSelectedElement((prev) => {
    // If same element, keep rich metadata from element:selected
    if (prev && prev.selector === msg.result.selector) {
      return msg.elementRef ? { ...prev, elementRef: msg.elementRef } : prev;
    }
    // New element - create minimal selection
    return {
      elementRef: msg.elementRef || 'selected',
      selector: msg.result.selector,
      tagName: msg.result.tagName,
      // ... other fields
    };
  });
```

### 6. Track listeners for reconnection

```typescript
// contentBridge.ts
const messageListeners = new Set<(msg: unknown) => void>();

function connectPort(): void {
  port = chrome.runtime.connect({ name: FLOW_PANEL_PORT_NAME });

  // Reattach all listeners after reconnect
  for (const listener of messageListeners) {
    port.onMessage.addListener(listener);
  }

  port.onDisconnect.addListener(() => {
    port = null;
    setTimeout(connectPort, 1000);
  });
}

export function onContentMessage(callback: (msg: unknown) => void) {
  const listener = (msg: unknown) => callback(msg);
  messageListeners.add(listener);
  if (port) port.onMessage.addListener(listener);
  return () => {
    messageListeners.delete(listener);
    if (port) port.onMessage.removeListener(listener);
  };
}
```

## Prevention

1. **Single port ownership**: One module owns port creation; others import and use it
2. **Type-safe message contracts**: Use discriminated unions in `@flow/shared/messages.ts` with type guards
3. **Integration tests**: `mutationFlow.test.ts` tests full Panel → Background → Content → Response flow
4. **Consistent naming**: Message types should match exactly between sender and receiver (no `inspection:result` vs `flow:content:inspection-result` drift)

## Message Flow Diagram

```
Panel (DevTools)
  │
  ├─ initContentBridge(tabId) ──► returns shared port
  │
  └─ sendToContent({ type: 'panel:*' })
       │
       ▼ flow-panel port
Background (Service Worker)
  │
  └─ contentPorts.get(tabId).postMessage()
       │
       ▼
Content Script
  │
  └─ panelRouter.handlePanelMessage()
       │
       ├─ Registers element with mutationEngine
       ├─ Executes feature handler
       │
       ▼ response
Background
  │
  └─ panelPorts.get(tabId).postMessage()
       │
       ▼
Panel
  │
  └─ onContentMessage() callback
       │
       └─ Updates inspectionResult + selectedElement
```

## Related

- `packages/extension/src/content/panelRouter.ts` — Full router implementation
- `packages/extension/src/panel/api/contentBridge.ts` — Port management
- `packages/shared/src/messages.ts` — Message type definitions
- `packages/extension/src/__tests__/integration/mutationFlow.test.ts` — Integration test
