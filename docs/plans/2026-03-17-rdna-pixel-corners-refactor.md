# RDNA Pixel Corners Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Move pixel corners from rad-os `globals.css` into the `@rdna/radiants` package and fix all components to work correctly with clip-path constraints (no double borders, correct shadow strategy, retro-OS bevel styling).

**Worktree:** `/private/tmp/claude/rdna-pixel-corners` (branch: `feat/rdna-pixel-corners`)

**Architecture:** Pixel corners use `clip-path: polygon()` for staircase corners and `::after` pseudo-element border rings for crisp 1px borders. Components must not set their own CSS `border` on pixel-cornered elements (causes doubling). External shadows must use `filter: drop-shadow()` since `box-shadow` gets clipped. Internal depth uses `inset box-shadow`. Dark mode buttons already use `box-shadow: 0 0 Npx` glow halos which will need conversion to `filter: drop-shadow()`.

**Tech Stack:** CSS (Tailwind v4 `@theme`), CVA (class-variance-authority), React/TypeScript

---

## Phase 1: Package Setup — Move CSS to Radiants

### Task 1: Create `pixel-corners.css` in radiants package

**Files:**
- Create: `packages/radiants/pixel-corners.css`
- Modify: `packages/radiants/index.css`

**Step 1: Copy pixel corners CSS from rad-os globals into new file**

Copy the entire pixel corners block (lines 25–192 of `apps/rad-os/app/globals.css`) into a new file `packages/radiants/pixel-corners.css`. Add the same header comment. Remove the `rounded-xs/sm/md/lg` Tailwind override selectors from the polygons — those stay in globals.css for now because they are app-level overrides (the package provides the `.pixel-rounded-*` classes; the app decides whether `rounded-*` maps to them).

Wait — the brainstorm says the Tailwind override IS permanent and should ship in the package. So include the `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg` selectors in the package CSS alongside the `.pixel-rounded-*` classes. This means any app importing `@rdna/radiants` gets pixel corners on all `rounded-*` elements automatically.

Create `packages/radiants/pixel-corners.css` containing:
- The full comment header explaining the technique, sizes, and constraints
- All shared base styles (`.pixel-rounded-*::after`, position: relative, border: transparent, etc.)
- All five size blocks (XS through XL) with their clip-path polygons
- The Tailwind override selectors (`rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg`) aliased to the appropriate pixel-rounded size

**Step 2: Import pixel-corners.css from index.css**

In `packages/radiants/index.css`, add after the animations import:

```css
/* Pixel corners — pixelated rounded corners via clip-path polygon */
@import './pixel-corners.css';
```

**Step 3: Remove pixel corners CSS from rad-os globals.css**

Delete lines 25–192 from `apps/rad-os/app/globals.css` (the entire pixel corners block). The app now gets pixel corners via the `@import '@rdna/radiants'` on line 2.

**Step 4: Verify the build compiles**

Run:
```bash
cd /private/tmp/claude/rdna-pixel-corners && pnpm build --filter=rad-os
```
Expected: Build succeeds. No missing class errors.

**Step 5: Commit**

```bash
git add packages/radiants/pixel-corners.css packages/radiants/index.css apps/rad-os/app/globals.css
git commit -m "refactor(radiants): move pixel-corners CSS from rad-os globals into package"
```

---

## Phase 2: Button — Fix All Variants

The Button component uses CVA with a `buttonFaceVariants` that applies `border`, `shadow-*`, and translate-based hover lift. Primary was partially fixed in the experiment. Now we systematize all variants.

### Reference: How pixel-corner buttons work

1. The `rounded-xs` class (on button face via CVA) triggers pixel corners + `::after` border ring automatically
2. Component must NOT set its own `border` (or set `border: transparent` / `border-none`) — the `::after` pseudo handles visible borders
3. External shadow: use `filter: drop-shadow()` instead of `box-shadow` (clip-path clips box-shadow)
4. Retro-OS depth: use `inset box-shadow` (light TL edge, dark BR edge) — this works inside clip-path
5. Active/pressed: swap bevel direction (dark TL, light BR → recessed look)

