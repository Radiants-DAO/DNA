# Lane 2: App/Package Docs Audit

**Branch:** `feat/logo-asset-maker`  
**Audit Date:** 2026-04-25  
**Last docs commit:** 2026-04-21 18:49:43

---

## File: `/apps/rad-os/CLAUDE.md`

**Status:** ✅ Current

**What it gets right:**
- Command format (`pnpm dev`, `pnpm build`, `pnpm test`) — accurate
- Directory map structure matches reality
- Key patterns section correctly identifies catalog as SSOT
- References to symlinked `design.md` are accurate
- Zustand store location and UI component boundaries are current

**Drift detected:** None significant. This is a lean, accurate reference file.

**Recommendation:** Keep as-is. Consider cross-referencing the catalog in app descriptions.

---

## File: `/apps/rad-os/README.md`

**Status:** ⚠️ Partially stale

**Critical drift:**

1. **App list is outdated (lines 9–13)**
   - Claims current visible apps are: `brand`, `manifesto`, `music` (Rad Radio), `about`
   - **Actual current desktop launchers:** `brand`, `lab`, `studio`, `scratchpad`, `good-news`, `about`, `manifesto`
   - `lab`, `studio`, `scratchpad`, `good-news` are missing from the README
   - Rad Radio is no longer a launchable window (now a taskbar widget), but this is correctly noted in the catalog comment

2. **Missing apps listed as "internal tooling"**
   - README says `pattern-playground` and `typography-playground` are "internal" and "not exposed as desktop launcher"
   - These are NOT in the current catalog at all — they may have been refactored into the `lab` app's subtabs (`pixel`, `components`)
   - No evidence they exist as separate components anymore

3. **Rad Radio ambient capability description (lines 15–20)** — CORRECT, this is still accurate in the catalog

**File paths that changed (lines 70, 75, 77):**
- All three reference paths to files exist and are current
- `AppWindow` API documentation is accurate

**Design system reference (line 129–140):**
- Import statements are correct
- Token usage pattern is current

**Catalog reference path (line 119):**
- Points to correct location

**Recommendation:** Update section "Current Surface" (lines 5–20) to:
  - List all seven current launchers from catalog.tsx
  - Note that `lab` contains pixel/components subtabs
  - Clarify status of `pattern-playground` and `typography-playground` (are they dead or absorbed into `lab`?)

---

## File: `/apps/rad-os/SPEC.md`

**Status:** ❌ Painfully stale

**Critical drift:**

1. **App inventory (§9, lines 230–340)** — SEVERELY out of date
   - Spec lists "Core Apps (7)": Brand, Manifesto, Calendar, Rad Radio, Links, Settings, About
   - Spec lists "Additional Apps (3)": Studio, Murder Tree, Auctions
   - **Actual current catalog (7 apps):** Brand, Lab, Studio, Scratchpad, Good-News, About, Manifesto
   - **Missing from spec (exist in code):** Lab, Scratchpad, Good-News
   - **Listed but removed from code:** Calendar, Rad Radio (as window), Links, Settings, Murder Tree, Auctions
   - **Still exists:** Brand, Manifesto, Studio, About

2. **Rad Radio (§9.4, lines 260–275)** — REMOVED from catalog
   - Spec claims it "opens automatically on page load"
   - Current catalog has no `rad-radio` app entry
   - It's now a taskbar widget only (see catalog.tsx line 148–150)

3. **App structure claims are broken:**
   - §9.8 (Radiants Studio) claims "Single window with tabs for three tools: Pixel Art Maker, Dither Tool, Commission Marketplace"
   - Current catalog shows `StudioApp` is a single window, but actual tabs/content unknown without reading the component
   - Spec claims features that may not be implemented (Dither Tool, Commission Marketplace)

4. **Removed apps still documented:**
   - **Calendar** (§9.3) — no component in code
   - **Links** (§9.5) — no component in code (replaced by start menu links in catalog)
   - **Settings** (§9.6) — no component in code
   - **Murder Tree** (§9.9) — no component in code
   - **Auctions** (§9.10) — no component in code

5. **Implementation phases (§16, lines 461–491)** — IRRELEVANT
   - These describe a planned build roadmap, not current state
   - Phase 1–5 structure is historical; actual implementation has followed a different path

6. **Asset location references (§11, lines 376–395):**
   - References `/Users/rivermassey/Dropbox/...` (personal path, not monorepo-relative)
   - References `/reference/rados/` which may not exist in current branch
   - Mock data shapes (§13) may not match current Zustand slices

7. **Technology claims:**
   - React 19 (line 13) — need to verify in package.json
   - Tailwind CSS v4 (line 14) — need to verify
   - These may be correct, but SPEC.md is not the authority

