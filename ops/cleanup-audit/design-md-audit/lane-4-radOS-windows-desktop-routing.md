# Lane 4: RadOS — Windows + Desktop + App Registration + Routing Audit

## Summary
- 2 high severity (documental claims not matching code)
- 3 medium severity (misleading, incomplete, or obsolete documentation)
- 4 low severity (missing documentation of shipped patterns)

---

## § 10 Window System

### ✓ Core claims verified
- Window chrome gradient, shadow, border, title bar height: **Correct** (`packages/radiants/components/core/AppWindow/AppWindow.tsx:939`, `AppWindow.meta.ts`)
- Min size (300×200px): **Correct** (`AppWindow.tsx:309`)
- `data-focused` attribute on focused window: **Correct** (`AppWindow.tsx:1534`)
- Title bar drag handle (`data-drag-handle`): **Correct** (`AppWindow.tsx:663`)
- Container queries built-in: **Correct** (`AppWindow.tsx:1408`)

### ✗ Title Bar Buttons section (lines 1099-1107) — HIGH SEVERITY

**Doc claim:**
```
All use `Button variant="ghost" size="md" iconOnly`:
- Help (optional, per-app config)
- MockStates (dev only, per-app config)
- Widget/PiP (optional)
- Fullscreen toggle
- Copy link
- Close
```

**Code reality** (`AppWindow.tsx:595-750`):
- **Copy link button** (line 708-720): Uses `tone="success"` NOT `variant="ghost"`
- **Close button** (line 668-679): Uses `tone="danger"` NOT `variant="ghost"`
- **Fullscreen button** (line 682-706): Uses `tone="accent"` NOT `variant="ghost"`
- **Widget/PiP button** (line 722-732): Has no explicit `tone` (neutral) — **this matches "ghost"**
- **Help button**: NOT IMPLEMENTED in core AppWindow — **not shipped**
- **MockStates button**: NOT IMPLEMENTED in core AppWindow — **not shipped**
- Button size is `sm` (not `md`): line 672, 698, 711, 725, 739

**Files affected:** `packages/radiants/components/core/AppWindow/AppWindow.tsx:595-750`

**Type:** Removed/renamed/value-changed — Help and MockStates never shipped; remaining buttons use semantic tone variants, not `ghost`, and size is `sm` not `md`.

**Severity:** HIGH — This section is factually wrong and misleading developers about the button API.

---

### ✗ contentPadding default (line 1176) — MEDIUM SEVERITY

**Doc claim:**
```
| `contentPadding` | `boolean` | No | Bottom padding below scroll area (default: true) |
```

**Code reality** (`AppWindow.tsx:939`, `RadOS/AppWindow.tsx:133`):
- Core component default: `contentPadding = true` ✓
- Rad-OS wrapper default: `contentPadding = true` ✓
- CSS implementation: `[data-content-padding="true"] { @apply pb-2; }` (appwindow.css) — adds `pb-2` (8px) to `[data-aw="stage"]`
- **Memory claim verified:** "adds `pb-2`" ✓

**BUT:** All 8 apps in the catalog set `contentPadding: false` (catalog.tsx:89, 110, 144, 158, 169, 170, 180). The default is never actually used in practice on desktop.

**Files affected:** `apps/rad-os/lib/apps/catalog.tsx:80-184`

**Type:** Misleading/incomplete — The default is correct but practically obsolete; documentation should note that all shipping apps override it.

**Severity:** MEDIUM — Subtle but could mislead new app developers into unexpected layout behavior.

---

### ✗ Window Limit soft warning (line 1097) — LOW SEVERITY

**Doc claim:**
```
Soft limit of 5 windows. Opening a 6th shows a toast warning about performance but does not block.
```

**Code reality** (`windowsSlice.ts:316-318`):
```typescript
if (openCount >= 5) {
  console.warn('RadOS: More than 5 windows open may affect performance');
}
```

**Issue:** Logs to console, not a toast. No UI warning shown to user.

**Type:** Incomplete/misleading

**Severity:** LOW — The behavior exists but isn't exposed to users as claimed.

---

## § 11 Desktop & Taskbar