### Task 2: Fix Button light-mode variants (secondary, outline, ghost, destructive, text)

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx`

**Step 1: Audit current variant classes**

Current CVA `buttonFaceVariants` variant classes (from Button.tsx lines 80–93):
- `primary`: `shadow-none` — partially fixed, needs bevel
- `secondary`: `border shadow-none` + hover lift/shadow
- `outline`: `border shadow-none` + hover lift/shadow
- `ghost`: `border-transparent shadow-none`
- `destructive`: `border shadow-none` + hover lift/shadow
- `text`: `border-transparent shadow-none rounded-none` + various overrides

**Step 2: Update all variant classes**

Replace the CVA variant block with:

```tsx
variant: {
  primary: `shadow-none`,
  secondary: `shadow-none`,
  outline: `shadow-none`,
  ghost: `border-transparent shadow-none`,
  destructive: `shadow-none`,
  text: `border-transparent shadow-none no-underline font-[inherit] text-[length:inherit] tracking-[inherit] leading-[inherit]
         normal-case !h-auto !p-0 rounded-none`,
},
```

Key changes:
- Remove `border` from secondary, outline, destructive (the `::after` handles border)
- Remove all `group-hover:-translate-y-*` and `group-hover:shadow-lifted` / `group-active:shadow-resting` from secondary, outline, destructive (retro-OS bevel replaces lift effect)
- Ghost and text keep `border-transparent` (they should NOT show `::after` border) — but they have `rounded-xs` from the base class, so the `::after` will fire. Need to suppress it. Add `[&::after]:hidden` or set a CSS custom property.

**Wait** — ghost and text have `rounded-xs` from the base CVA string (line 76). This means `::after` will fire on them too, showing an unwanted border ring. Solutions:
- Option A: Add `[&::after]:content-none` to ghost/text variants to suppress the pseudo
- Option B: Override the clip-path to `none` for ghost/text → but this removes pixel corners entirely
- Option C: Set `::after` background to transparent for ghost/text

Best: Option A. Ghost/text get `[&::after]:content-none` so no border ring appears.

Updated ghost:
```
ghost: `border-transparent shadow-none [&::after]:content-none`,
```

Updated text (already has `rounded-none` so `::after` won't match — confirmed, the CSS selectors target `.rounded-xs`, `.rounded-sm`, etc. `rounded-none` is not in the list, so `::after` won't fire. Good — text variant is already safe.

For ghost: it has `rounded-xs` via the base class. Options:
1. Override in ghost variant with `rounded-none` — but then no pixel corners at all
2. Suppress `::after` — ghost has no visible border normally, but when hovered in dark mode it gets a border (via dark.css). The `::after` would need to be conditionally visible.

Actually, looking at dark.css (line 312-338), ghost buttons get `border: 1px solid transparent` base and `border-color` on hover/active. In pixel-corner world, this should be: `::after` hidden by default, shown on hover. But `::after` is controlled by CSS — we can't toggle content via hover in the current setup.

**Simplification for ghost:** Ghost buttons don't need pixel corners. They're borderless/invisible containers. Make ghost use `rounded-none` to opt out of the pixel corners system entirely and handle its own border normally. In dark mode, the glow effect via `box-shadow` will need `filter: drop-shadow()` conversion instead.

Actually wait — ghost has `rounded-xs` which gives it pixel corners. But ghost is supposed to look borderless. Let's just remove `rounded-xs` from the base class and put it explicitly on variants that need it:

**Step 3: Move `rounded-xs` from base to per-variant**

Current base (line 76):
```
inline-flex items-center font-heading uppercase tracking-tight leading-none whitespace-nowrap rounded-xs
```

Change to:
```
inline-flex items-center font-heading uppercase tracking-tight leading-none whitespace-nowrap
```

Then add `rounded-xs` to: primary, secondary, outline, destructive.
Ghost and text do NOT get `rounded-xs`.

Updated variants:
```tsx
variant: {
  primary: `rounded-xs shadow-none`,
  secondary: `rounded-xs shadow-none`,
  outline: `rounded-xs shadow-none`,
  ghost: `shadow-none`,
  destructive: `rounded-xs shadow-none`,
  text: `shadow-none no-underline font-[inherit] text-[length:inherit] tracking-[inherit] leading-[inherit]
         normal-case !h-auto !p-0`,
},
```

**Step 4: Add Sun Mode retro-OS bevel via data-slot CSS**

Create a new file for button-specific pixel corner styles. These are CSS rules that apply inside the pixel-corner context, targeting `[data-slot="button-face"]` with `[data-variant]`.

Add to `packages/radiants/components/core/Button/button-pixel.css` — wait, RDNA doesn't use per-component CSS files. The dark.css already handles button variant styling via data attributes. We should add Sun Mode bevel the same way.

**Better approach:** Add the retro-OS bevel to a new `@layer` in `pixel-corners.css` since it's pixel-corner-specific behavior. Or add it to `base.css`. Actually, the most maintainable approach: add it to a new section at the bottom of `pixel-corners.css` since it's specific to the pixel-corner rendering context.

Add to `pixel-corners.css`:
```css
/* ============================================================================
   Retro-OS Bevel — Inset box-shadow for interactive pixel-cornered elements
   Sun Mode: Light top-left edge, dark bottom-right edge → raised appearance
   Swap on :active → pressed/recessed look
   Moon Mode: Override in dark.css with glow halos via filter: drop-shadow()
   ============================================================================ */

[data-slot="button-face"][data-variant="primary"] {
  box-shadow:
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.35),
    inset -1px -1px 0 0 rgba(0, 0, 0, 0.15);
}

[data-slot="button-face"][data-variant="primary"]:active {
  box-shadow:
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.35),
    inset 1px 1px 0 0 rgba(0, 0, 0, 0.15);
}

[data-slot="button-face"][data-variant="secondary"] {
  box-shadow:
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.25),
    inset -1px -1px 0 0 rgba(0, 0, 0, 0.1);
}

