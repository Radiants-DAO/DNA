# Monolith App Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate monolith-hackathon to use refactored @rdna/monolith package components, migrate remaining BEM CSS to Tailwind, and build a component library page as the first AppWindow-based tool.

**Architecture:** Copy components from `packages/monolith/components/core/` to replace local copies in `app/components/`. Remove dead BEM CSS blocks from globals.css. Migrate InfoWindow's cal-* classes to Tailwind inline. Build a `/components-showcase` page with a DesignSystemTab-style accordion showcase inside an AppWindow.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Radix UI (accordion + tabs), Zustand, react-draggable, use-scramble

**Branch:** `refactor/monolith-app` (off current main)
**Dev Server:** port 3003 (current live on 3002 for comparison)

**Key References:**
- `packages/monolith/REFACTOR_CHANGELOG.md` — exact class deletions, token changes, migration details
- `docs/brainstorms/2026-02-05-monolith-app-refactor-brainstorm.md` — architecture decisions

---

## Pre-flight Notes

### API Compatibility (verified)

CrtAccordion and CrtTabs package versions are **drop-in replacements** for the local versions:
- Identical compound API: `.Item`, `.Trigger`, `.Content`, `.List`
- Identical prop names and types
- Package adds optional `collapsible` prop to CrtAccordion (unused by InfoWindow)
- All 4 InfoWindow accordion usages and 1 tabs usage work without modification

### CSS Variable Scope

`--panel-accent-*` variables are scoped to `.door-info-overlay` in globals.css. Package components using these variables will work correctly when rendered inside the overlay (which they are). **Bug to fix:** `--panel-accent-50` is referenced in `@keyframes today-glow` but never defined — add it.

### What NOT to delete from globals.css

