# RadOS

RadOS is the desktop-style web app inside the DNA monorepo. It renders the Radiants brand and community surface as a windowed shell on desktop and a fullscreen app shell on mobile, built on Next.js, Zustand, and the shared `@rdna/radiants` design system.

## Current Surface

Desktop launchers are defined in [lib/apps/catalog.tsx](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/lib/apps/catalog.tsx). The current desktop-visible apps are:

- `brand` -> Brand Assets
- `manifesto` -> Manifesto
- `music` -> Rad Radio
- `about` -> About

Internal product/design tooling also lives in this app, especially under `components/apps/pattern-playground` and `components/apps/typography-playground`, but not every internal surface is exposed as a desktop launcher.

`Rad Radio` is currently the only app with ambient capabilities. It can provide:

- wallpaper/background treatment
- a floating widget surface
- a persistent controller

## Running RadOS

From the repo root:

```bash
pnpm install
pnpm --filter rad-os dev
pnpm --filter rad-os test
pnpm --filter rad-os build
```

If you `cd apps/rad-os`, the equivalent local commands are:

```bash
pnpm dev
pnpm test
pnpm build
```

`build` runs the registry freshness guard before `next build`, so generated Radiants and playground artifacts must already be current.

## Runtime Architecture

Top-level runtime flow:

```txt
app/page.tsx
  > RadOSDesktop
    > useHashRouting()
    > ToastProvider
    > InvertModeProvider
    > Desktop
```

Desktop runtime shape:

```txt
Desktop
  > background layer
  > watermark/typewriter copy
  > desktop launchers
  > Taskbar
  > desktop windows or mobile modals
  > ambient widget
  > ambient controller
```

### Window Shell

The shared window chrome now lives in `@rdna/radiants/components/core/AppWindow`. RadOS consumes it through thin wrappers in `components/Rad_os/`.

Primary wrappers:

- [AppWindow.tsx](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/components/Rad_os/AppWindow.tsx) for desktop windowed/fullscreen presentation
- [MobileAppModal.tsx](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/components/Rad_os/MobileAppModal.tsx) for mobile fullscreen presentation
- [WindowContent.tsx](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/components/Rad_os/WindowContent.tsx) as the RadOS alias for `AppWindowBody`

Public `AppWindow` API includes:

- shell state/layout: `open`, `position`, `defaultPosition`, `size`, `defaultSize`, `resizable`, `presentation`
- chrome toggles: `showCopyButton`, `showCloseButton`, `showFullscreenButton`, `showWidgetButton`, `showActionButton`
- callbacks: `onClose`, `onFullscreen`, `onWidget`, `onFocus`, `onPositionChange`, `onSizeChange`

Desktop `AppWindow` shape:

```txt
AppWindow
  > Draggable
    > div[role="dialog"][data-app-window]
      > TitleBar
      > content
      > resize handles
```

Typical content shape:

```txt
AppWindow
  > AppWindowBody
    > ScrollArea.Root or plain div
      > padded children
```

On desktop, launcher clicks open/focus windows. On mobile, the same app surfaces render through `MobileAppModal`.

### State Model

RadOS uses one Zustand store composed from three slices in [store/index.ts](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/store/index.ts):

- `windows` -> open/close/focus/fullscreen/widget state, window position/size, active tabs
- `preferences` -> volume, reduce motion, dark mode, invert mode
- `radRadio` -> channel, playback, seek state, favorites

Persisted state is intentionally limited. Preferences and radio favorites persist; window positions/open windows do not.

### App Catalog

The catalog in [lib/apps/catalog.tsx](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/lib/apps/catalog.tsx) is the source of truth for:

- lazy app component registration
- launcher visibility
- start menu grouping
- window chrome defaults
- ambient capability wiring

`Desktop`, `StartMenu`, the window shell, and ambient surfaces all resolve behavior from this catalog instead of duplicating per-app configuration.

## Design System Boundaries

Shared design-system primitives come from `@rdna/radiants`, not from this app:

```tsx
import { Button, Tabs, ToastProvider } from '@rdna/radiants/components/core';
import { Icon, RadMarkIcon } from '@rdna/radiants/icons/runtime';
```

Use these boundaries:

- `@rdna/radiants/components/core` for reusable primitives
- `@rdna/radiants/icons/runtime` for shared runtime icons
- `components/Rad_os/` for RadOS shell composition
- `components/ui/` for app-local composition helpers, not core primitives

## Adding Apps

App components receive a `windowId` prop:

```tsx
interface AppProps {
  windowId: string;
}
```

Typical workflow:

1. Add the app component under `apps/rad-os/components/apps/`.
2. Register it in [lib/apps/catalog.tsx](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/lib/apps/catalog.tsx).
3. Set launcher visibility with `desktopVisible` and `category` (`'tools' | 'media' | 'about' | 'links'`); add `subtabs` if the app should deep-link into a specific tab from the Start menu.
4. Set chrome behavior with `defaultSize`, `resizable`, `contentPadding`, and optional `ambient`.

Catalog example:

```tsx
const MyApp = lazy(() => import('@/components/apps/MyApp'));

{
  id: 'myapp',
  windowTitle: 'My App',
  windowIcon: <Icon name="square" size={20} />,
  component: MyApp,
  defaultSize: 'md',
  resizable: true,
  desktopVisible: true,
  category: 'tools',
}
```

For standalone prototype apps, scaffold from the workspace create package:

```bash
pnpm --filter @rdna/create exec node --experimental-strip-types src/cli.ts my-app --out-dir /tmp/my-app
```

That scaffold is backed by:

- [packages/create](/Users/rivermassey/Desktop/dev/DNA/packages/create)
- [templates/rados-app-prototype](/Users/rivermassey/Desktop/dev/DNA/templates/rados-app-prototype)

## Key Paths

| Path | Purpose |
|------|---------|
| `apps/rad-os/app/` | Next.js entrypoints and asset routes |
| `apps/rad-os/components/Rad_os/` | Desktop shell, taskbar, start menu, window wrappers |
| `apps/rad-os/components/apps/` | Application surfaces rendered inside the shell |
| `apps/rad-os/components/ui/` | App-local composition components |
| `apps/rad-os/hooks/` | Window manager, hash routing, responsive helpers |
| `apps/rad-os/lib/apps/` | App catalog and chrome/ambient selectors |
| `apps/rad-os/store/slices/` | Zustand slices |
| `apps/rad-os/test/` | Vitest coverage for app behavior |
| `packages/radiants/` | Shared design system used by RadOS |
| `packages/create/` | Standalone app scaffolder |
| `templates/rados-app-prototype/` | Scaffold template source |

## Related Docs

Start here for deeper context:

- [SPEC.md](/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/SPEC.md)
- [packages/radiants/README.md](/Users/rivermassey/Desktop/dev/DNA/packages/radiants/README.md)
- [docs/production-readiness-checklist.md](/Users/rivermassey/Desktop/dev/DNA/docs/production-readiness-checklist.md)

Older references to `.vault` or app-local `components/ui` primitives are obsolete. The current source of truth is the code in this app plus the shared `packages/radiants` and `packages/create` packages.
