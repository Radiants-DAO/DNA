# Production Readiness Audit Swarm — Results

Generated 2026-03-22 by 6-agent read-only audit swarm.

Source of truth: `docs/production-readiness-checklist.md`

---

## Top 10 Findings

### 1. CI does not run component tests (Tooling Drift)
The GitHub Actions workflow runs `pnpm lint:design-system` and `pnpm registry:check:full` but never runs `pnpm test:components`. `turbo.json` has no `test` task. Component regressions are only caught locally.
- **Severity**: high | **Confidence**: high | **Fix**: small
- **Refs**: `.github/workflows/rdna-design-guard.yml`, `turbo.json`

### 2. ~20 pixel-corner + border violations across 6 files (UI Polish)
`border-*` on `pixel-rounded-*` elements breaks `clip-path` rendering. Found in RadiantsStudioApp (~10 instances), RadRadioWidget, BrandAssetsApp, Taskbar DarkModeToggle, DesignSystemTab. The `rdna/no-pixel-border` lint rule exists but violations persist.
- **Severity**: high | **Confidence**: high | **Fix**: medium
- **Refs**: `RadiantsStudioApp.tsx:109,138,169,354,451,476,483,513,518`, `RadRadioApp.tsx:608`, `BrandAssetsApp.tsx:734,756,879`, `Taskbar.tsx:96`, `DesignSystemTab.tsx:29`

### 3. All mouse events should be pointer events — 5 files, ~15 changes (Behavior)
`mousedown`/`mousemove`/`mouseup` in AppWindow resize, StartMenu dismiss, WebGLSun interaction, pixel art canvas, and RadRadio seek. Touch/stylus users cannot resize windows, close menus, or draw.
- **Severity**: high | **Confidence**: high | **Fix**: medium
- **Refs**: `AppWindow.tsx:271-276,519-553`, `StartMenu.tsx:110`, `WebGLSun.tsx:353-354`, `RadiantsStudioApp.tsx:356-359`

### 4. token-map.mjs is hand-maintained and already drifting (Tooling Drift)
`sun-red` oklch value differs between `tokens.css`, `token-map.mjs`, and `DESIGN.md`. Hex values are stale after oklch migration. Architecture A (Meta-First Generation) was decided but not yet wired to auto-generate this file.
- **Severity**: high | **Confidence**: high | **Fix**: medium
- **Refs**: `tokens.css:18`, `eslint/token-map.mjs:18,48,97`, `DESIGN.md:180`

### 5. Dead wallet/Web3 layer — ~125 lines with zero consumers (Dead Code)
`walletSlice.ts`, `useWalletStore()`, `Web3Shell.tsx`, `Web3ActionBar` (already on checklist), mock data (`radiants.ts`, `commissions.ts`, `nft-metadata/`, `nfts.json`, `download-nft-data.js`) — all unused. ~500+ lines of dead Web3 infrastructure.
- **Severity**: high | **Confidence**: high | **Fix**: medium
- **Refs**: `store/slices/walletSlice.ts`, `Rad_os/Web3Shell.tsx`, `lib/mockData/radiants.ts`, `lib/mockData/commissions.ts`, `lib/mockData/nft-metadata/`
- **Blocked by**: product decision on Web3 v1 scope

### 6. `getAppMockStates` import from deleted file could break builds (Checklist)
`Desktop.tsx:6` imports from `@/lib/mockStates` which does not exist. If TypeScript strict path resolution applies, this is a build error.
- **Severity**: high | **Confidence**: high | **Fix**: small (delete one line)
- **Refs**: `Desktop.tsx:6`

### 7. `data-start-button` attribute missing — StartMenu toggle broken (Behavior)
`StartMenu.tsx:99` checks `target.closest('[data-start-button]')` but Taskbar never sets this attribute. Clicking Start while the menu is open triggers both close-on-outside and toggle, making the menu uncloseable via Start button.
- **Severity**: high | **Confidence**: high | **Fix**: small
- **Refs**: `StartMenu.tsx:99`, `Taskbar.tsx:165-169`

### 8. Duplicate dark mode tokens in base.css vs dark.css (UI Polish)
`base.css` lines 610-615 contain a `[data-theme="dark"]` block with duplicate `--color-depth` declarations (different values), hex instead of oklch for `--color-tinted`, and divergent values from `dark.css`. Stale legacy block.
- **Severity**: medium | **Confidence**: high | **Fix**: small
- **Refs**: `packages/radiants/base.css:610-615`

