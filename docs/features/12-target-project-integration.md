# Target Project Integration

## Overview

RadFlow must load and interact with the target project's actual pages - not just its own UI. This is the fundamental architecture that enables all editing tools to work.

**Reference:** Cursor's Design Sidebar - visual editing with immediate preview and code generation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  RadFlow App (Tauri)                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  RadFlow Chrome (toolbars, panels, mode indicators)    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Target Project Iframe                                 │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  localhost:3000 (target's dev server)            │  │ │
│  │  │  + Injected RadFlow hooks (component detection)  │  │ │
│  │  │  + Injected style overrides (live preview)       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Scope

**MVP Target:** RadFlow theme packages only
- theme-rad-os
- theme-phase
- Similar structure: Next.js/Vite + Tailwind v4 + CSS custom properties

General React project support is future scope.

---

## Core Components

### 1. Dev Server Management

**Detection:**
- Read `package.json` scripts for dev command
- Detect framework (Next.js → port 3000, Vite → port 5173)
- Check if server already running on expected port

**Lifecycle:**
- Start dev server if not running
- Track PID for cleanup
- Graceful shutdown on app close
- Reconnect if server restarts

**Commands (Rust):**
```rust
start_dev_server(project_path) -> Result<DevServerInfo>
stop_dev_server() -> Result<()>
get_dev_server_status() -> DevServerStatus
detect_framework(project_path) -> FrameworkInfo
```

### 2. Target Project Iframe

**Implementation:**
- HTML iframe element loading `localhost:{port}`
- Positioned below RadFlow chrome (toolbars)
- Resizable for responsive preview
- Isolation from RadFlow's React instance

**Considerations:**
- Same-origin policy (localhost to localhost is OK)
- iframe sandbox attributes for security
- Handle iframe load errors gracefully

### 3. React Hook Injection

**Purpose:** Correlate DOM elements to React components for Component ID Mode.

**Mechanism:**
```javascript
// Inject before React loads in target project
window.__RADFLOW_HOOK__ = {
  componentMap: new Map(), // elementId -> ComponentInfo
  nextId: 0,
};

// Hook into React DevTools global hook
const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
hook.onCommitFiberRoot = (rendererID, root) => {
  walkFiberTree(root.current, (fiber, domNode) => {
    if (domNode && fiber.type?.name) {
      const id = `radflow-${window.__RADFLOW_HOOK__.nextId++}`;
      domNode.setAttribute('data-radflow-id', id);
      window.__RADFLOW_HOOK__.componentMap.set(id, {
        name: fiber.type.displayName || fiber.type.name,
        // file:line comes from matching to SWC index
      });
    }
  });
};
```

**Injection Method:**
- RadFlow ships `@radflow/bridge` inside the app bundle (DMG)
- On first project open, copy to `.radflow/bridge/` and install via `pnpm add -D "file:.radflow/bridge"`
- `withRadflow()` config wrapper (like `@next/bundle-analyzer`) injects script
- Add `.radflow/` to `.gitignore` for clean commits

**DevTools Collision Handling:**
- If `__REACT_DEVTOOLS_GLOBAL_HOOK__` exists, chain (don't replace) callbacks
- Log warning in RadFlow UI when browser DevTools detected
- Document: "Disable browser React DevTools for best experience"

### 4. Component Detection Bridge

**Communication:** postMessage between RadFlow and iframe

**From iframe to RadFlow:**
```javascript
// When user hovers/clicks in iframe
window.parent.postMessage({
  type: 'radflow:hover',
  elementId: 'radflow-42',
  componentName: 'Button',
  rect: { x, y, width, height }
}, '*');
```

**From RadFlow to iframe:**
```javascript
// Inject style override for live preview
iframe.contentWindow.postMessage({
  type: 'radflow:inject-style',
  elementId: 'radflow-42',
  styles: { backgroundColor: 'var(--color-primary)' }
}, '*');
```

### 5. Live Preview (Style Injection)

**Flow:**
1. User changes property in panel
2. RadFlow sends style injection message to iframe
3. Iframe applies inline style immediately
4. User sees instant visual feedback

**Implementation in iframe:**
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'radflow:inject-style') {
    const element = document.querySelector(
      `[data-radflow-id="${event.data.elementId}"]`
    );
    if (element) {
      Object.assign(element.style, event.data.styles);
    }
  }
});
```

### 6. Clipboard Accumulation

**Same pattern as Text Edit Mode:**
- Each visual change adds to pending changes buffer
- Buffer shows count in UI
- Escape or "Copy All" copies accumulated changes
- Toggle mode: write directly to files on change

**Change Format:**
```
// Button @ components/Button.tsx:42
style={{ backgroundColor: 'var(--color-primary)' }}

