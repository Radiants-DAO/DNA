# fn-8.13 Review: Search & Navigation

**Spec:** `/docs/features/07-search-and-navigation.md`
**Scope:** Search systems, canvas navigation, keyboard shortcuts, git integration, window management
**Date:** 2026-01-16
**Reviewer:** fn-8.13 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~15% |
| **Gaps Found** | 18 (P0: 3, P1: 6, P2: 6, P3: 3) |
| **Smoke Test** | PARTIAL |

The Search & Navigation specification describes comprehensive search, navigation, and keyboard-driven workflows for the app. This is a large specification covering:
- Content Search (Cmd+F) with fuzzy matching
- Prompt Builder (Cmd+E) for AI context
- Canvas navigation (zoom, pan, sections)
- Edit mode navigation (page editor tabs)
- Git-as-Save workflow (Cmd+S commits)
- Keyboard shortcuts (global, canvas, edit mode)
- Window management (tabs, fullscreen)
- Spotlight system for search results
- Navigation history (back/forward)
- Vim mode (optional)
- Preferences

**What's Implemented:**
- **Basic search input** - TitleBar has non-functional search input (placeholder only)
- **Basic keyboard shortcuts** - V/T/P for mode switching, Cmd+C, Cmd+Z (logs only)
- **Section shortcuts (1-4)** - Left panel section switching via number keys
- **Tantivy POC** - Research proof-of-concept for fuzzy search exists (not integrated)
- **Undo system (partial)** - EditsSlice has undoLastStyleEdit but no full history

**Critical Gaps:**
- **No Content Search UI/Overlay** - Search input exists but doesn't search anything
- **No Prompt Builder** - Cmd+E not implemented
- **No Git Integration** - No Cmd+S commit, no snapshot system
- **No Canvas Navigation** - No zoom, pan, or section snapping (canvas is deferred)
- **No Menu Bar** - Native macOS menus not implemented

---

## Smoke Test Results

**Legend:**
- **UI EXISTS** - Component renders (but may use mock data)
- **FUNCTIONAL** - Connected to real data sources and working
- **NOT IMPLEMENTED** - Feature does not exist
- **POC ONLY** - Proof-of-concept exists in research/, not integrated

### Search Systems

| Test | Status | Notes |
|------|--------|-------|
| Cmd+F opens search overlay | NOT IMPLEMENTED | Input exists in TitleBar but no overlay |
| Type to filter results | NOT IMPLEMENTED | No search logic connected |
| Results categorized by type | NOT IMPLEMENTED | No results UI |
| Arrow key navigation in results | NOT IMPLEMENTED | No results |
| Enter to jump to result | NOT IMPLEMENTED | No results |
| Fuzzy search backend | POC ONLY | research/pocs/tantivy-poc/ works but not integrated |

### Prompt Builder

| Test | Status | Notes |
|------|--------|-------|
| Cmd+E opens prompt builder | NOT IMPLEMENTED | No shortcut registered |
| Contextual prompts for selection | NOT IMPLEMENTED | No prompt builder UI |
| Progressive prompt building | NOT IMPLEMENTED | No implementation |
| Copy built prompt to clipboard | NOT IMPLEMENTED | No implementation |

### Canvas Navigation

| Test | Status | Notes |
|------|--------|-------|
| Pinch to zoom (trackpad) | NOT IMPLEMENTED | Canvas is deferred |
| Scroll wheel zoom | NOT IMPLEMENTED | Canvas is deferred |
| Cmd++ / Cmd+- step zoom | NOT IMPLEMENTED | No zoom logic |
| Cmd+0 fit all / Cmd+1 100% | NOT IMPLEMENTED | No zoom logic |
| Two-finger pan | NOT IMPLEMENTED | Canvas is deferred |
| Spacebar + drag pan | NOT IMPLEMENTED | No pan logic |
| Floating pill section nav | NOT IMPLEMENTED | No section nav UI |
| Cmd+1-4 snap to sections | PARTIAL | 1-4 keys work for left panel, not canvas sections |
| Mini-map | NOT IMPLEMENTED | Canvas is deferred |

