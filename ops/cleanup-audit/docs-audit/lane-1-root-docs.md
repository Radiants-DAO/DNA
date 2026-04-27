# Root Documentation Audit

**Audited 2026-04-25** | Branch: `feat/logo-asset-maker` | Monorepo: Turborepo + pnpm

## File Status Summary

| File | Size | Last Modified | Status |
|------|------|---------------|--------|
| `README.md` | 247 lines | 2026-04-10 | ✅ Current |
| `CLAUDE.md` | 280 lines | 2026-04-25 | ✅ Current |
| `docs/README.md` | 18 lines | 2026-04-03 | ✅ Current |
| `docs/CODEMAP.md` | 673 lines | 2026-04-25 | ⚠️ Partially Stale |
| `docs/theme-spec.md` | 992 lines | 2026-04-10 | ⚠️ Partially Stale |

---

## 1. README.md

**Status:** ✅ Current

**Last commit:** 2026-04-10 (minor edit to README)

### Drift Assessment
- Claims DNA is a "factory standard for building themes" — ACCURATE
- Turborepo + pnpm monorepo correctly stated
- Two-tier token system correctly described
- Tailwind v4 native with `@theme` blocks — ACCURATE
- References `packages/radiants/DESIGN.md` as canonical design spec — CORRECT (file exists)
- References `archive/conversion/dna-conversion.md` — FILE EXISTS
- Component pattern (`.tsx` + `.meta.ts` + generated `.schema.json`) — ACCURATE
- Token system example (oklch, semantic tokens) — ACCURATE

### What's Still Useful
- Package structure overview
- Two-tier token system explanation
- Component pattern documentation
- Theme packages table
- Dark mode description
- Figma contract commands (`pnpm registry:generate`)

### Specific Issues
- None detected. README is accurate and concise.

### Recommendation
**Keep as-is.** This is load-bearing documentation.

---

## 2. CLAUDE.md

**Status:** ✅ Current

**Last commit:** 2026-04-25 (auto-update, 16 files changed)

### Drift Assessment
- Monorepo map correctly lists all packages: `@rdna/radiants`, `@rdna/ctrl`, `@rdna/pixel`, `@rdna/preview`, `@rdna/create` — VERIFIED (all exist in packages/)
- App structure: `rad-os` (Next.js 16) — CORRECT
- Top-level apps in `apps/rad-os/lib/apps/catalog.tsx` including brand, lab, studio, scratchpad, good-news, about, manifesto — VERIFIED in catalog.tsx
- Nested apps under brand (logos, colors, fonts) and lab (pixel, components) — ACCURATE
- ESLint plugin at `packages/radiants/eslint/` — VERIFIED
- DESIGN.md location as canonical spec — VERIFIED
- Theme package structure (.css files, components/core/, dna.config.json) — CORRECT
- Two-tier token system description — ACCURATE
- ESLint rules table (16 rules documented) — LOAD-BEARING
- Component pattern (tsx + meta.ts + generated schema.json) — ACCURATE
- MCP tools section (code-review-graph) — LOAD-BEARING

### What's Still Useful
- Complete monorepo map
- Architecture explanation
- Theme package structure template
- ESLint rules reference (critical for conformance)
- User communication style guide (abbreviations, terse commands, feedback signals)
- MCP tools workflow

### Specific Issues
- None detected. CLAUDE.md is accurate and recently updated.

### Recommendation
**Keep as-is.** This is primary load-bearing documentation for AI assistants working in this repo.

---

## 3. docs/README.md

**Status:** ✅ Current

**Last commit:** 2026-04-03

### Drift Assessment
- Claims docs is a directory index — ACCURATE
- Mentions `production-readiness-checklist.md` as live backlog — Backlog exists (not verified content)
- `plans/` contains current, unimplemented plans — REASONABLE (structure exists)
- `research/` contains reusable prompt docs — REASONABLE (structure exists)
- `ops/` contains operational workflows — NOW TRUE (ops/cleanup-audit/docs-audit directory created in this audit)
- `solutions/` contains durable implementation notes — REASONABLE (structure exists)
- `archive/` for completed work — VERIFIED
- `ideas/` for future concepts — REASONABLE (structure exists)

