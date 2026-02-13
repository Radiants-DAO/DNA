# RadFlow Roadmap: Follow-up Epic Specs

> Task: fn-3-46x.8 | Epic: Pencil vs RadFlow Architecture Comparison
> Generated: 2026-01-22
> Purpose: Candidate epics based on comparison findings (user decides which to create)

---

## Epic Priority Overview

| Priority | Epic | Status | Effort |
|----------|------|--------|--------|
| Critical | Complete Comment Mode | Existing | 2-3 weeks |
| High | Component Canvas (CSS scale()) | New | 3-4 weeks |
| High | Claude Code Skills Integration | New | 2 weeks |
| Medium | Streaming Edit Highlights | New | 1 week |
| Medium | Session Persistence | New | 1 week |
| Low | Vault Spec Updates | Doc only | 1 day |

---

## Epic: Complete Comment Mode

### Problem

Comment Mode is marked `priority: critical` in vault spec but Clipboard Panel is not implemented. Users can add comments but have no aggregated view or export workflow.

**Current State (from inventory):**
- Comment overlay: DONE
- Comment Popover: DONE
- Comment Badge: DONE
- Fiber source parsing: DONE
- **Clipboard Panel: NOT STARTED**
- **File watcher integration: NOT STARTED**

### Approach

Implement the Clipboard Panel as a left sidebar component that:
1. Shows real-time preview of compiled markdown
2. Lists all comments with delete buttons
3. Provides Clear All functionality
4. Supports pop-out to separate window
5. Auto-clears comments when source files change

**Key Technical Decisions:**
- Use existing `commentSlice.ts` store
- Subscribe to file watcher events for auto-clear
- Markdown preview via existing compilation function

### Acceptance Criteria

- [ ] Clipboard Panel visible in left sidebar when Comment Mode active
- [ ] Real-time markdown preview updates as comments added/removed
- [ ] Each comment shows: component, file:line, content
- [ ] Delete individual comments via badge or panel
- [ ] Clear All button removes all comments
- [ ] Pop-out to separate window (optional, lower priority)
- [ ] File changes trigger comment clear warning

### Dependencies

- Depends on: None (existing infrastructure)
- Blocks: Nothing critical

### Priority Rationale

**Critical** - Vault spec explicitly marks Comment Mode as critical priority. This is the highest-value feature completion, directly improving daily workflow. Reference: `01-radflow-inventory.md` PARTIAL section.

---

## Epic: Component Canvas (CSS scale())

### Problem

Component Canvas is specified in vault but not implemented. The vault spec recommends Shadow DOM isolation, but research findings recommend CSS scale() instead.

**Comparison Finding (from 05-canvas-rendering.md):**
> Shadow DOM is not recommended due to React incompatibilities. CSS scale() provides better performance with zero complexity.

### Approach

Build Component Canvas using CSS transform scale() for component thumbnails:

1. **Component Grid:** Scrollable grid of scaled component previews
2. **CSS scale():** Use `transform: scale(0.2)` for thumbnails
3. **Virtualization:** `@tanstack/virtual` for 100+ components
4. **Props Playground:** Selected component shows editable props
5. **Variant Preview:** Side-by-side variant comparison

**Key Technical Decisions:**
- CSS scale() over Shadow DOM (research recommendation)
- Virtualization threshold: 50+ components
- Keep iframe for single-component detailed view
- Leverage existing TSX parser (`components.rs`) for discovery

### Acceptance Criteria

- [ ] Component grid displays all discovered components
- [ ] CSS scale() provides smooth 60fps panning
- [ ] Virtualization kicks in at 50+ components
- [ ] Props panel shows component interface
- [ ] Props changes update preview in real-time
- [ ] Variant selector for multi-variant components
- [ ] No Shadow DOM (CSS containment for isolation)

### Dependencies

- Depends on: None (TSX parser already built)
- Blocks: Nothing

### Priority Rationale