### Edit Mode Navigation

| Test | Status | Notes |
|------|--------|-------|
| Press E to enter edit mode | NOT IMPLEMENTED | No E shortcut |
| Double-click to edit | NOT IMPLEMENTED | No edit mode transition |
| Page editor tabs | NOT IMPLEMENTED | Single view only |
| Escape to return to canvas | PARTIAL | Escape exits modes but no canvas/edit distinction |
| Cmd+S commit and close | NOT IMPLEMENTED | No git integration |
| Cmd+W close with prompt | NOT IMPLEMENTED | No close handling |

### Git as Save

| Test | Status | Notes |
|------|--------|-------|
| Cmd+S stages and commits | NOT IMPLEMENTED | No git integration |
| Smart commit message generation | NOT IMPLEMENTED | No git integration |
| Snapshot on enter edit mode | NOT IMPLEMENTED | No snapshot system |
| Discard restores snapshot | NOT IMPLEMENTED | No snapshot system |

### Keyboard Shortcuts

| Test | Status | Notes |
|------|--------|-------|
| V - Component ID mode | FUNCTIONAL | useKeyboardShortcuts.ts:51-54 |
| T - Text Edit mode | FUNCTIONAL | useKeyboardShortcuts.ts:55-58 |
| P - Preview mode | FUNCTIONAL | useKeyboardShortcuts.ts:59-62 |
| Escape - Exit mode | FUNCTIONAL | useKeyboardShortcuts.ts:63-77 |
| Cmd+C - Copy selection | FUNCTIONAL | useKeyboardShortcuts.ts:84-89 |
| Cmd+Z - Undo | PARTIAL | Logged only, not connected |
| Cmd+Shift+Z - Redo | PARTIAL | Logged only, not connected |
| Cmd+F - Content search | NOT IMPLEMENTED | No handler |
| Cmd+E - Prompt builder | NOT IMPLEMENTED | No handler |
| Cmd+, - Preferences | NOT IMPLEMENTED | No preferences |
| Cmd+D/G/etc - Object manipulation | NOT IMPLEMENTED | No handlers |

### Window Management

| Test | Status | Notes |
|------|--------|-------|
| Single canvas view | FUNCTIONAL | App has single main view |
| Multiple page editor tabs | NOT IMPLEMENTED | No tabs |
| Cmd+W close tab | NOT IMPLEMENTED | No tab handling |
| Cmd+Tab / Ctrl+Tab tab switching | NOT IMPLEMENTED | No tabs |
| Fullscreen mode | NOT IMPLEMENTED | No fullscreen handling |

### Menu Bar

| Test | Status | Notes |
|------|--------|-------|
| File menu | NOT IMPLEMENTED | No native menu |
| Edit menu | NOT IMPLEMENTED | No native menu |
| View menu | NOT IMPLEMENTED | No native menu |
| Help menu | NOT IMPLEMENTED | No native menu |

### Preferences

| Test | Status | Notes |
|------|--------|-------|
| Keyboard section | NOT IMPLEMENTED | No preferences UI |
| Remap function keys | NOT IMPLEMENTED | No preferences |
| Vim mode toggle | NOT IMPLEMENTED | No vim mode |

### Spotlight System

| Test | Status | Notes |
|------|--------|-------|
| Highlight search result | NOT IMPLEMENTED | No spotlight effect |
| Dim surrounding content | NOT IMPLEMENTED | No spotlight |
| Auto-fade after 2 seconds | NOT IMPLEMENTED | No spotlight |

### Navigation History

| Test | Status | Notes |
|------|--------|-------|
| Cmd+[ go back | NOT IMPLEMENTED | No history tracking |
| Cmd+] go forward | NOT IMPLEMENTED | No history tracking |
| Recent items in search | NOT IMPLEMENTED | No recent tracking |

---

## Priority Criteria

- **P0 (Critical):** Blocks core workflow, feature cannot work without this (~2-6 hours to fix)
- **P1 (High):** Required for MVP user experience, core spec feature (~2-8 hours)
- **P2 (Medium):** Enhances UX but not required for launch, has workarounds (~1-4 hours)
- **P3 (Low):** Polish, optimization, nice-to-have (~1-4 hours)