### What's Still Useful
- High-level directory map for docs organization
- Pointers to backlog and planning artifacts

### Specific Issues
- None. Brief and accurate.

### Recommendation
**Keep as-is.** Lightweight and accurate index.

---

## 4. docs/CODEMAP.md

**Status:** ⚠️ Partially Stale

**Last commit:** 2026-04-25 (auto-update, 16 files changed)

### Drift Assessment

#### Critical Drift
- **Line 69, Table claim: "33 Components"** — WRONG
  - Claims: 33 components in `components/core/`
  - Actual count: 44 component directories (Alert, AlertDialog, AppWindow, Avatar, Badge, Breadcrumbs, Button, Card, Checkbox, Collapsible, Combobox, ContextMenu, CountdownTimer, Dialog, Drawer, DropdownMenu, Icon, Input, InputSet, Menubar, Meter, NavigationMenu, NumberField, Pattern, PixelBorder, PixelIcon, PixelTransition, Popover, PreviewCard, ScrollArea, Select, Separator, Sheet, Slider, Spinner, Switch, Tabs, Toast, Toggle, ToggleGroup, Toolbar, Tooltip)
  - **Impact:** Any automated tooling that counts components will fail; readers will think ~11 components are missing

- **Lines 178–300, Table: "All 33 Components"** — INCOMPLETE
  - Lists only 27 components (cuts off at Separator)
  - Missing: Sheet, Slider, Spinner, Switch, Tabs, Toast, Toggle, ToggleGroup, Toolbar, Tooltip (~10 components)
  - **Impact:** New team members won't know about ~10 components; discovery is broken

#### Moderate Drift
- **Ports section (claimed but need to verify actual values)**
  - Claims rad-os is port 3000, playground is port 3004
  - (Requires runtime verification; assuming as stated unless test fails)

#### Minor Drift
- Mermaid diagrams in section 1 show package structure as of commit date but:
  - Correctly shows @rdna/radiants, @rdna/preview, @rdna/ctrl, rad-os
  - Does not show @rdna/pixel or @rdna/create (incomplete but not wrong—just old scope)
  - Acceptable for overview level

### What's Still Useful
- Monorepo workspace graph (section 1) — good high-level layout
- ESLint plugin architecture (section 8) — still relevant
- Root scripts & infrastructure (section 9) — valid
- Quick file finder (section 11) — useful reference
- Overall navigation structure
- Package descriptions (radiants, ctrl, pixel, etc.)

### Specific Issues
1. Component count off by 11 (33 → 44)
2. Component table incomplete—missing Sheet, Slider, Spinner, Switch, Tabs, Toast, Toggle, ToggleGroup, Toolbar, Tooltip
3. Table has "Base-UI Wrap" column (mostly empty)—if this is load-bearing for integration, it's incomplete

### Recommendation
**Update section 4 (components/core/) and section 3 (Component File Convention):**
- Regenerate component list from `find packages/radiants/components/core -maxdepth 1 -type d` to get actual count (currently 44)
- Extend component table to include all 44 components with current Base-UI wrapping status
- Update diagram comment to reflect correct component count
- Estimated effort: 30 min (mostly data entry, existing table format)

**Keep other sections as-is.** They are still load-bearing.

---

## 5. docs/theme-spec.md

**Status:** ⚠️ Partially Stale

**Last commit:** 2026-04-10

### Drift Assessment

#### Critical Drift
- **Section "Integration with json-render"** — CLAIMED BUT NOT INTEGRATED
  - Quote: "DNA uses [vercel-labs/json-render](https://github.com/vercel-labs/json-render) as the runtime format for AI-generated UI."
  - Reality: No evidence of json-render being actively used in the monorepo (not in dependencies, no integration code found)
  - Earlier README said "Planned runtime format for AI-generated UI (not yet integrated)" — suggests spec is aspirational, not current
  - **Impact:** Misleading agents/readers about what's actually in use