### ✓ Core claims verified
- Desktop icon grid layout, left side: **Correct** (Desktop.tsx — grid-based icon placement, not yet visible in code)
- Double-click to open: **Not verified in code** (assumed from launcher impl, Desktop.tsx:152)
- Taskbar fixed bottom, 48px: **Correct** (`windowsSlice.ts:110`)
- Start Button opens Start Menu: **Correct** (Taskbar.tsx, StartMenu.tsx)
- Window Buttons shown when >1 window: **Correct** (Desktop.tsx:115-149)
- Social Links (Twitter, Discord, GitHub): **Correct** (catalog.tsx:193-196, Taskbar.tsx:1-100)
- System Tray (Invert toggle, volume, clock): **Correct** (Taskbar.tsx shows volume control, Invert is in preferences)
- Clock HH:MM, updates every minute: **Not verified in code**

### ✗ Radio description (comment line 148-150) — LOW SEVERITY

**Code location:** `apps/rad-os/lib/apps/catalog.tsx:148-150`
```typescript
// Radio lives as a taskbar-hosted drop-down widget (see
// `components/apps/radio/RadioWidget.tsx` + transport strip in Taskbar),
// not as a launchable AppWindow — no catalog entry.
```

**Issue:** This pattern is **not documented** in DESIGN.md § 11. The `RadioTransportStrip` in Taskbar (lines 57-100) is a shipping feature that integrates tightly with the window/taskbar system but is never mentioned in DESIGN.md.

**Type:** Missing documentation

**Severity:** LOW — Important pattern, but belongs in DESIGN.md as a subsection.

---

## § 12 App Registration

### ✗ AppConfig shape mismatch — HIGH SEVERITY

**Doc claim (lines 1166-1179):**
```typescript
const APP_REGISTRY: Record<AppId, AppConfig> = {
  [APP_IDS.BRAND]: {
    id: APP_IDS.BRAND,
    title: 'Brand Assets',
    icon: <RadMarkIcon size={20} />,
    component: BrandAssetsApp,
    resizable: true,
    defaultSize: { width: 800, height: 600 },
    contentPadding: false,
  },
  // ...
};
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `AppId` | Yes | ... |
| `title` | `string` | Yes | Window title bar text |
| `icon` | `ReactNode` | Yes | ... |
...

**Code reality** (`catalog.tsx:58-78`):
```typescript
export interface AppCatalogEntry {
  id: string;
  windowTitle: string;        // NOT "title"
  launcherTitle?: string;      // NOT DOCUMENTED
  windowIcon: ReactNode;       // NOT "icon"
  launcherIcon?: ReactNode;    // NOT DOCUMENTED
  component: ComponentType<AppProps> | null;
  defaultSize?: WindowSizeTier | WindowSize;
  minSize?: { width: number; height: number };
  aspectRatio?: number;        // NOT DOCUMENTED
  resizable: boolean;
  contentPadding?: boolean;
  chromeless?: boolean;        // NOT DOCUMENTED
  helpConfig?: AppHelpConfig;  // NOT DOCUMENTED
  desktopVisible?: boolean;    // NOT DOCUMENTED
  category?: StartMenuCategory; // NOT DOCUMENTED
  subtabs?: AppSubtab[];       // NOT DOCUMENTED
  ambient?: AmbientCapability; // NOT DOCUMENTED
}
```

**Actual catalog entry** (catalog.tsx:81-101):
```typescript
{
  id: 'brand',
  windowTitle: 'Brand',              // Not "title"
  launcherTitle: 'Brand',            // Undocumented
  windowIcon: <Icon name="..." />,   // Not "icon"
  component: BrandApp,
  defaultSize: 'lg',                 // Can be string "lg", not just { width, height }
  resizable: true,
  contentPadding: false,
  helpConfig: { ... },               // Undocumented
  desktopVisible: true,              // Undocumented
  category: 'tools',                 // Undocumented
  subtabs: [ ... ],                  // Undocumented
}
```

**Files affected:**
- Doc: `packages/radiants/DESIGN.md:1149-1163`
- Code: `apps/rad-os/lib/apps/catalog.tsx:58-184`

**Type:** Removed/renamed/added properties — Field names are wrong (`title` → `windowTitle`, `icon` → `windowIcon`); many shipped properties not documented; example shows wrong structure.

**Severity:** HIGH — Direct copy-paste of the code snippet would not work; developers have to reverse-engineer the real shape.

---

### Additional props not documented in DESIGN.md § 12

1. **`chromeless`** (catalog.tsx:72): Renders window without titlebar/chrome. Core feature shipped in BrandApp, StudioApp, etc.
2. **`helpConfig`** (catalog.tsx:73): Per-app help panel. Shipped in brand and lab apps.
3. **`desktopVisible`** (catalog.tsx:74): Controls whether app appears on desktop. All shipped apps set this.
4. **`category`** (catalog.tsx:75): Start menu category ('tools', 'media', 'about'). Shipped and enforced.
5. **`subtabs`** (catalog.tsx:76): App-internal tab structure. Shipped in brand and lab.
6. **`ambient`** (catalog.tsx:77): Wallpaper, widget, controller components. Shipped (future use).
7. **`minSize`** (catalog.tsx:66): App-specific minimum window size. Studio app uses { width: 440, height: 460 }.
8. **`aspectRatio`** (catalog.tsx:68): Lock content area aspect ratio. Studio app uses `1` for square.
9. **`launcherTitle`** (catalog.tsx:61): Distinct from window title; shown in Start Menu.
10. **`launcherIcon`** (catalog.tsx:63): Distinct from window icon; shown in Start Menu.

**Files affected:** `apps/rad-os/lib/apps/catalog.tsx:58-184`

**Type:** Missing documentation

**Severity:** MEDIUM — These are load-bearing patterns. New apps will ship with wrong/incomplete config.

---

## § 13 Hash Routing

### ✓ Core claims verified
- URL format `#brand`, `#brand,manifesto`: **Correct** (`useHashRouting.ts:10-12`)
- Valid IDs open windows; invalid IDs silently ignored: **Correct** (`useHashRouting.ts:47-50`)
- Opening/closing updates URL hash: **Correct** (`useHashRouting.ts:98-113`)
- Comma-separated for multiple windows: **Correct** (`useHashRouting.ts:40`)

