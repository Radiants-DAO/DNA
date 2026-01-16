# RadFlow Tauri Prioritized Fix List

**Generated:** 2026-01-16
**Source:** fn-8.15 Master Gap Report + Individual Review Files
**Task:** fn-8.16

---

## Summary Statistics

| Priority | Count | Hours Est. | Description |
|----------|-------|------------|-------------|
| **P0 (Critical)** | 24 | 80-120h | Blocks core functionality |
| **P1 (High)** | 46 | 150-220h | Required for MVP |
| **P2 (Medium)** | 43 | 100-150h | Enhances UX |
| **P3 (Low)** | 25 | 60-90h | Polish |
| **Total** | 138 | 390-580h | ~10-15 weeks |

---

## Execution Strategy

### Critical Path (P0 First)
The P0 gaps form dependency chains. Fix in this order:

1. **Foundation** (Week 1-2): Theme system types, git commands, write infrastructure
2. **Token Editing** (Week 3): Token write commands, wire to editors
3. **Preview** (Week 4): Integrate PreviewShell, enable preview mode
4. **Component System** (Week 5): Live preview iframe, component editing

### Parallel Streams
After foundation, these can be worked in parallel:
- **Stream A:** Variables/Typography editors (token writes)
- **Stream B:** Component Browser (preview + editing)
- **Stream C:** Search & Navigation (content search, git)
- **Stream D:** Theme System (discovery, switching)

---

## P0 (Critical) - 24 Gaps

These gaps block core functionality. Address first.

### Write Infrastructure (6 gaps)

| ID | Gap | Source | Effort | Dependencies |
|----|-----|--------|--------|--------------|
| P0-1 | No Token Write Commands | fn-8.7 GAP-1 | 4-6h | None |
| P0-2 | No Typography Write Commands | fn-8.8 GAP-2 | 6-8h | None |
| P0-3 | Write Commands Not Connected to Editors | fn-8.14 | 2-3h | P0-1, P0-2 |
| P0-4 | No Component Write-Back | fn-8.9 GAP-3 | 8-10h | P0-5 |
| P0-5 | No Component Style Editing | fn-8.9 GAP-2 | 12-16h | P0-6 |
| P0-6 | No Live Component Preview | fn-8.9 GAP-1 | 10-15h | None |

**Fix Order:** P0-1 + P0-2 (parallel) → P0-3 → P0-6 → P0-5 → P0-4

**P0-1: No Token Write Commands**
- **Spec:** Variables Editor cannot save token changes
- **Location:** `src-tauri/src/commands/tokens.rs`
- **Fix:** Implement `update_token(css_path, name, value)` following `file_write.rs` pattern
- **Acceptance:** Pending changes save to CSS file, persist across reload

**P0-2: No Typography Write Commands**
- **Spec:** Typography Editor cannot save base element styles
- **Location:** Create `src-tauri/src/commands/typography.rs`
- **Fix:** Implement `update_element_style(css_path, element, property, value)`
- **Acceptance:** Typography changes write to `@layer base` rules

**P0-3: Write Commands Not Connected to Editors**
- **Spec:** `directWriteMode` toggles exist but do nothing
- **Location:** `VariablesPanel.tsx`, `TypographyPanel.tsx`
- **Fix:** Wire Save buttons to new write commands
- **Acceptance:** Direct write mode actually writes to files

---

### Theme System (5 gaps)

| ID | Gap | Source | Effort | Dependencies |
|----|-----|--------|--------|--------------|
| P0-7 | No Rust Theme Module | fn-8.11 GAP-0 | 2-3h | P0-8 |
| P0-8 | No Theme Type Definitions | fn-8.11 GAP-6 | 1-2h | None |
| P0-9 | No Theme Discovery | fn-8.11 GAP-1 | 3-4h | P0-7 |
| P0-10 | No Theme Switching | fn-8.11 GAP-2 | 4-6h | P0-7, P0-9 |
| P0-11 | Editor Hardcoded to Single Theme | fn-8.14 | 2-3h | P0-10 |