### 9. 5 checklist items are already done but not marked (Checklist)
HelpPanel removal, MockStatesPopover removal, SunBackground deletion, Toolbar as RDNA component, and `focusableWhenDisabled` investigation are all complete. Separator/Divider consolidation is a non-issue (only Separator exists).
- **Severity**: medium | **Confidence**: high | **Fix**: small (bookkeeping)

### 10. Dual localStorage for radioFavorites + stale closure race (Behavior)
Zustand persist AND manual `localStorage.setItem('rados-favorites')` write to separate keys. Mount effect uses stale `favorites` closure from pre-hydration render. Can cause double-toggle or loss of favorites.
- **Severity**: medium | **Confidence**: high | **Fix**: small
- **Refs**: `radRadioSlice.ts:114-117`, `RadRadioApp.tsx:715-731`

---

## Checklist Items That Should Change Track

| Item | Current | Recommended | Rationale |
|------|---------|-------------|-----------|
| HelpPanel removal from core/index.ts | execution | **done** | Already deleted, no traces remain |
| MockStatesPopover removal from core/index.ts | execution | **done** | Already deleted, no traces remain |
| SunBackground.tsx deletion | mixed | **done** | File no longer exists, plan doc confirms decision |
| Toolbar as RDNA component | checklist T1i | **done** | Toolbar.tsx exists, exported, registered |
| focusableWhenDisabled investigation | mixed | **done** | Documented in meta, tested in Button.test.tsx |
| Separator/Divider consolidation | mixed | **done** | Divider never existed, only Separator. README bug. |
| T2 Mobile app drawer design | execution | **mixed** | No UX design exists; "Design + implement" is 2 tasks |
| T1d Checkbox/Radio full visual refactor | execution | **mixed** | Needs System 7 reference design and pixel art specs |
| T1e Toast align with Alert | execution | **mixed** | "Align" pattern undefined — shared primitive needed |
| T0 SunBackground `[explore]` | mixed | **done** | Already deleted |
| T4 token-map.mjs auto-generation | research | **mixed** | Architecture A already decided, needs phased execution |
| T3 LinksApp implement/remove | mixed | **execution** | 17-line stub, binary decision, trivial to remove |
| T1a Pattern lint rules | mixed | **research** | Part of design-contract migration, not button work |
| T0 useIsMobile deletion | execution | **resequence** | Don't delete — migrate Desktop+StartMenu to use it first, then it's no longer unused |

---

## Newly Discovered Missing Items

### T0 additions (dead code, not on any checklist):
1. **Delete Web3Shell.tsx** — sole purpose is hosting Web3ActionBar; 0 consumers
2. **Delete AppWindowContent.tsx** — deprecated, 0 consumers, exports in index.ts
3. **Remove UtilityBar export** from Taskbar.tsx and index.ts — 0 consumers
4. **Delete lib/constants.tsx** — compat shim, 0 consumers, all callers migrated
5. **Delete mockData/radiants.ts + commissions.ts** — 0 consumers, ~400 lines
6. **Delete nft-metadata/ + nfts.json + download-nft-data.js** — stale NFT artifacts
7. **Delete walletSlice.ts + useWalletStore** — dead Zustand slice (needs product decision)
8. **Delete useModalBehavior.ts** — dead hooks export from @rdna/radiants, 0 consumers
9. **Delete test/render.tsx** — unused test helper in radiants
10. **Delete ops/hex-to-oklch.mjs + scripts/find-non-oklch.sh** — stale migration scripts
11. **Delete trash/registry.tsx** — dead reference-only file
12. **Delete DEMO_NOTES.md** — unlinked, merge useful content into DESIGN.md

### Behavior bugs not on any checklist:
13. **Missing `data-start-button` attribute** — StartMenu can't be toggled closed via Start button
14. **DesktopIcon wraps Button in clickable div** — no keyboard access, double event dispatch
15. **InvertOverlay + widget z-[900] collision** — overlapping z-layers, render order depends on DOM
16. **RadRadioController `handleEnded` stale closure** — race on channel switch
17. **`useKonamiCode` onActivate dep** — re-registers keydown listener every render
18. **StartMenu social links missing `noopener,noreferrer`** — reverse tabnapping risk
19. **WindowTitleBar clipboard error silently swallowed** — no user feedback on failure

