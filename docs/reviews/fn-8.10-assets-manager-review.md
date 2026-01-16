# fn-8.10 Review: Assets Manager

**Spec:** `/docs/features/05-assets-manager.md`
**Scope:** Icons, logos, and visual assets browsing, organization, and management
**Date:** 2026-01-16
**Reviewer:** fn-8.10 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~20% |
| **Gaps Found** | 14 (P0: 2, P1: 5, P2: 4, P3: 3) |
| **Smoke Test** | PARTIAL |

The Assets Manager specification describes a browser for theme-owned visual assets (icons and logos) with click-to-copy functionality, size configuration, and native filesystem integration. The current implementation has:

**What's Implemented:**
- **AssetsPanel.tsx** - Basic UI with sub-tabs for Icons, Logos, and Images
- **Icon Size Selector** - Preview icons at 16, 20, 24, or 32px
- **Click to Copy** - Single click copies asset name to clipboard
- **Search** - Real-time filtering by name
- **Grid Display** - Assets displayed in grid layout
- **Copy Toast** - Visual feedback when item copied

**Critical Gaps:**
- **Mock Data Only** - Uses hardcoded mock data, no actual asset discovery from filesystem
- **No Rust Backend** - No commands for `list_icons()`, `list_logos()`, `get_icon_sizes()`
- **No "Open in Finder"** - Cannot open asset directory in native file browser
- **No Right-Click Context Menu** - Cannot select size via context menu
- **No Size Configuration** - Cannot add/edit/remove size options
- **No File Watcher Integration** - Assets don't refresh on filesystem changes

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Icons tab displays | PASS | Sub-tab shows grid of icons (AssetsPanel.tsx:576-583) |
| Logos tab displays | PASS | Sub-tab shows grouped logo variants (AssetsPanel.tsx:584-590) |
| Images tab displays | PASS | Sub-tab shows image files (AssetsPanel.tsx:591-597) |
| Icon size selector | PASS | Buttons to switch preview size (AssetsPanel.tsx:557-564) |
| Size options available | PASS | 16, 20, 24, 32px options (AssetsPanel.tsx:537) |
| Click copies icon name | PASS | Copies JSX code `<Icon name="x" size={n} />` (AssetsPanel.tsx:308-312) |
| Click copies logo name | PASS | Copies logo name to clipboard (AssetsPanel.tsx:394-397) |
| Toast confirms copy | PASS | "Copied: {name}" toast shows (AssetsPanel.tsx:606-610) |
| Search filters icons | PASS | Real-time filtering by name (AssetsPanel.tsx:299-303) |
| Search filters logos | PASS | Real-time filtering by name (AssetsPanel.tsx:376-380) |
| Logos grouped by variant | PASS | Grouped by `wordmark`, `mark` variants (AssetsPanel.tsx:383-392) |
| Recently used icons | PASS | Shows "Recently Used" section (mock, AssetsPanel.tsx:306, 317-335) |
| Asset discovery from theme | NOT IMPLEMENTED | Uses MOCK_ICONS, MOCK_LOGOS, MOCK_IMAGES (lines 82-121) |
| Rust backend commands | NOT IMPLEMENTED | No list_icons, list_logos, reveal_in_finder commands |
| Open in Finder button | NOT IMPLEMENTED | No native filesystem integration |
| Right-click context menu | NOT IMPLEMENTED | No context menu for size options |
| Size configuration panel | NOT IMPLEMENTED | Cannot edit size scale |
| File watcher integration | NOT IMPLEMENTED | No auto-refresh on asset changes |
| Usage tracking | NOT IMPLEMENTED | No tracking of which icons are used |
| SVG metadata parsing | NOT IMPLEMENTED | No viewBox/dimension extraction |

---

## Detailed Gap Analysis

### P0 (Critical) - 2 Issues

#### GAP-1: No Asset Discovery from Filesystem

**Condition:** The spec's core functionality—discovering icons and logos from the theme's filesystem—is completely missing. The panel uses hardcoded mock data.

**Criteria:** Spec section "Asset Discovery" (lines 263-269):
- "Scan theme's assets directory"
- "Match SVG files to icon names"
- "Refresh on file changes"