[data-slot="button-face"][data-variant="secondary"]:active {
  box-shadow:
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.25),
    inset 1px 1px 0 0 rgba(0, 0, 0, 0.1);
}

[data-slot="button-face"][data-variant="outline"] {
  box-shadow:
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.15),
    inset -1px -1px 0 0 rgba(0, 0, 0, 0.08);
}

[data-slot="button-face"][data-variant="outline"]:active {
  box-shadow:
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.15),
    inset 1px 1px 0 0 rgba(0, 0, 0, 0.08);
}

[data-slot="button-face"][data-variant="destructive"] {
  box-shadow:
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.3),
    inset -1px -1px 0 0 rgba(0, 0, 0, 0.15);
}

[data-slot="button-face"][data-variant="destructive"]:active {
  box-shadow:
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.3),
    inset 1px 1px 0 0 rgba(0, 0, 0, 0.15);
}
```

**Step 5: Update dark.css button variants — convert box-shadow glow to filter: drop-shadow()**

The dark.css button variant rules (lines 284-444) use `box-shadow` for glow halos. With clip-path, these get clipped. Convert to `filter: drop-shadow()`.

For each button variant in dark.css, change:
```css
box-shadow:
  0 0 4px var(--glow-cream-hover),
  0 0 10px var(--glow-sun-yellow-subtle);
```
to:
```css
filter:
  drop-shadow(0 0 4px var(--glow-cream-hover))
  drop-shadow(0 0 10px var(--glow-sun-yellow-subtle));
```

Also keep the bevel `inset box-shadow` for depth in dark mode (it works inside clip-path):
```css
box-shadow:
  inset 1px 1px 0 0 rgba(252, 225, 132, 0.15),
  inset -1px -1px 0 0 rgba(0, 0, 0, 0.3);
filter:
  drop-shadow(0 0 4px var(--glow-cream-hover))
  drop-shadow(0 0 10px var(--glow-sun-yellow-subtle));
```

Apply to: primary, ghost, secondary, outline, text variants in dark.css.

Note: `filter: drop-shadow()` only accepts ONE shadow per `drop-shadow()` call but multiple can be chained. The syntax is correct as shown above.

**Step 6: Remove the "Keep Moon Mode buttons flat" override block**

In dark.css (lines 514-520), there's a block that removes `translate` and `shadow` from all button variants to keep them flat in dark mode. This needs updating — the translate removal is correct (no lift in dark mode), but the shadow removal needs to preserve inset bevel. Update:

```css
& [data-slot="button-face"][data-variant="primary"],
& [data-slot="button-face"][data-variant="secondary"],
& [data-slot="button-face"][data-variant="outline"],
& [data-slot="button-face"][data-variant="ghost"],
& [data-slot="button-face"][data-variant="destructive"],
& [data-slot="button-face"][data-variant="text"] {
  translate: 0 0 !important;
}
```

(Remove any `box-shadow: none !important` from this block — the individual variant rules handle shadows.)

**Step 7: Build verify**

Run:
```bash
cd /private/tmp/claude/rdna-pixel-corners && pnpm build --filter=rad-os
```

**Step 8: Commit**

```bash
git add packages/radiants/components/core/Button/Button.tsx packages/radiants/pixel-corners.css packages/radiants/dark.css
git commit -m "feat(radiants): retro-OS bevel for all button variants, fix double borders

- Move rounded-xs from base to per-variant (ghost/text opt out)
- Remove border class from secondary/outline/destructive (::after handles it)
- Add inset bevel (Sun Mode) in pixel-corners.css
- Convert dark mode button glow from box-shadow to filter: drop-shadow()"
```

---

## Phase 3: Category A — Fix Double Borders

Components that have `border border-line` AND get `rounded-xs/sm` (which adds `::after` border ring). Remove the component's own border — `::after` is the single source of visible borders.

### Task 3: ToggleGroup — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/ToggleGroup/ToggleGroup.tsx`

**Step 1: Remove borders from ToggleGroup**

Current root (ToggleGroup.tsx line 53):
```
'inline-flex rounded-xs border border-line overflow-hidden'
```

Change to:
```
'inline-flex rounded-xs overflow-hidden'
```

The `::after` on `rounded-xs` provides the outer border.

Current item (line 74):
```
cursor-pointer select-none border-line
```

The items share internal borders via:
```
horizontal: 'border-r last:border-r-0',
vertical: 'border-b last:border-b-0',
```

These internal dividers between items are NOT handled by `::after` — they're genuine internal borders and should stay. But the outer `border-line` on each item may double with the container's `::after`. Remove the outer border from items but keep internal dividers:

Actually, looking more carefully: the container has `border border-line` (outer border), and items have `border-r` / `border-b` (internal dividers). The container's `border` doubles with `::after`. The items' `border-r` is an internal divider, not an outer border — it should stay.

Change container: remove `border border-line`, keep `rounded-xs`.
The items' internal dividers (`border-r`, `border-b`) stay.

**Step 2: Verify build**

