# Lane 3: Components + Spacing + A11y + Machine Enforcement Audit

## Summary
- 2 high severity discrepancies
- 3 medium severity discrepancies  
- 2 low severity discrepancies

---

## §7 Component Architecture

### Component Two-File Pattern Verified
DESIGN.md claims (line 741-748): Every component follows ComponentName.tsx + ComponentName.meta.ts + ComponentName.schema.json structure.

**Reality:** Pattern is correct for radiants/components/core. All 41 components have .meta.ts files. Verified samples: Button (Button.tsx, Button.meta.ts, Button.schema.json), Card, Dialog all present.

**Issue - HIGH SEVERITY:** ctrl package (packages/ctrl/) components violate the pattern. Found .meta.ts files but **zero .schema.json files** in ctrl. ctrl structure:
- `/packages/ctrl/selectors/Toggle/`: has Toggle.meta.ts and Toggle.tsx, no .schema.json
- `/packages/ctrl/layout/Section/`: has Section.meta.ts and Section.tsx, no .schema.json
- Verified across all ctrl components (48 .tsx files, 0 .schema.json files)

DESIGN.md does not explicitly document that ctrl is a separate package with different patterns. This is incomplete architecture documentation.

### Registry Generation Script
DESIGN.md claims (line 808): "build-registry-metadata.ts is the canonical server-safe metadata builder."

**Reality:** Root package.json defines:
```
"registry:generate": "pnpm --filter @rdna/radiants generate:schemas && pnpm --filter @rdna/radiants generate:figma-contracts"
```
This script runs `generate:schemas` (line 116 of radiants/package.json) which uses `../preview/src/generate-schemas.ts`, not `build-registry-metadata.ts`.

**Issue - MEDIUM SEVERITY:** DESIGN.md references wrong canonical builder file name. The actual script chain is: registry:generate → generate:schemas → ../preview/src/generate-schemas.ts. build-registry-metadata.ts exists in /packages/radiants/registry/ but is not the entry point for the documented schema generation flow.

### @base-ui/react Version
DESIGN.md implies (line 762) @base-ui/react v1.4.1+ compatibility.

**Reality:** radiants/package.json line 143 pins: `"@base-ui/react": "^1.4.1"`

**Status:** Verified correct.

### React 19 Rules
DESIGN.md claims (line 843-848):
- No forwardRef (ref is a regular prop)
- Use use() hook for Context
- Use createCompoundContext() for compound state
- Children composition over render props

**Reality:** Button.tsx (line 3) imports from @base-ui/react (wrapper). No explicit forwardRef or useContext found in Button or Dialog samples. Dialog.tsx (line 1) is 'use client'. Pattern is React 19 aligned, though the specific use() hook recommendation is not actively tested in audited samples.

**Status:** DESIGN.md guidance matches codebase approach; React 19 pattern is sound.

### Component Inventory
DESIGN.md examples reference: Button, Section, Dialog, Toggle, Card, etc.

**Reality:** radiants/components/core contains 41 components (verified via .meta.ts count):
- All documented examples exist
- Additional components not mentioned: PixelIcon, PixelBorder, PixelTransition, PreviewCard, ScrollArea, Spinner, etc.
- ctrl package adds: ControlPanel, Section, PropertyRow, RadialMenu, ButtonStrip, Stepper, Toggle, SegmentedControl, ChipTag, MatrixGrid, etc.

**Issue - LOW SEVERITY:** DESIGN.md does not catalog the complete component library or explicitly document ctrl as a separate (newer) package with its own lifecycle. Reader cannot determine scope of "all components in @rdna/radiants".

---

## §8 Spacing

### Tailwind Spacing Grid
DESIGN.md claims (line 892-902): Use Tailwind's native 4px grid (p-1 = 4px, p-2 = 8px, etc.). No custom spacing tokens.

