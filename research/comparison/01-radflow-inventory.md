# RadFlow Current State Inventory

> Task: fn-3-46x.1 | Epic: Pencil vs RadFlow Architecture Comparison
> Generated: 2026-01-22

This document inventories RadFlow's current implementation state, cross-referencing vault documentation (canonical specs) with actual codebase files.

---

## BUILT (Working Features)

### 1. Page Builder (iframe + localhost preview)

**Vault Spec:** `02-Features/page-builder.md`
**Status:** Fully implemented

| Component | Codebase Location | Description |
|-----------|-------------------|-------------|
| iframe integration | `packages/bridge/src/message-bridge.ts` (326 lines) | Full postMessage protocol between Tauri host and target project |
| Dev server control | `src-tauri/src/commands/dev_server.rs` (346 lines) | Start/stop, port checking, log streaming, status detection |
| Health endpoint | `packages/bridge/src/installer.ts` | Installs `/_radflow/health` route |
| Next.js wrapper | `packages/bridge/src/next.config.wrapper.ts` | `withRadflow()` config wrapper |

**Implemented Features:**
- PING/PONG handshake with 2s timeout
- GET_COMPONENT_MAP, HIGHLIGHT, CLEAR_HIGHLIGHT messages
- INJECT_STYLE, CLEAR_STYLES for live preview
- Graceful origin validation and connection tracking
- Exponential backoff reconnection (500ms → 8s, max 5 attempts)
- External server detection (port already in use)

---

### 2. Bridge Package (postMessage + component detection)

**Vault Spec:** `02-Features/ai-integration.md` (Bridge Package section)
**Status:** Fully implemented, published as `@radflow/bridge`

| Component | Codebase Location | Description |
|-----------|-------------------|-------------|
| Fiber hook | `packages/bridge/src/fiber-hook.ts` (416 lines) | React DevTools hook interception |
| DOM annotator | `packages/bridge/src/dom-annotator.ts` (328 lines) | `data-radflow-id` attribute injection |
| Component map | `packages/bridge/src/component-map.ts` | In-memory RadflowId → ComponentEntry registry |
| Source resolver | `packages/bridge/src/source-resolver.ts` | File path resolution from fiber |
| Type definitions | `packages/bridge/src/types.ts` | Core interfaces |