**Fix Order:** P0-8 → P0-7 → P0-9 → P0-10 → P0-11

**P0-8: No Theme Type Definitions**
- **Spec:** `ThemeInfo`, `ThemeConfig`, `ColorMode` types needed
- **Location:** `src-tauri/src/types/mod.rs`
- **Fix:** Add Rust types with specta derive macros
- **Acceptance:** Types generate TypeScript bindings

**P0-7: No Rust Theme Module**
- **Spec:** No `commands/theme.rs` exists
- **Location:** Create `src-tauri/src/commands/theme.rs`
- **Fix:** Create module, add to `mod.rs`, register commands
- **Acceptance:** Theme commands available via Tauri

---

### Preview Mode (2 gaps)

| ID | Gap | Source | Effort | Dependencies |
|----|-----|--------|--------|--------------|
| P0-12 | Preview Mode Shows Placeholder | fn-8.6 GAP-2 | 4-6h | None |
| P0-13 | PreviewShell Not Used | fn-8.6 GAP-1 | Included | P0-12 |

**P0-12 + P0-13: Preview Mode Doesn't Render Target Project**
- **Spec:** Preview should show target project's dev server in iframe
- **Location:** `src/App.tsx`, `src/components/PreviewShell.tsx`
- **Fix:** Refactor App.tsx to use PreviewShell in both modes, pass dev server URL
- **Acceptance:** Preview mode shows actual target project without DevTools

---

### Git Integration (3 gaps)

| ID | Gap | Source | Effort | Dependencies |
|----|-----|--------|--------|--------------|
| P0-14 | No Git-as-Save Integration | fn-8.13 GAP-1 | 8-10h | None |
| P0-15 | No Snapshot System | fn-8.13 GAP-2 | 6-8h | P0-14 |
| P0-16 | No Undo Everything | fn-8.14 | 4-6h | P0-14, P0-15 |

**P0-14: No Git-as-Save Integration**
- **Spec:** CLAUDE.md mandates "Git is save"
- **Location:** Create `src-tauri/src/commands/git.rs`
- **Fix:** Implement `git_commit()`, `git_status()`, `git_diff()` using git CLI
- **Acceptance:** Cmd+S triggers commit dialog

---

### Content Discovery (3 gaps)

| ID | Gap | Source | Effort | Dependencies |
|----|-----|--------|--------|--------------|
| P0-17 | No Content Search System | fn-8.13 GAP-0 | 8-12h | None |
| P0-18 | No Violations UI | fn-8.12 GAP-0 | 4-6h | None |
| P0-19 | No LLM Context Copy Format | fn-8.12 GAP-1 | 1-2h | None |

**P0-17: No Content Search System**
- **Spec:** Search overlay with fuzzy matching for components, tokens, icons
- **Location:** Create `src/components/SearchOverlay.tsx`
- **Fix:** Integrate fuzzy-matcher, create search overlay, register Cmd+F
- **Acceptance:** Search finds components/tokens, arrow key nav, Enter navigates

**P0-19: No LLM Context Copy Format** (Quick Win)
- **Spec:** Copy format should be `{name} @ {file}:{line}`
- **Location:** `src/components/ComponentsPanel.tsx:248-253`
- **Fix:** Change copy format to include file:line
- **Acceptance:** Clipboard contains spec format for LLM context

---

### Typography Editor (2 gaps)

| ID | Gap | Source | Effort | Dependencies |
|----|-----|--------|--------|--------------|
| P0-20 | No Styleguide View | fn-8.8 GAP-1 | 4-6h | None |
| P0-21 | No Font Manager | fn-8.8 GAP-3 | 8-10h | None |

**P0-20: No Styleguide View**
- **Spec:** Living styleguide showing all HTML elements (h1-h6, p, a, li, etc.)
- **Location:** Create `src/components/StyleguideView.tsx`
- **Fix:** Render elements, load actual theme styles, connect to Properties Panel
- **Acceptance:** All spec elements visible with real theme styling

---

### Assets Manager (3 gaps)

