# RadOS App Catalog Boundary Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace RadOS's scattered app identity and launch policy with a single app-catalog boundary, then standardize optional ambient widget behavior for apps that support multi-tasking ambience.

**Architecture:** Introduce a catalog module that owns app launch config, per-surface projections, and optional ambient shell capability. Internalize window launch sizing inside the store so callers only open by app id, then make Desktop, Start Menu, Trash, and hash routing consume catalog selectors instead of hardcoded lists or raw registry lookups. Keep `isWidget`/`toggleWidget` as runtime state names for now to limit blast radius, but derive widget availability from catalog capability rather than one-off flags and Rad Radio special cases.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand 5, TypeScript, Vitest, Testing Library, pnpm workspaces

**Worktree:** Create with `git worktree add .claude/worktrees/rados-app-catalog -b feat/rados-app-catalog` from repo root.

---

## Success Criteria

1. `openWindow` and `toggleWindow` accept only `appId`; callers no longer pass `defaultSize`.
2. Launch centering uses app defaults resolved internally from catalog data.
3. Start Menu, desktop icon surfaces, trash list, and hash routing all derive from the same catalog/selectors.
4. Intentional presentation variance remains explicit through projection fields like launcher title/section instead of duplicated ad hoc lists.
5. Widget mode is optional and only available for ambience-capable apps.
6. Ambient widget mode is singleton: enabling widget mode for one app exits widget mode for every other window.
7. Rad Radio ambient wallpaper, floating widget, and controller render through a standard ambient capability path, not hardcoded `APP_IDS.MUSIC` branches in `Desktop`.
8. `AppWindow` shell props, including help and mock-state chrome, are derived from catalog-owned metadata rather than a second config source.
9. `apps/rad-os/scripts/create-app.ts` points to the new catalog boundary and no longer emits stale `AppConfig` snippets.
10. `apps/rad-os` has a minimal Vitest harness covering the catalog and window-store contract.

## Current Problems To Eliminate

- Launch policy leaks to callers today: `Desktop`, `DesktopIcon`, and `TrashApp` pass `defaultSize`, but `StartMenu` and `useHashRouting` do not.
- The store uses caller-supplied size only for initial centering, while `AppWindow` renders from the app config prop, so some launch paths can position windows using the wrong size without rendering the wrong size.
- Start Menu duplicates app ids, labels, icons, and grouping instead of deriving them from the intended source of truth.
- The current scaffolder emits `minSize` and numeric `defaultSize` snippets that do not match the current `AppConfig` contract.
- Rad Radio ambient behavior is hardcoded in `Desktop` even though it is a shell capability, not core desktop logic.
- Help and mock-state chrome are still sourced separately from launch config today, so they will remain a second source of truth unless they move into the catalog boundary too.

## Target Model

### Catalog Boundary

Create `apps/rad-os/lib/apps/catalog.tsx` as the single owned boundary for app metadata:

```tsx
import React, { lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { WindowSizeTier, WindowSize } from '@/lib/windowSizing';

export interface AppProps {
  windowId: string;
}

export type StartMenuSection = 'apps' | 'web3';

export interface AmbientCapability {
  wallpaper?: ComponentType;
  widget: ComponentType<{ appId: string; onExit: () => void }>;
  controller?: ComponentType;
}

export interface AppHelpConfig {
  showHelpButton: boolean;
  helpTitle?: string;
  helpContent?: ReactNode;
}

export interface AppMockStatesConfig {
  showMockStatesButton: boolean;
}

export interface AppCatalogEntry {
  id: string;
  windowTitle: string;
  launcherTitle?: string;
  windowIcon: ReactNode;
  launcherIcon?: ReactNode;
  component: ComponentType<AppProps> | null;
  defaultSize?: WindowSizeTier | WindowSize;
  resizable: boolean;
  contentPadding?: boolean;
  helpConfig?: AppHelpConfig;
  mockStatesConfig?: AppMockStatesConfig;
  desktopVisible?: boolean;
  startMenuSection?: StartMenuSection;
  trashed?: boolean;
  trashedDate?: string;
  ambient?: AmbientCapability;
}
```