---

## Detailed Gap Analysis

### P0 (Critical) - 3 Issues

#### GAP-0: No Content Search System

**Condition:** The search input in TitleBar is purely visual - no search logic, no results display, no keyboard navigation.

**Criteria:** Spec section "Content Search (Cmd+F)" (lines 16-41):
```
**Searchable Content:**
- Components (by name, category)
- Pages (by name, route)
- Design tokens (by name, value)
- Icons (by name, tags)
...
**Behavior:**
- Opens search overlay
- Type to filter results
- Results categorized by type
- Arrow keys to navigate
- Enter to jump to result
```

Current implementation (TitleBar.tsx:21-29):
```typescript
<input
  type="text"
  placeholder="Search (Cmd+F)"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  ...
/>
```

The input stores `searchQuery` but does nothing with it. No search overlay, no results, no Cmd+F shortcut.

**Effect:** Users cannot find components, tokens, or any content. The primary discovery mechanism is missing.

**Recommendation:**
1. Integrate tantivy-poc into Rust backend as `search_content(query)` command
2. Create `SearchOverlay.tsx` component with results list
3. Register Cmd+F shortcut to open overlay
4. Index components, tokens, icons on project load
5. Implement keyboard navigation (arrow keys, enter)
6. Add fuzzy matching for typo tolerance

**Priority:** P0 - Core feature, blocks content discovery
**Estimated Fix:** 8-12 hours

---

#### GAP-1: No Git-as-Save Integration

**Condition:** The spec's core concept of "Git is the save function" is not implemented at all.

**Criteria:** Spec section "Git as Save" (lines 159-188):
```
Every "save" is a git commit. No ambiguous local saves.

**Cmd+S Behavior:**
1. Stage changed files
2. Open commit message input (pre-filled with smart default)
3. Commit on Enter
4. Return to canvas
```

And section "Smart Commit Messages" (lines 170-173):
```
- "Update Button primary variant colors"
- "Edit HomePage hero section"
- "Modify --color-primary token"
```

No git commands exist in the Rust backend. No `git_commit`, `git_status`, `git_stage` commands.
No Cmd+S handler for commits.

**Effect:** Users cannot save their work persistently. Changes exist only in memory. The fundamental workflow is broken.

**Recommendation:**
1. Decide: Use git2-rs crate OR shell out to git CLI
2. Add `git_status()`, `git_stage(files)`, `git_commit(message)` commands
3. Register Cmd+S shortcut in useKeyboardShortcuts
4. Create commit dialog UI with message input
5. Generate smart commit messages from pending edits
6. Store snapshot on edit mode enter for discard option

**Priority:** P0 - Core workflow, blocks saving
**Estimated Fix:** 12-16 hours (decision + implementation)

---

#### GAP-2: No Snapshot System for Discard

**Condition:** The snapshot system for edit discard is not implemented.

**Criteria:** Spec section "Snapshot System" (lines 175-188):
```
**On Enter Edit Mode:**
- Snapshot current file state
- Store in memory (not git stash)
- Enable discard option

**On Discard:**
- Restore files to snapshot
- No git history created
- Clean return to canvas
```

No snapshot storage exists. No "Commit or Discard" dialog. Changes cannot be discarded.

**Effect:** Users cannot abandon unwanted changes. No safety net for experimentation.

**Recommendation:**
1. Add `snapshot_create(files)` command in Rust
2. Add `snapshot_restore(id)` command
3. Store file contents in memory HashMap
4. Create discard confirmation dialog
5. Wire into edit mode enter/exit transitions

**Priority:** P0 - Core safety feature
**Dependencies:** Requires GAP-1 (git integration concept)
**Estimated Fix:** 6-8 hours

---

### P1 (High) - 6 Issues

#### GAP-3: Undo/Redo Not Connected

**Condition:** Cmd+Z and Cmd+Shift+Z are registered but only log to console.

**Criteria:** Spec section "Global (Always Active)" (lines 194-204):
```
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
```

