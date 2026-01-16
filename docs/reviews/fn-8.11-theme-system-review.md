# fn-8.11 Review: Theme System

**Spec:** `/docs/features/04-theme-system.md`
**Scope:** Theme discovery, management, switching, creation, and preview
**Date:** 2026-01-16
**Reviewer:** fn-8.11 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~15% |
| **Gaps Found** | 17 (P0: 3, P1: 6, P2: 5, P3: 3) |
| **Smoke Test** | MINIMAL |

The Theme System specification describes a comprehensive theme management system where themes are self-contained design packages containing components, tokens, typography, and visual identity. The editor should discover, present, switch between, and manage these themes.

**What's Implemented:**
- **Token parsing** - `parse_tokens()` command extracts `@theme` blocks from CSS
- **ThemeTokens type** - Basic Rust type for inline and public tokens
- **Single theme works** - theme-rad-os package follows the spec's preferred structure
- **radflow.config in package.json** - Theme metadata structure exists in theme-rad-os

**Critical Gaps:**
- **No Theme Discovery** - No `list_themes()` command to scan for installed themes
- **No Theme Switching** - No `switch_theme(id)` command to change active theme
- **No Theme Management UI** - No components for viewing/selecting themes
- **No Rust Theme Module** - No `commands/theme.rs` module as specified
- **Single Theme Only** - Application is hardcoded to theme-rad-os
- **No Color Mode Toggle** - No light/dark mode switching within theme

---

## Smoke Test Results

**Legend:**
- **UI EXISTS** - Component renders (but may use mock data)
- **MOCK ONLY** - Uses hardcoded data, not connected to real source
- **FUNCTIONAL** - Connected to real data sources and working
- **NOT IMPLEMENTED** - Feature does not exist

| Test | Status | Notes |
|------|--------|-------|
| Parse theme tokens | FUNCTIONAL | `parse_tokens()` extracts @theme blocks (tokens.rs:172-184) |
| Theme package structure | FUNCTIONAL | theme-rad-os follows preferred structure (spec lines 83-98) |
| Theme metadata (package.json) | FUNCTIONAL | radflow config in package.json works (theme-rad-os/package.json:58-73) |
| List available themes | NOT IMPLEMENTED | No list_themes() command |
| Display theme selector | NOT IMPLEMENTED | No theme picker UI |
| Switch active theme | NOT IMPLEMENTED | No switch_theme() command |
| Theme preview mode | NOT IMPLEMENTED | Cannot preview without switching |
| Theme comparison view | NOT IMPLEMENTED | No side-by-side view |
| Light/dark mode toggle | NOT IMPLEMENTED | No color mode switching |
| Create new theme | NOT IMPLEMENTED | No theme creation workflow |
| Theme from template | NOT IMPLEMENTED | No template system |
| Theme validation | NOT IMPLEMENTED | No completeness checking |
| Theme export formats | NOT IMPLEMENTED | No DTCG/Style Dictionary export |
| Component manifest | NOT IMPLEMENTED | No optional manifest for richer metadata |
| Theme settings panel | NOT IMPLEMENTED | No theme-specific configuration |
| Rust Theme module | NOT IMPLEMENTED | No commands/theme.rs exists |

---

## Priority Criteria

- **P0 (Critical):** Blocks basic functionality, feature cannot work without this (~2-6 hours to fix)
- **P1 (High):** Required for MVP user experience, core spec feature (~2-8 hours)
- **P2 (Medium):** Enhances UX but not required for launch, has workarounds (~1-4 hours)
- **P3 (Low):** Polish, optimization, nice-to-have (~1-4 hours)

---

## Detailed Gap Analysis

### P0 (Critical) - 3 Issues

#### GAP-0: No Rust Theme Module

**Condition:** The spec (04-theme-system.md) and architecture spec (10-tauri-architecture.md) both specify theme commands, but no `commands/theme.rs` module exists.

**Criteria:** Architecture spec section (lines 473-476) shows:
```
│   │   │   ├── git.rs        # Git commands
│   │   │   ├── parser.rs     # Parser commands
│   │   │   ├── project.rs    # Project commands
│   │   │   └── theme.rs      # Theme commands
```

Current commands in `src-tauri/src/commands/mod.rs`:
```rust
pub mod components;
pub mod dev_server;
pub mod file_write;
pub mod project;
pub mod text_edit;
pub mod tokens;
pub mod violations;
pub mod watcher;
```