And spec "Research Notes" (lines 319-330):
- `list_icons(theme_path)` → Icon names and metadata
- `list_logos(theme_path)` → Logo variants
- `get_icon_sizes(theme_path)` → Configured size scale

Current implementation (AssetsPanel.tsx:82-121):
```typescript
const MOCK_ICONS: AssetItem[] = [
  { name: "home", type: "icon" },
  { name: "settings", type: "icon" },
  // ... 22 more hardcoded items
];
```

**Effect:** The Assets Manager cannot be used in practice. Users cannot:
- See actual icons from their theme
- Discover new icons added to the project
- Browse real logo variants

**Recommendation:**
1. Create `src-tauri/src/commands/assets.rs` module
2. Implement `list_icons(theme_path)` - scan `assets/icons/` directory for SVG files
3. Implement `list_logos(theme_path)` - scan `assets/logos/` directory
4. Generate TypeScript bindings via tauri-specta
5. Replace mock data with Tauri command calls

**Priority:** P0 - Without this, the feature is non-functional
**Estimated Fix:** 4-6 hours
- 2-3 hours: Rust commands for directory scanning
- 1-2 hours: TypeScript integration
- 1 hour: Replace mock data with API calls

---

#### GAP-2: No Rust Backend for Assets

**Condition:** No Tauri commands exist for asset management. The spec lists 4 required commands; none are implemented.

**Criteria:** Spec section "Commands Needed" (lines 331-335):
- `list_icons(theme_path)` → Icon names and metadata
- `list_logos(theme_path)` → Logo variants
- `reveal_in_finder(path)` → Open native file browser
- `get_icon_sizes(theme_path)` → Configured size scale

Current commands in bindings.ts show no asset-related functions.

**Effect:** Frontend cannot interact with the filesystem for assets. All functionality depends on mock data.

**Recommendation:**
1. Create `commands/assets.rs` with these signatures:
```rust
#[tauri::command]
pub fn list_icons(theme_path: String) -> Result<Vec<IconInfo>, String>;

#[tauri::command]
pub fn list_logos(theme_path: String) -> Result<Vec<LogoInfo>, String>;

#[tauri::command]
pub fn reveal_in_finder(path: String) -> Result<(), String>;

#[tauri::command]
pub fn get_icon_sizes(theme_path: String) -> Result<IconSizeConfig, String>;
```
2. Use `tauri::api::shell::open` or `@tauri-apps/plugin-opener` for Finder reveal
3. Register commands in `lib.rs`

**Priority:** P0 - Required for any real functionality
**Estimated Fix:** 6-8 hours

---

### P1 (High) - 5 Issues

#### GAP-3: No "Open in Finder" Button

**Condition:** The spec describes an "Open in Finder" button to offload file management to native filesystem. Not implemented.

**Criteria:** Spec section "Open in Finder" (lines 184-200):
- "Click 'Open in Finder' button"
- "Opens theme's assets directory in native file browser"
- "User can add, rename, organize files there"
- "Assets Manager refreshes on focus return"

The spec explicitly states (lines 195-199):
- "Native file management is better than building it"
- "Drag-and-drop already works in Finder"
- "Keeps editor focused on design work"

**Effect:** Users must manually navigate to asset directories. Cannot easily add or organize assets.

**Recommendation:**
1. Add "Open in Finder" button to panel header (matching spec wireframe line 35)
2. Use `@tauri-apps/plugin-opener` (already in dependencies) to open directory
3. Implement `reveal_in_finder(path)` Rust command as fallback
4. Add focus listener to refresh assets when window regains focus

**Priority:** P1 - Core philosophy of offloading to native tools
**Estimated Fix:** 2-3 hours

---

#### GAP-4: No Right-Click Context Menu

**Condition:** The spec describes right-click menus for icons and logos with size/variant options. Not implemented.

**Criteria:** Spec section "Right-Click Context Menu" for icons (lines 61-80):
```
┌─────────────────────┐
│ Copy "search"       │
├─────────────────────┤
│ sm (16px)          │
│ md (20px)       ✓  │
│ lg (24px)          │
│ xl (32px)          │
├─────────────────────┤
│ Edit sizes...       │
└─────────────────────┘
```