```bash
cd /private/tmp/claude/rdna-pixel-corners && pnpm build --filter=rad-os
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/ToggleGroup/ToggleGroup.tsx
git commit -m "fix(radiants): remove ToggleGroup double border (::after handles outer border)"
```

### Task 4: NavigationMenu dropdown — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx`

**Step 1: Remove border from dropdown content**

Current (line 231):
```
border border-line
rounded-xs
shadow-raised
```

Change to:
```
rounded-xs
```

Remove `border border-line` (::after handles it). Remove `shadow-raised` because clip-path clips box-shadow. Replace with `filter: drop-shadow()` equivalent:

```
rounded-xs [filter:drop-shadow(2px_2px_0_var(--color-ink))]
```

Wait — we can use a Tailwind utility for filter drop-shadow. Check if Tailwind v4 has it: `drop-shadow-*` exists but uses predefined values. We need the custom token equivalent. Use arbitrary: `[filter:drop-shadow(2px_2px_0_var(--color-ink))]`.

Actually — the `shadow-raised` token is `2px 2px 0 0 var(--color-ink)`. In dark mode it's overridden to a glow. The dark.css already force-overrides `.shadow-raised` with the correct glow values via `--tw-shadow`. But with clip-path, the box-shadow gets clipped.

For panels/overlays, we need the shadow to be visible outside the clip-path. Two options:
1. Add the shadow to the parent element (not the clipped one)
2. Use `filter: drop-shadow()` on the element itself

Option 2 is simpler. Use Tailwind arbitrary:
```
rounded-xs [filter:drop-shadow(var(--shadow-drop-raised,2px_2px_0_var(--color-ink)))]
```

This is getting complex. Let's create helper CSS classes instead.

**Better approach:** In `pixel-corners.css`, add utility classes that convert shadow tokens to `filter: drop-shadow()`:

```css
/* Drop-shadow equivalents for pixel-cornered elements */
.pixel-shadow-resting {
  filter: drop-shadow(0 2px 0 var(--color-ink));
}
.pixel-shadow-raised {
  filter: drop-shadow(2px 2px 0 var(--color-ink));
}
.pixel-shadow-floating {
  filter: drop-shadow(4px 4px 0 var(--color-ink));
}
```

Then dark.css overrides these with glow equivalents:
```css
.dark .pixel-shadow-resting { filter: drop-shadow(0 0 4px rgba(252,225,132,0.12)) drop-shadow(0 0 8px rgba(252,225,132,0.06)); }
.dark .pixel-shadow-raised { filter: drop-shadow(0 0 8px rgba(252,225,132,0.2)) drop-shadow(0 0 20px rgba(252,225,132,0.08)); }
.dark .pixel-shadow-floating { filter: drop-shadow(0 0 10px rgba(252,225,132,0.25)) drop-shadow(0 0 24px rgba(252,225,132,0.1)); }
```

Then NavigationMenu dropdown becomes:
```
rounded-xs pixel-shadow-raised
```

**Step 2: Apply fix**

Change line 231-233 from:
```
border border-line
rounded-xs
shadow-raised
```
to:
```
rounded-xs pixel-shadow-raised
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx packages/radiants/pixel-corners.css packages/radiants/dark.css
git commit -m "fix(radiants): NavigationMenu dropdown — remove double border, use pixel-shadow-raised"
```

### Task 5: Combobox — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/Combobox/Combobox.tsx`

**Step 1: Fix Combobox input and dropdown**

Input (line 128-129):
```
border border-line
rounded-xs
```
→ Change to: `rounded-xs`

Dropdown (line 182-184):
```
border border-line
rounded-xs
shadow-raised
```
→ Change to: `rounded-xs pixel-shadow-raised`

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Combobox/Combobox.tsx
git commit -m "fix(radiants): Combobox — remove double borders, use pixel-shadow-raised"
```

---

## Phase 4: Category B — Fix Missing/Broken Borders

Components that have borders but whose `::after` needs to render correctly.

### Task 6: Card — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/Card/Card.tsx`

**Step 1: Fix Card root**

Current (line 43):
```
'border border-line rounded-md overflow-hidden'
```

`rounded-md` maps to pixel-rounded-lg (radius 8). The `border border-line` doubles with `::after`. Remove it:
```
'rounded-md overflow-hidden'
```

Card variants using `shadow-raised` (line 49):
```
raised: 'bg-page text-main shadow-raised',
```
→ Change to: `'bg-page text-main pixel-shadow-raised'`

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Card/Card.tsx
git commit -m "fix(radiants): Card — remove double border, use pixel-shadow for raised variant"
```

### Task 7: Input — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/Input/Input.tsx`

**Step 1: Fix Input base classes**

Current (line 47):
```
font-sans bg-page text-main border border-line rounded-xs
```
→ Change to: `font-sans bg-page text-main rounded-xs`

The error state (line 60) uses `border-danger`:
```
true: 'border-danger focus-visible:shadow-[...]',
```
This can't work via `::after` because the `::after` border color is `var(--color-line)` globally. For error states, we need to override the `::after` background color.