No `theme` module.

**Effect:** This is a **blocking dependency** for all theme functionality. Without this module, cannot implement:
- `list_themes()` - Discover installed themes
- `switch_theme(id)` - Change active theme
- `get_theme_paths(id)` - Resolve theme file locations
- `save_theme_changes(id, changes)` - Persist modifications

**Recommendation:**
1. Create `src-tauri/src/commands/theme.rs`
2. Add `pub mod theme;` to `commands/mod.rs`
3. Define Rust types in `types/mod.rs`:
```rust
#[derive(Debug, Serialize, Deserialize, specta::Type)]
pub struct ThemeInfo {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub version: String,
    pub path: String,
    pub color_mode: String,
    pub is_active: bool,
}
```

**Priority:** P0 - **BLOCKS: GAP-1, GAP-2, GAP-3, GAP-5, GAP-7, GAP-8, GAP-9, GAP-11, GAP-12**
**Estimated Fix:** 2-3 hours

---

#### GAP-1: No Theme Discovery Command

**Condition:** The spec's core functionality—discovering installed themes—is completely missing. The application is hardcoded to use theme-rad-os only.

**Criteria:** Spec section "Commands Needed" (lines 506-510):
- `list_themes()` → Available themes with metadata

And architecture spec (line 267):
- `list_themes` | - | themes: Vec<Theme>

**Effect:** Users cannot:
- See available themes in their project
- Switch between themes
- Add new themes to the project

The application is locked to a single hardcoded theme.

**Recommendation:**
1. Scan for packages with `"radflow": { "type": "theme" }` in package.json
2. Parse theme metadata from package.json radflow config
3. Return list of ThemeInfo objects
4. Cache results and refresh on package.json changes

Implementation sketch:
```rust
#[tauri::command]
pub fn list_themes(project_root: String) -> Result<Vec<ThemeInfo>, String> {
    // Scan node_modules for @radflow/theme-* packages
    // Also scan project root for local themes
    // Parse package.json for radflow.type === "theme"
}
```

**Priority:** P0 - Without this, multi-theme support impossible
**Dependencies:** Requires GAP-0 (Rust theme module)
**Estimated Fix:** 3-4 hours

---

#### GAP-2: No Theme Switching Command

**Condition:** Cannot change the active theme. Spec describes switch action but no command exists.

**Criteria:** Spec section "Switch Action" (lines 221-230):
- "Select new theme from available options"
- "System updates CSS import references"
- "Page refreshes with new theme"
- "Editor loads new theme's token values"

And spec section "Commands Needed" (lines 506-510):
- `switch_theme(id)` → Update active theme

Architecture spec (line 269):
- `switch_theme` | theme_id: String | success: bool

**Effect:** Users are locked to whichever theme was initially configured. Cannot experience or work with multiple themes.

**Recommendation:**
1. Update project configuration to track active theme
2. Update CSS import statements in entry file
3. Emit event to frontend to refresh theme context
4. Reload tokens via `parse_tokens()` with new theme's CSS

```rust
#[tauri::command]
pub fn switch_theme(project_root: String, theme_id: String) -> Result<(), String> {
    // 1. Validate theme exists
    // 2. Update radflow.config.json or equivalent
    // 3. Update CSS imports in main entry
    // 4. Emit "theme-changed" event to frontend
}
```

**Priority:** P0 - Core functionality per spec
**Dependencies:** Requires GAP-0 (Rust theme module) and GAP-1 (list_themes)
**Estimated Fix:** 4-6 hours

---

### P1 (High) - 6 Issues

#### GAP-3: No Theme Management UI

**Condition:** No frontend components for viewing or selecting themes.

**Criteria:** Spec section "Available Themes" (lines 246-255):
```
Display:
- Theme name and description
- Preview swatch/image
- Version information
- Active indicator
```

And spec section "Theme Management" (lines 243-280) describes:
- Available Themes view
- Add Theme action
- Remove Theme action
- Theme Settings

No `ThemePanel`, `ThemePicker`, or similar component exists in `/src/components/`.

**Effect:** Users have no visual interface to:
- See which themes are available
- Compare themes visually
- Switch between themes
- Access theme-specific settings