**High** - Fills major gap in RadFlow capabilities. Component Canvas enables variant comparison without dev server, which is a key Pencil feature. CSS scale() approach is simpler than originally spec'd Shadow DOM. Reference: `05-canvas-rendering.md` recommendation.

---

## Epic: Claude Code Skills Integration

### Problem

RadFlow provides context via clipboard but has no programmatic AI integration. Users must manually copy/paste context.

**Comparison Finding (from 06-mcp-vs-skills.md):**
> Skills are sufficient for RadFlow's context-provider workflow and align better with its philosophy.

### Approach

Implement 4 core Claude Code skills that call RadFlow's local HTTP API:

1. **Local HTTP API:** Add endpoints to RadFlow Tauri app
2. **Skills Plugin:** Create Claude Code plugin manifest
3. **Context Skill:** `/radflow:context` bundles selection as markdown
4. **Token Skill:** `/radflow:tokens` exports design tokens
5. **Source Skill:** `/radflow:source` returns file:line
6. **Components Skill:** `/radflow:components` lists discovered components

**Key Technical Decisions:**
- Skills over MCP (simpler, aligned with workflow)
- Read-only operations only
- Local HTTP server on port 7878
- Markdown output format (human-readable)

### Acceptance Criteria

- [ ] RadFlow exposes HTTP API on localhost:7878
- [ ] `/radflow:context` skill returns selection context
- [ ] `/radflow:tokens` skill returns token values
- [ ] `/radflow:source` skill returns source location
- [ ] `/radflow:components` skill returns component list
- [ ] Skills work when RadFlow is running
- [ ] Graceful error when RadFlow not running

### Dependencies

- Depends on: None
- Blocks: MCP implementation (if needed later)

### Priority Rationale

**High** - Enables programmatic AI integration without abandoning clipboard philosophy. Skills maintain human-in-the-loop while reducing copy/paste friction. Reference: `06-mcp-vs-skills.md` recommendation.

---

## Epic: Streaming Edit Highlights

### Problem

When users edit styles in RadFlow, there's no visual indication of pending changes in the preview. Pencil shows streaming updates as AI works.

**Pencil Pattern (from 02-pencil-architecture.md):**
> Pencil streams partial `batch_design` operations before the full JSON is complete... The canvas updates incrementally.

### Approach

Add visual feedback for pending style edits:

1. **Highlight Pending:** Show shimmer/glow on elements with pending edits
2. **Edit Count Badge:** Display "3 edits" indicator near element
3. **Preview Diff:** Side panel shows CSS diff before apply
4. **Clear Indicator:** Visual feedback when edits are saved/cleared

**Key Technical Decisions:**
- Use existing INJECT_STYLE mechanism
- Add CSS class for pending state (no new bridge protocol)
- Keep edits in frontend store until explicit save

### Acceptance Criteria

- [ ] Elements with pending edits show visual highlight
- [ ] Edit count badge appears on edited elements
- [ ] Diff preview shows old → new values
- [ ] Highlight clears when edits saved or discarded
- [ ] Works with existing bridge protocol

### Dependencies

- Depends on: None
- Related to: Token persistence (if adding write mode)

### Priority Rationale

**Medium** - Improves UX for style editing workflow. Inspired by Pencil's streaming updates pattern. Not blocking but enhances polish. Reference: `02-pencil-architecture.md` streaming patterns.

---

## Epic: Session Persistence

### Problem

AI conversations are not persisted. Users cannot resume complex refactoring tasks across sessions.

**Pencil Pattern (from 02-pencil-architecture.md):**
> Sessions can be resumed via `sessionId`: `options.resume = sessionId`

### Approach

Add session persistence for AI conversation context:

1. **Session Store:** Persist conversation context to local storage/file
2. **Resume UI:** Show "Resume last session?" on startup
3. **Session Picker:** List recent sessions with timestamps
4. **Context Bundling:** Include session context in clipboard export