Selector helpers should keep callers away from raw object shape. Prefer surface-specific projections over returning catalog entries and forcing surfaces to rebuild launcher/window copy:

```ts
export function getApp(id: string): AppCatalogEntry | undefined;
export function isValidAppId(id: string): boolean;
export function getDesktopLaunchers(): Array<{ id: string; label: string; icon: ReactNode }>;
export function getStartMenuSections(): Record<StartMenuSection, Array<{ id: string; label: string; icon: ReactNode }>>;
export function getTrashedApps(): Array<{ id: string; title: string; icon: ReactNode; trashedDate?: string }>;
export function getWindowChrome(id: string): Pick<AppCatalogEntry, 'windowTitle' | 'windowIcon' | 'defaultSize' | 'resizable' | 'contentPadding' | 'helpConfig' | 'mockStatesConfig' | 'ambient'> | undefined;
export function supportsAmbientWidget(id: string): boolean;
export function getActiveAmbientApp(windows: Array<{ id: string; isOpen: boolean; isWidget: boolean }>): { app: AppCatalogEntry; ambient: AmbientCapability } | null;
```

### Window Store Contract

`apps/rad-os/store/slices/windowsSlice.ts` should own launch sizing:

```ts
openWindow: (id) => {
  const defaults = getWindowChrome(id);
  const cssSize = defaults?.defaultSize ? resolveWindowSize(defaults.defaultSize) : undefined;
  const pxEstimate = cssSize
    ? { width: remToPx(cssSize.width), height: remToPx(cssSize.height) }
    : undefined;
  // use pxEstimate for initial position
}
```

Guard widget toggling in the store:

```ts
toggleWidget: (id) => {
  if (!supportsAmbientWidget(id)) return;
  // ambient mode is singleton: enabling one widget clears every other widget window
}
```

Delete `cssSize` from `WindowState`; it is not needed once sizing is resolved from catalog at launch time and the window component still receives `defaultSize` from the catalog entry.

### Surface Projections

- Desktop icon bar uses `getDesktopLaunchers()`
- Start Menu uses `getStartMenuSections()`
- Trash app uses `getTrashedApps()`
- Hash routing uses `isValidAppId()`
- App window shell props come from `getWindowChrome(windowState.id)`

### Ambient Capability

Do not make widget mode universal. Only ambience-capable apps define `ambient`, and only one app may be in ambient widget mode at a time.

Rad Radio becomes the first catalog entry with:

```tsx
ambient: {
  wallpaper: RadRadioAmbientWallpaper,
  widget: RadRadioAmbientWidget,
  controller: RadRadioAmbientController,
}
```

`Desktop` then renders from selectors instead of hardcoded music branches:

```tsx
const ambient = getActiveAmbientApp(windows);
const AmbientWallpaper = ambient?.ambient.wallpaper;
const AmbientWidget = ambient?.ambient.widget;
const AmbientController = ambient?.ambient.controller;
```

Non-goals for this refactor:

- Do not rename `isWidget` or `toggleWidget` yet.
- Do not generalize social links into the app catalog.
- Do not force Start Menu titles/icons to equal window titles/icons where the product intentionally differs.

## Phase 1: Add Test Harness For RadOS

### Task 1: Add Vitest to `apps/rad-os`

**Files:**
- Create: `apps/rad-os/vitest.config.ts`
- Create: `apps/rad-os/test/setup.ts`
- Modify: `apps/rad-os/package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Add test scripts and dev dependencies**

Modify `apps/rad-os/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^28.1.0",
    "vitest": "^2.1.9"
  }
}
```

**Step 2: Add Vitest config**

Create `apps/rad-os/vitest.config.ts`:

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
});
```

**Step 3: Add minimal setup**

