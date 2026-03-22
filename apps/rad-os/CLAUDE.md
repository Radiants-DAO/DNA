# RadOS — CLAUDE.md

Next.js 16 desktop-OS UI. Part of the DNA monorepo (`apps/rad-os/`).

## Commands

```bash
pnpm dev         # Dev server (localhost:3000) — run from monorepo root
pnpm build       # Production build
pnpm test        # Vitest
```

## Directory Map

```
app/                        # Next.js App Router
components/
  apps/                     # App components (BrandAssets, RadRadio, Studio, etc.)
  Rad_os/                   # Window system (AppWindow, Desktop, Taskbar, StartMenu)
  background/               # WebGL sun background
  ui/                       # Local UI wrappers (imports from @rdna/radiants)
hooks/                      # useWindowManager, useHashRouting, useKonamiCode, useIsMobile
store/
  index.ts                  # Combined Zustand store (devtools + persist)
  slices/                   # windows, preferences, radRadio, wallet, mockData
lib/
  apps/                     # App catalog — single source of truth for all app metadata
  mockData/                 # Mock data (tracks, radiants, submissions)
  constants.tsx             # Window sizing, shared constants
public/
  assets/                   # Logos, images, fonts
  media/                    # Audio (music/) and video (video/)
scripts/                    # create-app scaffolding
```

## Key Patterns

- **App catalog** (`lib/apps/catalog.tsx`): Single module that owns all app identity — id, title, icon, component, sizing, ambient capability, start menu placement.
- **Window system**: `AppWindow` (desktop, draggable) / `MobileAppModal` (mobile, fullscreen). State in `windowsSlice`.
- **Ambient capability**: Apps can declare `wallpaper`, `widget`, `controller` components for background/widget modes.
- **UI components**: Import from `@rdna/radiants/components/core`. Design tokens in `design.md` (symlink to `packages/radiants/DESIGN.md`).
- **State**: Zustand slice pattern. All state in one store. Persist middleware for preferences + favorites.

## References

- `design.md` — Design system tokens, components, patterns (symlinked)
- `SPEC.md` — Original build spec (partially superseded by catalog pattern)
