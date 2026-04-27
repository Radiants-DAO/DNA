# Lane 6 — Defensive Coding (2026-04-21)

**Rule:** CLAUDE.md — "don't add error handling for scenarios that can't happen."
**Seed:** grep try/catch, `typeof window === 'undefined'`, `if (!x) return` across source.
**Cap:** 20.
**Total findings:** 3.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | DEFENSIVE-001 | `packages/radiants/components/core/AppWindow/AppWindow.tsx` | 384, 929 + several | low | ssr-guard-hot-path | Multiple `if (typeof window === 'undefined') return;` inside `useCallback`/`useEffect` bodies. Inside a `useEffect`, the window is always defined — React effects don't run during SSR. | Drop the guard inside effect / callback bodies that are only invoked client-side. Keep guards for top-level module code and for initial `useState(() => …)` lazy init (which DOES run on SSR). | S | LEGACY-003 (same file hot zone) |
| 2 | DEFENSIVE-002 | `apps/rad-os/components/apps/manifesto/{CoverPage,ForwardPage}.tsx` | 79, 29 | low | ssr-guard-effect | Same pattern — SSR check inside `useEffect`. | Drop the window guard in the effect body. | XS | |
| 3 | DEFENSIVE-003 | `apps/rad-os/hooks/useHashRouting.ts` | 38, 91 | low | ssr-guard-effect | SSR check inside `useEffect` / `useLayoutEffect`. | Drop. | XS | |

## Confirmed NOT findings (load-bearing guards)

- `store/index.ts:39` — SSR guard around `localStorage` in a zustand `migrate` function (runs at store-construction time, can execute on server). **Keep.**
- `windowsSlice.ts:70, 118` — same pattern: ran during slice init. **Keep.**
- `getBodyFontSize` in `GoodNewsLegacyApp.tsx:138` — helper called at module top-level. **Keep.**
- `useResolvedColor.ts:15` — returns `fallback` when SSR; this is correct. **Keep.**
- All try/catch around `localStorage`, `navigator.clipboard`, `JSON.parse` in serialization — legitimate IO boundaries. **Keep.**
- `rasterize.ts:12` try/catch around `loadImage()` — legitimate error path. **Keep.**
- `useContainerSize.ts:17 if (!el) return;` — real possibility on first render (ref not attached). **Keep.**

## Pattern observation

The codebase is substantially defensive-clean compared to the 2026-04-16 snapshot (27 defensive findings). Wave 9 appears to have landed SSR-guard cleanup on `WindowTitleBar.tsx` (DEFENSIVE-001 from that audit — now the file carries a single legitimate clipboard try/catch).

Remaining noise is concentrated in `AppWindow.tsx` SSR guards inside effect bodies — same file is a legacy hot zone (LEGACY-001) and would be fixed in the same sweep.
