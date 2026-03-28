# RadOS App Template (`@rdna/create`) Brainstorm

**Date:** 2026-03-26
**Status:** Decided

## What We're Building

An npm scaffolding package (`npx @rdna/create my-app`) that generates a standalone Next.js project for prototyping RadOS apps. The output is a single-page prototype surface with a simulated AppWindow frame (resize handles, taskbar — no drag/z-index/window management). Apps use the real `AppProps` contract and RDNA design system so they can merge cleanly into production RadOS via PR.

## Why This Approach

**Single-page prototype surface with taskbar** hits the sweet spot:
- Lighter than a full RadOS clone (no window manager, z-index stack, drag system)
- Heavier than a bare component sandbox (still *feels* like RadOS with the chrome + taskbar)
- Apps built here use the same `AppProps` interface and `WindowContent` component, so the merge path is a copy + catalog entry

**npm dep for RDNA** (`@rdna/radiants`) keeps things clean — versioned, updatable, no vendoring drift. Requires publishing the package, which is already on the roadmap.

## Key Decisions

| Decision | Choice |
|----------|--------|
| **Scaffold output** | Single-page Next.js app with simulated AppWindow + taskbar |
| **Window behavior** | Resize handles: yes. Drag/z-index/multi-window: no |
| **RDNA delivery** | `@rdna/radiants` as npm dependency |
| **Layout modes** | All four — formalized as `mode` prop on WindowContent: `single-column`, `sidebar`, `tabbed`, `full-bleed` |
| **Merge path** | Manual guide (copy component + catalog entry) now; CLI eject command later |
| **Audience** | Both AI agents (CLAUDE.md-driven) and human devs (good README, commented examples) |
| **Component browser** | Not included — RadOS itself is the reference for available components |
| **Package name** | `@rdna/create` → `npx @rdna/create my-app` |
| **Taskbar** | Included — some apps need it for ambient/controller patterns |

## Scaffold Output Structure

```
my-app/
├── package.json              # Next.js + @rdna/radiants dep
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── CLAUDE.md                 # AI-friendly project context
├── README.md                 # Human-friendly getting started
├── MERGE-GUIDE.md            # How to merge into production RadOS
├── app/
│   ├── layout.tsx            # RDNA theme + fonts
│   ├── globals.css           # Tailwind v4 + @rdna/radiants imports
│   └── page.tsx              # Prototype surface (AppWindow frame + taskbar)
├── components/
│   ├── AppWindow.tsx          # Simplified AppWindow (resize, no drag/z-index)
│   ├── WindowContent.tsx      # Formalized layout modes
│   ├── Taskbar.tsx            # Minimal taskbar
│   └── app/
│       └── MyApp.tsx          # User's app (the thing they're building)
├── lib/
│   ├── types.ts               # AppProps, WindowSizeTier, layout mode types
│   └── store.ts               # Minimal Zustand store (preferences only)
└── public/
```

## WindowContent Layout Modes (New Formalization)

```tsx
<WindowContent mode="single-column">   {/* Centered max-w container, vertical sections */}
<WindowContent mode="sidebar">          {/* Fixed sidebar + scrollable main */}
<WindowContent mode="tabbed">           {/* Tab bar + switchable panels */}
<WindowContent mode="full-bleed">       {/* No padding, edge-to-edge */}
```

This formalization should be backported to the real RadOS WindowContent component too — it currently uses ad-hoc prop combos (`padding="none"`, `bordered={false}`, etc.) to achieve these same layouts.

## Merge Path (v1 — Manual)

1. Copy `components/app/MyApp.tsx` → `apps/rad-os/components/apps/MyApp.tsx`
2. Add catalog entry in `apps/rad-os/lib/apps/catalog.tsx`
3. Move any store slices to `apps/rad-os/store/slices/`
4. Update imports from local paths to `@/` aliases
5. Run `pnpm lint:design-system` to verify RDNA compliance
6. Open PR

## Resolved Questions

| Question | Resolution |
|----------|------------|
| **@rdna/radiants publishing** | Packages exist in @rdna namespace but are outdated. Build template first using workspace link; publish radiants as a separate task. |
| **Taskbar scope** | Real functionality — prototype control bar: window size presets, breakpoint dropdown (resize window to test mobile/tablet/desktop via container queries), fullscreen toggle, widget mode toggle, dark/light toggle. |
| **Dark mode toggle** | Yes, sun/moon toggle in the taskbar. RDNA has full dark mode tokens, devs need to test both. |
| **Store template** | Skip Zustand slice template — trivial to add, clutters scaffold for simple apps. Document the pattern in CLAUDE.md/README instead. |

## Open Questions

- **Breakpoint presets:** What named sizes for the breakpoint dropdown? (e.g., Mobile 375px, Tablet 768px, Desktop 1024px, or match RadOS window tiers sm/md/lg/xl?)

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA-app-template`
- Branch: `feat/app-template`

## Research Notes

- `apps/rad-os/lib/apps/catalog.tsx` — App registry contract (`AppCatalogEntry`, `AppProps`)
- `apps/rad-os/components/Rad_os/AppWindow.tsx` — Full window implementation (~400 lines, resize + drag + z-index)
- `apps/rad-os/components/Rad_os/WindowContent.tsx` — Content wrapper with scroll, padding, border
- `apps/rad-os/scripts/create-app.ts` — Existing in-monorepo scaffolder (template for our work)
- `apps/rad-os/lib/windowSizing.ts` — Window size tiers (sm/md/lg/xl in rem)
- `packages/radiants/package.json` — RDNA package, already has exports structure
- 40+ RDNA components available via `@rdna/radiants/components/core`
- WindowContent currently uses ad-hoc prop combos for layout — opportunity to formalize