Create `apps/rad-os/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

**Step 4: Install dependencies**

Run: `pnpm install`

Expected: lockfile updates and `apps/rad-os` can execute `vitest`.

**Step 5: Smoke-test the harness**

Run: `pnpm --filter rad-os exec vitest run`

Expected: `No test files found` and exit code `1`.

**Step 6: Commit**

```bash
git add apps/rad-os/package.json apps/rad-os/vitest.config.ts apps/rad-os/test/setup.ts pnpm-lock.yaml
git commit -m "test: add rad-os vitest harness"
```

## Phase 2: Lock The Refactor Contract With Tests

### Task 2: Write failing catalog and store tests

**Files:**
- Create: `apps/rad-os/test/app-catalog.test.ts`
- Create: `apps/rad-os/test/windows-slice.test.ts`
- Create: `apps/rad-os/test/ambient-capability.test.ts`

**Step 1: Write failing catalog tests**

Create `apps/rad-os/test/app-catalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getApp, getDesktopLaunchers, getStartMenuSections, getTrashedApps, getWindowChrome } from '@/lib/apps/catalog';

describe('app catalog selectors', () => {
  it('keeps start menu projections derived from catalog data', () => {
    const sections = getStartMenuSections();
    expect(sections.apps.map((app) => app.id)).toContain('brand');
    expect(sections.web3.map((app) => app.id)).toContain('studio');
  });

  it('allows launcher copy to differ from window copy explicitly', () => {
    const brand = getApp('brand');
    expect(brand?.windowTitle).toBe('Brand Assets');
    expect(brand?.launcherTitle).toBe('Brand & Press');
  });

  it('hides trashed apps from desktop projections while keeping them available to trash', () => {
    const desktopIds = getDesktopLaunchers().map((app) => app.id);
    const trashedIds = getTrashedApps().map((app) => app.id);
    for (const trashedId of trashedIds) {
      expect(desktopIds).not.toContain(trashedId);
    }
  });

  it('derives app window chrome from the catalog boundary', () => {
    const brand = getWindowChrome('brand');
    expect(brand?.windowTitle).toBe('Brand Assets');
    expect(brand?.helpConfig).toBeDefined();
    expect(brand?.mockStatesConfig).toBeDefined();
  });
});
```

**Step 2: Write failing store tests**

Create `apps/rad-os/test/windows-slice.test.ts`:

```ts
import { create } from 'zustand';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWindowsSlice, type WindowsSlice } from '@/store/slices/windowsSlice';

vi.mock('@/lib/apps', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apps')>('@/lib/apps');
  return {
    ...actual,
    supportsAmbientWidget: (id: string) => id === 'music' || id === 'music-2',
    getWindowChrome: (id: string) =>
      id === 'music-2'
        ? {
            windowTitle: 'Music 2',
            windowIcon: null,
            defaultSize: 'md',
            resizable: true,
            contentPadding: false,
            ambient: { widget: () => null },
          }
        : actual.getWindowChrome(id),
  };
});

const createStore = () => create<WindowsSlice>()((set, get, api) => createWindowsSlice(set, get, api));

describe('windows slice launch policy', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
    document.documentElement.style.fontSize = '16px';
  });

  it('centers from catalog default size without caller-supplied defaults', () => {
    const store = createStore();
    store.getState().openWindow('music');
    expect(store.getState().getWindow('music')?.position).toEqual({ x: 336, y: 138 });
  });

  it('ignores widget toggles for apps without ambient capability', () => {
    const store = createStore();
    store.getState().openWindow('brand');
    store.getState().toggleWidget('brand');
    expect(store.getState().getWindow('brand')?.isWidget).toBe(false);
  });

  it('keeps ambient widget mode singleton', () => {
    const store = createStore();
    store.getState().openWindow('music');
    store.getState().openWindow('music-2');
    store.getState().toggleWidget('music');
    store.getState().toggleWidget('music-2');
    expect(store.getState().getWindow('music')?.isWidget).toBe(false);
    expect(store.getState().getWindow('music-2')?.isWidget).toBe(true);
  });
});
```

**Step 3: Write failing ambient selector tests**

Create `apps/rad-os/test/ambient-capability.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getActiveAmbientApp, supportsAmbientWidget } from '@/lib/apps/catalog';