**Reality:** radiants/tokens.css (verified):
```css
--spacing: 4px;
```
This overrides Tailwind v4 default and confirms 4px base grid. All p-*, m-*, gap-* utilities resolve to 4px increments.

**Status:** Verified correct.

### Spacing Enforcement Rule
DESIGN.md claims (line 980): `rdna/no-hardcoded-spacing` bans arbitrary spacing values (p-[13px], inline pixel spacing); allows standard Tailwind scale classes.

**Reality:** no-hardcoded-spacing.mjs (verified):
- Bans arbitrary bracket spacing: `p-[12px]`, `gap-[13px]` ✓
- Allows standard Tailwind classes: mt-3, px-4, gap-2 ✓
- Also allows responsive/scalable arbitrary values: %, rem, clamp(), calc(), min(), max() ✓
- Checks both className attributes and inline style props (padding, margin, gap) ✓

**Status:** Verified correct. Rule is more permissive than DESIGN.md implies (allows % and rem in brackets), but that is an enhancement, not a violation.

---

## §9 Accessibility

### Focus Ring Specification
DESIGN.md claims (line 938): Focus rings use `ring-2 ring-focus ring-offset-1` (sun-yellow, visible in both modes).

**Reality:** Button.test.tsx focuses on prop testing (active state, rounded variants, aria-disabled), not CSS class verification. No explicit test for ring-2 ring-focus ring-offset-1 class presence found in Button tests.

**Issue - MEDIUM SEVERITY:** A11y claim lacks test coverage in radiants component tests. The focus ring spec exists in CSS tokens but is not validated by component test assertions.

### ARIA Labels
DESIGN.md claims (line 951-953): Icon-only buttons MUST have aria-label.

**Reality:** Button.meta.ts defines iconOnly prop (line 16 of meta). Button.test.tsx (line 45) verifies aria-label forwarding on link variant. Pattern is implemented and tested.

**Status:** Verified correct.

### Keyboard Navigation
DESIGN.md claims (line 944): Escape closes overlays.

**Reality:** Dialog, Sheet, Drawer, Menu, Popover components use @base-ui/react primitives which provide native keyboard handling. Tabs.test.tsx (verified) includes arrow-key navigation tests. Not all components have explicit Escape-to-close tests documented in visible test files.

**Status:** Functionally correct via base-ui wrapping; test coverage is patchy.

### Reduced Motion
DESIGN.md claims (line 938): `--duration-scalar: 0` when `prefers-reduced-motion: reduce`.

**Reality:** radiants/animations.css (not directly audited) should define this. DESIGN.md description claims animations are respected, but explicit CSS variable definition for reduced motion was not verified in token files read.

**Issue - LOW SEVERITY:** Reduced motion CSS implementation not verified. DESIGN.md claims it but no direct evidence in tokens.css or animations.css snippets examined.

---

## §10 Machine Enforcement

### ESLint Rule Count Mismatch - HIGH SEVERITY
DESIGN.md (line 973-988) documents **9 rules** in the table:
1. rdna/no-hardcoded-colors
2. rdna/no-hardcoded-spacing
3. rdna/no-hardcoded-typography
4. rdna/prefer-rdna-components
5. rdna/no-removed-aliases
6. rdna/no-raw-radius
7. rdna/no-raw-shadow
8. rdna/no-clipped-shadow
9. rdna/no-hardcoded-motion

**Reality:** index.mjs (line 36-57) registers **20 rules**:
1. no-hardcoded-colors
2. no-hardcoded-typography
3. no-removed-aliases
4. no-hardcoded-spacing
5. prefer-rdna-components
6. no-raw-radius
7. no-raw-shadow
8. no-hardcoded-motion
9. no-viewport-breakpoints-in-window-layout
10. require-exception-metadata
11. no-mixed-style-authority
12. no-broad-rdna-disables
13. **no-clipped-shadow**
14. **no-pixel-border** ← NOT IN DESIGN.MD TABLE
15. **no-raw-line-height** ← NOT IN DESIGN.MD TABLE
16. **no-raw-font-family** ← NOT IN DESIGN.MD TABLE
17. **no-pattern-color-override** ← NOT IN DESIGN.MD TABLE
18. **no-arbitrary-icon-size** ← NOT IN DESIGN.MD TABLE
19. **no-translucent-bg** ← NOT IN DESIGN.MD TABLE
20. **no-backdrop-blur** ← NOT IN DESIGN.MD TABLE