**Recommendation:**
1. Create `src/components/ThemePanel.tsx`
2. Show list of available themes from `list_themes()`
3. Display theme swatches/previews
4. Add "Set Active" button triggering `switch_theme()`
5. Add to left panel navigation

**Priority:** P1 - Required for any multi-theme UX
**Dependencies:** Requires GAP-0 (Rust module), GAP-1 (list_themes), GAP-2 (switch_theme)
**Estimated Fix:** 4-6 hours

---

#### GAP-4: No Color Mode Toggle

**Condition:** Cannot switch between light/dark modes within a theme.

**Criteria:** Spec section "Theme vs Color Mode" (lines 47-52):
- "Theme: Complete visual identity (brand A vs brand B)"
- "Color Mode: Light/dark variation within a theme"
- "A theme contains both light and dark modes"
- "Switching modes changes light/dark within current theme"

The theme-rad-os package includes `dark.css` with `.dark` class overrides, but:
- No UI toggle to apply `.dark` class
- No mode persistence
- No system preference detection

**Effect:** Users cannot:
- Switch to dark mode
- Respect system preferences
- Preview components in both modes

**Recommendation:**
1. Add color mode toggle to toolbar/settings
2. Apply `.dark` class to `<html>` element
3. Persist preference in localStorage or config
4. Optionally detect `prefers-color-scheme`

```typescript
// Example hook
function useColorMode() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);
  return [mode, setMode];
}
```

**Priority:** P1 - Expected modern app behavior
**Estimated Fix:** 2-3 hours

---

#### GAP-5: No Theme Persistence

**Condition:** Active theme selection is not persisted.

**Criteria:** Spec section "Theme Persistence" (lines 232-240):
- "Active theme ID saved to configuration"
- "Restored on project reload"
- "Per-project theme selection"
- "Default theme if none specified"

No configuration mechanism exists to store active theme ID per project.

**Effect:** Theme selection would be lost on app restart (if switching were implemented).

**Recommendation:**
1. Create `radflow.config.json` at project root OR
2. Use `radflow` section in root `package.json`
3. Store `activeTheme` field
4. Read on project load
5. Fall back to first available theme

**Priority:** P1 - Required for multi-theme workflow
**Dependencies:** Requires GAP-2 (switch_theme)
**Estimated Fix:** 2-3 hours

---

#### GAP-6: No Rust Type Definitions for Themes

**Condition:** The `src-tauri/src/types/mod.rs` file has `ThemeTokens` but lacks theme management types.

**Criteria:** Spec section "Theme Metadata" (lines 68-77):
```
Metadata Fields:
- Theme ID (unique identifier)
- Display name
- Description
- Version
- Author/maintainer
- Preview image
```

Current types in `types/mod.rs` only include:
- `ThemeTokens` (inline and public token maps)

Missing types:
- `ThemeInfo` - Theme metadata
- `ThemeConfig` - Theme configuration
- `ColorMode` - Light/dark enum

**Effect:** Cannot define strongly-typed theme commands without these types.

**Recommendation:**
Add to `types/mod.rs`:
```rust
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ThemeInfo {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub version: String,
    pub path: String,
    pub color_mode: String,
    pub is_active: bool,
    pub preview_image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ThemeConfig {
    pub active_theme: Option<String>,
    pub color_mode: ColorMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum ColorMode {
    Light,
    Dark,
    System,
}
```

**Priority:** P1 - Required for GAP-0 implementation
**Estimated Fix:** 1-2 hours

---

#### GAP-7: No Theme Preview Mode

**Condition:** Cannot preview a theme without fully switching to it.

**Criteria:** Spec section "Preview Mode" (lines 329-337):
- "Apply theme visually without switching"
- "Editor stays on current theme"
- "Quick look at other themes"
- "Exit returns to active theme"

**Effect:** Users must commit to switching themes to see how they look. Cannot "try before buying."

**Recommendation:**
1. Add `preview_theme(id)` command that temporarily applies theme CSS
2. Track "preview" vs "active" state
3. Add "Exit Preview" button that reverts to active theme
4. Apply via CSS class swapping rather than file changes

**Priority:** P1 - Important for theme exploration UX
**Dependencies:** Requires GAP-1 (list_themes)
**Estimated Fix:** 3-4 hours

---

#### GAP-8: No Theme Validation