Add to `pixel-corners.css`:
```css
/* Error state — override ::after border color */
.pixel-border-danger::after {
  background: var(--color-danger) !important;
}
```

Then change error state to:
```
true: 'pixel-border-danger focus-visible:shadow-[...]',
```

Wait — the `focus-visible:shadow-[...]` also gets clipped. Convert to filter:
```
true: 'pixel-border-danger focus-visible:[filter:drop-shadow(0_0_6px_var(--color-sun-red))_drop-shadow(0_0_14px_rgba(255,107,99,0.3))]',
```

This is getting unwieldy with arbitrary values. Better to add a utility class:
```css
.pixel-border-danger::after { background: var(--color-danger) !important; }
.pixel-glow-danger:focus-visible { filter: drop-shadow(0 0 6px var(--color-sun-red)) drop-shadow(0 0 14px rgba(255,107,99,0.3)); }
```

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Input/Input.tsx packages/radiants/pixel-corners.css
git commit -m "fix(radiants): Input — remove double border, add pixel-border-danger for error state"
```

### Task 8: Select — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/Select/Select.tsx`

**Step 1: Fix Select trigger and dropdown**

Trigger (line 89): `border rounded-xs` → `rounded-xs`
Trigger hover (lines 104-105): Remove `shadow-resting` and `shadow-lifted` lift pattern.

Dropdown (lines 204-206):
```
border border-line
rounded-xs
shadow-raised
```
→ `rounded-xs pixel-shadow-raised`

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Select/Select.tsx
git commit -m "fix(radiants): Select — remove double borders, use pixel-shadow-raised"
```

### Task 9: NumberField — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/NumberField/NumberField.tsx`

**Step 1: Fix NumberField**

Input element (line 74): `border-y border-line` — this is a partial border (top/bottom only, sides handled by step buttons). With pixel corners on the container, this needs rethinking. The NumberField is a composite: [decrement] [input] [increment]. The container probably gets `rounded-xs` and `::after` handles the outer border. Internal borders between segments stay as internal dividers.

Check if the container has `rounded-xs`: The step buttons (line 152, 165) have `rounded-r-xs` and `rounded-l-xs`. The input has `border-y border-line`. This suggests the three segments are laid out inline with shared borders.

For pixel corners: wrap the entire NumberField in a container with `rounded-xs` and remove individual borders. The `::after` on the container handles the outer border. Internal dividers between segments can use 1px border-left/right.

Change input (line 74): `border-y border-line` → remove (container handles outer border)
Step buttons (lines 84, 152, 165): `border border-line` → `border-l border-line` (internal divider only)
Container: ensure it has `rounded-xs` and `overflow-hidden`

**Step 2: Commit**

```bash
git add packages/radiants/components/core/NumberField/NumberField.tsx
git commit -m "fix(radiants): NumberField — remove double borders, container-level pixel corners"
```

### Task 10: Meter — remove border doubling

**Files:**
- Modify: `packages/radiants/components/core/Meter/Meter.tsx`

**Step 1: Fix Meter**

Current (line 33):
```
'w-full h-4 bg-page border border-line rounded-xs overflow-hidden'
```
→ `'w-full h-4 bg-page rounded-xs overflow-hidden'`

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Meter/Meter.tsx
git commit -m "fix(radiants): Meter — remove double border"
```

---

## Phase 5: Category C — Suppress Unwanted Borders

### Task 11: Breadcrumbs — suppress ::after on links

**Files:**
- Modify: `packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx`

**Step 1: Fix breadcrumb links**

Current (line 66):
```
className="font-sans text-base text-mute hover:text-main hover:underline transition-colors focus-visible:outline-none rounded-xs"
```

The `rounded-xs` triggers pixel corners + `::after` border on each breadcrumb link. Breadcrumb links should NOT have pixel-cornered borders.

Remove `rounded-xs` from breadcrumb links. If they need pixel corners for hover focus, use `rounded-none` or just omit the rounded class.

→ Remove `rounded-xs` from the className.

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx
git commit -m "fix(radiants): Breadcrumbs — remove rounded-xs to suppress unwanted pixel border"
```

---

## Phase 6: Category D — Retro-OS Refactors

### Task 12: Switch — retro toggle, remove hover lift

**Files:**
- Modify: `packages/radiants/components/core/Switch/Switch.tsx`

**Step 1: Fix Switch track and thumb**

Track (line 35):
```
'group relative inline-flex items-center rounded-xs border cursor-pointer ...'
```
→ Remove `border`:
```
'group relative inline-flex items-center rounded-xs cursor-pointer ...'
```
The `::after` handles the track border.

Track variants (lines 44-45):
```
true: 'bg-accent border-accent',
false: 'bg-inv border-line',
```
→ Remove border-color classes (::after handles it):
```
true: 'bg-accent',
false: 'bg-inv',
```

For the checked state, the `::after` border should change color to match accent. Add a CSS rule:
```css
[data-slot="switch-track"][aria-checked="true"]::after {
  background: var(--color-accent) !important;
}
```