describe('ambient capability', () => {
  it('marks Rad Radio as ambient-capable', () => {
    expect(supportsAmbientWidget('music')).toBe(true);
    expect(supportsAmbientWidget('brand')).toBe(false);
  });

  it('returns the active ambient app only when a widget window is open', () => {
    const ambient = getActiveAmbientApp([
      { id: 'music', isOpen: true, isWidget: true },
      { id: 'brand', isOpen: true, isWidget: false },
    ]);
    expect(ambient?.app.id).toBe('music');
  });

  it('ignores widget windows that do not have ambient capability', () => {
    const ambient = getActiveAmbientApp([
      { id: 'brand', isOpen: true, isWidget: true },
    ]);
    expect(ambient).toBeNull();
  });
});
```

**Step 4: Run the tests to verify they fail**

Run: `pnpm --filter rad-os exec vitest run apps/rad-os/test/app-catalog.test.ts apps/rad-os/test/windows-slice.test.ts apps/rad-os/test/ambient-capability.test.ts`

Expected: FAIL with module resolution errors for `@/lib/apps/catalog` and/or type/contract failures in `windowsSlice`.

**Step 5: Commit the red tests**

```bash
git add apps/rad-os/test/app-catalog.test.ts apps/rad-os/test/windows-slice.test.ts apps/rad-os/test/ambient-capability.test.ts
git commit -m "test: lock rad-os app catalog boundary behavior"
```

## Phase 3: Introduce The Catalog Boundary

### Task 3: Create catalog types, entries, and selectors

**Files:**
- Create: `apps/rad-os/lib/apps/catalog.tsx`
- Create: `apps/rad-os/lib/apps/index.ts`
- Create: `apps/rad-os/lib/windowSizing.ts`
- Modify: `apps/rad-os/lib/constants.tsx`

**Step 1: Move window sizing utilities into a pure helper**

Create `apps/rad-os/lib/windowSizing.ts`:

```ts
export const WINDOW_SIZES = {
  sm: { width: '30rem', height: '25rem' },
  md: { width: '48rem', height: '36rem' },
  lg: { width: '69rem', height: '50rem' },
  xl: { width: '86rem', height: '60rem' },
} as const;

export type WindowSizeTier = keyof typeof WINDOW_SIZES;
export type WindowSize = { width: string; height: string };

export function resolveWindowSize(size: WindowSizeTier | WindowSize): WindowSize {
  return typeof size === 'string' ? WINDOW_SIZES[size] : size;
}