Current implementation (useKeyboardShortcuts.ts:91-100):
```typescript
case "z":
  if (event.shiftKey) {
    console.log("[Shortcut] Redo");
  } else {
    console.log("[Shortcut] Undo");
  }
  return;
```

EditsSlice has `undoLastStyleEdit()` but it's not wired to the keyboard shortcut.

**Effect:** Standard undo/redo shortcuts do nothing. Users expect these to work.

**Recommendation:**
1. Connect Cmd+Z to `undoLastStyleEdit()` in EditsSlice
2. Add redo stack (currently only undo exists)
3. Create `redoLastStyleEdit()` action
4. Wire Cmd+Shift+Z to redo

**Priority:** P1 - Standard user expectation
**Estimated Fix:** 3-4 hours

---

#### GAP-4: No Prompt Builder (Cmd+E)

**Condition:** The Prompt Builder for AI context is not implemented.

**Criteria:** Spec section "Prompt Builder (Cmd+E)" (lines 40-63):
```
Contextual command palette for AI prompts.

**Concept:**
Select element(s) → Cmd+E → contextual quick prompts → Enter to copy

**Context Examples:**
- Button selected → "Change variant", "Update colors", "Add hover state"
- Multiple components selected → "Apply to all", "Make consistent"
- Token selected → "Generate scale", "Find usage", "Suggest alternatives"
```

No Cmd+E shortcut exists. No prompt builder UI. No contextual prompt suggestions.

**Effect:** The AI-assisted workflow specified in the feature is entirely missing.

**Recommendation:**
1. Create `PromptBuilder.tsx` component
2. Register Cmd+E shortcut
3. Read current selection state
4. Show contextual quick prompts based on selection type
5. Allow prompt composition
6. Copy to clipboard on Enter

**Priority:** P1 - Core AI integration feature
**Estimated Fix:** 8-10 hours

---

#### GAP-5: No Page Editor Tabs

**Condition:** The app has a single view - no tab system for editing multiple pages.

**Criteria:** Spec section "Page Editor Tabs" (lines 134-140):
```
Multiple pages can be open.

**Behavior:**
- Each open page is a tab
- Single canvas view (only one canvas)
- Multiple page editor tabs allowed
- Tab shows page name + modified indicator
```

And section "Window Management - Page Editor Tabs" (lines 292-300):
```
- Cmd+W — Close current tab
- Cmd+Shift+W — Close all tabs
- Ctrl+Tab — Next editor tab
```

No tab UI exists. No tab state management. No tab keyboard shortcuts.

**Effect:** Users cannot have multiple pages open for comparison or quick switching.

**Recommendation:**
1. Add `openTabs: Tab[]` state to store
2. Create `TabBar.tsx` component
3. Show modified indicator (dirty state)
4. Wire Cmd+W to close tab
5. Wire Ctrl+Tab to cycle tabs
6. Add close/closeAll actions

**Priority:** P1 - Standard editor feature
**Estimated Fix:** 6-8 hours

---

#### GAP-6: No Native Menu Bar

**Condition:** The native macOS menu bar is not configured with application menus.

**Criteria:** Spec section "Menu Bar" (lines 313-348):
```
### File Menu
- New... (TBD)
- Open Project...
- Close Tab (Cmd+W)
- Save / Commit (Cmd+S)

### Edit Menu
- Undo (Cmd+Z)
- Redo (Cmd+Shift+Z)
- Cut/Copy/Paste

### View Menu
- Zoom In/Out
- Components Section (Cmd+1)
...
```

No Tauri menu configuration exists. Users get default system menus only.

**Effect:** Standard Mac app expectations not met. Menu items not visible.

**Recommendation:**
1. Configure Tauri menu in `tauri.conf.json`
2. Add File, Edit, View, Help menus
3. Wire menu items to app actions via IPC
4. Show keyboard shortcuts in menu

**Priority:** P1 - Mac app standard
**Estimated Fix:** 4-6 hours

---

#### GAP-7: Canvas Section Shortcuts Wrong Target

