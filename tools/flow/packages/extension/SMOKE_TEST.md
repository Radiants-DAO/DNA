# Flow Extension — Phase 1 Smoke Test

## Prerequisites
- Chrome or Chromium-based browser (Arc, Brave, Edge, Vivaldi)
- Node.js 20+
- pnpm 9+

## Setup
1. `cd tools/flow && pnpm install`
2. `pnpm dev` (starts WXT dev server with HMR)
3. Open `chrome://extensions/`
4. Enable "Developer mode" toggle
5. Click "Load unpacked" and select `packages/extension/.output/chrome-mv3/`

## Tests

### 1. Extension loads
- [ ] Extension appears in chrome://extensions/ with no errors
- [ ] No red error badges on the extension card

### 2. Content script highlight overlay
- [ ] Open any page (e.g. https://example.com)
- [ ] Hover over elements — blue highlight box follows cursor
- [ ] Label shows tag name, id, and first 2 classes above the element
- [ ] Label repositions below element when near top of viewport
- [ ] Overlay disappears when mouse leaves the page
- [ ] Overlay does not block clicks or scrolling (pointer-events: none)

### 3. Element selection (Alt+Click)
- [ ] Alt+Click on an element — overlay stays on selected element
- [ ] `data-flow-index` attribute appears on the selected element (check in Elements panel)
- [ ] Alt+Click on a different element — previous selection is unregistered

### 4. Shadow DOM isolation
- [ ] Page styles do not bleed into the overlay
- [ ] Overlay renders above all page content including modals/popovers

### 5. DevTools panel
- [ ] Open DevTools (F12 or Cmd+Opt+I) — "Flow" tab exists
- [ ] Green dot and "connected" text visible
- [ ] Hover elements on the page — panel updates with tagName, id, classList, dimensions, text preview
- [ ] Alt+Click an element — "Selected Element" section appears with index and selector

### 6. Agent script global detection
- [ ] On a React app: "Detected Globals" section shows "React"
- [ ] On a Next.js app: shows "React" and "Next.js"
- [ ] On a plain HTML page: "Detected Globals" section is not shown

### 7. Disconnect and reconnect
- [ ] Close DevTools — overlay continues working on page (hover highlights still appear)
- [ ] Reopen DevTools — Flow tab reconnects, hover data resumes

### 8. Restricted pages (graceful failure)
- [ ] Navigate to chrome://settings — no errors in extension service worker console
- [ ] Navigate to chrome://extensions — no errors

## Message Chain Verification

The full message chain for hover events:
```
Agent (MAIN world)
  | window.postMessage + origin check + source check
Content Script (isolated world)
  | chrome.runtime.connect (FLOW_PORT_NAME)
Service Worker
  | port.postMessage (FLOW_PANEL_PORT_NAME)
DevTools Panel
```

To debug the chain, add `console.log` at each relay point:
- **Service worker console**: `chrome://extensions/` → Flow → "Inspect views: service worker"
- **Content script console**: page's DevTools console
- **Panel console**: right-click Flow panel → "Inspect"