**Implemented Features:**
- Chains with existing React DevTools (doesn't break them)
- Debounced fiber tree walking (100ms)
- Stable RadflowId generation via WeakMap
- Filters out node_modules components
- Parent/child hierarchy tracking
- Props sanitization (removes functions, React elements)
- MutationObserver for DOM changes
- Batched DOM operations via requestAnimationFrame

---

### 3. Token Parsing (lightningcss)

**Vault Spec:** `01-Architecture/system-overview.md` (Stack section)
**Status:** Fully implemented

| Component | Codebase Location | Description |
|-----------|-------------------|-------------|
| Token extraction | `src-tauri/src/commands/tokens.rs` (238 lines) | CSS parsing via lightningcss |
| Research POC | `research/pocs/lightningcss-poc/` | Proof-of-concept with fixtures |

**Implemented Features:**
- Tailwind v4 `@theme` and `@theme inline` block parsing
- Custom property extraction (CSS variables)
- Multiple value types: colors (RGB, RGBA, hex), lengths (px, rem, em), CSS functions
- Distinguishes public vs internal (inline) tokens
- HashMap output for frontend consumption
- Comprehensive test suite

---

### 4. File Watching

**Vault Spec:** `01-Architecture/system-overview.md` (Infrastructure)
**Status:** Fully implemented

| Component | Codebase Location | Description |
|-----------|-------------------|-------------|
| File watcher | `src-tauri/src/commands/watcher.rs` (213 lines) | notify v7 integration |
| Research POC | `research/pocs/notify-poc/` | Proof-of-concept |

**Implemented Features:**
- Watches .css and .tsx files
- Debouncing (100ms) to prevent rapid re-parsing
- Event types: Created, Modified, Removed
- Emits `file-changed` events to frontend
- Recursive directory watching
- Start/stop control with state management

---

### 5. TSX Parsing (SWC)

**Vault Spec:** `02-Features/component-canvas.md` (SWC Parsing section)
**Status:** Fully implemented (parser ready, canvas not built)

| Component | Codebase Location | Description |
|-----------|-------------------|-------------|
| TSX parser | `src-tauri/src/commands/components.rs` (695 lines) | SWC-based component scanning |
| Research POC | `research/pocs/swc-poc/` | Proof-of-concept |

**Implemented Features:**
- Function component detection
- Props interface extraction with types
- Union type detection (string literals → select controls)
- Control type inference: string→text, number→number, boolean→boolean, ReactNode→slot
- Line number tracking for source mapping
- Recursive directory scanning (skips node_modules)
- Comprehensive test suite

---

### 6. Clipboard Workflow

**Vault Spec:** `02-Features/ai-integration.md` (Context Building)
**Status:** Implemented via Comment Mode

| Component | Codebase Location | Description |
|-----------|-------------------|-------------|
| Markdown compilation | `src/stores/slices/commentSlice.ts` (223 lines) | Comments → clipboard format |
| Copy shortcut | `src/hooks/useKeyboardShortcuts.ts` | Shift+Cmd+C handler |

**Implemented Features:**
- Comments compile to markdown grouped by file
- Line numbers included for precise targeting
- Copy to clipboard for external AI tools
- Session-only persistence (cleared on close)

---

## PARTIAL (Started but Incomplete)

### 1. Comment Mode

**Vault Spec:** `02-Features/comment-mode.md`
**Status:** Core implemented, Clipboard Panel missing

| Component | Status | Codebase Location |
|-----------|--------|-------------------|
| Comment Mode overlay | DONE | `src/components/CommentMode.tsx` (899 lines) |
| Comment Popover | DONE | `src/components/CommentPopover.tsx` (220 lines) |
| Comment Badge | DONE | `src/components/CommentBadge.tsx` (112 lines) |
| Comment state | DONE | `src/stores/slices/commentSlice.ts` |
| Fiber source parsing | DONE | `src/utils/fiberSource.ts` (381 lines) |
| Dogfood Mode toggle | DONE | TitleBar component |
| Question Mode (Q key) | DONE | Purple variant for asking Claude |
| Multi-select (Shift+click) | DONE | Toggle selection support |
| **Clipboard Panel** | NOT STARTED | Left sidebar aggregation panel |
| **File watcher integration** | NOT STARTED | Auto-clear comments on file change |

**Implementation Notes:**
- Per vault spec, Clipboard Panel should show real-time prompt preview, comment list with delete buttons, Clear All, and pop-out capability
- File watcher should auto-clear comments when source files change
- These are the remaining items before Comment Mode is fully complete

---

### 2. Search (Fuzzy Matching)

**Vault Spec:** `01-Architecture/system-overview.md` lists "fuzzy-matcher (in-memory)"
**Status:** Research done, not integrated

| Component | Status | Location |
|-----------|--------|----------|
| Full-text search POC | Research only | `research/pocs/tantivy-poc/` |
| fuzzy-matcher integration | NOT FOUND | Not in codebase |

**Gap:** Vault spec mentions fuzzy-matcher for search, but no implementation found. Tantivy POC exists for full-text search but isn't integrated into the app.

---

### 3. Typography Editor

**Vault Spec:** `01-Architecture/system-overview.md` (Editor Panels)
**Status:** Unknown - needs verification

| Component | Status | Location |
|-----------|--------|----------|
| Typography panel | Unknown | Not found in exploration |

**Note:** Vault mentions "Variables Editor, Typography Editor, Assets Manager, Layers Panel" under Editor Panels. Implementation status unclear from codebase exploration.

---

### 4. Token Persistence

**Vault Spec:** `02-Features/page-builder.md` (Edit Accumulation & Save)
**Status:** Read-only implemented, write pending

| Component | Status | Location |
|-----------|--------|----------|
| Token reading | DONE | `tokens.rs` |
| Token writing | NOT IMPLEMENTED | Spec mentions preview diff + write to JSX |

**Gap:** Can read tokens from CSS, but the "Edit Accumulation & Save" workflow (queue edits → preview diff → write inline styles) is not implemented.

---

## PLANNED (Spec'd but Not Started)

### 1. Component Canvas (Shadow DOM Isolation)

**Vault Spec:** `02-Features/component-canvas.md`
**Status:** Not implemented

| Feature | Vault Status | Codebase Status |
|---------|--------------|-----------------|
| Shadow DOM isolation | PLANNED | Not found |
| Component discovery | PLANNED | TSX parsing ready (components.rs) |
| Mock States | PLANNED | Not found |
| Props playground | PLANNED | Not found |
| Live rendering | PLANNED | Not found |

**Vault Spec Notes:**
> "Build Order: Component Canvas should be built FIRST, then Page Builder. Current MVP has this reversed - Page Builder (iframe + localhost) is working, Canvas is not yet implemented."

**Key Distinction from Page Builder:**

| Component Canvas | Page Builder |
|------------------|--------------|
| No server required | localhost dev server |
| Instant preview | Full page context |
| Single component focus | Multi-component layout |
| Variant comparison | Real routing/navigation |
| Shadow DOM isolation | iframe isolation |

---

### 2. Direct Write Mode

**Vault Spec:** `02-Features/page-builder.md` (Edit Accumulation & Save)
**Status:** Post-MVP, not started

The spec describes a save workflow:
1. User changes property in panel
2. Change queued in pending edits store
3. Edit count shown in UI
4. On save (Cmd+S): Preview diff before write → Write inline styles to JSX

**Note:** Current philosophy is "clipboard-first" (context engineering), direct writes are future scope.

---

### 3. Asset Discovery

**Vault Spec:** Mentioned in system-overview as "Asset discovery"
**Status:** Not found in codebase

No implementation or POC found for asset (images, icons, fonts) discovery and management.

---

### 4. SREF Codes (Style References)

**Vault Spec:** `02-Features/ai-integration.md` (SREF Codes section)
**Status:** Explicitly marked as "Future Enhancement"

> "Status: Not yet implemented — placeholder for future AI integration."

---

### 5. Prompt Library

**Vault Spec:** `02-Features/ai-integration.md` (Prompt Library section)
**Status:** Not implemented

Spec describes organized prompts by category with YAML structure, but no implementation found.

---

## Architecture Summary

```
RadFlow Tauri Architecture (Current)
=====================================

┌─────────────────────────────────────────────────────┐
│                    RadFlow App                       │
├─────────────────────────────────────────────────────┤
│  React 19 Frontend                                   │
│  ├── Comment Mode [DONE]                            │
│  │   ├── CommentMode.tsx (overlay + detection)      │
│  │   ├── CommentPopover.tsx (input UI)              │
│  │   ├── CommentBadge.tsx (numbered badges)         │
│  │   └── fiberSource.ts (React fiber parsing)       │
│  ├── Page Builder [DONE]                            │
│  │   └── iframe + localhost preview                 │
│  ├── Editor Panels [PARTIAL]                        │
│  │   ├── Variables Editor [?]                       │
│  │   └── Typography Editor [?]                      │
│  ├── Clipboard Panel [NOT STARTED]                  │
│  └── Component Canvas [NOT STARTED]                 │
├─────────────────────────────────────────────────────┤
│  @radflow/bridge Package [DONE]                      │
│  ├── fiber-hook.ts (React DevTools integration)     │
│  ├── message-bridge.ts (postMessage protocol)       │
│  ├── dom-annotator.ts (data-radflow-id injection)   │
│  └── next.config.wrapper.ts (withRadflow())         │
├─────────────────────────────────────────────────────┤
│  Tauri Rust Backend                                  │
│  ├── tokens.rs [DONE] - lightningcss parsing        │
│  ├── components.rs [DONE] - SWC TSX parsing         │
│  ├── watcher.rs [DONE] - notify file watching       │
│  └── dev_server.rs [DONE] - server lifecycle        │
└─────────────────────────────────────────────────────┘
```

---

## Key Findings

### What's Strong
1. **Bridge package is production-ready** - Comprehensive fiber tracking, DOM annotation, message protocol
2. **Rust backend is solid** - Token parsing, TSX parsing, file watching all working
3. **Comment Mode core is complete** - Multi-select, fiber source extraction, markdown compilation
4. **Philosophy is clear** - "Context engineering, not direct writes" - clipboard-first approach

### What's Missing
1. **Clipboard Panel** - Critical for Comment Mode UX, not started
2. **Component Canvas** - The spec says this should have been built first
3. **Search** - Vault mentions fuzzy-matcher but no integration
4. **Token persistence** - Can read but not write

### Critical Priority (per vault spec)
**Comment Mode** is marked as `priority: critical` in the vault spec. The Clipboard Panel and file watcher integration should be completed to finish this feature.

---

## File Cross-Reference

| Vault Spec | Key Codebase Files |
|------------|-------------------|
| `system-overview.md` | `src-tauri/Cargo.toml`, `package.json` |
| `page-builder.md` | `packages/bridge/src/message-bridge.ts`, `dev_server.rs` |
| `component-canvas.md` | `src-tauri/src/commands/components.rs` (TSX parsing only) |
| `comment-mode.md` | `src/components/CommentMode.tsx`, `commentSlice.ts`, `fiberSource.ts` |
| `ai-integration.md` | `packages/bridge/src/*`, `commentSlice.ts` (markdown export) |

---

## Version Info

- **Vault docs date:** 2026-01-17 to 2026-01-20
- **lightningcss:** v1.0.0-alpha.68
- **SWC:** swc_ecma_parser v32, swc_common v18
- **notify:** v7
- **React:** 19
- **Tauri:** 2.0