Rules 9-12 are repo-local governance rules and properly excluded from recommended config. **But rules 14-20 are missing from DESIGN.md Table entirely.**

### Missing Rules in DESIGN.md Documentation

**Rule: no-pixel-border** (file: no-pixel-border.mjs)
- Status: Active in index.mjs recommended config (line 76)
- Severity: warn (recommended), would be error (recommended-strict)
- Purpose: Ban border-* and overflow-hidden on pixel-cornered elements
- **Not documented in DESIGN.md**

**Rule: no-raw-line-height** (file: no-raw-line-height.mjs)
- Status: Active in index.mjs recommended config (line 77)
- Severity: warn
- Purpose: Ban arbitrary line-height values in style props
- **Not documented in DESIGN.md**

**Rule: no-raw-font-family** (file: no-raw-font-family.mjs)
- Status: Active in index.mjs recommended config (line 78)
- Severity: warn
- Purpose: Ban hardcoded font-family in style props
- **Not documented in DESIGN.md**

**Rule: no-pattern-color-override** (file: no-pattern-color-override.mjs)
- Status: Active in index.mjs recommended config (line 79)
- Severity: warn
- Purpose: Ban hardcoded colors on pattern-mode elements
- **Not documented in DESIGN.md**

**Rule: no-arbitrary-icon-size** (file: no-arbitrary-icon-size.mjs, added line 27 of index.mjs)
- Status: Active in index.mjs recommended config (line 80)
- Severity: warn
- Purpose: Restrict Icon size to 16 or 24 only; ban removed iconSet prop
- **Not documented in DESIGN.md**
- Icon.meta.ts (line 28-34) defines size as enum [16, 24]
- Actively enforced by rule (lines 24-30 of no-arbitrary-icon-size.mjs)

**Rule: no-translucent-bg** (file: no-translucent-bg.mjs, added line 28 of index.mjs)
- Status: Active in index.mjs recommended config (line 81)
- Severity: warn
- Purpose: Ban translucent bg utilities (bg-page/80, etc.)
- **Not documented in DESIGN.md**
- Date added: Apr 19 16:40 (recent)

**Rule: no-backdrop-blur** (file: no-backdrop-blur.mjs, added line 29 of index.mjs)
- Status: Active in index.mjs recommended config (line 82)
- Severity: warn
- Purpose: Ban backdrop-blur utilities and backdrop-filter in style props
- **Not documented in DESIGN.md**
- Date added: Apr 19 16:40 (recent, same commit as no-translucent-bg)

### Recommended Config Rule Count
DESIGN.md does not specify rule counts. recommended config (lines 64-84) contains **16 rules** (confirmed line count).
recommended-strict config (lines 109-127) contains **16 rules** (same as recommended, all 'error' instead of 'warn' except viewport rule).
internals config (lines 86-106) contains **15 rules** (prefer-rdna-components is 'off', others same).

**These rule counts are not documented in DESIGN.md.**

### Repo-Local Rules
DESIGN.md does not mention repo-local rules (9-12 in the rule list above). eslint.rdna.config.mjs (verified) registers:
- `require-exception-metadata`: 'error' (apps/rad-os, packages/ctrl, packages/radiants/components/core, packages/pixel)
- `no-broad-rdna-disables`: 'error' (same scopes)
- `no-mixed-style-authority`: 'error' (radiants/components/core, ctrl, pixel only, not apps/rad-os)
- `no-viewport-breakpoints-in-window-layout`: 'warn' (RadOS window content only)