And for logos (lines 162-171):
```
┌─────────────────────┐
│ Copy "wordmark"     │
├─────────────────────┤
│ View in Finder      │
│ Edit variant...     │
└─────────────────────┘
```

**Effect:** Users must use the top-bar size selector for all icons. Cannot quickly copy with specific size. Cannot access "View in Finder" for individual assets.

**Recommendation:**
1. Add `onContextMenu` handler to icon/logo items
2. Create `AssetContextMenu` component with size options
3. Copy includes size in JSX: `<Icon name="search" size="sm" />`
4. Add "View in Finder" option for individual files

**Priority:** P1 - Important UX for power users
**Estimated Fix:** 3-4 hours

---

#### GAP-5: No Size Configuration Panel

**Condition:** Cannot edit the available icon size options. Spec describes a configuration panel.

**Criteria:** Spec section "Size Configuration" (lines 82-101):
```
ICON SIZES
─────────────────────
sm:  [16] px
md:  [20] px  (default)
lg:  [24] px
xl:  [32] px

[+ Add Size]
```

Behavior described:
- Edit pixel values
- Set default size
- Add/remove size options
- Changes persist to theme

Current implementation (AssetsPanel.tsx:537):
```typescript
const iconSizeOptions: IconSizeOption[] = [16, 20, 24, 32]; // Hardcoded
```

**Effect:** Theme authors cannot customize icon sizes for their design system. Locked to 16/20/24/32 preset.

**Recommendation:**
1. Create `IconSizeEditor` component
2. Store sizes in theme config file (manifest or dedicated file)
3. Add `get_icon_sizes(theme_path)` and `set_icon_sizes(theme_path, sizes)` commands
4. Add "Edit sizes..." option accessible from context menu or settings

**Priority:** P1 - Required for theme customization
**Estimated Fix:** 4-5 hours

---

#### GAP-6: No External Icon Library Support

**Condition:** Spec describes support for external icon libraries (Phosphor, Lucide, Heroicons). Not implemented.

**Criteria:** Spec section "External Icon Libraries" (lines 220-228):
- Themes can use external icon packages instead of bundling SVGs
- "Phosphor Icons (`@phosphor-icons/react`)"
- "Lucide Icons (`lucide-react`)"
- "Heroicons (`@heroicons/react`)"
- "RadFlow discovers available icons by scanning the library's exports"

**Effect:** Themes using external icon libraries cannot browse icons in the Assets Manager.

**Recommendation:**
1. Detect which icon library is used (scan package.json)
2. Parse library exports to enumerate available icons
3. For Phosphor/Lucide/Heroicons, maintain known icon lists or parse at runtime
4. Show library icons alongside bundled SVGs

**Priority:** P1 - Many themes use external libraries
**Estimated Fix:** 6-8 hours (complex due to library variations)

---

#### GAP-7: No File Watcher Integration

**Condition:** Assets don't refresh when files change in the assets directory.

**Criteria:** Spec section "Asset Discovery" (line 268):
- "Refresh on file changes"

And spec section "Open in Finder" (line 192):
- "Assets Manager refreshes on focus return"

The app has a file watcher (`commands/watcher.rs`) but it's not connected to asset scanning.

**Effect:** Users must manually refresh or reopen panel after adding/removing assets.

**Recommendation:**
1. Subscribe to watcher events for `assets/icons/` and `assets/logos/` directories
2. Trigger asset rescan on relevant file events
3. Debounce to prevent excessive rescans
4. Also refresh on window focus gain

**Priority:** P1 - Expected behavior for live editing
**Estimated Fix:** 2-3 hours

---

### P2 (Medium) - 4 Issues

#### GAP-8: No SVG Metadata Extraction

**Condition:** Cannot parse SVG viewBox or dimensions for intelligent display.

**Criteria:** Spec section "Research Required" (lines 303-306):
- "SVG metadata extraction (viewBox, dimensions)"
- "SVG sprite generation (optional optimization)"

**Effect:** Cannot display icons at optimal sizes or show dimension info.

