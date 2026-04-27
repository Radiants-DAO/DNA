# Lane 5 — Weak Types (2026-04-21)

**Seed:** grep for `any`, `as any`, `<any>`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` across source (excluding `.next/`, `archive/`, vendored `lib/dotting`, generated).
**Cap:** 20.
**Total findings:** 2.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | WEAK-001 | `apps/rad-os/lib/dotting/utils/eventDispatcher.ts` | 2 | low | vendored-any | `type EventCallback = (...args: any[]) => void;` — in vendored Dotting code. | Keep (vendored). Document as explicit exception, or tighten to `(...args: unknown[]) => void` if all internal emitters have typed payloads. | S | TYPE-004 |
| 2 | WEAK-002 | `apps/rad-os/lib/dotting/components/Canvas/DataLayer.tsx` | 597 | low | cast-any-escape-hatch | `... ) as any; // this is to forestall typescript error` — single `as any` in the 3840-LOC Dotting Editor. | Vendored code. Investigate specific TS error and type the cast; if not feasible, keep but replace with `as unknown as T`. | M | |

## Observations

- The only `any` appearances in source are in the vendored Dotting pixel-editor folder (`apps/rad-os/lib/dotting/`). The rest of the monorepo has **zero** `any`, zero `ts-ignore`, zero widening casts.
- Prior audit (2026-04-16) flagged 19 weak-type items concentrated in `packages/radiants/registry/runtime-attachments.tsx`. Wave 5 resolved all of them using `React.ComponentProps<typeof X>['prop']` tricks. Codebase is now materially tighter.
- The 11 unused types in `AppWindow.tsx` (lane 2) are dead, not weak.

## Recommended guardrail (not a finding)

Add `@typescript-eslint/no-explicit-any: error` scoped to `apps/rad-os/{app,components,hooks,store,lib}/**/*.{ts,tsx}` and all of `packages/*/!(**/lib/dotting/**)`. The ceiling is already effectively zero; lock it in.