**Status:** Repo-local rules are correctly scoped but not documented in DESIGN.md.

### Exception Format
DESIGN.md claims (line 998): Required format is:
```
// eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123
```

**Reality:** Verified exceptions in codebase follow this format exactly:
- apps/rad-os/app/pixel-corners/page.tsx: `// eslint-disable-next-line rdna/prefer-rdna-components -- reason:native-select-for-preview-tool owner:design-system expires:2027-01-01 issue:DNA-preview`
- apps/rad-os/components/ui/DesignSystemTab.tsx: `// eslint-disable-next-line rdna/prefer-rdna-components -- reason:preview-click-capture owner:design expires:2027-01-01 issue:DNA-001`

**Issue - MEDIUM SEVERITY:** Exception format requires `owner:<team-slug>` but real exceptions use `owner:design` (not a canonical slug per "lowercase team slug" requirement on line 1002). Some use `owner:design-system` (plural), others `owner:design` (singular). No canonical slug registry is provided in DESIGN.md.

### Rule Severity Configuration
DESIGN.md (line 979-988) claims all rules are "warn in shared configs, target: error" except one note on clipped-shadow.

**Reality:**
- recommended config (line 67-82): All 16 rules are 'warn' ✓
- recommended-strict config (line 112-127): All 16 rules are 'error', except viewport rule excluded ✓
- internals config (line 89-104): All 15 rules are 'warn' (prefer-rdna-components 'off') ✓

**Status:** Severity levels match DESIGN.md claims.

### Scope
DESIGN.md claims (line 1009-1013):
- Enforced in: packages/radiants/components/core, apps/rad-os, tools/playground
- Not enforced: tools/ (non-UI code)

**Reality:** eslint.rdna.config.mjs actually enforces in:
- packages/radiants/components/core/**/*.{ts,tsx} ✓
- apps/rad-os/**/*.{ts,tsx} ✓
- tools/playground/**/*.tsx — **not explicitly scoped in eslint.rdna.config.mjs**
- packages/ctrl/**/*.{ts,tsx} — **new package, not mentioned in DESIGN.md**
- packages/pixel/src/**/*.{ts,tsx} — **new package, not mentioned in DESIGN.md**
- packages/preview/src/**/*.{ts,tsx} — **not enforced with rdna rules, only unused-imports**

**Issue - MEDIUM SEVERITY:** Scope documentation is incomplete. ctrl and pixel packages are governed by rdna rules but not documented in DESIGN.md. tools/playground scope is not explicitly configured in eslint.rdna.config.mjs (likely via catch-all in apps but not explicit).

---

## Components / Packages Missing from DESIGN.md

### radiants/components/core (41 total, examples documented)
Undocumented components exist and are complete:
- PixelBorder, PixelIcon, PixelTransition, PreviewCard, ScrollArea, Spinner, Toolbar, ToggleGroup, Collapsible, Combobox, ContextMenu, AlertDialog, Slider, Popover, NavigationMenu, Checkbox (Radio variant), Avatar, Alert, Separator, Breadcrumbs, CountdownTimer, Meter, NumberField, InputSet (compound), TextArea, Toast, Drawer, DropdownMenu, Sheet, Input, Menubar, Tabs, Switch, Checkbox, Select, Badge, Card, Dialog, Button

DESIGN.md mentions only a subset (Button, Card, Dialog, Toggle). This is understandable for brevity, but the pattern is fully established across 41 components.

### ctrl package (new sibling, 48+ components)
DESIGN.md does not mention packages/ctrl at all. This package is governed by the same eslint rules (eslint.rdna.config.mjs lines 101-126) and follows meta.ts pattern, but:
- **Has no .schema.json files** (0 found vs 41 in radiants)
- Is not described as part of @rdna/radiants
- Appears to be a newer package (control surface primitives)
- Is not included in radiants/package.json exports
- Has its own package.json and CSS structure