**Condition:** 1-4 keys switch left panel sections, not canvas sections as spec describes.

**Criteria:** Spec section "Section Navigation - Keyboard" (lines 99-105):
```
| Cmd+1 | Snap to Components section |
| Cmd+2 | Snap to Pages section |
| Cmd+3 | Snap to Docs section |
| Cmd+4 | Snap to Violations section |
```

Current implementation (LeftPanel.tsx:182-189):
```typescript
if (key >= "1" && key <= "4") {
  const index = parseInt(key) - 1;
  const section = SECTIONS[index];
  if (section) {
    toggleSection(section.id);  // Toggles left panel, not canvas
  }
}
```

Keys 1-4 (without Cmd) toggle left panel sections (Variables, Components, Assets, Layers).
Spec says Cmd+1-4 should navigate to canvas sections.

**Effect:** Shortcuts don't match spec. Users familiar with spec behavior will be confused.

**Recommendation:**
1. Add Cmd+1-4 shortcuts for canvas section navigation (when canvas exists)
2. Keep current 1-4 for left panel (useful shortcut, just different)
3. Document the deviation or update spec
4. When canvas is built, implement section snapping

**Priority:** P1 - User expectation mismatch
**Dependencies:** Full fix requires canvas implementation
**Estimated Fix:** 2-3 hours (partial), deferred (full)

---

#### GAP-8: No Preferences UI

**Condition:** The preferences system is not implemented.

**Criteria:** Spec section "Preferences" (lines 351-378):
```
### Keyboard Section
- View all shortcuts
- Search shortcuts
- Remap function keys
- Reset to defaults
- Import/export keybindings

### Vim Mode
When Enabled:
- j/k for up/down navigation
- h/l for left/right
- / for search
- : for command mode
```

Current state: Settings button exists in LeftPanel but only shows "Re-run Setup Wizard" and disabled "Preferences (coming soon)".

**Effect:** Users cannot customize keyboard shortcuts or enable vim mode.

**Recommendation:**
1. Create `Preferences.tsx` modal/panel
2. Add keyboard shortcuts viewer
3. Allow function key remapping
4. Store preferences in user config
5. Vim mode implementation (optional, lower priority)

**Priority:** P1 - Customization expectation
**Estimated Fix:** 8-12 hours (without vim mode)

---

### P2 (Medium) - 6 Issues

#### GAP-9: No Spotlight/Highlight System

**Condition:** Search results don't get spotlighted or highlighted.

**Criteria:** Spec section "Spotlight System" (lines 381-409):
```
### Visual Treatment
- Target element highlighted
- Surrounding content dimmed (subtle)
- Outline or glow on target
- Smooth transition animation

### Duration
- Automatic fade after 2 seconds
- Click anywhere dismisses
```

No spotlight effect exists. Elements have no highlight animation.

**Effect:** Search results don't draw attention. Users may miss the found item.

**Recommendation:**
1. Create `useSpotlight` hook
2. Add highlight CSS animation
3. Dim background with overlay
4. Auto-fade timer (2 seconds)
5. Wire to search result selection

**Priority:** P2 - Nice visual polish
**Dependencies:** Requires GAP-0 (search system)
**Estimated Fix:** 3-4 hours

---

#### GAP-10: No Navigation History

**Condition:** Back/forward navigation is not implemented.

**Criteria:** Spec section "Navigation History" (lines 411-430):
```
### Back/Forward
- Cmd+[ — Go back
- Cmd+] — Go forward
- History tracks canvas position, section, selection

### Recent Items
- Shown in Content Search (Cmd+F)
- "Recent" section at top of results
```

No navigation history state. No Cmd+[ / Cmd+] handlers.

**Effect:** Users cannot retrace their navigation steps.

**Recommendation:**
1. Add `navigationHistory: Location[]` to store
2. Track position, section, selection changes
3. Register Cmd+[ and Cmd+] shortcuts
4. Cap history length (e.g., 50 entries)
5. Clear on project close

**Priority:** P2 - Enhancement
**Estimated Fix:** 4-6 hours

---