### UI polish not on any checklist:
20. **RadiantsStudioApp overflow-hidden + pixel-rounded-sm** — 3 instances breaking clip-path
21. **border-ink in BrandAssetsApp** — won't flip in dark mode (use border-line)
22. **MobileAppModal inline style border** — mixed style authority
23. **6 inline SVG icons in RadiantsStudioApp** — bypass icon system
24. **No `prefers-reduced-motion` on WebGLSun** — continuous rAF loop ignores media query
25. **MobileAppModal z-index `500 + windowState.zIndex`** — could overflow into system layer

### Tooling drift not on any checklist:
26. **no-clipped-shadow and no-pixel-border rules lack tests** — complex ancestor-walking untested
27. **tokens.css still has 4 rgba() values** — not migrated to oklch
28. **no-legacy-color-format is a lib, not an ESLint rule** — test file location confusing
29. **Registry test threshold >= 22 but actual count is 42** — would miss deletion of 20 components
30. **`PreviewPage` component exported but never consumed** — @rdna/preview has 0 consumers

### Checklist inaccuracies:
31. **".dna.json missing" count wrong** — says 23, actual is 38+ (zero .dna.json files exist)
32. **"20 components zero test coverage" count wrong** — actual is 18 without individual tests
33. **Registry test says "26 entries"** — actual test uses `>= 22`, not "26"
34. **Tabs worktree path doesn't exist** — `/private/tmp/claude/tabs-refactor` was pruned

---

## Top Leverage Refactors

### 1. mouse* → pointer* migration
- **Unlocks**: T2 touch compatibility, window resize on mobile, StartMenu dismiss on touch, pixel art canvas touch, WebGL touch interaction
- **Files**: AppWindow.tsx, StartMenu.tsx, WebGLSun.tsx, RadiantsStudioApp.tsx, RadRadioApp.tsx
- **Risk**: low (pointer events are a superset of mouse events)
- **Payoff**: 5+ checklist items resolved, removes entire class of touch bugs
- **Track**: execution

### 2. Pixel-corner border violation sweep
- **Unlocks**: T1 visual quality across RadiantsStudioApp, RadRadio, BrandAssetsApp, Taskbar, DesignSystemTab
- **Files**: 6 files, ~20 instances
- **Risk**: low (removing border classes, clip-path ::after handles borders)
- **Payoff**: Eliminates the #1 visual embarrassment pattern
- **Track**: execution

### 3. Auto-generate token-map.mjs (Architecture A Phase 1-2)
- **Unlocks**: T4 ESLint accuracy, eliminates drift class, foundation for design-contract system
- **Files**: tokens.css → script → token-map.mjs
- **Risk**: medium (needs careful testing of ESLint auto-fix paths)
- **Payoff**: Single highest-leverage tooling improvement, prevents future enforcement bugs
- **Track**: mixed (architecture decided, phased execution)

### 4. Delete entire Web3/NFT layer
- **Unlocks**: T0 cleanup of ~500+ lines, removes confusing dead state from persisted store, simplifies Desktop.tsx
- **Files**: walletSlice.ts, Web3Shell.tsx, Web3ActionBar/, mockData/radiants.ts, mockData/commissions.ts, nft-metadata/, nfts.json, download-nft-data.js
- **Risk**: low (zero consumers) — but needs product confirmation on Web3 v1 scope
- **Payoff**: Largest single dead code removal, cleans store/index.ts type surface
- **Track**: execution (pending product decision)

### 5. Shared dropdown overlay primitive
- **Unlocks**: T1g dropdown unification — DropdownMenu, ContextMenu, Menubar, Select all use incompatible hover tokens
- **Files**: DropdownMenu.tsx, ContextMenu.tsx, Menubar.tsx, Select.tsx
- **Risk**: medium (needs canonical hover pattern decision)
- **Payoff**: Removes repeated bug class, simplifies T1g to one decision + one implementation
- **Track**: mixed

### 6. Consolidate isMobile → useIsMobile hook
- **Unlocks**: T0 dead hook becomes alive, T2 mobile detection is consistent, removes 2 inline resize listeners
- **Files**: Desktop.tsx, StartMenu.tsx, hooks/useIsMobile.ts
- **Risk**: low
- **Payoff**: Prerequisite for T2, fixes a dependency ordering mistake in the checklist
- **Track**: execution

---

## Dependency Graph Corrections