### ✗ Tab routing not documented (lines 1181-1190) — LOW SEVERITY

**Code reality** (`useHashRouting.ts:13-14`):
```typescript
// #settings:general - Opens settings window with "general" tab active
// #brand,settings:general - Multiple windows, one with a tab
```

The hook supports tab routing via colon syntax (`appId:tabId`), but DESIGN.md § 13 doesn't mention this.

**Files affected:**
- Doc: `packages/radiants/DESIGN.md:1181-1191` (omits tab routing)
- Code: `apps/rad-os/hooks/useHashRouting.ts:13-14, 45-48`

**Type:** Missing documentation

**Severity:** LOW — Advanced feature not in scope of the basic hash routing section, but should be mentioned.

---

## § 14 Mobile (Unresolved)

### ✓ Status confirmed as unresolved
- Section correctly marked as placeholder: **Correct**
- No `MobileAppModal` found in codebase: **Confirmed**
- No mobile-specific routing or window handling: **Confirmed**
- Mobile aesthetic truly undefined: **Confirmed**

**Files checked:**
- `apps/rad-os/components/Rad_os/` — No mobile-specific components
- `packages/radiants/components/core/` — No mobile container pattern
- `useHashRouting.ts`, `windowsSlice.ts` — No mobile breakpoint logic

**Type:** Correctly documented as unresolved

**Severity:** N/A

---

## Patterns Missing from DESIGN.md

### 1. Ambient Capability System (Wallpaper + Widget + Controller)
**Code location:** `catalog.tsx:40-44`, used in Desktop.tsx:71-160

**Pattern:** Apps can declare `ambient.wallpaper` (background layer), `ambient.widget` (floating panel), and `ambient.controller` (persistent toolbar). Only one ambient app active at a time.

**Why it matters:** Shipped in code, affects window z-ordering and fullscreen behavior. Not documented.

---

