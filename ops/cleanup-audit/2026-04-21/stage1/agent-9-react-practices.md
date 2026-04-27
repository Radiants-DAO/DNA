# Lane 9 — React Practices (2026-04-21)

**Rule set:** `rdna/prefer-rdna-components`, effect-as-state, derived-state, inline-style-hot-path, a11y-on-clickable-div.
**Cap:** 20.
**Total findings:** 6.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | REACT-001 | `apps/rad-os/app/ctrl-preview/page.tsx` | 97 inline, + 113, 127, 158 (fontSize:10) | med | inline-style-hot-path | 97 inline `style={{…}}` objects in one 1180-LOC file; several duplicate the same DAW-aesthetic `{ fontSize: 10, lineHeight: 'round(…)', textShadow: GLOW }` across rows. | Hoist shared style objects to module-level constants; the DAW-style constants should live in `@rdna/ctrl/styles` eventually. | M | DEDUP-001, RDNA-DRIFT-04, T2-DEEP-01 |
| 2 | REACT-002 | `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx` | 103, 186 + `FibonacciMosaic.tsx:267, 303, 355` | med | clickable-div-a11y | 5 raw `<button>` / clickable row sites disabled via `rdna/prefer-rdna-components`. Even as exceptions these are keyboard-focus liabilities (no `role`, no `tabIndex`, no keyboard handlers). | Introduce `<InteractiveRow>` primitive OR add explicit `tabIndex`/`onKeyDown` to each. | M | LEGACY-008 |
| 3 | REACT-003 | `apps/rad-os/components/apps/brand-assets/LogoMaker.tsx` | 350, 385, 514 | low | raw-button-intentional | Three raw `<button>` exceptions inside LogoMaker for thumbnail-tile chrome. Visually justified but will drift if reused elsewhere. | Keep as-is; add a one-line file-top comment explaining the exception bucket. | XS | LEGACY-007 |
| 4 | REACT-004 | `apps/rad-os/components/apps/manifesto/{CoverPage,ForwardPage}.tsx` | 79, 29 | low | effect-ssr-over-defensive | `useEffect(() => { if (layoutW <= 0 || typeof window === 'undefined') return; … })` — the window guard is vestigial inside an effect. | Drop window check; keep `layoutW <= 0` since that's a real condition. | XS | DEFENSIVE-002 |
| 5 | REACT-005 | `apps/rad-os/hooks/useHashRouting.ts` | 38, 91 | low | effect-ssr-guard | Two SSR guards inside effects; same pattern. | Drop the guards. | XS | DEFENSIVE-003 |
| 6 | REACT-006 | `packages/radiants/components/core/AppWindow/AppWindow.tsx` | 269 | low | effect-mixed-guard | `if (Number.isNaN(remValue) || typeof window === 'undefined') return undefined;` inside an effect's inner memoized callback. | Drop the window branch; keep `Number.isNaN`. | XS | LEGACY-001 |

## Confirmed NOT findings (verified against last audit's false-positive list)

- `useState(defaultOpen)` in Dialog/Sheet/AlertDialog/Drawer/Tabs — controlled/uncontrolled seed pattern, not derived state.
- `useEffectEvent` + `store.subscribe()` in `WebGLSun.tsx` — the correct pattern for imperative three.js subscription.
- `useMemo` / `useCallback` in `ToggleGroup.tsx:151`, `Slider.tsx:72` — each guards a context value / drag handler that is identity-sensitive. Keep.
- Zero missing `key=` on `.map()` outputs in the hand-audited samples. (ESLint's `react/jsx-key` covers this.)
- Zero hook-conditional `useState` / `useEffect` in source.

## Patterns worth noting (not findings)

- `useWebAudioEffects.ts:117` — `if (!audio || typeof window === 'undefined') return;` — `audio` is a ref that CAN be null; window guard is defensive. Could be simplified to `if (!audio) return;` once confirmed the hook never runs at module top-level.
- `icon-conversion-review.ts:262` try/catch around pixel-grid conversion — IO + parser error; legitimate.