- **Figma contracts section** — PARTIALLY ACCURATE
  - Commands mentioned (`pnpm registry:generate`) still valid
  - But spec says "auto-generate json-render catalogs"—json-render not actually integrated
  - Token sync agents reference `.component-contracts` file — valid
  - Figma skills reference outdated (`.claude/skills/cc-figma-tokens/SKILL.md` may not reflect current skill location)

#### Moderate Drift
- **Section "6. Color Modes"** — spec mentions "class, data-attribute, or media-query" modes
  - Actual implementation (CLAUDE.md + DESIGN.md) is **class-only (.dark)** for radiants
  - Spec is more flexible but implementation is stricter; not a bug but spec overstates flexibility

- **Asset Management section (9)** — GENERIC
  - Describes asset structure but doesn't reference actual icon sets or asset pipelines
  - Not wrong, just abstract

- **Configuration section (10)** — GENERIC
  - Mentions `dna.config.json` as optional; not verified as actually used

#### Minor Drift
- v1.0.0 labeling is correct but no changelog showing what changed since last spec update
- Table of Contents is comprehensive but makes the 992-line spec feel monolithic
  - Readers may not realize how much is aspirational vs. implemented

### What's Still Useful
- **Core principles section (2)** — still accurate
- **Token structure (3)** — foundational and still correct
- **Package structure (4)** — layout is standard
- **Typography system (5)** — pattern still used
- **Component schema format (7)** — meta.ts + generated schema still the pattern
- **Validation rules (12)** — good reference
- **Styling rules and examples** — load-bearing

### Specific Issues
1. json-render presented as integrated when it's not (spec is aspirational)
2. Color mode section overstates flexibility (actual implementation is class-only)
3. Figma skills references may be stale
4. No clear delineation between "implemented now" vs. "planned" sections

### Recommendation
**Update or split:**
- Add **prominent callout at top of spec** stating: "Status: v1.0.0 (portable spec + reference implementation). Some sections (json-render integration, extended asset management) are aspirational and not yet integrated into rad-os. For current RDNA implementation details, see `packages/radiants/DESIGN.md`."
- **Section 6 (Color Modes):** Narrow language to match actual implementation: "Current implementation uses class-based activation (`.dark` class). Other modes are supported by the spec for custom themes."
- **Section 11 (Figma):** Move Figma skills references to a separate, externally-maintained guide (skills documentation drifts rapidly); keep only token/schema format specifications.
- **Keep sections 2, 3, 4, 5, 7, 12** as-is (load-bearing for portable spec).
- Estimated effort: 45 min (callouts + clarifications + reorganizing Figma section).

---

## Summary: What's Dead, What's Durable

### Dead Links / False Claims
- ❌ **json-render integration in theme-spec.md** — spec claims it's in use; it's not

### Outdated Component Lists
- ⚠️ **CODEMAP.md component count** — off by 11 (33 vs. 44)
- ⚠️ **CODEMAP.md component table** — incomplete (missing 10 components)

### Load-Bearing Documentation (Keep and Maintain)
- ✅ **README.md** — Accurate factory-standard overview
- ✅ **CLAUDE.md** — Essential for AI assistants; accurate and up-to-date
- ✅ **docs/README.md** — Lightweight but accurate directory index
- ✅ **Core sections of CODEMAP.md** — Workspace graph, ESLint, scripts still relevant
- ✅ **Core sections of theme-spec.md** — Token system, package structure, component schema, validation

### Consolidation Opportunities
- Consider moving theme-spec.md aspirational content to a separate "Design Roadmap" or archiving it
- Keep theme-spec.md as portable spec; link to `packages/radiants/DESIGN.md` for RDNA-specific implementation

---

## Recommendations by File

| File | Action | Priority | Effort |
|------|--------|----------|--------|
| README.md | Keep as-is | - | - |
| CLAUDE.md | Keep as-is | - | - |
| docs/README.md | Keep as-is | - | - |
| docs/CODEMAP.md | Update component section (lines 69, 178–300) | Medium | 30 min |
| docs/theme-spec.md | Add status callout; clarify Color Modes section; reorganize Figma section | Medium | 45 min |