| ID | Gap | Source | Effort | Dependencies |
|----|-----|--------|--------|--------------|
| P0-22 | No Rust Types for Assets | fn-8.10 GAP-0 | 1-2h | None |
| P0-23 | No Asset Discovery | fn-8.10 GAP-1 | 4-6h | P0-22 |
| P0-24 | No Asset Backend Commands | fn-8.10 GAP-2 | 6-8h | P0-22 |

**P0-22: No Rust Types for Assets**
- **Spec:** `IconInfo`, `LogoInfo`, `IconSizeConfig` types needed
- **Location:** `src-tauri/src/types/mod.rs`
- **Fix:** Add types with specta derive
- **Acceptance:** Types generate bindings, enable asset commands

---

## P1 (High) - 46 Gaps

Required for MVP user experience. Work after P0 foundation.

### Variables Editor (5 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-1 | No Color Modes (Light/Dark) | fn-8.7 GAP-3 | 4-6h |
| P1-2 | No Semantic Token Drag-and-Drop | fn-8.7 GAP-4 | 4-6h |
| P1-3 | No Contrast Accessibility Checking | fn-8.7 GAP-5 | 3-4h |
| P1-4 | No Preview Drawer | fn-8.7 GAP-6 | 3-4h |
| P1-5 | No Token Relationship Visualization | fn-8.7 GAP-7 | 3-4h |

### Typography Editor (5 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-6 | No Properties Panel for Base Elements | fn-8.8 GAP-5 | 4-5h |
| P1-7 | No Token Scale Options | fn-8.8 GAP-6 | 3-4h |
| P1-8 | No Color Token Picker for Text | fn-8.8 GAP-7 | 1-2h |
| P1-9 | No Tag Conversion UI | fn-8.8 GAP-8 | 3-4h |
| P1-10 | No Rust Typography/Font Parsing | fn-8.8 GAP-9 | 4-6h |

### Component Browser (6 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-11 | No Component Manifest Support | fn-8.9 GAP-4 | 4-6h |
| P1-12 | No Variant Display | fn-8.9 GAP-5 | 4-5h |
| P1-13 | No Size Display | fn-8.9 GAP-6 | 2-3h |
| P1-14 | No Props Playground | fn-8.9 GAP-7 | 6-8h |
| P1-15 | No Props Reference Panel | fn-8.9 GAP-8 | 3-4h |
| P1-16 | Required/Optional Prop Detection | fn-8.9 GAP-9 | 1-2h |

### Assets Manager (4 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-17 | No "Open in Finder" Button | fn-8.10 GAP-3 | 2-3h |
| P1-18 | No Right-Click Context Menu | fn-8.10 GAP-4 | 3-4h |
| P1-19 | No Size Configuration Panel | fn-8.10 GAP-5 | 4-5h |
| P1-20 | No External Icon Library Support | fn-8.10 GAP-6 | 16-24h |

### Theme System (6 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-21 | No Theme Management UI | fn-8.11 GAP-3 | 4-6h |
| P1-22 | No Color Mode Toggle | fn-8.11 GAP-4 | 2-3h |
| P1-23 | No Theme Persistence | fn-8.11 GAP-5 | 2-3h |
| P1-24 | No Theme Preview Mode | fn-8.11 GAP-7 | 3-4h |
| P1-25 | No Theme Validation | fn-8.11 GAP-8 | 3-4h |
| P1-26 | No File Watcher for Assets | fn-8.10 GAP-7 | 2-3h |

### Canvas Editor (4 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-27 | No Multi-Select for Components | fn-8.12 GAP-2 | 3-4h |
| P1-28 | No Violation Badges on Components | fn-8.12 GAP-3 | 2-3h |
| P1-29 | Filter by Violation Status | fn-8.12 GAP-4 | 2-3h |
| P1-30 | Preview Canvas Not Connected | fn-8.12 GAP-5 | 2-3h |