**Key Technical Decisions:**
- Local file storage (no cloud)
- Session = selection + comments + conversation hints
- Auto-save on Comment Mode exit
- Manual resume (not automatic)

### Acceptance Criteria

- [ ] Sessions auto-saved on Comment Mode exit
- [ ] Startup shows resume option if session exists
- [ ] Session picker lists last 5 sessions
- [ ] Resumed session restores comments and selection
- [ ] Sessions can be manually cleared

### Dependencies

- Depends on: None
- Related to: Comment Mode completion

### Priority Rationale

**Medium** - Improves workflow for complex multi-session tasks. Pencil implements this pattern effectively. Lower priority than core feature completion. Reference: `02-pencil-architecture.md` session resume.

---

## Epic: Vault Spec Updates

### Problem

Vault specs contain outdated recommendations based on research findings:
1. Component Canvas spec says Shadow DOM (should be CSS scale())
2. No mention of virtualization requirements
3. Missing skills/MCP decision

### Approach

Update vault documentation to reflect research findings:

1. **component-canvas.md:** Update isolation approach
2. **ai-integration.md:** Add skills section
3. **system-overview.md:** Update architecture diagram

### Acceptance Criteria

- [ ] component-canvas.md updated with CSS scale() approach
- [ ] Virtualization mentioned for 100+ components
- [ ] ai-integration.md includes skills specification
- [ ] Architecture diagrams reflect current decisions

### Dependencies

- Depends on: Decisions finalized from this epic

### Priority Rationale

**Low** - Documentation update, no user-facing impact. Should be done but doesn't block development. Reference: All comparison documents.

---

## Epic Dependency Graph

```
                    ┌────────────────────┐
                    │ Vault Spec Updates │ (Low)
                    └────────────────────┘
                              ▲
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Complete  │     │ Component Canvas │     │  Skills          │
│ Comment    │     │ (CSS scale())    │     │  Integration     │
│   Mode     │     └──────────────────┘     └──────────────────┘
└────────────┘            │                         │
  (Critical)              │ (High)                  │ (High)
                          │                         │
                          ▼                         ▼
                 ┌────────────────┐        ┌────────────────┐
                 │   Streaming    │        │    Session     │
                 │   Highlights   │        │  Persistence   │
                 └────────────────┘        └────────────────┘
                     (Medium)                  (Medium)
```

**Critical Path:** Complete Comment Mode → Component Canvas → Skills

---

## Implementation Order Recommendation

### Phase 1: Foundation (Weeks 1-3)
1. Complete Comment Mode (Clipboard Panel)
2. Update vault specs

### Phase 2: New Capabilities (Weeks 4-7)
3. Component Canvas (CSS scale())
4. Claude Code Skills Integration

### Phase 3: Polish (Weeks 8-9)
5. Streaming Edit Highlights
6. Session Persistence

---

## Out of Scope (Per Interview)

The following were explicitly deferred:

| Item | Reason | Status |
|------|--------|--------|
| .pen file conversion | Low priority | Defer indefinitely |
| Onboarding wizard | Low priority | Defer |
| MCP server | Skills sufficient | Defer unless demanded |
| Direct write mode | Against philosophy | Defer indefinitely |
| WASM canvas | Overkill | Skip |

---

## Notes for Epic Creation

When creating actual epics from this document:

1. **Use flowctl:** `.flow/bin/flowctl` for task tracking
2. **Reference this doc:** Link to `07-roadmap-epics.md` in epic description
3. **Break into tasks:** Each epic → 3-8 tasks
4. **Acceptance first:** Start with acceptance criteria, then decompose
5. **Dependencies:** Mark inter-epic dependencies in JSON

Example flowctl usage:
```bash
# Create new epic
.flow/bin/flowctl create-epic "Complete Comment Mode"

# Add tasks
.flow/bin/flowctl add-task fn-4 "Implement Clipboard Panel component"
```