**Recommendation:**
1. Parse SVG files in Rust to extract viewBox
2. Include dimensions in `IconInfo` struct
3. Use metadata to suggest appropriate display sizes

**Priority:** P2 - Nice to have for power users
**Estimated Fix:** 2-3 hours

---

#### GAP-9: Images Tab Beyond Spec Scope

**Condition:** The panel includes an "Images" tab, but spec explicitly excludes images.

**Criteria:** Spec section "What it doesn't own" (lines 13-15):
- "Fonts (Typography Editor)"
- "**Images (project-specific, use Finder)**"
- "File organization (offload to native filesystem)"

The AssetsPanel.tsx includes MOCK_IMAGES and ImagesContent component (lines 116-121, 450-513).

**Effect:** Scope creep beyond spec. Images should be handled via Finder, not built into Assets Manager.

**Recommendation:**
Either:
1. Remove Images tab to match spec scope, OR
2. Update spec to include images if this is a deliberate enhancement

**Priority:** P2 - Spec divergence, may be intentional
**Estimated Fix:** 30 minutes (remove) or 1 hour (spec update)

---

#### GAP-10: No Usage Tracking

**Condition:** Cannot see which icons are used in the project.

**Criteria:** Spec section "Ideal Behaviors" (lines 275-276):
- "Show which icons are used in the project"
- "Identify unused icons"

**Effect:** Cannot audit icon usage or identify opportunities to remove unused icons.

**Recommendation:**
1. Scan project TSX files for `<Icon name="..." />` patterns
2. Mark icons as "used" or "unused" in UI
3. Add filter to show only used/unused icons

**Priority:** P2 - Nice to have for maintenance
**Estimated Fix:** 3-4 hours

---

#### GAP-11: Recently Used from localStorage (Not Implemented)

**Condition:** "Recently Used" section exists but uses hardcoded mock data, not actual history.

**Criteria:** Spec section "Ideal Behaviors" implies recent usage should be tracked.

Current implementation (AssetsPanel.tsx:305-306):
```typescript
// Get recently used from localStorage (simplified mock)
const recentIcons = useMemo(() => MOCK_ICONS.slice(0, 5), []); // Just first 5
```

**Effect:** "Recently Used" shows same icons every time. Doesn't help users find frequently-used assets.

**Recommendation:**
1. Use `@tauri-apps/plugin-store` to persist recent icons
2. Update list when icon is copied
3. Limit to last N unique icons (e.g., 10)

**Priority:** P2 - UX improvement
**Estimated Fix:** 1-2 hours

---

### P3 (Low) - 3 Issues

#### GAP-12: No Fuzzy Search

**Condition:** Search is exact substring match, not fuzzy.

**Criteria:** Spec section "Ideal Behaviors" (line 273):
- "Forgiving search that finds icons even with typos"

Current implementation (AssetsPanel.tsx:301-302):
```typescript
return MOCK_ICONS.filter((icon) => icon.name.toLowerCase().includes(query));
```

**Effect:** Typos like "hom" won't find "home", "srch" won't find "search".

**Recommendation:**
1. Use `fuzzy-matcher` crate (already in project stack)
2. Score matches and show best results first
3. Highlight matching portions

**Priority:** P3 - Nice to have
**Estimated Fix:** 1-2 hours

---

#### GAP-13: No Quick Add (Drag-and-Drop)

**Condition:** Cannot drag SVG onto panel to add new icon.

**Criteria:** Spec section "Ideal Behaviors" (lines 278-279):
- "Drag SVG onto panel to add new icon"
- "Auto-names from filename"

**Effect:** Must manually copy files to assets directory.

**Recommendation:**
1. Add drop zone to panel
2. Handle drag-and-drop events
3. Copy dropped file to assets directory
4. Trigger rescan

**Priority:** P3 - Enhancement
**Estimated Fix:** 3-4 hours

---

#### GAP-14: No Preview in Context

**Condition:** Cannot see icon in context (button, nav item, etc.)

**Criteria:** Spec section "Ideal Behaviors" (lines 281-282):
- "Show icon in a mini component preview (button, nav item, etc.)"