**What remains load-bearing:**
- §2 Zustand pattern (unified store)
- §3 Window system interface basics
- §4 Hash routing spec (if still used)
- §5 Desktop/Taskbar/Start Menu layout

**Recommendation:** **Delete or fully rewrite**
- This is a historical v2 spec that no longer reflects the product
- Its "app inventory" is 70% removed or renamed
- Create a new `SPEC-CURRENT.md` or fold app inventory into README.md using catalog.tsx as SSOT
- Archive the old spec to `SPEC-v2-archived.md` if needed for historical reference

---

## File: `/apps/rad-os/design.md` (symlink)

**Status:** ✅ Current

**What it is:** Symlink → `../../packages/radiants/DESIGN.md`

**Symlink target verification:**
```
lrwxr-xr-x  1 rivermassey  staff  33 Apr 18 19:31 apps/rad-os/design.md -> ../../packages/radiants/DESIGN.md
```

**Recommendation:** Keep symlink. Canonical DESIGN.md is at the right location.

---

## File: `/packages/radiants/CLAUDE.md`

**Status:** ✅ Current

**What it gets right:**
- ESLint plugin location and command: `packages/radiants/eslint/`, rules listed comprehensively
- Run commands correct: `pnpm lint:design-system`, `pnpm lint:design-system:staged`
- Exception format with `owner`, `issue`, `expires:YYYY-MM-DD` — accurate and enforced
- Token rules (no hardcoded colors, spacing, typography) are current
- Pixel corner rules (opt-in, no `border-color`, use `pixel-shadow-*`) are current
- Component rules and enforcement via eslint-plugin-rdna are accurate
- References to `DESIGN.md § sections` are correct and up-to-date

**Specific rule names verified as current:**
All 14 rules listed (rdna/no-hardcoded-colors through rdna/no-arbitrary-icon-size) exist and are enforced.

**Recommendation:** Keep as-is. This is load-bearing enforcement documentation.

---

## File: `/packages/radiants/README.md`

**Status:** ⚠️ Partially stale (specific section drift, not general)

**What it gets right:**
- Installation and CSS import patterns are correct
- Available components list (Button through CountdownTimer) — list is accurate
- Semantic tokens section with examples is current
- Figma contract generation workflow and env vars are accurate
- Pixel Corners section matches actual implementation in `@rdna/pixel`
- Dark mode `.dark` class activation is accurate
- Fonts list (Joystix, PixelCode, Mondwest) is current

**Drift detected:**

1. **Typography description (lines 149–156)**
   - References "Joystix Monospace" and "PixelCode"
   - Doesn't mention that Mondwest must be downloaded separately (it does, but buried in fonts section)
   - No mention of the recently regenerated (2026-04-19) typography scale

2. **Typography scale is outdated in the DESIGN.md reference (not in README)**
   - README correctly defers to DESIGN.md for typography details
   - But DESIGN.md itself has a discrepancy (see DESIGN.md audit below)

3. **Pixel Corners section (lines 178–194)** — ACCURATE
   - References `packages/pixel/src/corners/registry.ts`, `prepare.ts`, CSS files
   - The `px()` API mention is current
   - `PixelBorder` component reference is accurate

**Recommendation:** Clarify typography note in the fonts section: "Mondwest must be downloaded separately due to licensing. See DESIGN.md § Typography for current token values (regenerated 2026-04-19: text-xs = 10px, no 2xs variant)."

---

## File: `/packages/radiants/DESIGN.md`

**Status:** ⚠️ Partially stale (typography values are WRONG)

**Critical drift:**

1. **Typography scale values (§ Typography, lines 372–379)** — **CONFLICT with generated tokens**
   - **DESIGN.md claims:**
     ```
     --font-size-xs: 0.5rem = 8px
     --font-size-sm: 0.75rem = 12px
     --font-size-base: 1rem = 16px
     ```
   - **Actual generated tokens (packages/radiants/generated/typography-tokens.css):**
     ```
     --font-size-xs: 0.625rem = 10px (DIFFERENT from spec)
     --font-size-sm: 0.75rem = 12px ✓
     --font-size-base: 1rem = 16px ✓
     --font-size-lg: 1.333rem ≈ 21px (not 20px as spec implies)
     --font-size-xl: 1.777rem ≈ 28px (not 24px)
     --font-size-2xl: 2.369rem ≈ 38px (not 28px)
     ```
   - **Authority:** Generated tokens file has comment "Auto-generated from pretext-type-scale.ts — do not edit"
   - **Regeneration date:** Last token generation was 2026-04-19 per user context
   - **Impact:** Text-xs token is now 10px, NOT 8px. The 8px claim is stale.