**Condition:** No validation that themes are complete and correct.

**Criteria:** Spec section "Token Consistency" and "Token Coverage" (lines 349-366):
- "Same semantic token names across themes"
- "Missing tokens flagged"
- "Warnings for incomplete themes"
- "Suggestions for required values"

And spec section "Ideal Behaviors" (lines 447-449):
- "Comprehensive validation that theme meets all requirements"
- "Accessibility checking across all tokens"

**Effect:** Incomplete themes could be installed without warning. Users may encounter missing tokens or styles.

**Recommendation:**
1. Define required token schema
2. Validate on theme discovery
3. Report missing/invalid tokens
4. Show warnings in theme list UI

**Priority:** P1 - Important for theme quality
**Dependencies:** Requires GAP-1 (list_themes)
**Estimated Fix:** 3-4 hours

---

### P2 (Medium) - 5 Issues

#### GAP-9: No Theme Creation Workflow

**Condition:** Cannot create new themes from within the editor.

**Criteria:** Spec section "Theme Creation" (lines 282-315):
- "New Theme from Scratch" workflow
- "New Theme from Template" options
- Templates: Minimal, Standard, Rich, Clone

**Effect:** Users must manually create theme packages. Cannot quickly scaffold new themes.

**Recommendation:**
1. Create `create_theme()` command with template parameter
2. Templates: minimal (just tokens), standard (tokens + typography), rich (full component set)
3. Clone option to duplicate existing theme
4. UI wizard for theme creation

**Priority:** P2 - Enhancement, users can create manually
**Estimated Fix:** 6-8 hours

---

#### GAP-10: No Theme Comparison View

**Condition:** Cannot compare themes side-by-side.

**Criteria:** Spec section "Theme Comparison" (lines 319-327):
- "Side-by-side theme rendering"
- "Same component, different themes"
- "Quick visual comparison"
- "Identify inconsistencies"

**Effect:** Users must switch themes back and forth to compare. Cannot see differences at a glance.

**Recommendation:**
1. Add comparison mode to theme panel
2. Render component previews with different themes applied
3. Show token value differences
4. Highlight inconsistencies

**Priority:** P2 - Nice to have for power users
**Estimated Fix:** 4-6 hours

---

#### GAP-11: No Token Export Formats

**Condition:** Cannot export theme tokens to other formats.

**Criteria:** Spec section "Ideal Behaviors" (lines 453-455):
- "Export theme as CSS custom properties, JSON tokens, Tailwind config, or other formats"

And spec section "Research Notes" (lines 486-490):
- DTCG (Design Tokens Community Group) format
- Figma Tokens plugin format
- Style Dictionary format
- Tailwind config generation

**Effect:** Themes are locked to RadFlow. Cannot share with other tools or team members using different tooling.

**Recommendation:**
1. Add `export_theme(id, format)` command
2. Support formats: CSS custom properties, JSON, DTCG, Style Dictionary
3. UI for export with format selection

**Priority:** P2 - Interoperability enhancement
**Dependencies:** Requires GAP-1 (list_themes)
**Estimated Fix:** 4-6 hours

---

#### GAP-12: No Theme Import from Design Tools

**Condition:** Cannot import tokens from Figma or other design tools.

**Criteria:** Spec section "Ideal Behaviors" (line 455):
- "Import from design tools"

**Effect:** Must manually recreate tokens from design files. No bridge between design and development.

**Recommendation:**
1. Support Figma Tokens JSON import
2. Support Style Dictionary import
3. Map imported tokens to RadFlow token structure

**Priority:** P2 - Workflow enhancement
**Estimated Fix:** 6-8 hours

---

#### GAP-13: No Component Manifest Support

**Condition:** Optional component manifest not implemented.

**Criteria:** Spec section "Component Manifest" (lines 193-209):
```
Manifest Provides:
- Component categorization
- Explicit variant enumeration
- Size options
- Compound component relationships
- Preview configuration
- Documentation hints
```

**Effect:** Editor relies solely on file scanning and prop inference. Cannot access richer metadata.

**Recommendation:**
1. Define optional `components.manifest.json` schema
2. Parse manifest during theme discovery
3. Use manifest data to enhance component browser
4. Fall back to inference when manifest absent

**Priority:** P2 - Enhancement for complex themes
**Estimated Fix:** 3-4 hours