### Search & Navigation (6 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-31 | Undo/Redo Not Connected | fn-8.13 GAP-3 | 3-4h |
| P1-32 | No Prompt Builder (Cmd+E) | fn-8.13 GAP-4 | 8-10h |
| P1-33 | No Page Editor Tabs | fn-8.13 GAP-5 | 6-8h |
| P1-34 | No Native Menu Bar | fn-8.13 GAP-6 | 4-6h |
| P1-35 | Canvas Section Shortcuts Wrong Target | fn-8.13 GAP-7 | 2-3h |
| P1-36 | No Preferences UI | fn-8.13 GAP-8 | 8-12h |

### Tools & Modes (6 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-37 | DOM Element Correlation Missing | fn-8.3 GAP-1 | 4-6h |
| P1-38 | Rectangle Selection Incomplete | fn-8.3 GAP-2 | 2-3h |
| P1-39 | Hierarchy Context Menu Flat | fn-8.3 GAP-3 | 3-4h |
| P1-40 | Layers Panel Bidirectional Sync | fn-8.3 GAP-4 | 1-2h |
| P1-41 | Missing Rich Text Content Types | fn-8.4 GAP-1 | 4-6h |
| P1-42 | Text Edit DOM Correlation | fn-8.4 GAP-2 | 2-3h |

### Property Panels (2 gaps)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-43 | Direct Write Mode Is Placeholder | fn-8.5 GAP-1 | 4-6h |
| P1-44 | No Undo History for Panel Edits | fn-8.5 GAP-2 | 2-3h |

### Preview Mode (1 gap)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-45 | Responsive Preview Not Implemented | fn-8.6 GAP-3 | 3-4h |

### Animation/Effects Tokens (1 gap)

| ID | Gap | Source | Effort |
|----|-----|--------|--------|
| P1-46 | Missing Animation/Effects Token Categories | fn-8.7 GAP-2 | 3-4h |

---

## P2 (Medium) - 43 Gaps

Enhances UX but has workarounds.

### Variables Editor (3 gaps)
- P2-1: ColorsPanel Not Integrated (fn-8.7 GAP-8) - 2h
- P2-2: No Undo Stack for Individual Changes (fn-8.7 GAP-9) - 2h
- P2-3: Reload Doesn't Warn About Pending Changes (fn-8.7 GAP-10) - 30min

### Typography Editor (4 gaps)
- P2-4: TypographyPanel Is Component-Level (fn-8.8 GAP-4) - 2-3h
- P2-5: No Text Transform Controls (fn-8.8 GAP-10) - 30min
- P2-6: No Link-Specific Controls (fn-8.8 GAP-11) - 1-2h
- P2-7: No Code/Pre-Specific Controls (fn-8.8 GAP-12) - 1h

### Component Browser (4 gaps)
- P2-8: No Source Link/External Editor (fn-8.9 GAP-10) - 2-3h
- P2-9: No File Watcher Auto-Refresh (fn-8.9 GAP-11) - 2-3h
- P2-10: No Component Selection in Canvas (fn-8.9 GAP-12) - 4-5h
- P2-11: Folder-Based Categories Only (fn-8.9 GAP-13) - 1-2h

### Assets Manager (4 gaps)
- P2-12: No SVG Metadata Extraction (fn-8.10 GAP-8) - 2-3h
- P2-13: Images Tab Beyond Spec Scope (fn-8.10 GAP-9) - 30min
- P2-14: No Usage Tracking (fn-8.10 GAP-10) - 3-4h
- P2-15: Recently Used Mock Data (fn-8.10 GAP-11) - 1-2h

### Theme System (5 gaps)
- P2-16: No Theme Creation Workflow (fn-8.11 GAP-9) - 6-8h
- P2-17: No Theme Comparison View (fn-8.11 GAP-10) - 4-6h
- P2-18: No Token Export Formats (fn-8.11 GAP-11) - 4-6h
- P2-19: No Design Tool Import (fn-8.11 GAP-12) - 6-8h
- P2-20: No Component Manifest Support (fn-8.11 GAP-13) - 3-4h

### Canvas Editor (4 gaps)
- P2-21: No File Watcher Violation Updates (fn-8.12 GAP-6) - 3-4h
- P2-22: Rust Violations Using Regex Not SWC (fn-8.12 GAP-7) - 6-8h
- P2-23: No Violation Suggestions UI (fn-8.12 GAP-8) - 1-2h
- P2-24: No Violation Severity Filtering (fn-8.12 GAP-9) - 1-2h