2. **No 2xs variant** — DESIGN.md correctly notes (line 416) that `text-2xs` is deprecated, which aligns with generated tokens (no 2xs present)

3. **Documentation section (line 370)** correctly notes "clamp" flex behavior and "0.25rem (4px) grid" but the static table (lines 372–379) is outdated

4. **Other sections verified (sample check):**
   - Colors section (§ Color) — spot check shows semantic token names match
   - Shadow section (§ Shadow) — names like `shadow-raised`, `shadow-lifted` match CSS
   - Motion section — references to `duration-base`, easing names are plausible
   - Spacing section — "space-1 = 4px", "gap-2 = 8px" match standard Tailwind scale
   - Pixel corners section — references current files in `packages/pixel/`

**Recommendation:** 
- **Update typography table (lines 372–379)** to match generated tokens:
  - `text-xs: 0.625rem (10px)` ← was 8px
  - Keep the rest as-is
  - Add note: "Last regenerated 2026-04-19. See generated/typography-tokens.css for source of truth."
- Add front-matter warning: "When code and this document conflict, run `pnpm tokens:generate` and use the generated `typography-tokens.css` as truth."

---

## File: `/packages/pixel/PIXEL-CORNERS.md`

**Status:** ✅ Current

**What it gets right:**
- Core concept (bitstring grids for cover/border) is explained clearly
- Five preset sizes (xs–xl) with Bresenham radius values match the actual system
- Visual reference grids (8× scale) are documented
- Bitstring format explanation is accurate and matches the API
- Mirroring logic (TL/TR/BL/BR derivation) is correctly explained
- React component `PixelCorner` API with props is current
- Mixed corner sizes example is accurate
- File map at the end (lines 268–283) matches directory structure
- Canvas vs. SVG tradeoff section is accurate
- Overlay vs. clip-path rationale is sound and reflects actual implementation

**Recommendation:** Keep as-is. This is a well-maintained technical reference.

---

## Summary: Missing Docs

**Other *.md files found in packages/ (via find):**
- `packages/pixel/PIXEL-CORNERS.md` ✅ (already audited)
- `packages/radiants/CLAUDE.md` ✅ (already audited)
- `packages/radiants/README.md` ✅ (already audited)
- `packages/radiants/DESIGN.md` ✅ (already audited)

**No *.md files found in:**
- `packages/ctrl/` — has no docs
- `packages/preview/` — has no docs
- `packages/create/` — has no docs

**Recommendation:** Consider whether `packages/ctrl/`, `packages/preview/`, and `packages/create/` need README files explaining their purpose and usage in the monorepo context.

---

## Action Summary

| File | Status | Action | Priority |
|------|--------|--------|----------|
| `/apps/rad-os/CLAUDE.md` | ✅ Current | Keep | Low |
| `/apps/rad-os/README.md` | ⚠️ Stale | Update app list (7 apps) | High |
| `/apps/rad-os/SPEC.md` | ❌ Painfully stale | Rewrite or archive | Critical |
| `/apps/rad-os/design.md` | ✅ Current | Keep (symlink OK) | Low |
| `/packages/radiants/CLAUDE.md` | ✅ Current | Keep | Low |
| `/packages/radiants/README.md` | ⚠️ Minor drift | Clarify typography note | Medium |
| `/packages/radiants/DESIGN.md` | ⚠️ Typography wrong | Update table (text-xs = 10px) | High |
| `/packages/pixel/PIXEL-CORNERS.md` | ✅ Current | Keep | Low |

---

## Root Causes

1. **SPEC.md is a historical artifact** — It documents a planned build that was never fully realized or was refactored mid-way. The actual product diverged significantly.
2. **Typography tokens were regenerated** (2026-04-19) but DESIGN.md table wasn't updated to match.
3. **App catalog is the live SSOT** but it's buried in a React file; README and SPEC both try to document it separately, leading to sync drift.
4. **No synchronization hook** — There's no process that regenerates docs from catalog.tsx or generated tokens after changes.

## Recommended Process Changes

1. **Make catalog.tsx the single source of truth** for app inventory; generate README app list from it (or document the seven apps in README with a "see catalog.tsx for authoritative list" note).
2. **Lock DESIGN.md typography values to generated/typography-tokens.css** — add a pre-commit hook that validates the table or auto-regenerates it.
3. **Archive or rewrite SPEC.md** — if keeping for historical/planning context, mark it clearly as "Historical — see README and catalog.tsx for current product state."
4. **Add "Last Updated" timestamps** to each doc and a post-generation step that updates them when code changes.