1. **T0 useIsMobile should NOT be deleted** — resequence to "migrate consumers first, then it's no longer unused"
2. **T3 Studio does NOT depend on T1d Checkbox** — the checklist says "after checkbox/canvas touch" but Studio never imports Checkbox
3. **T2 Mobile is NOT fully parallel with T1** — mobile nav needs stable Button (T1a) and probably Tabs (T1b)
4. **T5 Motion should partially overlap T2** — 22+ components use hardcoded durations, `prefers-reduced-motion` only works on token-based durations. Mobile users on low-end devices get janky animations.
5. **T1h HelpPanel dependency is satisfied** — HelpPanel is already deleted, T1h can start whenever
6. **T1b Tabs worktree is gone** — needs recreation, `/private/tmp/claude/tabs-refactor` doesn't exist

---

## Recommended First 3 Execution Batches

### Batch 1: T0 Sweep + isMobile Consolidation (1 session)
All dead code, broken imports, and dead exports. Include the newly discovered items.
1. Delete `getAppMockStates` import from Desktop.tsx (build risk)
2. Delete Trash app + trash/registry.tsx
3. Delete Web3ActionBar + Web3Shell + walletSlice (if product confirms)
4. Delete AppWindowContent, UtilityBar export, constants.tsx
5. Delete mockData/radiants.ts, commissions.ts, nft-metadata/, nfts.json, download-nft-data.js
6. Delete useModalBehavior.ts, test/render.tsx, DEMO_NOTES.md, hex-to-oklch.mjs, find-non-oklch.sh
7. Remove `hasAutoSized`, `StartButton` export, console.log stubs
8. Fix dual localStorage for radioFavorites
9. Fix store/index.ts:32 migrate type cast
10. **Consolidate isMobile** — migrate Desktop + StartMenu to useIsMobile hook (don't delete the hook)
11. Add `data-start-button` attribute to Taskbar
12. Fix StartMenu `noopener,noreferrer`
13. Mark 6 done items as ✅ in checklist

### Batch 2: Pixel-Corner + Pointer Event Sweep (1 session)
Two mechanical sweeps that resolve the highest-severity visual and behavioral bug classes.
1. Remove all `border-*` from `pixel-rounded-*` / `pixel-corners` elements (~20 instances, 6 files)
2. Remove `overflow-hidden` from pixel-cornered elements (3 instances)
3. Convert all `mousedown/mousemove/mouseup/mouseleave` → `pointerdown/pointermove/pointerup/pointerleave` (5 files)
4. Add `touch-action: none` to drag/resize handles
5. Fix InvertOverlay `duration-500` → `duration-300`
6. Fix `border-ink` → `border-line` in BrandAssetsApp
7. Reconcile base.css `[data-theme="dark"]` duplicate tokens with dark.css

### Batch 3: T1b Tabs + T1a Button Foundations (2-3 sessions)
The two foundational components. Everything else depends on them.
1. Recreate tabs worktree, validate existing refactor plan
2. Execute tabs refactor
3. Button: flat mode pressed+hover, disabled reconciliation, focus state, active gradient fix
4. Button: pattern mode visibility fix
5. DesktopIcon: move onClick to Button, remove wrapper div

---

## Recommended First 3 Research Questions

### 1. What is the canonical dropdown hover pattern?
DropdownMenu uses `hover:bg-inv hover:text-flip`, Menubar uses `hover:bg-hover`, Select uses `hover:bg-accent hover:text-accent-inv`. Which one wins? Decision unlocks T1g dropdown unification and the shared overlay primitive.

### 2. Should Web3/wallet features be in v1?
walletSlice, Web3Shell, Web3ActionBar, all NFT mock data, and the entire wallet connect flow have zero consumers. If Web3 is not v1, deleting this layer saves ~500 lines and simplifies the store. If it IS v1, it needs to be wired up.

### 3. What does "align Toast with Alert" mean concretely?
Do they share CVA variants? Same color bands? Same icon treatment? Toast is ephemeral, Alert is inline — they're fundamentally different. The T1e item can't execute without this decision. Should they share a `FeedbackPrimitive` or just visual tokens?

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total findings across all agents | 78 |
| High severity | 12 |
| Medium severity | 31 |
| Low severity | 35 |
| Items to mark done (already complete) | 6 |
| Items to reclassify | 8 |
| Newly discovered missing items | 34 |
| Items missing from all derived tracks | 7+ |
| Duplicate items in tracks | 1 |
| Dependency graph corrections | 6 |
| Top leverage refactors | 6 |