- `.app_wrap`, `.taskbar_*`, `.close_button`, `.app_contents` — actively used by InfoWindow
- `.button_mono` — used by InfoWindow action buttons
- `.cal-today-hero`, `.cal-hero-*`, `.cal-today-event`, `.cal-event-*`, `.cal-today-dot`, `.cal-legend*` — migrated to Tailwind in Task 2.2 (don't delete early)
- `@keyframes today-glow` — already exists locally, no package import needed

---

## Phase 0: Setup

### Task 0.1: Create branch and dev server

**Step 1:** Create the branch
```bash
git checkout -b refactor/monolith-app
```

**Step 2:** Start dev server on port 3003
```bash
pnpm dev --port 3003
```

**Step 3:** Verify the app loads at http://localhost:3003

---

## Phase 1: Component Library Page (verify components first)

Build the component showcase so the user can review all @rdna/monolith components and their variants before we refactor the rest of the app.

### Task 1.1: Install Radix UI dependencies

The package CrtAccordion and CrtTabs use Radix primitives.

**Files:**
- Modify: `package.json`

**Step 1:** Install deps
```bash
pnpm add @radix-ui/react-accordion @radix-ui/react-tabs
```

**Step 2:** Commit
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add radix-ui accordion and tabs dependencies"
```

### Task 1.2: Copy package components to app

Copy refactored components from `packages/monolith/components/core/` to replace local copies.

**Files:**
- Replace: `app/components/AnimatedSubtitle.tsx` ← `packages/monolith/components/core/AnimatedSubtitle/AnimatedSubtitle.tsx`
- Replace: `app/components/CrtAccordion.tsx` ← `packages/monolith/components/core/CrtAccordion/CrtAccordion.tsx`
- Replace: `app/components/CrtTabs.tsx` ← `packages/monolith/components/core/CrtTabs/CrtTabs.tsx`
- Replace: `app/components/ShaderBackground.tsx` ← `packages/monolith/components/core/ShaderBackground/ShaderBackground.tsx`
- Replace: `app/components/OrbitalNav.tsx` ← `packages/monolith/components/core/OrbitalNav/OrbitalNav.tsx`
- Replace: `app/components/CountdownTimer.tsx` ← `packages/monolith/components/core/CountdownTimer/CountdownTimer.tsx`
- Create: `app/components/Button.tsx` ← `packages/monolith/components/core/Button/Button.tsx` (+ `Button/index.ts` if barrel needed)
- Create: `app/components/Card.tsx` ← `packages/monolith/components/core/Card/Card.tsx`
- Create: `app/components/Badge.tsx` ← `packages/monolith/components/core/Badge/Badge.tsx`
- Create: `app/components/AppWindow.tsx` ← `packages/monolith/components/core/AppWindow/AppWindow.tsx`
- Create: `app/components/CalendarGrid.tsx` ← `packages/monolith/components/core/CalendarGrid/CalendarGrid.tsx`
- Create: `app/hooks/useWindowManager.ts` ← `packages/monolith/hooks/useWindowManager.ts` (or wherever the Zustand window store lives)

**Keep as-is (do NOT replace):**
- `app/components/CRTShader.tsx` — app-specific local copy, not in package core exports
- `app/components/InfoWindow.tsx` — app-specific content component (will update imports in Task 1.3)

**OrbitalNav migration:**
- Package version takes `items: OrbitalItem[]` prop (local hardcodes `ORBITAL_ITEMS`)
- Create `app/data/orbital-items.ts` with the `ORBITAL_ITEMS` array extracted from the current local OrbitalNav
- Export the `OrbitalItem` type from the new OrbitalNav

**Dependency check (already in package.json):**
- `react-draggable` ^4.5.0 — needed by AppWindow ✓
- `zustand` ^5.0.9 — needed by useWindowManager ✓
- `use-scramble` ^2.2.15 — needed by AnimatedSubtitle, OrbitalNav ✓

**Step 1:** Copy each component file. Adjust internal imports to use relative paths (not package paths). If a component has an `index.ts` barrel file, merge exports into the main file or copy both.

**Step 2:** Create `app/data/orbital-items.ts` with the `ORBITAL_ITEMS` array.

**Step 3:** Copy hooks (useWindowManager and any Zustand store it depends on).

**Step 4:** Verify the dev server compiles without errors.

**Step 5:** Commit
```bash
git add app/components/ app/data/ app/hooks/
git commit -m "feat: copy refactored components from @rdna/monolith package"
```

### Task 1.3: Update page.tsx and InfoWindow.tsx imports

Fix imports that break after component replacement.

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/components/InfoWindow.tsx`

**Step 1:** Update `app/page.tsx`:
- Import `ORBITAL_ITEMS` from `./data/orbital-items` instead of `./components/OrbitalNav`
- Pass `items={ORBITAL_ITEMS}` prop to `<OrbitalNav>`
- AnimatedSubtitle and ShaderBackground have backward-compatible defaults — no prop changes needed

**Step 2:** Update `app/components/InfoWindow.tsx`:
- Change `import { ORBITAL_ITEMS } from './OrbitalNav'` → `import { ORBITAL_ITEMS } from '../data/orbital-items'`
- CrtAccordion and CrtTabs imports stay the same (`import CrtAccordion from './CrtAccordion'`) — APIs are drop-in compatible, no changes needed

**Step 3:** Verify `--panel-accent-*` variables are inherited correctly. The variables are set on `.door-info-overlay` — confirm CrtAccordion/CrtTabs render inside this scope. (They do — InfoWindow renders inside the overlay.)

**Step 4:** Fix `--panel-accent-50` bug — add the missing variable definition to `.door-info-overlay` in globals.css:
```css
--panel-accent-50: rgba(180, 148, 247, 0.5);
```

**Step 5:** Test in browser — open each panel (hackathon, calendar, rules, prizes, judges, toolbox, faq, legal) and verify content renders correctly.

**Step 6:** Commit
```bash
git add app/page.tsx app/components/InfoWindow.tsx app/globals.css
git commit -m "fix: update imports for refactored components and fix missing panel-accent-50"
```

### Task 1.4: Build the Component Library page

Create a `/components-showcase` route with a DesignSystemTab-style showcase.

**Files:**
- Create: `app/components-showcase/page.tsx`
- Create: `app/components-showcase/DesignSystemShowcase.tsx`

**Step 1:** Create `app/components-showcase/DesignSystemShowcase.tsx`

Build helper components (same pattern as rad-os DesignSystemTab):

```tsx
function Section({ title, children }) // CrtAccordion.Item wrapper per component
function Row({ children, props }) // Single variant row with props label
function PropsDisplay({ props }) // Code-style props string display
```

Accordion sections for each component:
- **Button** — All 5 variants (primary, secondary, outline, ghost, mono) × 3 sizes (sm, md, lg) + disabled + loading + iconOnly
- **Card** — 3 variants (default, elevated, glass) × 3 paddings (sm, md, lg) + CardHeader/CardTitle/CardContent composition
- **Badge** — 6 variants (default, success, warning, error, info, custom) × 2 sizes (sm, md)
- **CrtAccordion** — single vs multiple type, collapsible, nested content example
- **CrtTabs** — controlled vs uncontrolled, multiple tab content types
- **CalendarGrid** — with sample events data showing all 6 category colors (launch, vibecoding, devshop, deadline, milestone, mtndao)
- **CountdownTimer** — numeric vs text format, different placements
- **AppWindow** — live demo with lorem content (draggable/resizable within the showcase)
- **OrbitalNav** — props description with mini example using 3-4 items
- **AnimatedSubtitle** — live demo with custom `lines` prop
- **ShaderBackground** — live demo with preset selector (or describe presets)

Use CrtAccordion from the refactored components for the section wrappers.

**Step 2:** Create `app/components-showcase/page.tsx`
```tsx
'use client';
import dynamic from 'next/dynamic';

const DesignSystemShowcase = dynamic(
  () => import('./DesignSystemShowcase'),
  { ssr: false }
);

export default function ComponentsPage() {
  return <DesignSystemShowcase />;
}
```

Render standalone initially (not inside AppWindow yet) so the user can review all components. AppWindow wrapping happens in Phase 3.

**Step 3:** Verify at http://localhost:3003/components-showcase

**Step 4:** Commit
```bash
git add app/components-showcase/
git commit -m "feat: add component library showcase page"
```

### Task 1.5: User review checkpoint

**STOP HERE.** Ask the user to review the component showcase at `/components-showcase`:
- Are all expected variants present?
- Any components missing?
- Any visual issues with the refactored components?
- Do the Radix-based CrtAccordion/CrtTabs look correct?
- Ready to proceed with CSS cleanup?

---

## Phase 2: CSS Cleanup

### Task 2.1: Remove dead BEM CSS blocks from globals.css

Per REFACTOR_CHANGELOG.md section 5, delete CSS class blocks that are now self-contained in the copied package components.

**Files:**
- Modify: `app/globals.css`

**Delete these blocks (search by class name, not line number):**

| Classes | Now self-contained in |
|---------|----------------------|
| `.orbital-layer`, `.orbital-icon`, `.orbital-icon img`, `.orbital-icon:hover img`, `.orbital-icon:active img`, `.orbital-label`, `.data-stream` + all variants/media queries | `OrbitalNav.tsx` (Tailwind inline) |
| `.crt-accordion-item`, `.crt-accordion-trigger`, `.crt-accordion-content`, `.accordion-icon` + all hover/active/state variants | `CrtAccordion.tsx` (Tailwind inline) |
| `.crt-tab-list`, `.crt-tab-trigger`, `.crt-tab-content` + all hover/active/state variants | `CrtTabs.tsx` (Tailwind inline) |
| `.cal-grid`, `.cal-cell`, `.cal-cell--header`, `.cal-cell--past`, `.cal-cell--today`, `.cal-cell--selected`, `.cal-cell--launch/deadline/mtndao`, `.cal-date`, `.cal-date--bold`, `.cal-dots`, `.cal-dot`, `.cal-tooltip`, `.cal-tooltip-header/time/desc` + all variants | `CalendarGrid.tsx` (Tailwind inline) |
| `.button_mono` + hover/active states | `Button.tsx` mono variant (Tailwind inline) |

**DO NOT delete (still actively used):**
- `.app_wrap`, `.taskbar_*`, `.close_button*`, `.app_contents` — used by InfoWindow's window chrome
- `.cal-today-hero`, `.cal-hero-*`, `.cal-today-event`, `.cal-event-*`, `.cal-today-dot`, `.cal-legend*` — migrated in Task 2.2
- `@keyframes today-glow` — used by CalendarGrid (locally defined, not imported from package)
- All `.door-*`, `.portal-*`, `.hero-*`, `.monolith-*` classes — page-level layout, not component styling

**Step 1:** For each class block, grep the codebase to confirm it's dead (no references outside the now-self-contained component). Delete the block.

**Step 2:** Verify dev server compiles and all panels render correctly.

**Step 3:** Commit
```bash
git add app/globals.css
git commit -m "chore: remove dead BEM CSS migrated to component Tailwind"
```

### Task 2.2: Migrate InfoWindow cal-* classes to Tailwind

This is a **non-trivial migration** (~30 classes with beveled borders, hover lifts, glow shadows). Budget accordingly.

**Files:**
- Modify: `app/components/InfoWindow.tsx`
- Modify: `app/globals.css` (delete migrated classes after each batch)

**Classes to migrate (from REFACTOR_CHANGELOG.md section 5 "WARNING" block):**

| CSS Class | Context | Key styles to preserve |
|-----------|---------|----------------------|
| `.cal-today-hero` | Today hero container | Flex column, padding, beveled border, background |
| `.cal-hero-header` | "TODAY" label | Font-mono, uppercase, panel-accent color |
| `.cal-hero-reset` | Reset button | Button styles with bevel, hover lift |
| `.cal-today-event` | Event card | Flex, padding, beveled border, gap, hover glow |
| `.cal-event-top` | Event header row | Flex row, gap, align-items center |
| `.cal-event-time-block` | Time display | Flex column, gap |
| `.cal-event-time-local` | Local time | Font-mono, larger size, panel-accent color |
| `.cal-event-time-utc` | UTC time | Font-mono, smaller, muted color |
| `.cal-event-desc` | Description text | Font-body, sub color |
| `.cal-event-actions` | Action buttons row | Flex row, gap, flex-wrap |
| `.cal-event-link` | Action link button | Border, padding, font-mono, uppercase, hover lift/glow |
| `.cal-today-dot` | Category indicator dot | Inline-block, 0.5em width/height, rounded-full |
| `.cal-legend` | Legend container | Flex wrap, gap |
| `.cal-legend-item` | Legend item | Flex, align-center, gap, font-ui, uppercase |

**Approach:** Read the CSS definition for each class, then replace the `className="cal-*"` in InfoWindow.tsx with equivalent Tailwind utilities. Use `[var(--panel-accent)]` bracket notation for CSS variable references. Preserve all bevel effects (border-top/left vs border-bottom/right color differences).

**Step 1:** Migrate the hero section classes (`.cal-today-hero`, `.cal-hero-header`, `.cal-hero-reset`).

**Step 2:** Migrate event classes (`.cal-today-event`, `.cal-event-top`, `.cal-event-time-*`, `.cal-event-desc`, `.cal-event-actions`, `.cal-event-link`).

**Step 3:** Migrate legend classes (`.cal-today-dot`, `.cal-legend`, `.cal-legend-item`).

**Step 4:** Delete all migrated CSS class definitions from globals.css.

**Step 5:** Verify the calendar panel renders correctly in browser — check today-hero, event cards, action buttons, and legend.

**Step 6:** Commit
```bash
git add app/components/InfoWindow.tsx app/globals.css
git commit -m "refactor: migrate InfoWindow cal-* BEM classes to Tailwind"
```

### Task 2.3: Update hardcoded token references

Per REFACTOR_CHANGELOG.md token changes section.

**Files:**
- Modify: `app/globals.css`

| Old Reference | New Reference |
|---------------|---------------|
| `#060b0a` (body bg) | `var(--color-surface-body)` or `bg-surface-body` |
| `#12d9a0` (scrollbar hover) | `var(--color-green-hover)` |
| `#10c794` (scrollbar active) | `var(--color-green-active)` |
| `#e2e2e2` (borders) | `var(--color-edge-subtle)` |

**Step 1:** Search globals.css for each hardcoded hex value and replace with semantic token.

**Step 2:** Verify no visual regressions.

**Step 3:** Commit
```bash
git add app/globals.css
git commit -m "refactor: replace hardcoded hex values with semantic tokens"
```

---

## Phase 3: Toolbox Launcher + AppWindow Integration

### Task 3.1: Wrap component showcase in AppWindow

**Files:**
- Modify: `app/components-showcase/page.tsx`
- Modify: `app/components-showcase/DesignSystemShowcase.tsx`

**Step 1:** Import AppWindow and useWindowManager. Wrap the showcase content:
```tsx
<AppWindow
  id="component-library"
  title="COMPONENTS.EXE"
  defaultSize={{ width: 800, height: 600 }}
  resizable
>
  <DesignSystemShowcase />
</AppWindow>
```

**Step 2:** Ensure `--panel-accent-*` variables are available in this context. The showcase page is NOT inside `.door-info-overlay`, so set the variables on the page root or AppWindow wrapper:
```css
/* Either inline style or a class that sets the panel-accent vars */
```

**Step 3:** Verify dragging, resizing, and close button work.

**Step 4:** Commit
```bash
git add app/components-showcase/
git commit -m "feat: wrap component showcase in AppWindow"
```

### Task 3.2: Add component library launcher to toolbox

**Files:**
- Modify: `app/components/InfoWindow.tsx` (toolbox section content)

**Step 1:** In the toolbox content, add a launcher card for the component library. Use a Button or styled link that navigates to `/components-showcase`.

**Step 2:** Style the launcher card to match the existing toolbox aesthetic (beveled border, panel-accent colors).

**Step 3:** Commit
```bash
git add app/components/InfoWindow.tsx
git commit -m "feat: add component library launcher to toolbox"
```

---

## Phase 4: Final Verification

### Task 4.1: Full regression test

**Checklist:**
- [ ] All 8 panels open and render correctly (hackathon, calendar, rules, prizes, judges, toolbox, faq, legal)
- [ ] CrtAccordion expands/collapses in all panels (FAQ, toolbox, prizes)
- [ ] CrtTabs switch correctly (rules, legal)
- [ ] Orbital nav animations work (orbit, hover gravity, dismiss/return spiral)
- [ ] Audio mute/unmute with fade works
- [ ] URL deep linking works (`?panel=hackathon&tab=...`)
- [ ] Mobile responsive (orbital nav hides, tab strip shows)
- [ ] Component showcase page at `/components-showcase` renders all components
- [ ] AppWindow draggable/resizable on showcase page
- [ ] No hydration errors in console
- [ ] No dead CSS classes remaining in globals.css (grep for deleted class names)
- [ ] Embed page still works at `/embed`
- [ ] `--panel-accent-*` variables render correctly (no invisible text)

### Task 4.2: Deploy preview

```bash
vercel
```

Share preview URL with user for final review before merging.