#### GAP-11: Edit Mode Enter/Exit Flow Incomplete

**Condition:** The edit mode transition flow (E key, double-click, snapshots) is not implemented.

**Criteria:** Spec section "Entering Edit Mode" (lines 121-133):
```
**From Canvas:**
- Select page/component/doc
- Press **E** to enter edit mode
- Or double-click item

**Behavior:**
- Canvas transitions out
- Edit view opens
- Snapshot taken for discard option
```

Current: V/T/P modes exist but no dedicated "edit mode" with E key.
No transition animation. No snapshot on entry.

**Effect:** The edit workflow doesn't match spec. No clear "I'm now editing" state.

**Recommendation:**
1. Add E shortcut for entering edit mode
2. Create edit mode transition animation
3. Wire snapshot creation on entry
4. Add "Commit or Discard" dialog on exit
5. Sync with tab system (GAP-5)

**Priority:** P2 - Workflow polish
**Dependencies:** Requires GAP-2 (snapshots)
**Estimated Fix:** 4-6 hours

---

#### GAP-12: Missing Figma-Style Shortcuts

**Condition:** Many Figma-familiar shortcuts are not implemented.

**Criteria:** Spec section "Figma-Style Shortcuts" (lines 244-279):
```
### Selection & Tools
| H | Hand tool (pan) |
| Z | Zoom tool |

### Object Manipulation
| Cmd+D | Duplicate |
| Cmd+G | Group |
| Cmd+Shift+G | Ungroup |
| Cmd+] | Bring forward |
| Cmd+[ | Send backward |
```

None of these shortcuts are implemented.

**Effect:** Designers familiar with Figma won't find expected shortcuts.

**Recommendation:**
1. Prioritize most-used shortcuts (H for pan, Z for zoom)
2. Add object manipulation when selection exists
3. Document which shortcuts exist vs planned

**Priority:** P2 - Designer expectation
**Dependencies:** Some require canvas (H, Z)
**Estimated Fix:** 4-6 hours (for non-canvas shortcuts)

---

#### GAP-13: Search Not Indexed on Project Load

**Condition:** Even if tantivy is integrated, there's no indexing on project open.

**Criteria:** Spec section "Research Notes" (line 460):
```
*Search: index on startup or incrementally?*
```

And spec section "Rust Backend Integration" (lines 519-538):
```
**Commands Needed:**
- `index_project(path)` → Build search index
```

No indexing command exists. The tantivy POC requires manual item addition.

**Effect:** Search won't work immediately on project open.

**Recommendation:**
1. Add `index_project(path)` Rust command
2. Scan components, tokens, icons, docs
3. Call on project open
4. Update incrementally on file changes

**Priority:** P2 - Required for search to work
**Dependencies:** Requires GAP-0 (search integration)
**Estimated Fix:** 4-6 hours

---

#### GAP-14: Function Keys Not Mappable

**Condition:** F1-F12 keys cannot be customized as spec describes.

**Criteria:** Spec section "Function Keys" (lines 231-241):
```
| F1 | Help / Documentation |
| F2 | Rename selected |
| F3 | Find next |
| F5 | Refresh preview |
| F6-F12 | User mappable |
```

No function key handlers exist. No mapping system.

**Effect:** Power users cannot use function keys for quick actions.

**Recommendation:**
1. Add function key handlers
2. Allow remapping in preferences
3. Store mappings in user config
4. Default F1-F5 per spec

**Priority:** P2 - Power user feature
**Dependencies:** Requires GAP-8 (preferences)
**Estimated Fix:** 3-4 hours

---

### P3 (Low) - 3 Issues

#### GAP-15: Vim Mode Not Implemented

**Condition:** Optional vim-style navigation is not available.

**Criteria:** Spec section "Vim Mode" (lines 364-378):
```
**When Enabled:**
- j/k for up/down navigation
- h/l for left/right
- / for search
- : for command mode
- gg/G for top/bottom
```

No vim mode toggle. No vim key bindings.

**Effect:** Vim users must use standard navigation.