### Search & Navigation (6 gaps)
- P2-25: No Spotlight/Highlight System (fn-8.13 GAP-9) - 3-4h
- P2-26: No Navigation History (fn-8.13 GAP-10) - 4-6h
- P2-27: Edit Mode Flow Incomplete (fn-8.13 GAP-11) - 4-6h
- P2-28: Missing Figma-Style Shortcuts (fn-8.13 GAP-12) - 4-6h
- P2-29: Search Not Indexed on Load (fn-8.13 GAP-13) - 4-6h
- P2-30: Function Keys Not Mappable (fn-8.13 GAP-14) - 3-4h

### Tools & Modes (5 gaps)
- P2-31: Clipboard Format Missing Full Path (fn-8.3 GAP-5) - 30min
- P2-32: HTML Element Content Preview (fn-8.3 GAP-6) - 1h
- P2-33: Escape Key Behavior (fn-8.3 GAP-7) - 30min
- P2-34: Element Highlight Outline (fn-8.3 GAP-8) - 2h
- P2-35: Violation Icon Positioning (fn-8.3 GAP-9) - 1h

### Text Edit Mode (4 gaps)
- P2-36: Single Click Instead of Double Click (fn-8.4 GAP-3) - 30min
- P2-37: No Rich Text Output Format (fn-8.4 GAP-4) - 1-2h
- P2-38: Edit Mode Indicator Missing Escape Hint (fn-8.4 GAP-5) - 10min
- P2-39: Unsaved Direct Edit Prompt Missing (fn-8.4 GAP-6) - 1h

### Property Panels (3 gaps)
- P2-40: Typography Panel Missing Token Categories (fn-8.5 GAP-3) - 1-2h
- P2-41: Layout Panel Missing Grid Gap Token Picker (fn-8.5 GAP-4) - 1h
- P2-42: RightPanel Duplicate Implementation (fn-8.5 GAP-5) - 2-4h

### Preview Mode (1 gap)
- P2-43: No Previous Mode Tracking (fn-8.6 GAP-4) - 45min

---

## P3 (Low) - 25 Gaps

Polish and nice-to-have features.

### Variables Editor (2 gaps)
- P3-1: No Smart Defaults for New Colors (fn-8.7 GAP-11) - 2h
- P3-2: No Color Harmony Tools (fn-8.7 GAP-12) - 2-3h

### Typography Editor (2 gaps)
- P3-3: No Font Preview Before Applying (fn-8.8 GAP-13) - 2h
- P3-4: No Contrast Preview (fn-8.8 GAP-14) - 2h

### Component Browser (2 gaps)
- P3-5: No Tag Search (fn-8.9 GAP-14) - 1-2h
- P3-6: No Filter UI (fn-8.9 GAP-15) - 2-3h

### Assets Manager (3 gaps)
- P3-7: No Fuzzy Search (fn-8.10 GAP-12) - 1-2h
- P3-8: No Quick Add (Drag-and-Drop) (fn-8.10 GAP-13) - 3-4h
- P3-9: No Preview in Context (fn-8.10 GAP-14) - 3-4h

### Theme System (3 gaps)
- P3-10: No Theme Marketplace (fn-8.11 GAP-14) - 40+h
- P3-11: No Theme A/B Testing (fn-8.11 GAP-15) - 20+h
- P3-12: No Theme Scheduling (fn-8.11 GAP-16) - 8-12h

### Canvas Editor (2 gaps)
- P3-13: Spatial Canvas (Deferred) (fn-8.12 GAP-10) - 40+h
- P3-14: Live React Previews (Research) (fn-8.12 GAP-11) - TBD

### Search & Navigation (3 gaps)
- P3-15: Vim Mode (fn-8.13 GAP-15) - 6-8h
- P3-16: Mini-Map (Deferred) (fn-8.13 GAP-16) - 8-12h
- P3-17: Floating Section Nav (Deferred) (fn-8.13 GAP-17) - 4-6h