---

### P3 (Low) - 3 Issues

#### GAP-14: No Theme Marketplace

**Condition:** No browsing/installing community themes.

**Criteria:** Spec section "Ideal Behaviors" (lines 450-452):
- "Browse and install community themes"
- "Share themes publicly"
- "Rate and review themes"

**Effect:** Theme distribution is manual. No ecosystem discovery.

**Recommendation:** Future feature - requires infrastructure beyond the app.

**Priority:** P3 - Future enhancement
**Estimated Fix:** 40+ hours (infrastructure needed)

---

#### GAP-15: No Theme A/B Testing

**Condition:** Cannot run theme experiments.

**Criteria:** Spec section "Ideal Behaviors" (lines 456-458):
- "Support for theme experiments"
- "Toggle between themes for user testing"
- "Analytics on theme preference"

**Effect:** Cannot gather user feedback on theme variations.

**Recommendation:** Future feature.

**Priority:** P3 - Advanced feature
**Estimated Fix:** 20+ hours

---

#### GAP-16: No Theme Scheduling

**Condition:** Cannot schedule automatic theme changes.

**Criteria:** Spec section "Ideal Behaviors" (lines 459-461):
- "Automatically switch themes based on time, season, or events"
- "Support for temporary promotional themes"

**Effect:** Themes must be changed manually.

**Recommendation:** Future feature.

**Priority:** P3 - Advanced feature
**Estimated Fix:** 8-12 hours

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| Single theme focus initially | MVP focuses on getting one theme working well before multi-theme support |
| package.json radflow config vs separate file | Using package.json is cleaner for npm packages, matches spec alternative |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Theme inheritance mentioned then contradicted | Lines 39-44 vs 524 | Clarify: spec says "Themes don't inherit" but Open Questions asks "allow themes to extend other themes?" |
| Default theme behavior | Lines 237-240 | How to determine default theme? First alphabetically? Explicit config? |
| CSS import update mechanism | Lines 224-225 | Needs more detail on how "system updates CSS import references" |
| Configuration file location | Lines 232-240 | radflow.config.json? Or package.json? Or both? |
| Multi-brand clarification | Lines 462-466 | How does multi-brand differ from multi-theme? Same mechanism? |

---

## Implementation Quality Notes

### Current Strengths

1. **Token parsing works** - `parse_tokens()` successfully extracts @theme blocks
2. **Theme package structure solid** - theme-rad-os follows spec's preferred CSS-at-root structure
3. **Metadata in package.json** - radflow config section provides theme info
4. **Component library complete** - theme-rad-os has comprehensive components
5. **Dark mode CSS exists** - dark.css with .dark class overrides ready

### Critical Gaps

1. **No multi-theme discovery** - Locked to single hardcoded theme
2. **No switching mechanism** - Cannot change themes
3. **No management UI** - No visual theme selection
4. **No Rust backend** - Theme commands not implemented
5. **No color mode toggle** - Dark mode CSS exists but no activation UI

---

## Relationship to Other Features

| Feature | Relationship |
|---------|--------------|
| Variables Editor (fn-8.7) | Uses ThemeTokens, would need to switch token source on theme change |
| Typography Editor (fn-8.8) | Typography is theme-specific, needs theme context |
| Component Browser (fn-8.9) | Components come from theme, need multi-theme awareness |
| Project Detection (project.rs) | Could detect available themes during project scan |
| File Watcher (watcher.rs) | Could trigger theme rescan on package.json changes |

---

## Integration Test Plan

Once implemented, verify the complete feature works end-to-end:

### Prerequisites
1. Install multiple themes:
   ```
   packages/
   ├── theme-rad-os/      # Existing
   └── theme-minimal/     # Test theme
   ```

### Test Cases

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | App loads with themes | list_themes() returns both themes |
| 2 | Theme selector appears | UI shows available themes |
| 3 | Active theme indicated | Current theme has visual indicator |
| 4 | Switch theme | switch_theme() updates active, UI refreshes |
| 5 | Tokens update on switch | Variables panel shows new theme's tokens |
| 6 | Components update on switch | Component browser shows theme's components |
| 7 | Persistence works | Restart app, same theme active |
| 8 | Dark mode toggle | Click toggle, dark.css applied |
| 9 | Preview mode | Preview theme without committing |
| 10 | Exit preview | Returns to original theme |
| 11 | Theme validation | Incomplete theme shows warnings |
| 12 | Create theme | New theme scaffolded from template |