export function remToPx(value: string): number {
  const rem = Number.parseFloat(value);
  if (typeof document !== 'undefined') {
    return rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  return rem * 16;
}
```

**Step 2: Create the catalog module**

Create `apps/rad-os/lib/apps/catalog.tsx` with:

```tsx
import React, { lazy } from 'react';
import { Icon, RadMarkIcon } from '@rdna/radiants/icons';
import type { WindowSize, WindowSizeTier } from '@/lib/windowSizing';
import { RadRadioAmbientWallpaper, RadRadioAmbientWidget, RadRadioAmbientController } from '@/components/apps/rad-radio/ambient';

const BrandAssetsApp = lazy(() => import('@/components/apps/BrandAssetsApp'));
const ManifestoApp = lazy(() => import('@/components/apps/ManifestoApp'));
const AboutApp = lazy(() => import('@/components/apps/AboutApp'));
const LinksApp = lazy(() => import('@/components/apps/LinksApp'));
const RadRadioApp = lazy(() => import('@/components/apps/RadRadioApp'));
const RadiantsStudioApp = lazy(() => import('@/components/apps/RadiantsStudioApp'));
const TrashApp = lazy(() => import('@/components/apps/TrashApp'));

export interface AppProps {
  windowId: string;
}

// types from Target Model section live here

export const APP_CATALOG: AppCatalogEntry[] = [
  {
    id: 'brand',
    windowTitle: 'Brand Assets',
    launcherTitle: 'Brand & Press',
    windowIcon: <RadMarkIcon size={20} />,
    component: BrandAssetsApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    helpConfig: {
      showHelpButton: true,
      helpTitle: 'Brand Assets Help',
      helpContent: <>Port the current help content here</>,
    },
    mockStatesConfig: {
      showMockStatesButton: true,
    },
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'music',
    windowTitle: 'Rad Radio',
    launcherTitle: 'Music',
    windowIcon: <Icon name="broadcast-dish" size={20} />,
    launcherIcon: <Icon name="music-8th-notes" size={20} />,
    component: RadRadioApp,
    defaultSize: 'md',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    startMenuSection: 'apps',
    ambient: {
      wallpaper: RadRadioAmbientWallpaper,
      widget: RadRadioAmbientWidget,
      controller: RadRadioAmbientController,
    },
  },
  // port the remaining current entries here
];

const APP_BY_ID = Object.fromEntries(APP_CATALOG.map((app) => [app.id, app]));

export function getApp(id: string) {
  return APP_BY_ID[id];
}

export function isValidAppId(id: string) {
  return id in APP_BY_ID;
}

export function getDesktopLaunchers() {
  return APP_CATALOG
    .filter((app) => app.desktopVisible && !app.trashed)
    .map((app) => ({
      id: app.id,
      label: app.launcherTitle ?? app.windowTitle,
      icon: app.launcherIcon ?? app.windowIcon,
    }));
}

export function getStartMenuSections() {
  return {
    apps: APP_CATALOG
      .filter((app) => app.startMenuSection === 'apps' && !app.trashed)
      .map((app) => ({ id: app.id, label: app.launcherTitle ?? app.windowTitle, icon: app.launcherIcon ?? app.windowIcon })),
    web3: APP_CATALOG
      .filter((app) => app.startMenuSection === 'web3' && !app.trashed)
      .map((app) => ({ id: app.id, label: app.launcherTitle ?? app.windowTitle, icon: app.launcherIcon ?? app.windowIcon })),
  };
}

export function getTrashedApps() {
  return APP_CATALOG
    .filter((app) => app.trashed)
    .map((app) => ({ id: app.id, title: app.windowTitle, icon: app.windowIcon, trashedDate: app.trashedDate }));
}

export function getWindowChrome(id: string) {
  const app = getApp(id);
  if (!app) return undefined;
  return {
    windowTitle: app.windowTitle,
    windowIcon: app.windowIcon,
    defaultSize: app.defaultSize,
    resizable: app.resizable,
    contentPadding: app.contentPadding,
    helpConfig: app.helpConfig,
    mockStatesConfig: app.mockStatesConfig,
    ambient: app.ambient,
  };
}

export function supportsAmbientWidget(id: string) {
  return Boolean(getApp(id)?.ambient?.widget);
}

export function getActiveAmbientApp(windows: Array<{ id: string; isOpen: boolean; isWidget: boolean }>) {
  const active = windows.find((windowState) => windowState.isOpen && windowState.isWidget && supportsAmbientWidget(windowState.id));
  if (!active) return null;
  const app = getApp(active.id)!;
  return { app, ambient: app.ambient! };
}
```

**Step 3: Export the boundary**

Create `apps/rad-os/lib/apps/index.ts`:

```ts
export * from './catalog';
```

**Step 4: Reduce `lib/constants.tsx` to compatibility-only exports**

Modify `apps/rad-os/lib/constants.tsx` to re-export only what still needs to exist during migration:

```ts
export { WINDOW_SIZES, resolveWindowSize, remToPx } from '@/lib/windowSizing';
export type { WindowSize, WindowSizeTier } from '@/lib/windowSizing';
export type { AppProps } from '@/lib/apps';
```

Delete app registry content from this file after consumers are migrated. Do not leave duplicate app lists behind.

**Step 5: Run the catalog tests**

Run: `pnpm --filter rad-os exec vitest run apps/rad-os/test/app-catalog.test.ts apps/rad-os/test/ambient-capability.test.ts`

Expected: `app-catalog.test.ts` and `ambient-capability.test.ts` pass; `windows-slice.test.ts` still fails until the store contract changes.

**Step 6: Commit**

```bash
git add apps/rad-os/lib/apps/catalog.tsx apps/rad-os/lib/apps/index.ts apps/rad-os/lib/windowSizing.ts apps/rad-os/lib/constants.tsx
git commit -m "refactor: add rad-os app catalog boundary"
```

## Phase 4: Internalize Launch Policy In The Store

### Task 4: Remove caller-owned launch defaults

**Files:**
- Modify: `apps/rad-os/store/slices/windowsSlice.ts`
- Modify: `apps/rad-os/hooks/useWindowManager.ts`

**Step 1: Make the store read catalog defaults**

Update `apps/rad-os/store/slices/windowsSlice.ts`:

```ts
import { getWindowChrome, supportsAmbientWidget } from '@/lib/apps';
import type { WindowSizeTier, WindowSize } from '@/lib/windowSizing';
import { resolveWindowSize, remToPx } from '@/lib/windowSizing';

export interface WindowState {
  id: string;
  isOpen: boolean;
  isFullscreen: boolean;
  isWidget: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  activeTab?: string;
}

openWindow: (id) => {
  const defaults = getWindowChrome(id);
  const cssSize = defaults?.defaultSize ? resolveWindowSize(defaults.defaultSize) : undefined;
  const pxEstimate = cssSize
    ? { width: remToPx(cssSize.width), height: remToPx(cssSize.height) }
    : undefined;
  // existing logic, minus cssSize on the stored window
},

toggleWidget: (id) => {
  if (!supportsAmbientWidget(id)) return;
  const targetIsWidget = !get().getWindow(id)?.isWidget;
  set((state) => ({
    windows: state.windows.map((w) =>
      w.id === id
        ? { ...w, isWidget: targetIsWidget, isFullscreen: false }
        : targetIsWidget
          ? { ...w, isWidget: false }
          : w
    ),
  }));
},
```

**Step 2: Simplify the hook contract**

Update `apps/rad-os/hooks/useWindowManager.ts`:

```ts
openWindow: (appId: string) => void;
toggleWindow: (appId: string) => void;

const openWindow = useCallback((appId: string) => {
  storeOpenWindow(appId);
}, [storeOpenWindow]);

const toggleWindow = useCallback((appId: string) => {
  const window = storeGetWindow(appId);
  if (!window || !window.isOpen) {
    storeOpenWindow(appId);
  } else {
    storeCloseWindow(appId);
  }
}, [storeGetWindow, storeOpenWindow, storeCloseWindow]);
```

**Step 3: Run the store tests**

Run: `pnpm --filter rad-os exec vitest run apps/rad-os/test/windows-slice.test.ts`

Expected: PASS.

**Step 4: Run the whole current suite**

Run: `pnpm --filter rad-os exec vitest run`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/rad-os/store/slices/windowsSlice.ts apps/rad-os/hooks/useWindowManager.ts
git commit -m "refactor: internalize rad-os launch policy"
```

## Phase 5: Move Surface Rendering Onto Catalog Projections

### Task 5: Replace raw registry usage and hardcoded app lists

**Files:**
- Modify: `apps/rad-os/components/Rad_os/Desktop.tsx`
- Modify: `apps/rad-os/components/Rad_os/DesktopIcon.tsx`
- Modify: `apps/rad-os/components/Rad_os/StartMenu.tsx`
- Modify: `apps/rad-os/components/apps/TrashApp.tsx`
- Modify: `apps/rad-os/hooks/useHashRouting.ts`

**Step 1: Update Desktop and DesktopIcon**

Use catalog selectors:

```tsx
import { getDesktopLaunchers, getWindowChrome, getActiveAmbientApp } from '@/lib/apps';

const allApps = getDesktopLaunchers();

const config = getWindowChrome(windowState.id);
if (!config) return null;

{allApps.map((app) => (
  <DesktopIcon
    key={app.id}
    appId={app.id}
    label={app.label}
    icon={app.icon}
  />
))}
```

Update `DesktopIcon`:

```tsx
const handleClick = () => {
  openWindow(appId);
};
```

**Step 2: Replace Start Menu hardcoded app arrays**

Update `apps/rad-os/components/Rad_os/StartMenu.tsx`:

```tsx
import { getWindowChrome, getStartMenuSections } from '@/lib/apps';

const sections = getStartMenuSections();
const trashApp = getWindowChrome('trash');

{sections.apps.map((app) => (
  <MenuItem
    key={app.id}
    item={{
      id: app.id,
      label: app.label,
      icon: app.icon,
    }}
    onClick={() => handleAppClick(app.id)}
  />
))}
```

Use the same selector data for the mobile overlay and footer trash button.

**Step 3: Update Trash and hash routing**

`TrashApp`:

```tsx
import { getTrashedApps } from '@/lib/apps';

const trashedApps = getTrashedApps();
onClick={() => openWindow(app.id)}
```

`useHashRouting`:

```ts
import { isValidAppId } from '@/lib/apps';

if (isValidAppId(appId)) {
  openWindow(appId);
}
```

**Step 4: Run focused tests**

Run: `pnpm --filter rad-os exec vitest run apps/rad-os/test/app-catalog.test.ts apps/rad-os/test/windows-slice.test.ts apps/rad-os/test/ambient-capability.test.ts`

Expected: PASS.

**Step 5: Run lint**

Run: `pnpm --filter rad-os lint`

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/rad-os/components/Rad_os/Desktop.tsx apps/rad-os/components/Rad_os/DesktopIcon.tsx apps/rad-os/components/Rad_os/StartMenu.tsx apps/rad-os/components/apps/TrashApp.tsx apps/rad-os/hooks/useHashRouting.ts
git commit -m "refactor: derive rad-os shell surfaces from app catalog"
```

## Phase 6: Standardize Ambient Widget Capability

### Task 6: Move Rad Radio shell behavior behind `ambient`

**Files:**
- Create: `apps/rad-os/components/apps/rad-radio/ambient.tsx`
- Modify: `apps/rad-os/components/apps/RadRadioApp.tsx`
- Modify: `apps/rad-os/components/Rad_os/Desktop.tsx`
- Modify: `apps/rad-os/lib/apps/catalog.tsx`

**Step 1: Create an ambient adapter file for Rad Radio**

Create `apps/rad-os/components/apps/rad-radio/ambient.tsx`:

```tsx
import React from 'react';
import { VideoPlayer, RadRadioWidget, RadRadioController, videos } from '@/components/apps/RadRadioApp';
import { useRadRadioStore } from '@/store';

export function RadRadioAmbientWallpaper() {
  const { currentVideoIndex, prevVideo, nextVideo } = useRadRadioStore();
  return (
    <VideoPlayer
      currentVideoIndex={currentVideoIndex}
      onPrevVideo={() => prevVideo(videos.length)}
      onNextVideo={() => nextVideo(videos.length)}
      wallpaperMode
    />
  );
}

export function RadRadioAmbientWidget({ appId, onExit }: { appId: string; onExit: () => void }) {
  return <RadRadioWidget onExitWidget={onExit} />;
}

export function RadRadioAmbientController() {
  return <RadRadioController />;
}
```

This keeps shell-specific pieces out of `Desktop`.

**Step 2: Update the catalog entry**

Point the `music` entry's `ambient` field at the new adapter exports.

**Step 3: Remove Rad Radio special-casing from Desktop**

Update `apps/rad-os/components/Rad_os/Desktop.tsx`:

```tsx
const ambient = getActiveAmbientApp(windows);
const AmbientWallpaper = ambient?.ambient.wallpaper;
const AmbientWidget = ambient?.ambient.widget;
const AmbientController = ambient?.ambient.controller;

{AmbientWallpaper ? (
  <div className="absolute inset-0 z-0 bg-inv">
    <AmbientWallpaper />
  </div>
) : (
  <div className="absolute inset-0 z-0 bg-accent dark:bg-page">
    <WebGLSun />
  </div>
)}

{ambient && AmbientWidget && (
  <div className="fixed top-4 right-4 z-[900] pointer-events-auto">
    <AmbientWidget appId={ambient.app.id} onExit={() => toggleWidget(ambient.app.id)} />
  </div>
)}

{AmbientController ? <AmbientController /> : null}
```

When passing shell props into `AppWindow`, derive all shell chrome from `getWindowChrome(windowState.id)` and widget button visibility from capability:

```tsx
showWidgetButton={Boolean(config.ambient)}
onWidget={config.ambient ? () => toggleWidget(windowState.id) : undefined}
showHelpButton={config.helpConfig?.showHelpButton}
helpTitle={config.helpConfig?.helpTitle}
helpContent={config.helpConfig?.helpContent}
showMockStatesButton={config.mockStatesConfig?.showMockStatesButton}
```

**Step 4: Keep ambient tests aligned with the singleton contract**

Ensure `ambient-capability.test.ts` still covers `getActiveAmbientApp` returning `null` for non-ambient widget windows, and keep the singleton widget assertion in `windows-slice.test.ts`.

**Step 5: Run tests and lint**

Run: `pnpm --filter rad-os exec vitest run`

Expected: PASS.

Run: `pnpm --filter rad-os lint`

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/rad-os/components/apps/rad-radio/ambient.tsx apps/rad-os/components/apps/RadRadioApp.tsx apps/rad-os/components/Rad_os/Desktop.tsx apps/rad-os/lib/apps/catalog.tsx apps/rad-os/test/ambient-capability.test.ts
git commit -m "refactor: standardize ambient widget capability"
```

## Phase 7: Fix Tooling And Developer Guidance

### Task 7: Repair the app scaffolder and developer docs

**Files:**
- Modify: `apps/rad-os/scripts/create-app.ts`
- Modify: `apps/rad-os/trash/registry.tsx`
- Modify: `apps/rad-os/README.md`
- Modify: `apps/rad-os/SPEC.md`

**Step 1: Update the scaffolder output**

Change `create-app.ts` so the printed next steps target the catalog entry, not `APP_REGISTRY` + `APP_IDS`, and remove stale `minSize` examples:

```ts
const catalogSnippet = (config: AppConfig) => `
{
  id: '${config.name}',
  windowTitle: '${config.pascalName.replace(/([A-Z])/g, ' $1').trim()}',
  windowIcon: <${config.pascalName}Icon size={20} />,
  component: ${config.pascalName}App,
  defaultSize: 'md',
  resizable: true,
  desktopVisible: true,
  startMenuSection: 'apps',
},
`;
```

Update the printed instructions accordingly.

**Step 2: Fix inline comments and docs**

- `trash/registry.tsx` should no longer instruct developers to remove Start Menu references manually.
- `README.md` and `SPEC.md` should point at `lib/apps/catalog.tsx` as the catalog boundary.

Keep the doc change narrow. Do not rewrite unrelated architecture sections.

**Step 3: Run targeted checks**

Run: `pnpm --filter rad-os lint`

Expected: PASS.

Run: `pnpm --filter rad-os exec vitest run`

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/rad-os/scripts/create-app.ts apps/rad-os/trash/registry.tsx apps/rad-os/README.md apps/rad-os/SPEC.md
git commit -m "docs: point rad-os app development at catalog boundary"
```

## Phase 8: Final Verification

### Task 8: Verify the whole refactor before merge

**Files:**
- No code changes expected unless verification fails

**Step 1: Run unit tests**

Run: `pnpm --filter rad-os exec vitest run`

Expected: PASS.

**Step 2: Run lint**

Run: `pnpm --filter rad-os lint`

Expected: PASS.

**Step 3: Run production build**

Run: `pnpm --filter rad-os build`

Expected: PASS.

**Step 4: Manual smoke-check in browser**

Run: `pnpm --filter rad-os dev`

Verify:

- Desktop icons still open the correct apps.
- Start Menu desktop and mobile views show catalog-derived labels and sections.
- `#brand,manifesto` opens both windows.
- Rad Radio can enter widget mode.
- In widget mode, the ambient wallpaper and floating widget render.
- A non-ambient app does not expose the widget button.
- Trash still opens trashed apps.

**Step 5: Commit any final fixups**

```bash
git add -A
git commit -m "chore: finalize rad-os app catalog boundary"
```