### Tools & Modes (3 gaps)
- P3-18: Pill Positioning (fn-8.3 GAP-10) - 1-2h
- P3-19: Mode Indicator Shortcut Hint (fn-8.3 GAP-11) - 15min
- P3-20: Layers Panel Collapse Persistence (fn-8.3 GAP-12) - 30min

### Text Edit Mode (2 gaps)
- P3-21: Text Element Detection Overly Broad (fn-8.4 GAP-7) - 30min
- P3-22: Exit Toast Duplicate Code (fn-8.4 GAP-8) - 15min

### Property Panels (1 gap)
- P3-23: Colors Panel Missing Opacity (fn-8.5 GAP-6) - 1h

### Spec Updates (2 gaps)
- P3-24: Update 10-architecture.md (git2 → git CLI) - 1h
- P3-25: Update 10-architecture.md (tantivy → fuzzy-matcher) - 30min

---

## Quick Wins (< 1 hour, any priority)

These can be done between larger tasks:

| ID | Gap | Effort | Impact |
|----|-----|--------|--------|
| P0-19 | LLM Context Copy Format | 30min | High |
| P2-3 | Reload Warning Dialog | 30min | Medium |
| P2-31 | Clipboard Full Path | 30min | Medium |
| P2-33 | Escape Key Behavior | 30min | Low |
| P2-36 | Double Click Activation | 30min | Low |
| P2-38 | Escape Hint | 10min | Low |
| P3-19 | Mode Indicator Hint | 15min | Low |
| P3-20 | Collapse Persistence | 30min | Low |
| P3-22 | Exit Toast Dedup | 15min | Low |

---

## Dependency Graph

```
P0-8 (Theme Types) ─────────────────────────────────┐
    └─> P0-7 (Theme Module) ──┬─> P0-9 (Discovery) ─┼─> P0-10 (Switching) ─> P0-11 (Decouple)
                              │                     │
P0-22 (Asset Types) ──────────┼─> P0-23 (Asset Discovery) ─> P0-24 (Asset Commands)
                              │
P0-1 (Token Write) ───────────┤
P0-2 (Typography Write) ──────┼─> P0-3 (Wire to Editors)
                              │
P0-14 (Git Commands) ─────────┼─> P0-15 (Snapshots) ─> P0-16 (Undo Everything)
                              │
P0-12 (Preview Mode) ─────────┼─> P0-13 (PreviewShell)
                              │
P0-6 (Live Preview) ──────────┼─> P0-5 (Style Editing) ─> P0-4 (Component Write)
                              │
P0-17 (Search) ───────────────┤
P0-18 (Violations UI) ────────┤
P0-19 (LLM Format) ───────────┤ (Independent)
P0-20 (Styleguide) ───────────┤
P0-21 (Font Manager) ─────────┘
```

---

## Follow-up Epics Recommended

Based on gap analysis, these epics should be created:

### Epic: fn-9 Write Infrastructure
**Scope:** All P0 write-related gaps (P0-1 through P0-5)
**Estimated:** 35-50 hours

### Epic: fn-10 Theme System
**Scope:** All P0/P1 theme gaps (P0-7 through P0-11, P1-21 through P1-26)
**Estimated:** 25-35 hours

### Epic: fn-11 Git Integration
**Scope:** All git-related gaps (P0-14 through P0-16)
**Estimated:** 18-24 hours

### Epic: fn-12 Search & Navigation
**Scope:** Search, navigation, preferences (P0-17, P1-31 through P1-36)
**Estimated:** 40-60 hours

### Epic: fn-13 Component Browser Enhancement
**Scope:** Live preview, props playground, editing (P0-6, P1-11 through P1-16)
**Estimated:** 35-50 hours

### Epic: fn-14 Typography Editor
**Scope:** Styleguide, font manager, base element editing (P0-20, P0-21, P1-6 through P1-10)
**Estimated:** 30-45 hours

---

*Generated by fn-8.16 task as part of fn-8 Feature Reviews epic.*