**Recommendation:**
1. Add vim mode toggle in preferences
2. Implement j/k/h/l for navigation
3. / for search focus
4. gg/G for jump to top/bottom
5. Exclude text editing contexts

**Priority:** P3 - Niche preference
**Estimated Fix:** 6-8 hours

---

#### GAP-16: Mini-Map Not Implemented

**Condition:** The mini-map for large canvas navigation doesn't exist.

**Criteria:** Spec section "Mini Map" (lines 107-115):
```
### Features
- Thumbnail of entire canvas
- Current viewport rectangle
- Click to jump
- Collapsible
- Section boundaries visible
```

Canvas is deferred, so mini-map is also deferred.

**Effect:** No overview for large canvases.

**Recommendation:** Defer until canvas is implemented.

**Priority:** P3 - Canvas feature (deferred)
**Estimated Fix:** 8-12 hours (when canvas exists)

---

#### GAP-17: Floating Section Nav Not Implemented

**Condition:** The floating pill nav for section jumping doesn't exist.

**Criteria:** Spec section "Floating Pill Nav" (lines 92-97):
```
- Persistent floating control
- Shows section names/icons
- Click to snap to section
- Current section highlighted
```

Canvas is deferred, so this UI is also deferred.

**Effect:** No visual section navigator.

**Recommendation:** Defer until canvas is implemented.

**Priority:** P3 - Canvas feature (deferred)
**Estimated Fix:** 4-6 hours (when canvas exists)

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| No spatial canvas | Canvas is explicitly deferred per 08-canvas-editor spec |
| 1-4 keys for left panel | Useful shortcut, different from spec's Cmd+1-4 for canvas |
| No git2 crate | CLAUDE.md says "git2 → git CLI" (decision made) |
| No tantivy in main app | CLAUDE.md says "tantivy → fuzzy-matcher" (simpler approach) |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Cmd+1 conflict | Lines 75-76, 209 | Cmd+1 = "Zoom to 100%" AND "Snap to Components" - pick one |
| Shift+1/2 undefined | Lines 277-278 | "Shift+1 Zoom to Components" - different from Cmd+1? |
| tantivy vs fuzzy-matcher | Lines 457-460 | Spec says tantivy, CLAUDE.md says fuzzy-matcher |
| Canvas sections undefined | Lines 99-105 | What are "Components section", "Pages section" on canvas? |
| E key vs modes | Lines 125, 253 | E = "Enter edit mode" but V/T/P/I are also modes |

---

## Implementation Quality Notes

### Current Strengths

1. **Mode shortcuts work** - V/T/P for mode switching is solid
2. **Section switching (1-4)** - Left panel shortcuts are useful
3. **Copy selection works** - Cmd+C correctly copies component info
4. **Tantivy POC complete** - Research proves fuzzy search works
5. **EditsSlice has undo** - Foundation for undo/redo exists

### Critical Gaps

1. **No search** - Core discovery feature missing
2. **No git integration** - Cannot save work
3. **No prompt builder** - AI workflow missing
4. **Menu bar missing** - Not a proper Mac app
5. **Undo not wired** - Standard shortcut broken

---

## Relationship to Other Features

| Feature | Relationship |
|---------|--------------|
| Canvas Editor (08) | Search navigates TO canvas items; canvas navigation lives here |
| Component ID Mode (06) | V shortcut implemented here; selection state shared |
| Variables Editor (01) | Searchable content source |
| Component Browser (03) | Searchable content source |
| Git Integration (proposed) | This spec defines the UX, implementation TBD |

---

## Research Findings

### Tantivy POC Analysis

The `research/pocs/tantivy-poc/` demonstrates:
- In-memory index creation works
- Component/icon name indexing
- Fuzzy search with Levenshtein distance
- Sub-millisecond search times
- Returns file path for navigation

```rust
// POC shows this works:
let results = index.fuzzy_search("buton", 1, 5);  // Finds "Button"
```

However, CLAUDE.md says "tantivy → fuzzy-matcher" suggesting a simpler approach was chosen.

### Recommendation