// Card @ components/Card.tsx:15
style={{ padding: '24px', borderRadius: '8px' }}
```

### 7. File Write (Save Mode)

**On Save:**
1. Read accumulated changes
2. For each change, find source location (from SWC index)
3. Write inline style to JSX
4. File watcher triggers hot reload
5. Iframe reloads with persisted changes

**Write Strategy:**
- Add/update `style` prop on JSX element
- Creates violation (inline style)
- User cleans up violations with AI later

---

## User Flow

### First Launch (Project Setup)

1. User opens RadFlow
2. Project Picker: select theme folder
3. First-run wizard:
   - Detect framework/dev command
   - Confirm port
   - Save preferences
4. Start dev server
5. Load iframe with target project

### Editing Flow

1. Press V → Component ID Mode
2. Hover element in iframe → tooltip shows component info
3. Click → select component, show in Layers panel
4. Open Colors panel → see token dropdown
5. Select new color → instant preview in iframe
6. Change accumulates in clipboard buffer
7. Cmd+S → write changes to files
8. Hot reload → see persisted changes
9. Later: "Fix Violations" → AI converts inline styles to proper patterns

---

## Tasks Breakdown

### fn-5.1: Iframe Shell
- Add iframe element to App layout
- Position below RadFlow chrome
- Handle resize for responsive preview
- Loading state UI

### fn-5.2: Dev Server Detection
- Read package.json scripts
- Detect framework (Next/Vite/CRA)
- Detect expected port
- Check if already running

### fn-5.3: Dev Server Management
- Rust commands to start/stop server
- Process management (spawn, track PID)
- Graceful shutdown on app close
- Status monitoring

### fn-5.4: Script Injection Setup (RadFlow Bridge Package)
- Bundle `@radflow/bridge` in RadFlow app
- Copy to `.radflow/bridge/` on first project open
- Install via `pnpm add -D "file:.radflow/bridge"`
- `withRadflow()` config wrapper for Next.js
- Add `.radflow/` to `.gitignore`

### fn-5.5: React Hook Implementation
- Hook into __REACT_DEVTOOLS_GLOBAL_HOOK__
- Walk fiber tree on commit
- Add data-radflow-id attributes
- Build componentMap

### fn-5.6: postMessage Bridge
- Message protocol definition
- Iframe → RadFlow: hover, click, select
- RadFlow → iframe: inject style, highlight
- Error handling

### fn-5.7: Component Detection Integration
- Connect iframe hover to Component ID Mode
- Match fiber component name to SWC index
- Display file:line in tooltip
- Update Layers panel

### fn-5.8: Style Injection
- Receive style changes from panels
- Send to iframe via postMessage
- Apply inline styles immediately
- Track injected styles for cleanup

### fn-5.9: Clipboard Accumulation for Visual Edits
- Extend existing clipboard pattern
- Accumulate style changes
- Format for copy (component @ file:line + style)
- UI showing pending count

### fn-5.10: File Write on Save
- Cmd+S triggers write
- Read accumulated changes
- Find JSX locations via SWC
- Write inline styles to files
- Clear accumulation buffer

### fn-5.11: First-Run Wizard
- Detect project settings
- Framework, port, dev command
- Save preferences per-project
- Skip on subsequent launches

### fn-5.12: Hot Reload Integration
- Ensure file write triggers rebuild
- Iframe reloads automatically
- Preserve scroll position if possible
- Handle reload errors

---

## Dependencies

- fn-2 complete (Page Editor MVP) ✅
- SWC parsing working ✅
- File watcher working ✅
- Zustand stores working ✅

---

## Technical Risks

1. **React DevTools hook availability** - May not exist in all builds
2. **iframe security restrictions** - Need same-origin (localhost)
3. **Hot reload timing** - File write to reload may have lag
4. **Component name matching** - Minified names in prod builds

**Mitigations:**
- Require dev mode for target projects
- Document localhost requirement
- Consider debouncing rapid changes
- Match by file:line when name fails

---

## Success Criteria

- [ ] Target project renders in iframe
- [ ] Dev server starts automatically
- [ ] Hovering elements shows correct component info
- [ ] Style changes preview instantly
- [ ] Changes accumulate in clipboard
- [ ] Save writes to correct files
- [ ] Hot reload shows persisted changes