**Effect:** Must mentally visualize how icon looks in real UI context.

**Recommendation:**
1. Add "Preview in context" option
2. Show icon in common UI patterns (button, nav, card header)
3. Apply theme styles

**Priority:** P3 - Polish feature
**Estimated Fix:** 3-4 hours

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| Images tab included | May be deliberate expansion of scope. Spec excludes images but panel includes them. Needs clarification. |
| JSX code copied instead of just name | Better UX - icons always need size, copying `<Icon name="x" size={n} />` is more useful than just "x". |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Component vs Name terminology | Lines 21-28 | Clarify: does click copy component name or full JSX? |
| Default size behavior | Line 59 | What happens when user clicks without right-click size selection? |
| Logo variants definition | Lines 174-181 | How are variants defined? Component props? File naming? |
| External library detection | Lines 220-228 | How to detect which library is used? Scan imports? Check package.json? |
| Size persistence location | Lines 256-260 | Where exactly are sizes stored? theme.json? Dedicated config? |

---

## Implementation Quality Notes

### Current Strengths

1. **Clean UI architecture** - Separate components for each content type (IconsContent, LogosContent, ImagesContent)
2. **TypeScript types** - Well-defined interfaces (AssetItem, IconSizeOption)
3. **Search functionality** - Real-time filtering works smoothly
4. **Copy feedback** - Clear visual feedback with toast and check icon
5. **Size selector** - Good UI pattern for icon size switching
6. **Responsive grid** - Assets display well in different panel widths

### Critical Gaps

1. **Mock data only** - No connection to filesystem
2. **No Rust backend** - Zero asset-related commands
3. **No native integration** - Cannot open Finder
4. **No persistence** - Sizes hardcoded, no configuration

---

## Relationship to Other Features

| Feature | Relationship |
|---------|--------------|
| File Watcher (watcher.rs) | Should trigger asset rescan on changes |
| Project Detection (project.rs) | Could provide theme path for asset discovery |
| Components Browser (fn-8.9) | Similar discovery/scanning pattern to reuse |
| Plugin Opener | Already in deps, can use for "Open in Finder" |

---

## Follow-up Tasks Recommended

1. **fn-8.10.1** - Create assets.rs backend with list_icons, list_logos commands (P0, GAP-1, GAP-2) **[BLOCKS: 3,5,7,8,10,11,12,13]**
2. **fn-8.10.2** - Implement reveal_in_finder command (P0, GAP-2) **[BLOCKS: 3]**
3. **fn-8.10.3** - Add "Open in Finder" button (P1, GAP-3) **[DEPENDS: 8.10.2]**
4. **fn-8.10.4** - Implement right-click context menu (P1, GAP-4)
5. **fn-8.10.5** - Add size configuration panel (P1, GAP-5) **[DEPENDS: 8.10.1]**
6. **fn-8.10.6** - Support external icon libraries (P1, GAP-6) **[DEPENDS: 8.10.1]**
7. **fn-8.10.7** - Wire file watcher to asset rescan (P1, GAP-7) **[DEPENDS: 8.10.1]**
8. **fn-8.10.8** - Add SVG metadata extraction (P2, GAP-8) **[DEPENDS: 8.10.1]**
9. **fn-8.10.9** - Clarify Images tab scope (P2, GAP-9)
10. **fn-8.10.10** - Add icon usage tracking (P2, GAP-10) **[DEPENDS: 8.10.1]**
11. **fn-8.10.11** - Implement real "Recently Used" (P2, GAP-11)
12. **fn-8.10.12** - Add fuzzy search (P3, GAP-12)
13. **fn-8.10.13** - Implement drag-and-drop add (P3, GAP-13) **[DEPENDS: 8.10.1]**
14. **fn-8.10.14** - Add preview in context (P3, GAP-14)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/AssetsPanel.tsx` | Assets browser UI | 616 |
| `src/bindings.ts` | Tauri command bindings (no asset commands) | 483 |
| `src-tauri/src/commands/mod.rs` | Command modules (no assets module) | 13 |
| `docs/features/05-assets-manager.md` | Specification | 346 |