Use the simpler approach per CLAUDE.md:
1. `fuzzy-matcher` crate for in-memory fuzzy matching
2. Simpler than tantivy (no index schema, no commit)
3. Sufficient for hundreds of components/tokens
4. Save tantivy for full-text search (docs content) if needed later

---

## Integration Test Plan

Once gaps are addressed, verify end-to-end:

### Prerequisites
1. Project with components, tokens, icons
2. Modified files (to test git integration)

### Test Cases

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Press Cmd+F | Search overlay opens |
| 2 | Type "btn" | Fuzzy matches "Button" component |
| 3 | Arrow down, Enter | Navigates to Button, spotlight effect |
| 4 | Press V, select Button | Component ID mode, Button selected |
| 5 | Press Cmd+E | Prompt builder opens with Button context |
| 6 | Select prompt, Enter | Context copied to clipboard |
| 7 | Edit token value | Change tracked in EditsSlice |
| 8 | Press Cmd+S | Commit dialog opens |
| 9 | Enter message, Enter | Git commit created |
| 10 | Press Cmd+Z | Last edit undone |
| 11 | Press Escape while editing | "Commit or Discard" dialog |
| 12 | Click Discard | Changes reverted to snapshot |

---

## Follow-up Tasks Recommended

### Dependency Graph

```
GAP-1 (Git) ────────> GAP-2 (Snapshots) ────> GAP-11 (Edit Flow)
                                              └──> GAP-5 (Tabs)

GAP-0 (Search) ─────> GAP-9 (Spotlight)
                └───> GAP-10 (History)
                └───> GAP-13 (Indexing)

GAP-3 (Undo) ─────────> (Independent, quick)

GAP-4 (Prompt Builder) ─> (Independent)

GAP-6 (Menu Bar) ─────> (Independent)

GAP-8 (Preferences) ──> GAP-14 (F-keys)
                   └──> GAP-15 (Vim mode)
```

### Task List

**Foundation (P0):**
1. **fn-nav-0** - Implement content search with fuzzy-matcher (P0, GAP-0, GAP-13)
2. **fn-nav-1** - Implement git-as-save workflow (P0, GAP-1)
3. **fn-nav-2** - Implement snapshot system (P0, GAP-2) [DEPENDS: 2]

**Core Features (P1):**
4. **fn-nav-3** - Wire Cmd+Z to EditsSlice undo (P1, GAP-3) **[QUICK WIN]**
5. **fn-nav-4** - Implement prompt builder (P1, GAP-4)
6. **fn-nav-5** - Add native menu bar (P1, GAP-6)
7. **fn-nav-6** - Implement page editor tabs (P1, GAP-5) [DEPENDS: 2, 3]
8. **fn-nav-7** - Add preferences UI (P1, GAP-8)

**Enhancements (P2):**
9. **fn-nav-8** - Add spotlight effect (P2, GAP-9) [DEPENDS: 1]
10. **fn-nav-9** - Add navigation history (P2, GAP-10)
11. **fn-nav-10** - Complete edit mode flow (P2, GAP-11) [DEPENDS: 3, 7]
12. **fn-nav-11** - Add Figma-style shortcuts (P2, GAP-12)
13. **fn-nav-12** - Add function key mapping (P2, GAP-14) [DEPENDS: 8]

**Polish (P3):**
14. **fn-nav-13** - Implement vim mode (P3, GAP-15) [DEPENDS: 8]
15. **fn-nav-14** - Mini-map (P3, GAP-16) [DEFERRED: canvas]
16. **fn-nav-15** - Floating section nav (P3, GAP-17) [DEFERRED: canvas]

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `docs/features/07-search-and-navigation.md` | Specification | 553 |
| `src/hooks/useKeyboardShortcuts.ts` | Keyboard handlers | 115 |
| `src/components/layout/TitleBar.tsx` | Search input location | 114 |
| `src/components/layout/LeftPanel.tsx` | Section shortcuts | 869 |
| `src/stores/slices/editsSlice.ts` | Undo foundation | 148 |
| `src/stores/slices/uiSlice.ts` | Mode state | 51 |
| `research/pocs/tantivy-poc/src/main.rs` | Search POC | 519 |