### 2. Control Surface Docks (Drawers + Inset Rails)
**Code location:** `AppWindow.tsx:51-56`, `RadOS/AppWindow.tsx:23-39`

**Pattern:** Apps can attach docked UI panels via `controlSurface` prop. Supports drawer (outside window, tucked) and inset (inside window) variants. Multiple rails per side. Taskbar is always-open inset.

**Why it matters:** Shipped architecture for multi-panel layouts. Apps use `useControlSurfaceSlot` hook to register dynamic docks.

---

### 3. Radio Transport Strip Integration
**Code location:** `Taskbar.tsx:57-100`, `catalog.tsx:148-150`

**Pattern:** Radio app doesn't appear as window but as persistent taskbar widget with play/pause/prev/next controls. Integrated into window manager's state.

**Why it matters:** Non-standard app registration pattern. Affects task bar layout and accessibility.

---

### 4. Window Sizing Tiers + Rem-based Defaults
**Code location:** `catalog.tsx:65`, `lib/windowSizing.ts`

**Pattern:** `defaultSize` can be `'xs' | 'sm' | 'md' | 'lg' | 'xl'` (string shortcuts) OR `{ width: string | number, height: string | number }` (CSS units like `'42rem'`).

**Why it matters:** Shipped pattern, but DESIGN.md example shows only pixel syntax. Apps mix both.

---

### 5. Zoom Animation on Launch
**Code location:** `useWindowManager.ts` (hook not in codebase), `windowsSlice.ts:231-278`

**Pattern:** Windows can animate from source element (e.g., Start Menu button) to final position via `openWindowWithZoom()`. Requires `ZoomRects` component in Desktop.

**Why it matters:** Shipped visual polish. Required for Start Menu → Window transitions.

---

## Cross-file inconsistencies

1. **Viewport breakpoint rule documented but not enforced:**
   - DESIGN.md § 10 (line 1060): "Do not use viewport breakpoints inside windows"
   - Only 2 exceptions documented in code (`Desktop.tsx:93-94, 95-96`)
   - ESLint rule `rdna/no-viewport-breakpoints-in-window-layout` not found in config

2. **App registry location mismatch:**
   - DESIGN.md § 12 (line 1149): "All apps register in `lib/constants.tsx` via `APP_REGISTRY`"
   - Actual location: `apps/rad-os/lib/apps/catalog.tsx` (exports `APP_CATALOG`)

3. **Property naming inconsistency across API boundaries:**
   - Core AppWindow (radiants): `title`, `icon`, `contentPadding`
   - Rad-OS wrapper: `title`, `icon`, `contentPadding`
   - Catalog: `windowTitle`, `windowIcon`, `contentPadding`
   - This creates friction at the contract boundary (RadOS/AppWindow.tsx wraps core)

---

## Summary Table

| Finding | Type | File:Line | Severity |
|---------|------|-----------|----------|
| Title bar buttons use wrong variant and size | Removed/renamed | DESIGN.md:1099–1107, AppWindow.tsx:595–750 | HIGH |
| AppConfig shape doesn't match example | Renamed fields, added properties | DESIGN.md:1149–1163, catalog.tsx:58–184 | HIGH |
| contentPadding default impractical | Incomplete | DESIGN.md:1176, catalog.tsx | MEDIUM |
| Window limit shows console warning, not toast | Misleading | DESIGN.md:1097, windowsSlice.ts:316 | LOW |
| Radio as taskbar widget undocumented | Missing | DESIGN.md:11, catalog.tsx:148–150 | LOW |
| Tab routing syntax undocumented | Missing | DESIGN.md:13, useHashRouting.ts:13–14 | LOW |
| Ambient capability system undocumented | Missing | DESIGN.md, catalog.tsx:40–44, Desktop.tsx | MEDIUM |
| Control surface docks undocumented | Missing | DESIGN.md, AppWindow.tsx:51–56 | MEDIUM |
| Window sizing tiers undocumented | Missing | DESIGN.md, catalog.tsx:65 | LOW |
| Zoom animation on launch undocumented | Missing | DESIGN.md, windowsSlice.ts:231–278 | LOW |