Thumb (line 107):
```
'switch-thumb rounded-xs border pointer-events-none relative top-0 ...'
```
→ Remove `border`:
```
'switch-thumb rounded-xs pointer-events-none relative top-0 ...'
```

Remove hover lift from thumb (lines 110-112):
```
'shadow-none',
'group-hover:-top-1 group-hover:shadow-lifted',
'group-active:-top-0.5 group-active:shadow-resting',
```
→ Replace with bevel:
```
'shadow-none',
```
(The retro-OS bevel will be applied via CSS in pixel-corners.css targeting `[data-slot="switch-thumb"]`)

Add to pixel-corners.css:
```css
.switch-thumb {
  box-shadow:
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.3),
    inset -1px -1px 0 0 rgba(0, 0, 0, 0.12);
}

.switch-thumb:active,
.group:active .switch-thumb {
  box-shadow:
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.3),
    inset 1px 1px 0 0 rgba(0, 0, 0, 0.12);
}
```

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Switch/Switch.tsx packages/radiants/pixel-corners.css
git commit -m "feat(radiants): Switch — retro-OS bevel, remove hover lift and double border"
```

### Task 13: Slider — retro track + thumb, remove hover lift

**Files:**
- Modify: `packages/radiants/components/core/Slider/Slider.tsx`

**Step 1: Fix Slider**

Track (lines 74-75):
```
`slider-track relative w-full overflow-visible rounded-xs border border-line bg-page ...`
```
→ Remove `border border-line`:
```
`slider-track relative w-full overflow-visible rounded-xs bg-page ...`
```

Thumb (lines 134-135):
```
'before:rounded-xs before:border before:border-line before:bg-page',
'before:shadow-none',
```
→ Remove `before:border before:border-line`:
```
'before:rounded-xs before:bg-page',
'before:shadow-none',
```

Remove hover lift (line 84):
```
'group-hover:before:-translate-y-1 group-hover:before:shadow-lifted group-active:before:-translate-y-0.5 group-active:before:shadow-resting'
```
→ Remove entirely (no lift in retro mode).

Add bevel to slider thumb via CSS:
```css
[data-slot="slider-thumb"]::before {
  box-shadow:
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.3),
    inset -1px -1px 0 0 rgba(0, 0, 0, 0.12) !important;
}
```

**Step 2: Commit**

```bash
git add packages/radiants/components/core/Slider/Slider.tsx packages/radiants/pixel-corners.css
git commit -m "feat(radiants): Slider — retro-OS track/thumb, remove hover lift and double borders"
```

### Task 14: Tabs — fix borders and shadow

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Fix Tab triggers**

Tab trigger base (line 99):
```
relative border rounded-sm flex-1 shadow-none
```
→ Remove `border`:
```
relative rounded-sm flex-1 shadow-none
```

Pill variant active (line 114):
```
'border-line bg-accent text-accent-inv -translate-y-0.5 shadow-resting'
```
→ Remove lift + shadow:
```
'bg-accent text-accent-inv'
```

Line variant active (line 116):
```
'border-b-0 bg-page border-t border-l border-r border-line rounded-t-md z-10'
```
This is a classic tab shape (borders on three sides, no bottom border). With pixel corners, this is tricky — `::after` draws a full border ring. Line-variant tabs need a different approach.

For line variant: keep the traditional border approach (no pixel corners). Use `rounded-none` to opt out:
```
'rounded-none bg-page border-t border-l border-r border-line border-b-0 z-10'
```

Other pill variant references that have `shadow-resting` / `shadow-lifted` — remove lift:
Line 113:
```
'border-transparent bg-transparent text-head hover:border-line hover:bg-inv hover:text-accent hover:-translate-y-0.5 hover:shadow-resting'
```
→
```
'bg-transparent text-head hover:bg-inv hover:text-accent'
```

**Step 2: Fix TabList/TabSidebar borders**

TabList (line 166): `border border-line rounded-xs` → `rounded-xs` (remove border)
TabSidebar (line 217): `border border-line rounded-l-sm` → keep as-is (directional rounded classes are not overridden by pixel corners per the brainstorm — `rounded-r/l/t/b` unchanged)

Actually, `rounded-l-sm` won't trigger pixel corners since the CSS only targets `.rounded-xs`, `.rounded-sm`, `.rounded-md`, `.rounded-lg` (not directional variants). So TabSidebar is fine.

TabList with `border border-line rounded-xs`: the `rounded-xs` triggers `::after`, so remove `border border-line`.

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Tabs/Tabs.tsx
git commit -m "feat(radiants): Tabs — remove double borders and lift effects, line-variant opt-out"
```

---

## Phase 7: Other Affected Components — Audit Pass

### Task 15: Audit and fix remaining components with `border` + `rounded-xs/sm/md`

