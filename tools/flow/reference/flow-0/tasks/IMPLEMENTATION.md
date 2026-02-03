# RadFlow Implementation Reference

Comprehensive documentation of all changes made during the Project Integration work. Covers every modified, new, and deleted file with what was changed and why.

**Last updated:** 2026-01-28

---

## Table of Contents

1. [Rust Backend (Tauri)](#rust-backend-tauri)
2. [State Management (Zustand Store)](#state-management-zustand-store)
3. [UI Components](#ui-components)
4. [Hooks](#hooks)
5. [Utilities](#utilities)
6. [Configuration & Entry Points](#configuration--entry-points)

---

## Rust Backend (Tauri)

The Tauri backend provides native filesystem operations, CSS parsing, and project intelligence to the RadFlow frontend via auto-generated TypeScript bindings (specta/tauri-specta). All commands are annotated with `#[tauri::command]` and `#[specta::specta]` for type-safe IPC.

### Dependencies (`tauri/Cargo.toml`)

| Crate | Version | Purpose |
|-------|---------|---------|
| `tauri` | 2 | App framework |
| `tauri-plugin-opener` | 2 | OS file/URL opener |
| `tauri-plugin-dialog` | 2 | Native file/folder dialogs |
| `tauri-plugin-store` | 2 | Persistent key-value storage |
| ~~`tauri-plugin-fs`~~ | ~~2~~ | ~~Removed — asset content inlined at scan time~~ |
| `specta` / `tauri-specta` | 2.0.0-rc.22 / rc.21 | TypeScript binding generation |
| `swc_common` / `swc_ecma_parser` / `swc_ecma_ast` | 18 / 32 / 19 | TSX component parsing |
| `lightningcss` | 1.0.0-alpha.68 | CSS `@theme` block token extraction |
| `notify` | 7 | Filesystem watcher |
| `regex` | 1 | Violation pattern detection |
| `chrono` | 0.4 | Timestamp formatting |
| `rayon` | 1.10 | Parallel directory scanning (spatial viewer) |

### Window Configuration (`tauri/tauri.conf.json`)

- Product: **RadFlow** (`com.radflow.app`), v0.1.0
- Default window: 1440x900, min 1200x700, **maximized**, **no native decorations** (custom title bar), devtools enabled
- CSP disabled (`null`) for development flexibility
- Frontend served from Vite dev server at `http://localhost:1420`

### Entry Point (`tauri/src/lib.rs`)

The `run()` function registers all commands, plugins, and managed state.

**Top-level commands defined here:**

| Command | Signature | Purpose |
|---------|-----------|---------|
| `greet` | `fn greet(name: String) -> String` | Test command |
| `get_version` | `fn get_version() -> VersionInfo` | Returns app + Tauri versions |
| `validate_project` | `fn validate_project(path: String) -> ProjectValidation` | Checks if folder has `package.json` or `tsconfig.json` |

**Managed state:** `WatcherState` (file watcher handle), `DevServerState` (child process handle)

**All registered commands** (30 total):

```
greet, get_version, validate_project,
parse_component, scan_components,
parse_tokens, parse_theme_tokens_bundle, detect_theme_info,
scan_violations, detect_violations,
start_watcher, stop_watcher, get_watched_path,
write_text_change, get_file_info, revert_text_change,
detect_project,
start_dev_server, stop_dev_server, get_dev_server_status, get_dev_server_logs, check_dev_server_health,
scan_directory, expand_folder, search_files,
scan_schemas, search_schemas, get_schema, get_dna_config,
scan_theme_assets, scan_project_assets
```

### Command Modules (`tauri/src/commands/mod.rs`)

| Module | Status |
|--------|--------|
| `assets` | **New** |
| `components` | Existing |
| `dev_server` | Existing |
| `project` | Modified |
| `schema` | Existing |
| `spatial` | **New** |
| `text_edit` | Existing |
| `tokens` | Modified |
| `violations` | Existing |
| `watcher` | Existing |

`file_write` is commented out (removed per fn-9 context engineering pivot).

### Types (`tauri/src/types/mod.rs`)

All types derive `Serialize`, `Deserialize`, `Type` (specta) for auto TypeScript generation.

| Type | Fields | Purpose |
|------|--------|---------|
| `PropInfo` | name, type_name, required, default, doc, control_type, options | Component prop metadata with UI control hints |
| `UnionTypeInfo` | name, values, line | Extracted union type aliases |
| `ComponentInfo` | name, file, line, props, default_export, union_types | Parsed component data |
| `ViolationSeverity` | Warning, Error | Enum for lint severity |
| `ViolationInfo` | file, line, column, severity, message, code_snippet, suggestion | Design system violation |
| `ThemeTokens` | inline: HashMap, public: HashMap | Tokens split by `@theme inline` vs `@theme` |
| `ThemeTokensBundle` | base: ThemeTokens, dark: Option<HashMap> | Combined light + dark mode tokens |
| `ThemeInfo` | name, package_name, path, tokens_css, dark_css, components_dir, assets_dir | Theme package metadata |
| `IconAsset` | id, name, path, absolute_path, size, content? | SVG icon (content = inline SVG string) |
| `LogoAsset` | id, name, path, absolute_path, size, content? | Logo — SVG inline or raster base64 data URI |
| `ImageAsset` | id, name, path, absolute_path, size, extension, content? | Image — SVG inline or raster base64 data URI (≤512KB) |
| `AssetLibrary` | icons, logos, images | Complete asset inventory |
| `FileEvent` | Modified(path), Created(path), Removed(path) | Watcher event enum |

### Tokens Module (`tauri/src/commands/tokens.rs`)

Parses Tailwind v4 `@theme` blocks using lightningcss.

| Command | Signature | Purpose |
|---------|-----------|---------|
| `parse_tokens` | `fn parse_tokens(css_path: String) -> Result<ThemeTokens, String>` | Parse single CSS file for `@theme` blocks |
| `parse_theme_tokens_bundle` | `fn parse_theme_tokens_bundle(theme_path: String) -> Result<ThemeTokensBundle, String>` | Parse `tokens.css` + optional `dark.css` from theme directory |
| `detect_theme_info` | `fn detect_theme_info(theme_path: String) -> Result<Option<ThemeInfo>, String>` | Detect theme metadata (name, dark.css presence, components/assets dirs) |

Key internals:
- `parse_theme_tokens(css)` — walks `@theme` and `@theme inline` rule blocks
- `parse_dark_mode_tokens(css)` — extracts custom properties from `.dark {}` selector blocks
- `format_custom_property_value()` — converts lightningcss token lists to CSS value strings

### Assets Module (`tauri/src/commands/assets.rs`) — **NEW**

| Command | Signature | Purpose |
|---------|-----------|---------|
| `scan_theme_assets` | `fn scan_theme_assets(theme_path: String) -> Result<AssetLibrary, String>` | Scan `assets/icons`, `assets/logos`, `assets/images` under a theme |
| `scan_project_assets` | `fn scan_project_assets(project_path: String) -> Result<AssetLibrary, String>` | Scan multiple common asset locations with deduplication via `HashSet<PathBuf>` |

Helpers: `scan_icons`, `scan_logos`, `scan_images`, `generate_id` (deterministic hash-based ID), `read_svg_content`, `read_raster_data_uri`, `base64_encode`. All paths include both relative and absolute. **Content inlined at scan time**: SVGs as raw strings (for `dangerouslySetInnerHTML`), raster images as base64 data URIs (capped at 512KB). Eliminates `convertFileSrc` / asset protocol entirely.

### Project Module (`tauri/src/commands/project.rs`)

| Command | Signature | Purpose |
|---------|-----------|---------|
| `detect_project` | `fn detect_project(path: String) -> ProjectDetectionResult` | Full project detection: type, package manager, dev command/port, bridge status, theme, monorepo root |

Key internals:
- `detect_package_manager()` — checks for `pnpm-lock.yaml`, `yarn.lock`, falls back to npm
- `extract_dev_port()` — parses `-p` / `--port` flags from `dev` script
- `has_bridge_installed()` — checks for `@rdna/bridge` in devDependencies
- `is_theme_package()` — presence of `tokens.css`
- `find_monorepo_root()` — walks parents looking for `pnpm-workspace.yaml`
- `find_rdna_theme()` — resolves `@rdna/*` deps to physical paths in `packages/`

### Spatial Module (`tauri/src/commands/spatial.rs`) — **NEW**

Filesystem operations for the spatial file browser. Uses `rayon` for parallel reads.

| Command | Signature | Purpose |
|---------|-----------|---------|
| `scan_directory` | `fn scan_directory(path: String, show_hidden: bool) -> Result<DirectoryContents, String>` | Read directory with metadata |
| `expand_folder` | `fn expand_folder(path: String, show_hidden: bool) -> Result<Vec<FileNode>, String>` | Lazy-load folder children |
| `search_files` | `fn search_files(root: String, query: String, max_results: u32, show_hidden: bool) -> Result<SearchResults, String>` | Recursive fuzzy file search |

Design: Auto-collapsed directories (`node_modules`, `.git`, `dist`, etc.), max 1000 children, max 500 search results, max depth 10, fuzzy subsequence matching with scoring.

---

## State Management (Zustand Store)

Single Zustand store (`useAppStore`) composed of **21 slices**. Middleware: `devtools` (dev-only), `subscribeWithSelector`, `persist` (UI preferences only).

### Persistence

Only UI preferences persisted to localStorage (`"radflow-app-store"`):
`editorMode`, `activePanel`, `showViolationsOnly`, `activeBreakpoint`, `customWidth`, `previewViewMode`, `dogfoodMode`, `panelMode`, `barPosition`

### Slice Inventory

#### 1. UiSlice (`slices/uiSlice.ts`)
- `editorMode: EditorMode` — 10 modes: `"cursor" | "component-id" | "text-edit" | "preview" | "clipboard" | "comment" | "smart-edit" | "select-prompt" | "designer" | "animation"`
- `devMode`, `dogfoodMode`, `barPosition: ModeBarPosition`
- Cross-slice: `setEditorMode` clears CommentSlice and ComponentIdSlice state on mode exit

#### 2. PanelsSlice (`slices/panelsSlice.ts`)
- `activePanel: PanelType | null` — `"colors" | "typography" | "spacing" | "layout" | "feedback"`

#### 3. CommentSlice (`slices/commentSlice.ts`)
- `comments: Feedback[]`, `activeFeedbackType`, `hoveredCommentElement`, `selectedCommentElements`
- `compileToMarkdown()` — structured markdown grouped by file with rich context
- Cross-slice: `setActiveFeedbackType` writes to UiSlice and PanelsSlice

#### 4. ComponentIdSlice (`slices/componentIdSlice.ts`)
- `selectedComponents`, `hoveredComponent`, `selectionRect`, `showViolationsOnly`
- Reads `components` from ComponentsSlice

#### 5. TextEditSlice (`slices/textEditSlice.ts`)
- `pendingEdits: TextEdit[]` — clipboard-only (direct write removed per fn-9)

#### 6. TokensSlice (`slices/tokensSlice.ts`)
- `tokens: ThemeTokens | null`, `darkTokens`, `colorMode: "light" | "dark"`, `resolvedTokens` cache
- `loadThemeTokens(themePath)` — loads base + dark via Tauri
- `getActiveTokens()` — merges base + dark overrides per mode
- `resolveToken(name)` — resolves `var()` chains with circular reference detection

#### 7. ComponentsSlice
- `components`, `componentMetas`, `componentMetaMap`, `componentMetaByRadflowId`
- `scanComponents(dir)`, `mergeRuntimeInstances(runtimeEntries)`

#### 8. ViolationsSlice — `violations`, `violationsByFile`, loading/error

#### 9. WatcherSlice — `watcherActive`, `watchedPath`, `lastFileEvent`

#### 10. BridgeSlice — `bridgeStatus`, `bridgeComponentMap`, `bridgeComponentLookup`, `bridgeSelection`, `bridgeHoveredId`

#### 11. ProjectSlice (`slices/projectSlice.ts`)
- `project`, `serverStatus`, `serverLogs`
- Cross-slice: `detectProject` calls `setSpatialRootPath(project.path)`

#### 12. SelectionSlice — `selectedEntry`, `multiSelectEnabled`, `selectedIds`

#### 13. EditsSlice — `pendingStyleEdits`, `editsByFile`

#### 14. ViewportSlice — `breakpoints`, `activeBreakpoint`, `customWidth`, `viewportWidth`, `targetUrl`, `previewViewMode`, `canvasRect`, `canvasScale`, `canvasEditMode`

#### 15. UndoSlice — `styleUndoStack`, `styleRedoStack`, `maxStyleHistory`

#### 16. TargetProjectSlice — `targetProjects`, `activeTarget`, `isScanning`

#### 17. ThemeSlice — `discoveredThemes`, `activeTheme`, `activeApp`, scan state

#### 18. OutputSlice (`slices/outputSlice.ts`)
- `panelMode: "default" | "focus" | "advanced"`, `currentTarget: "clipboard" | "file" | "both"`
- `getOutputImplementation()` returns clipboard or file writer

#### 19. SpatialViewportSlice (`slices/spatialViewportSlice.ts`) — **NEW**
- `spatialBrowserActive`, file tree (`spatialFileTree`, expanded/selected/focused paths), viewport (pan, search)
- `spatialExpandPath`, `spatialSelectRange`, `panToNode`, keyboard nav actions
- Types in `types/spatial.ts`: `FileNode`, `LayoutNode`, `PanOffset`, `CanvasBounds`, `SearchMatch`

#### 20. ComponentCanvasSlice (`slices/componentCanvasSlice.ts`) — **NEW**
- `componentCanvasActive`, `componentSchemas`, `dnaConfigs`, `componentCanvasNodes`, selection, viewport
- `scanComponentSchemas(themePath)` — calls Rust, parses JSON, calculates grid layout
- Cross-slice: triggers `loadThemeTokens`, `loadThemeAssets`, `setSpatialRootPath`
- Types in `types/componentCanvas.ts`: `ComponentSchema`, `DnaConfig`, `ComponentCanvasNode`

#### 21. AssetsSlice (`slices/assetsSlice.ts`) — **NEW**
- `themeAssets`, `projectAssets`, separate loading/error states, `recentAssetIds`
- `loadThemeAssets`, `loadProjectAssets`, merge getters (`getMergedIcons/Logos/Images`)

#### Deleted: `smartAnnotateSlice.ts`

### Cross-Slice Dependency Graph

```
ComponentCanvasSlice
  → TokensSlice.loadThemeTokens()
  → AssetsSlice.loadThemeAssets()
  → SpatialViewportSlice.setSpatialRootPath()

ProjectSlice
  → SpatialViewportSlice.setSpatialRootPath()

CommentSlice
  → UiSlice.editorMode (writes)
  → PanelsSlice.activePanel (writes)

UiSlice.setEditorMode()
  → CommentSlice fields (clears)
  → ComponentIdSlice fields (clears)

ComponentIdSlice
  → ComponentsSlice.components (reads)
```

### Shared Canvas Types (`types/canvas.ts`)

`PhysicsConfig`, `SpringConfig`, `GestureState`, `SoundConfig`, `GridConfig`, `CanvasNodeBase`, `Connection` — shared between Spatial File Viewer and Component Canvas.

---

## UI Components

### Layout

#### `EditorLayout.tsx` (Modified)
Top-level layout shell. Integrates spatial canvas view and floating mode bar. Removed `TitleBar`, `StatusBar`, `ResizeDivider` dependencies.

#### `LeftPanel.tsx` (Modified)
Left sidebar. Added `VariablesPanel` as a panel option.

#### `RightPanel.tsx` (Modified)
Right sidebar. Updated panel imports, removed deprecated panels.

#### `PreviewCanvas.tsx` (Modified)
Iframe preview. Updated outline usage, integrated `CanvasGrid`.

#### `SettingsBar.tsx` (New)
Floating settings bar for spatial canvas: directory picker, hidden files toggle, auto-collapse config.

#### Deleted
- **`TitleBar.tsx`** — Custom title bar removed
- **`StatusBar.tsx`** — Status info now inline in spatial canvas
- **`ResizeDivider.tsx`** — Panels use fixed/CSS widths

### Panels

#### `AssetsPanel.tsx` (Modified)
Replaced all mock data (25 hardcoded icons) with real store data (145+ from theme). SVGs rendered via `dangerouslySetInnerHTML` (inherits `currentColor`, fully styleable). Raster images via base64 data URI `<img>` tags. No `convertFileSrc`, no asset protocol, no `tauri-plugin-fs`. Loading/empty/error states. React.memo on grid items. ARIA tablist/tab/tabpanel.

#### `VariablesPanel.tsx` (New)
Design tokens viewer/editor. Categorized collapsible sections (Colors with swatches, Spacing with bars, Radius with previews, Shadows with box-shadow). **Colors section has nested sub-accordions**: Core (brand palette), Surface, Content, Edge, Status, Action — grouped by semantic prefix. Light/dark mode toggle (sun/moon icons). Amber dot indicator for tokens with dark overrides. Inline value editing.

#### `ComponentsPanel.tsx` (Modified)
Reads `componentSchemas` from store (populated by workspace scan), not hardcoded `loadTheme()`. Displays active theme name + component count. Search, variant badges, props detail panel. No longer imports `themeLoader.ts`.

#### `ColorsPanel.tsx`, `TypographyPanel.tsx`, `SpacingPanel.tsx`, `LayoutPanel.tsx` (Modified)
Updated icon imports to use `./ui/icons`.

#### `LayersPanel.tsx` (Modified)
Component tree in Component ID mode. Bidirectional hover sync with canvas.

#### Deleted: `CommentClipboardPanel.tsx` — Consolidated elsewhere

### Toolbar & Floating UI

#### `FloatingModeBar.tsx` (New)
Draggable floating toolbar wrapping `ModeToolbar`. Position persisted to localStorage.

#### `DragHandle.tsx` (New)
Reusable drag handle + `useDraggable` hook. Viewport boundary constraints, localStorage persistence.

#### `ModeToolbar.tsx` (Modified)
Icons from `./ui/icons`. Mode buttons for Select, Text Edit, Preview, Comment, Question.

### Canvas

#### `Outline.tsx` (Modified)
Selection/hover outlines using Radiants palette. `useElementRect` with ResizeObserver.

#### `CanvasGrid.tsx` (New)
HTML5 Canvas dot grid with optional spring physics. Retina-aware. Static and physics render modes.

### Spatial (New Module)

#### `SpatialCanvas.tsx` (New)
Main orchestrator. Pan/zoom viewport, file nodes, connection lines, minimap, zoom controls, marquee selection. Scans directories via Tauri on mount.

#### `FileNode.tsx` (New)
File/folder nodes with chevron, type icons, metadata. Visual states: selected, highlighted, focused, copy-feedback. Truncation nodes for capped children.

#### `ConnectionLines.tsx` (New)
SVG Bezier curves between parent/child. Blue highlight for selected paths.

#### `Minimap.tsx` (New)
SVG overview in bottom-right. Click to navigate.

#### `ZoomControls.tsx` (New)
Zoom in/out/percentage/fit-to-view buttons.

#### `MarqueeSelection.tsx` (New)
Semi-transparent blue rectangle overlay for rubber-band selection.

#### `SpatialControls.tsx` (New)
Directory picker, refresh, hidden files toggle, auto-collapse settings.

#### `icons.tsx` (New)
Self-contained Lucide-style SVG icon set for spatial module.

### Icons & Shared UI

#### `ui/icons.tsx` (New)
Centralized icon barrel. Re-exports 100+ icons from `@rdna/radiants/icons` + 5 fallbacks from `lucide-react`.

### Other Modified Components

- **`CommentPopover.tsx`** — Uses radiants colors, icons from `./ui/icons`
- **`CommentBadge.tsx`** — Numbered badge with hover preview, updated icons
- **`CommentMode.tsx`** — React fiber parsing, bridge integration, multi-select, dogfood mode
- **`ComponentIdMode.tsx`** — Derives mode from `editorMode`, crosshair cursor, violation badges
- **`TextEditMode.tsx`** — Clipboard-only (direct write removed per fn-9), dogfood mode
- **`AppSwitcher.tsx`** — Updated icons
- **`ProjectPicker.tsx`** — Recent projects, keyboard nav
- **`TargetProjectSelector.tsx`** — Updated icons
- **`ThemeSelector.tsx`** — Updated icons
- **`designer/ColorPicker.tsx`** — Added OKLCH tab, recent colors, updated icons

### Barrel Exports (`components/index.ts`)
**Removed:** `CommentClipboardPanel`, `SmartAnnotate`. **Added:** `VariablesPanel`, `TargetProjectSelector`, `ThemeSelector`, `AppSwitcher`.

---

## Hooks

### Existing (Modified)

#### `useKeyboardShortcuts.ts`
Global keyboard handler. Key shortcuts: V (component-id), T (text-edit), P (preview), C/Q (comment/question), Escape (exit mode), Cmd+B (spatial browser), Cmd+F (search), Cmd+C (copy), Cmd+Shift+C (copy comments), Cmd+Z/Shift+Z (undo/redo), Cmd+1-4 (search scope).

#### `useTauriCommands.ts`
Convenience hooks: `useComponents()`, `useTokens()`, `useComponentIdMode()`, `useTextEditMode()`.

### New Canvas Hooks

#### `useCanvasGestures.ts`
Pan, zoom, drag gestures. Drag > Pan priority. Velocity tracking. Touch support with pinch-to-zoom.

#### `useCanvasPhysics.ts`
Momentum and bounce. Adaptive friction (0.975 base, 0.94 high-speed). Bounce damping 0.45.

#### `useCanvasSounds.ts`
Web Audio effects (bounce, gridTouch, select, deselect, expand, collapse, copy, drop). Lazy AudioContext.

#### `useMarqueeSelection.ts`
Rubber-band selection. Screen-to-canvas coordinate conversion. AABB intersection. Shift for additive. 5px threshold.

#### `usePanZoom.ts`
Alt+click/middle-mouse pan. Ctrl+wheel zoom toward cursor. Animated transitions. Zoom-to-fit with 80px padding.

#### `useSpatialKeyboard.ts`
Arrow keys navigate, Left/Right expand/collapse, Enter toggle, Home/End, Cmd+C copy, Cmd+A select all, Escape clear.

#### `useSpatialLayout.ts`
Thin wrapper calling `calculateTreeLayout` + `calculateCanvasBounds` from spatial utils.

**Note:** New hooks not yet exported from `hooks/index.ts` barrel.

---

## Utilities

### `utils/spatial/` (New Directory)

#### `constants.ts`
- `SPATIAL_PERFORMANCE` — rendering thresholds
- `DEFAULT_LAYOUT_CONFIG` — 200x64px nodes, 24px h-gap, 48px v-gap, max 20 visible children
- `AUTO_COLLAPSE_PATTERNS` — `node_modules`, `.git`, `dist`, `build`, `.next`, etc.
- `PAN_PHYSICS`, `FEEDBACK_TIMINGS`, `SPATIAL_Z_INDEX`

#### `treeLayout.ts`
- `calculateTreeLayout(root, expandedPaths, config)` — recursive subtree width measurement → top-down positioning → truncation nodes
- `calculateCanvasBounds(nodes, padding)` — max extents + padding

#### `treeHelpers.ts`
- `getParentPath`, `getAncestorPaths`, `mergeChildren`, `findNodeByPath`, `cleanupStalePaths`, `sortByVisualOrder`, `countTreeNodes`, `getAllFilePaths`

---

## Configuration & Entry Points

### `bindings.ts`
Auto-generated by `tauri-specta`. 30 command wrappers + all Rust types as TypeScript interfaces.

### `main.tsx`
Adds `dark` class to `documentElement`, renders `<App />`.

### `index.css`
Imports Tailwind + radiants tokens.css/dark.css. Font faces (PixelCode, Joystix Monospace). `@theme` block with legacy aliases. Tauri drag region. **New:** `.file-node` styles for spatial browser (hover lift/glow, selected blue ring, focused sky outline, highlighted amber pulse, copy-feedback green pulse, truncation dashed border).

### `package.json`
`@rdna/flow` v0.1.0. Key deps: `@rdna/radiants` (workspace), `@tauri-apps/api` ^2, `zustand` ^5, `react` ^19, `culori` ^4, `zod` ^4.

### `public/`
- `fonts/` — 20 PixelCode woff2 files
- `assets/icons/` — 100+ retro pixel-art SVG icons

---

## Unified Workspace Flow (Phase 1)

Replaced 6+ incompatible project/theme loading paths with a single orchestrated workspace flow.

### What Was Replaced

| Old Path | Problem |
|----------|---------|
| `projectStore.ts` (standalone Zustand store) | Separate from main store, inconsistent |
| `themeSlice.ts` (port-scanning discovery) | Unreliable, slow, no monorepo awareness |
| `targetProjectSlice.ts` (legacy port scanner) | Duplicate of themeSlice logic |
| `componentCanvasSlice.ts` side-effects | Loaded tokens/assets/spatial as side effect of schema scan |
| `SettingsBar.tsx` manual path input | User had to type theme paths manually |
| `projectSlice.ts` detectProject | Set spatial root as side effect |

### New Architecture

```
Open Project (folder picker or recent)
  → scan_monorepo (Rust: parse pnpm-workspace.yaml, walk dirs)
  → Set workspace state (themes[], apps[], activeThemeId, activeAppId)
  → loadThemeData (parallel: tokens + assets + schemas + spatial root)
  → detectProject + startDevServer (for selected app)
  → Save to recents (tauri-plugin-store)
```

### New Files

| File | Purpose |
|------|---------|
| `tauri/src/commands/workspace.rs` | `scan_monorepo` Rust command — parses `pnpm-workspace.yaml` via serde_yaml, discovers themes (by `tokens.css`) and apps (by `dev` script), resolves `@rdna/*` deps |
| `app/stores/slices/workspaceSlice.ts` | Slice #22: workspace state, `openWorkspace`, `selectTheme`, `selectApp`, `closeWorkspace`, recent workspaces (tauri-plugin-store) |
| `app/components/ThemeTransition.tsx` | ASCII `░▒▓█` wipe animation on theme switch (~300ms) |

### WorkspaceSlice (#22)

- `workspace: WorkspaceContext | null` — `{ type: "monorepo", root, themes: ThemeEntry[], apps: AppEntry[], activeThemeId, activeAppId }`
- `themeDataLoading: boolean` — true while tokens/assets/schemas loading
- `recentWorkspaces: RecentWorkspace[]` — persisted via tauri-plugin-store
- `openWorkspace(rootPath?)` — folder picker → scan → auto-select → load → server → save recents
- `selectTheme(themeId)` — clears old data, loads new theme, no app server
- `selectApp(appId)` — selects parent theme if different, stops old server, starts new one
- `closeWorkspace()` — stops server, clears state, returns to picker
- `loadThemeData()` helper — `Promise.allSettled([tokens, assets, schemas])` + `setSpatialRootPath`

### Canvas Priority

1. **SpatialCanvas** — when spatial browser toggled (B key)
2. **PreviewCanvas** — when dev server has `targetUrl`
3. **ComponentCanvas** — default (component schema grid)

### UI Changes

| Component | Change |
|-----------|--------|
| `App.tsx` | Workspace-first startup, shows `ProjectPicker` when no workspace |
| `ProjectPicker.tsx` | Rewritten: recent workspaces, keyboard nav, context menu |
| `ThemeSelector.tsx` | Grouped dropdown: theme headers + nested apps with server status dots |
| `SettingsBar.tsx` | Removed Component Canvas section, added ThemeSelector + page nav dropdown |
| `EditorLayout.tsx` | Default to ComponentCanvas, PreviewCanvas when server live, theme transition overlay |
| `LeftPanel.tsx` | "View Canvas" button in Components panel header |

### Deleted Files

- `app/stores/projectStore.ts`
- `app/stores/slices/targetProjectSlice.ts`
- `app/stores/slices/themeSlice.ts`
- `app/components/TargetProjectSelector.tsx`

### Phase 2 (Not Yet Implemented)

- Multi-server process registry (`HashMap<String, Child>` in Rust)
- Concurrent theme + app dev servers
- Server health monitoring per-app