**Status:** ctrl is an intentional separate package but should be documented in DESIGN.md or explicitly excluded from the architecture section's scope claim.

### pixel package (new engine package)
Mentioned in eslint.rdna.config.mjs (lines 128-153) as governed by same rules. Not mentioned in DESIGN.md at all.

---

## ESLint Rules Missing from DESIGN.md

**6 new rules added to recommended config but not documented in DESIGN.md Table:**

1. **rdna/no-pixel-border** — Ban border-* and overflow-hidden on pixel-cornered elements (use ::after pseudo-border)
2. **rdna/no-raw-line-height** — Ban arbitrary line-height in style props (use CSS vars)
3. **rdna/no-raw-font-family** — Ban hardcoded font-family in style props
4. **rdna/no-pattern-color-override** — Ban hardcoded colors on pattern-mode elements
5. **rdna/no-arbitrary-icon-size** — Restrict Icon size to 16 or 24; ban removed iconSet prop
6. **rdna/no-translucent-bg** — Ban translucent bg utilities (bg-*/N); require opaque tokens
7. **rdna/no-backdrop-blur** — Ban backdrop-blur utilities; RDNA chrome is opaque

**These are all active in the 'recommended' shared config exported to consumers (index.mjs line 64+).**

The most critical omissions are:
- **no-arbitrary-icon-size** — Actively constrains a public component (Icon) prop to 16|24 (Icon.meta.ts line 28)
- **no-translucent-bg** and **no-backdrop-blur** — Recent enforcements (Apr 19) affecting chrome transparency rules

---

## Summary Table

| Finding | Severity | Location | Type |
|---------|----------|----------|------|
| ctrl package has no .schema.json files | HIGH | packages/ctrl/ | Pattern violation |
| build-registry-metadata.ts name incorrect; actual entry is ../preview/src/generate-schemas.ts | MEDIUM | DESIGN.md line 808 vs radiants/package.json line 116 | Wrong reference |
| A11y focus ring spec lacks test coverage in component test assertions | MEDIUM | DESIGN.md line 938 vs Button.test.tsx | Incomplete validation |
| Exception format allows non-canonical owner slugs (design vs design-system) | MEDIUM | DESIGN.md line 1002 vs actual exceptions | Vague requirement |
| ESLint scope incomplete; ctrl and pixel packages not documented | MEDIUM | DESIGN.md lines 1009-1013 vs eslint.rdna.config.mjs | Scope drift |
| 6 new ESLint rules (no-pixel-border, no-raw-line-height, no-raw-font-family, no-pattern-color-override, no-arbitrary-icon-size, no-translucent-bg, no-backdrop-blur) not in DESIGN.md table | HIGH | DESIGN.md §10 vs packages/radiants/eslint/index.mjs | Missing documentation |
| Component library incompletely documented; 41 radiants components, ctrl package not described | LOW | DESIGN.md §7 examples | Scope ambiguity |
| Reduced motion CSS implementation not verified | LOW | DESIGN.md line 938 | Unverified claim |

---

## Critical Gaps Requiring Documentation Update

1. **Complete the ESLint rules table** with all 20 registered rules (currently only 9 documented)
2. **Clarify ctrl package** — document separately or exclude from component architecture scope
3. **Fix registry generation reference** — update line 808 to reference actual entry point
4. **Document repo-local rules** — mention require-exception-metadata, no-broad-rdna-disables, no-mixed-style-authority, no-viewport-breakpoints-in-window-layout
5. **Define canonical owner slug registry** — provide whitelist of valid team slugs for exceptions
6. **Expand scope documentation** — explicitly list packages/ctrl, packages/pixel, and their rule applicability
7. **Add focus ring tests** — verify ring-2 ring-focus ring-offset-1 classes appear in Button/interactive components when focused