**Files (review each, fix if doubled):**
- `packages/radiants/components/core/Badge/Badge.tsx` — `rounded-xs border border-line` → remove `border border-line`
- `packages/radiants/components/core/Alert/Alert.tsx` — `border border-line rounded-xs` → remove `border border-line`, `shadow-raised` → `pixel-shadow-raised`
- `packages/radiants/components/core/AlertDialog/AlertDialog.tsx` — `border border-line rounded-sm shadow-floating` → `rounded-sm pixel-shadow-floating`
- `packages/radiants/components/core/Tooltip/Tooltip.tsx` — `rounded-xs` (no border) → fine as-is
- `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx` — `border border-line rounded-sm shadow-raised` → `rounded-sm pixel-shadow-raised`
- `packages/radiants/components/core/ContextMenu/ContextMenu.tsx` — `border border-line rounded-sm shadow-raised` → `rounded-sm pixel-shadow-raised`
- `packages/radiants/components/core/Menubar/Menubar.tsx` — content: `border border-line rounded-xs shadow-raised` → `rounded-xs pixel-shadow-raised`; triggers: `border border-line rounded-xs` → `rounded-xs`
- `packages/radiants/components/core/Collapsible/Collapsible.tsx` — `border border-line rounded-xs` → `rounded-xs`
- `packages/radiants/components/core/Avatar/Avatar.tsx` — `border border-line`, square variant `rounded-xs` → when square, remove `border border-line`; circle variant uses `rounded-full` (unchanged)
- `packages/radiants/components/core/Toolbar/Toolbar.tsx` — root: `border border-line rounded-sm` → `rounded-sm`; items: `border border-transparent rounded-xs` → `rounded-xs` (border-transparent may cause ::after to show but with transparent — need to check)

For Toolbar items: they have `rounded-xs` and `border border-transparent`. The `::after` will show with `var(--color-line)` background. On hover they get `hover:border-line`. In pixel-corner world, the `::after` always shows the border. We want it hidden by default and shown on hover.

Options:
1. Remove `rounded-xs` from toolbar items (opt out of pixel corners for inline controls)
2. Add `[&::after]:opacity-0 [&:hover::after]:opacity-100` to toggle visibility

Option 1 is simpler and matches the ghost button pattern. Toolbar items are inline controls that shouldn't have permanent borders:
→ Remove `rounded-xs` from toolbar items, use plain hover bg change

**Step 1: Apply fixes to each file**

Go through each file listed above and make the specific changes noted.

**Step 2: Build verify**

```bash
cd /private/tmp/claude/rdna-pixel-corners && pnpm build --filter=rad-os
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/
git commit -m "fix(radiants): audit pass — remove double borders across all pixel-cornered components

Components fixed: Badge, Alert, AlertDialog, DropdownMenu, ContextMenu,
Menubar, Collapsible, Avatar, Toolbar. Shadow tokens converted to
pixel-shadow-* equivalents for clip-path compatibility."
```

---

## Phase 8: Focus Ring Audit

### Task 16: Verify focus-visible works with clip-path

**Files:**
- Possibly modify: `packages/radiants/pixel-corners.css`

**Step 1: Test focus rings**

Current focus approach: Most components use `focus-visible:outline-none` (suppresses default outline). Button uses only `focus-visible:outline-none` on root — no visible focus ring is implemented.

Some dark.css rules use `shadow-focused` for focus. With clip-path, box-shadow-based focus rings get clipped.

Check what Tailwind's `ring-*` utilities generate — they use `box-shadow` under the hood, which gets clipped.

Solution: Use CSS `outline` for focus rings instead of `ring-*` or `box-shadow`. `outline` is NOT clipped by `clip-path`.

Add to `pixel-corners.css`:
```css
/* Focus ring for pixel-cornered elements — outline instead of box-shadow ring */
.pixel-rounded-xs:focus-visible,
.pixel-rounded-sm:focus-visible,
.pixel-rounded-md:focus-visible,
.pixel-rounded-lg:focus-visible,
.pixel-rounded-xl:focus-visible,
.rounded-xs:focus-visible,
.rounded-sm:focus-visible,
.rounded-md:focus-visible,
.rounded-lg:focus-visible {
  outline: 2px solid var(--color-focus, var(--color-accent));
  outline-offset: 2px;
}
```

This provides a visible focus indicator that works outside the clip-path. The outline won't follow the pixel staircase shape (it'll be rectangular), but it's accessible and visible.

**Step 2: Test in browser**

Tab through buttons, inputs, selects, toggle groups, etc. Verify the outline appears outside the clipped element.

**Step 3: Commit**

```bash
git add packages/radiants/pixel-corners.css
git commit -m "fix(radiants): focus ring audit — use outline instead of ring/shadow for clip-path compat"
```

---

## Phase 9: Shadow Token Utilities

### Task 17: Create pixel-shadow utility classes and dark mode overrides

This task was partially done inline during earlier tasks. Consolidate here.

**Files:**
- Modify: `packages/radiants/pixel-corners.css`
- Modify: `packages/radiants/dark.css`

**Step 1: Add pixel-shadow utilities to pixel-corners.css**