### Error Cases

| # | Test | Expected Result |
|---|------|-----------------|
| E1 | No themes found | Show "No themes installed" message |
| E2 | Invalid theme package | Skip, log warning, continue with valid themes |
| E3 | Switch to non-existent theme | Error message, stay on current |
| E4 | Corrupt theme config | Graceful fallback to default |

---

## Follow-up Tasks Recommended

### Dependency Graph

```
GAP-6 (Types) ────> GAP-0 (Rust Module) ──┬──> GAP-1 (Discovery) ──┬──> GAP-3 (UI)
                                          │                        ├──> GAP-7 (Preview)
                                          │                        ├──> GAP-8 (Validation)
                                          │                        ├──> GAP-10 (Comparison)
                                          │                        └──> GAP-11 (Export)
                                          │
                                          └──> GAP-2 (Switching) ──> GAP-5 (Persistence)

GAP-4 (Color Mode) ────> (Independent)
GAP-9 (Creation) ──────> (Requires GAP-0, GAP-1)
GAP-12 (Import) ───────> (Requires GAP-0)
GAP-13 (Manifest) ─────> (Requires GAP-1)
GAP-14, 15, 16 ────────> (Future features)
```

### Task List

1. **fn-8.11.0** - Add Rust type definitions for ThemeInfo, ThemeConfig, ColorMode (P1, GAP-6) **[BLOCKS: 2]**
2. **fn-8.11.1** - Create commands/theme.rs module (P0, GAP-0) **[DEPENDS: 1] [BLOCKS: 3,4,7,8,9,10,11,12,13]**
3. **fn-8.11.2** - Implement list_themes() command (P0, GAP-1) **[DEPENDS: 2] [BLOCKS: 5,8,9,11,12,13]**
4. **fn-8.11.3** - Implement switch_theme() command (P0, GAP-2) **[DEPENDS: 2] [BLOCKS: 6]**
5. **fn-8.11.4** - Create ThemePanel.tsx UI (P1, GAP-3) **[DEPENDS: 3,4]**
6. **fn-8.11.5** - Add theme persistence (P1, GAP-5) **[DEPENDS: 4]**
7. **fn-8.11.6** - Add color mode toggle (P1, GAP-4)
8. **fn-8.11.7** - Add theme preview mode (P1, GAP-7) **[DEPENDS: 3]**
9. **fn-8.11.8** - Add theme validation (P1, GAP-8) **[DEPENDS: 3]**
10. **fn-8.11.9** - Add theme creation workflow (P2, GAP-9) **[DEPENDS: 2,3]**
11. **fn-8.11.10** - Add theme comparison view (P2, GAP-10) **[DEPENDS: 3]**
12. **fn-8.11.11** - Add token export formats (P2, GAP-11) **[DEPENDS: 3]**
13. **fn-8.11.12** - Add design tool import (P2, GAP-12) **[DEPENDS: 2]**
14. **fn-8.11.13** - Add component manifest support (P2, GAP-13) **[DEPENDS: 3]**
15. **fn-8.11.14** - Future: Theme marketplace (P3, GAP-14)
16. **fn-8.11.15** - Future: A/B testing (P3, GAP-15)
17. **fn-8.11.16** - Future: Theme scheduling (P3, GAP-16)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `docs/features/04-theme-system.md` | Specification | 526 |
| `docs/features/10-tauri-architecture.md` | Architecture spec (theme commands) | 500+ |
| `src-tauri/src/commands/mod.rs` | Command modules (no theme module) | 13 |
| `src-tauri/src/commands/tokens.rs` | Token parsing (parse_tokens) | 234 |
| `src-tauri/src/types/mod.rs` | Type definitions (ThemeTokens only) | 81 |
| `src/bindings.ts` | Tauri command bindings (no theme commands) | 483 |
| `src/stores/types.ts` | Store types (TokensSlice exists) | 394 |
| `packages/theme-rad-os/package.json` | Theme metadata | 74 |
| `packages/theme-rad-os/tokens.css` | Token definitions | - |
| `packages/theme-rad-os/dark.css` | Dark mode overrides | - |