```css
/* ============================================================================
   Pixel Shadow Utilities
   Drop-shadow equivalents for pixel-cornered elements.
   box-shadow gets clipped by clip-path — filter: drop-shadow() does not.
   ============================================================================ */

.pixel-shadow-surface {
  filter: drop-shadow(0 1px 0 var(--color-ink));
}
.pixel-shadow-resting {
  filter: drop-shadow(0 2px 0 var(--color-ink));
}
.pixel-shadow-lifted {
  filter: drop-shadow(0 4px 0 var(--color-ink));
}
.pixel-shadow-raised {
  filter: drop-shadow(2px 2px 0 var(--color-ink));
}
.pixel-shadow-floating {
  filter: drop-shadow(4px 4px 0 var(--color-ink));
}
```

**Step 2: Add dark mode overrides to dark.css**

Add a new section in the `.dark` block:

```css
  /* ============================================
     PIXEL SHADOW — Dark mode glow equivalents
     ============================================ */

  & .pixel-shadow-surface {
    filter: drop-shadow(0 0 4px rgba(252,225,132,0.08));
  }
  & .pixel-shadow-resting {
    filter: drop-shadow(0 0 4px rgba(252,225,132,0.12)) drop-shadow(0 0 8px rgba(252,225,132,0.06));
  }
  & .pixel-shadow-lifted {
    filter: drop-shadow(0 0 8px rgba(252,225,132,0.2)) drop-shadow(0 0 16px rgba(252,225,132,0.08));
  }
  & .pixel-shadow-raised {
    filter: drop-shadow(0 0 8px rgba(252,225,132,0.2)) drop-shadow(0 0 20px rgba(252,225,132,0.08));
  }
  & .pixel-shadow-floating {
    filter: drop-shadow(0 0 10px rgba(252,225,132,0.25)) drop-shadow(0 0 24px rgba(252,225,132,0.1));
  }
```

**Step 3: Force-generate utilities in globals.css**

Add to rad-os `globals.css` `@source inline(...)`:
```
pixel-shadow-{surface,resting,lifted,raised,floating} pixel-border-danger pixel-glow-danger
```

**Step 4: Commit**

```bash
git add packages/radiants/pixel-corners.css packages/radiants/dark.css apps/rad-os/app/globals.css
git commit -m "feat(radiants): pixel-shadow utility classes with dark mode glow overrides"
```

---

## Phase 10: Final Verification

### Task 18: Full build + visual verification

**Step 1: Build all workspaces**

```bash
cd /private/tmp/claude/rdna-pixel-corners && pnpm build
```

**Step 2: Run lint**

```bash
cd /private/tmp/claude/rdna-pixel-corners && pnpm lint
```

**Step 3: Run design system lint**

```bash
cd /private/tmp/claude/rdna-pixel-corners && pnpm lint:design-system
```

**Step 4: Visual checklist (manual)**

- [ ] Primary button: pixel corners, inset bevel, bevel swaps on press
- [ ] Secondary/outline/destructive buttons: pixel corners, no lift, bevel effect
- [ ] Ghost button: NO pixel corners, no border (dark mode: glow on hover)
- [ ] Text button: NO pixel corners
- [ ] Card: pixel corners, no double border, raised variant has drop-shadow
- [ ] ToggleGroup: pixel corners on container, no double border, internal dividers intact
- [ ] Input: pixel corners, no double border, error state shows red border
- [ ] Select: pixel corners, no double border, dropdown has drop-shadow
- [ ] Switch: pixel corners, no hover lift, bevel on thumb
- [ ] Slider: pixel corners, no hover lift, bevel on thumb
- [ ] Tabs (pill): pixel corners, no lift, active state clear
- [ ] Tabs (line): traditional borders (opted out of pixel corners)
- [ ] All overlays (Dialog, DropdownMenu, ContextMenu, Menubar): pixel corners, drop-shadow visible
- [ ] Focus ring: outline visible on tab navigation, not clipped
- [ ] Dark mode: all button glows visible (not clipped), bevel present

**Step 5: Fix any issues found**

**Step 6: Final commit if needed**

---

## Open Items (deferred — not part of this plan)

These are tracked but not implemented in this phase:

1. **Switch thumb shape decision** — pixelated square (retro) vs round (modern). Currently keeping pixelated (`rounded-xs`). Revisit after visual review.
2. **Meter/Progress fill shape** — sharp-edged vs pill. Currently keeping `rounded-xs`. Revisit.
3. **Radio component** — doesn't exist yet. When built, use `rounded-full` (not pixel corners).
4. **Shadow token overhaul** — whether to globally convert `--shadow-*` tokens from `box-shadow` to `filter: drop-shadow()` format. Deferred — the `pixel-shadow-*` utility classes bridge the gap without breaking the token format.
5. **MockStatesPopover** — uses inline styles with `border` and `boxShadow`. Needs pixel-corner treatment separately since it uses JS-object styles not className.
6. **Dithwather mask-image future** — separate brainstorm (2026-03-16). Could replace clip-path for shadow-friendly rendering.
