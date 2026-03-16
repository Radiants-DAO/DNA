# RDNA Polish Pass — Phase 1: Token Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the token layer with DESIGN.md so Phase 2 component refactors build on a stable foundation.

**Architecture:** All changes target the `@rdna/radiants` package CSS (tokens, dark mode, base styles, typography) plus app-level z-index/pointer-events fixes. Token definitions are additive where possible (new shadow names alongside old). The visual review gate at the end catches regressions before Phase 2.

**Tech Stack:** Tailwind CSS v4, `@theme` blocks, CSS custom properties

**Source documents:**
- `packages/radiants/DESIGN.md` — canonical target (1109 lines)
- `docs/brainstorms/2026-02-24-rdna-polish-pass-brainstorm.md` — scope decisions
- `docs/brainstorms/2026-02-24-rdna-design-md-brainstorm.md` — design decisions

---

## Task 1: Kill `--color-warm-cloud` → consolidate to `--color-cream`

**Why:** `warm-cloud` and `cream` are identical (`#FEF8E2`). DESIGN.md Section 2 says warm-cloud is deprecated.

**Files:**
- Modify: `packages/radiants/tokens.css:16` — delete the warm-cloud definition
- Modify: `packages/radiants/tokens.css:36,59` — change `var(--color-warm-cloud)` → `var(--color-cream)`
- Modify: `packages/radiants/dark.css` — all `var(--color-warm-cloud)` → `var(--color-cream)` and update comments
- Modify: `packages/radiants/base.css:91,137,146` — change `var(--color-warm-cloud)` → `var(--color-cream)`
- Modify: `apps/rad-os/components/background/SunBackground.tsx:17` — `var(--color-warm-cloud)` → `var(--color-cream)`
- Modify: `apps/rad-os/components/background/WebGLSun.tsx:32,34` — update comments
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx:88,300` — update token catalog entry and class reference
- Modify: `apps/rad-os/lib/colors.ts:6` — rename `warmCloud` → `cream`, update comment

### Step 1: Update tokens.css

In `packages/radiants/tokens.css`:

**Delete** the `--color-warm-cloud` line (line 16):
```css
/* DELETE THIS LINE */
--color-warm-cloud: #FEF8E2;
```

**Change** line 36:
```css
/* FROM */ --color-page: var(--color-warm-cloud);
/* TO   */ --color-page: var(--color-cream);
```

**Change** line 59:
```css
/* FROM */ --color-flip: var(--color-warm-cloud);
/* TO   */ --color-flip: var(--color-cream);
```

### Step 2: Update dark.css

Replace ALL `var(--color-warm-cloud)` with `var(--color-cream)` in both the `.dark` block and the `@media (prefers-color-scheme: dark)` block. There are approximately 6 var() references and several comments that say "warm-cloud". Update comments to say "cream" instead.

Key lines in `.dark` block:
```css
--color-inv: var(--color-cream);
--color-main: var(--color-cream);
--color-sub: var(--color-cream);  /* Will change again in Task 3 */
--color-accent-inv: var(--color-cream);
```

Same changes in the `@media (prefers-color-scheme: dark)` block (lines ~541-626).

Update comments: "warm-cloud at 60%" → "cream at 60%", "warm-cloud at 20%" → "cream at 20%", etc.

### Step 3: Update base.css

In `packages/radiants/base.css`:
```css
/* Line 91: scrollbar thumb */
/* FROM */ background: var(--color-warm-cloud);
/* TO   */ background: var(--color-cream);

/* Line 137: custom scrollbar utility */
/* FROM */ scrollbar-color: var(--color-warm-cloud) var(--color-sun-yellow);
/* TO   */ scrollbar-color: var(--color-cream) var(--color-sun-yellow);

/* Line 146: dark scrollbar thumb */
/* FROM */ background: var(--color-warm-cloud);
/* TO   */ background: var(--color-cream);
```

### Step 4: Update app files

**`apps/rad-os/components/background/SunBackground.tsx:17`:**
```css
/* FROM */ var(--color-warm-cloud) 0%,
/* TO   */ var(--color-cream) 0%,
```

**`apps/rad-os/components/background/WebGLSun.tsx:32,34`:** Update comments only:
```ts
/* FROM */ /** Light mode: warm-cloud (#FEF8E2) ... */
/* TO   */ /** Light mode: cream (#FEF8E2) ... */

/* FROM */ light: [0.996, 0.973, 0.886],  // warm-cloud
/* TO   */ light: [0.996, 0.973, 0.886],  // cream
```

**`apps/rad-os/components/apps/BrandAssetsApp.tsx:88`:**
```ts
/* FROM */ cssVar: '--color-warm-cloud', tailwind: 'warm-cloud',
/* TO   */ /* DELETE this entire entry — warm-cloud is removed from the token system */
```

**`apps/rad-os/components/apps/BrandAssetsApp.tsx:300`:**
```tsx
/* FROM */ className={logo.logoColor === 'cream' ? 'text-warm-cloud' : ...}
/* TO   */ className={logo.logoColor === 'cream' ? 'text-cream' : ...}
```

**`apps/rad-os/lib/colors.ts:6`:**
```ts
/* FROM */ warmCloud: '#FEF8E2',   // --color-warm-cloud, --bg-primary
/* TO   */ cream: '#FEF8E2',       // --color-cream
```

> **Note:** `apps/radmark/src/styles/tokens.css` also has warm-cloud references. Out of scope for this plan (different app), but flag for later cleanup.

### Step 5: Verify

```bash
cd /Users/rivermassey/Desktop/dev/DNA && grep -r "warm-cloud" packages/radiants/ apps/rad-os/ --include="*.css" --include="*.tsx" --include="*.ts" -l
```

Expected: zero matches in packages/radiants/ and apps/rad-os/ source files (docs are OK).

### Step 6: Commit

```bash
git add packages/radiants/tokens.css packages/radiants/dark.css packages/radiants/base.css \
  apps/rad-os/components/background/SunBackground.tsx \
  apps/rad-os/components/background/WebGLSun.tsx \
  apps/rad-os/components/apps/BrandAssetsApp.tsx \
  apps/rad-os/lib/colors.ts
git commit -m "refactor: consolidate --color-warm-cloud to --color-cream

Removes duplicate token. warm-cloud and cream were identical (#FEF8E2).
DESIGN.md Section 2 deprecates warm-cloud.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Remove dead tokens + fix sub

**Why:** Three tokens are unused (zero consumers). `sub` is identical to `main` in light mode — DESIGN.md Section 2 specifies 85% opacity for visual hierarchy.

**Files:**
- Modify: `packages/radiants/tokens.css:24,26,28` — delete dead tokens
- Modify: `packages/radiants/tokens.css:58` — fix sub
- Modify: `packages/radiants/dark.css` — fix sub in both dark blocks

### Step 1: Delete dead tokens from tokens.css

Remove these three lines from the `/* System Colors */` section:
```css
/* DELETE */ --color-success-green-dark: #87BB82;
/* DELETE */ --color-warning-yellow-dark: #BE9D2B;
/* DELETE */ --color-error-red-dark: #9E433E;
```

### Step 2: Fix sub in tokens.css

```css
/* FROM */ --color-sub: var(--color-black);  /* Use with opacity modifier: text-sub/70 */
/* TO   */ --color-sub: rgba(15, 14, 12, 0.85);
```

Note: We use `rgba()` directly rather than `var(--color-black)` with opacity because CSS custom properties can't have opacity applied via Tailwind's `/85` syntax when the value is `var()`. The hardcoded rgba ensures the 85% opacity is baked in. The Tailwind class `text-sub` will produce the correct result.

### Step 3: Fix sub in dark.css

In the `.dark` block:
```css
/* FROM */ --color-sub: var(--color-cream);
/* TO   */ --color-sub: rgba(254, 248, 226, 0.85);
```

In the `@media (prefers-color-scheme: dark)` block:
```css
/* FROM */ --color-sub: var(--color-cream);
/* TO   */ --color-sub: rgba(254, 248, 226, 0.85);
```

### Step 4: Commit

```bash
git add packages/radiants/tokens.css packages/radiants/dark.css
git commit -m "fix: remove dead tokens and fix sub opacity

Removes success-green-dark, warning-yellow-dark, error-red-dark (zero consumers).
Sets sub to 85% opacity in both modes for visual hierarchy:
- Sun Mode: rgba(15,14,12, 0.85) — was identical to main
- Moon Mode: rgba(254,248,226, 0.85) — was identical to main

DESIGN.md Section 2: three-tier content hierarchy (100% → 85% → 60%).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: New rem-based type scale + root clamp

**Why:** Current scale has `sm` and `base` both at 14px, and the scale doesn't follow a uniform 0.25rem grid. DESIGN.md Section 3 defines the target.

**Files:**
- Modify: `packages/radiants/tokens.css:154-161` — new scale values
- Modify: `packages/radiants/base.css:36` — root font-size clamp
- Modify: `packages/radiants/typography.css:76,93,97,117` — text-sm → text-xs

### Step 1: Update type scale in tokens.css

Replace the entire typography scale section:
```css
/* FROM */
--font-size-2xs: 0.5rem;     /* 8px - tiny labels */
--font-size-xs: 0.75rem;     /* 12px - buttons, small UI */
--font-size-sm: 0.875rem;    /* 14px - body text */
--font-size-base: 0.875rem;  /* 14px - body text */
--font-size-lg: 1rem;        /* 16px - large body */
--font-size-xl: 1.25rem;     /* 20px - headings */
--font-size-2xl: 1.5rem;     /* 24px - headings */
--font-size-3xl: 2rem;       /* 32px - display */

/* TO */
--font-size-2xs: 0.5rem;     /* 8px - tiny labels */
--font-size-xs: 0.75rem;     /* 12px - buttons, small UI */
--font-size-base: 1rem;      /* 16px - body text (at max root) */
--font-size-lg: 1.25rem;     /* 20px - large body */
--font-size-xl: 1.5rem;      /* 24px - headings */
--font-size-2xl: 1.75rem;    /* 28px - headings */
--font-size-3xl: 2rem;       /* 32px - display */
```

Key changes: `sm` removed, `base` from 0.875→1rem, `lg` from 1→1.25rem, `xl` from 1.25→1.5rem, `2xl` from 1.5→1.75rem, `3xl` unchanged.

> **Blast radius note:** Removing `--font-size-sm` from @theme means Tailwind's `text-sm` falls back to its built-in (0.875rem). Components using `text-sm` won't break — they'll use Tailwind's default. Phase 2 will migrate component `text-sm` usages to `text-xs` or `text-base`.

### Step 2: Update root clamp in base.css

In `packages/radiants/base.css`, change the body font-size (line 36):
```css
/* FROM */ font-size: clamp(1rem, 1vw, 1.125rem);
/* TO   */ font-size: clamp(14px, 1vw + 12px, 16px);
```

Also add the `html` root clamp (above the `body` rule, or on `html` itself). Check if there's already an `html` rule. The root clamp goes on `html`:

```css
html {
  font-size: clamp(14px, 1vw + 12px, 16px);
}
```

Then remove `font-size` from the `body` rule (body inherits from html). If the existing code has `font-size` on `body`, move it to `html`.

### Step 3: Update typography.css

Replace `text-sm` with `text-xs` in base element styles (these are small/code/citation elements that should use the smaller size):

```css
/* Line 76: small */
/* FROM */ @apply text-sm font-heading font-normal leading-normal text-main;
/* TO   */ @apply text-xs font-heading font-normal leading-normal text-main;

/* Line 93: code */
/* FROM */ @apply text-sm font-mono font-normal leading-normal text-main bg-inv/10 px-1 py-0.5 rounded-sm;
/* TO   */ @apply text-xs font-mono font-normal leading-normal text-main bg-inv/10 px-1 py-0.5 rounded-sm;

/* Line 97: pre */
/* FROM */ @apply text-sm font-mono font-normal leading-relaxed text-main bg-inv/10 p-4 rounded-sm overflow-x-auto;
/* TO   */ @apply text-xs font-mono font-normal leading-relaxed text-main bg-inv/10 p-4 rounded-sm overflow-x-auto;

/* Line 117: cite */
/* FROM */ @apply text-sm font-heading font-normal leading-normal text-main italic;
/* TO   */ @apply text-xs font-heading font-normal leading-normal text-main italic;
```

### Step 4: Commit

```bash
git add packages/radiants/tokens.css packages/radiants/base.css packages/radiants/typography.css
git commit -m "feat: new rem-based type scale on 0.25rem grid with root clamp

Type scale: 2xs(0.5) xs(0.75) base(1) lg(1.25) xl(1.5) 2xl(1.75) 3xl(2rem).
Removes --font-size-sm (was identical to base at 14px).
Root clamp: clamp(14px, 1vw + 12px, 16px) — whole scale flexes.
Typography base elements: text-sm → text-xs for small/code/cite.

DESIGN.md Section 3.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Fix `--duration-scalar` for reduced-motion

**Why:** The scalar is defined but not connected to durations. DESIGN.md Section 5 says all durations multiply by the scalar.

**Files:**
- Modify: `packages/radiants/tokens.css:230-244` — clean up scalar placement

### Step 1: Move scalar into @theme and clean up

The current implementation already works (reduced-motion media query hard-overrides all durations to 0ms). The fix is to move `--duration-scalar` into the `@theme` block so it's a proper token, and add a comment clarifying the relationship.

In `packages/radiants/tokens.css`, add `--duration-scalar` inside the `@theme` block, in the Motion section:

```css
/* Add after --easing-in line (after line 193) */
--duration-scalar: 1;   /* Multiplier: 1 = normal, 0 = instant (reduced-motion) */
```

Then update the `:root` block outside @theme — **remove** the `--duration-scalar: 1` line since it's now in @theme:

```css
/* DELETE the :root block at lines 230-232 if it only contains --duration-scalar */
/* The @media reduced-motion block stays — it overrides the @theme value */
```

The `@media (prefers-reduced-motion: reduce)` block stays as-is. It correctly overrides all durations to 0ms and sets scalar to 0.

### Step 2: Commit

```bash
git add packages/radiants/tokens.css
git commit -m "fix: move --duration-scalar into @theme token block

Scalar now part of the token system. Reduced-motion media query
correctly overrides all durations to 0ms when scalar is 0.

DESIGN.md Section 5.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Define z-index tokens

**Why:** Without a defined scale, every agent invents values (z-5, z-999, z-9999). DESIGN.md Section 15 defines 8 bands.

**Files:**
- Modify: `packages/radiants/tokens.css` — add z-index tokens in @theme
- Modify: `apps/rad-os/app/globals.css` — add z-index utilities to @source

### Step 1: Add z-index tokens to @theme

Add a new section in `packages/radiants/tokens.css` inside the `@theme` block (after the touch target section, before the closing `}`):

```css
/* ============================================
   Z-INDEX SCALE
   Global stacking order for RadOS layers.
   Windows use dynamic values within their band.
   In-app panels use z-10/z-20/z-30 relative to
   the window's own stacking context.
   ============================================ */

--z-index-base: 0;           /* Background (WebGL, canvas art) */
--z-index-desktop: 10;       /* Desktop icons */
--z-index-windows: 100;      /* AppWindow container — individual windows order within */
--z-index-chrome: 200;       /* Taskbar */
--z-index-menus: 300;        /* Start Menu, dropdown menus */
--z-index-toasts: 400;       /* Toast notifications */
--z-index-modals: 500;       /* MobileAppModal, Dialog portals */
--z-index-system: 900;       /* Invert overlay, system effects */
```

This generates Tailwind utilities: `z-base`, `z-desktop`, `z-windows`, `z-chrome`, `z-menus`, `z-toasts`, `z-modals`, `z-system`.

### Step 2: Update @source in globals.css

Add z-index utilities to the `@source inline(...)` directive in `apps/rad-os/app/globals.css`:

Add to the existing @source string: `z-{base,desktop,windows,chrome,menus,toasts,modals,system}`

### Step 3: Verify token generation

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && npx tailwindcss --help 2>/dev/null; echo "Check that z-base, z-chrome etc. resolve"
```

If Tailwind v4 doesn't support `--z-index-*` namespace for generating `z-{name}` utilities, fall back to using the tokens as `z-[var(--z-index-chrome)]` and document the pattern. The CSS custom properties still serve as the canonical scale.

### Step 4: Commit

```bash
git add packages/radiants/tokens.css apps/rad-os/app/globals.css
git commit -m "feat: define z-index token scale in @theme

8 bands: base(0) desktop(10) windows(100) chrome(200)
menus(300) toasts(400) modals(500) system(900).
DESIGN.md Section 15.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Define shadow elevation tokens (alongside old names)

**Why:** Current shadows use role-based names (btn, card, card-lg) instead of elevation-based names. DESIGN.md Section 4 defines a 6-level elevation scale. Old names are kept for Phase 2 migration.

**Files:**
- Modify: `packages/radiants/tokens.css` — add elevation tokens in @theme
- Modify: `packages/radiants/dark.css` — add dark mode overrides for elevation tokens
- Modify: `apps/rad-os/app/globals.css` — add elevation utilities to @source

### Step 1: Add elevation tokens to @theme in tokens.css

Add a new section AFTER the existing shadow section (keep old names intact):

```css
/* ============================================
   SHADOW ELEVATION SCALE
   6-level elevation system per DESIGN.md Section 4.
   Sun Mode: sharp pixel-art offsets (directional).
   Moon Mode: soft ambient glows (overridden in dark.css).

   Old names (shadow-btn, shadow-card, etc.) kept for
   Phase 2 migration. Remove in Phase 3.
   ============================================ */

--shadow-inset: inset 0 0 0 1px var(--color-black);
--shadow-surface: 0 1px 0 0 var(--color-black);
--shadow-resting: 0 2px 0 0 var(--color-black);
--shadow-raised: 2px 2px 0 0 var(--color-black);
--shadow-floating: 4px 4px 0 0 var(--color-black);
--shadow-focused: 4px 4px 0 0 var(--color-black);
```

### Step 2: Add dark mode overrides in dark.css

In the `.dark` block, add after the existing shadow overrides:

```css
/* ============================================
   SHADOW ELEVATION — Moon Mode
   Ambient glows instead of directional shadows
   ============================================ */

--shadow-inset: inset 0 0 8px var(--glow-sun-yellow-subtle);
--shadow-surface: 0 0 2px var(--glow-sun-yellow-subtle);
--shadow-resting: 0 0 6px var(--glow-sun-yellow-subtle);
--shadow-raised: 0 0 10px var(--glow-sun-yellow), 0 0 20px var(--glow-sun-yellow-subtle);
--shadow-floating: 0 0 12px var(--glow-sun-yellow), 0 0 24px var(--glow-sun-yellow-subtle);
--shadow-focused: 0 0 12px var(--glow-sun-yellow), 0 0 24px var(--glow-sun-yellow), 0 0 36px var(--glow-sun-yellow-subtle);
```

Also add the SAME overrides in the `@media (prefers-color-scheme: dark)` `:root:not(.light)` block.

Then add the `--tw-shadow` force-overrides for the new elevation classes (same pattern as existing shadow-btn/shadow-card overrides):

```css
/* In .dark block, after existing shadow utility overrides */
& .shadow-inset {
  --tw-shadow: inset 0 0 8px var(--glow-sun-yellow-subtle);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

& .shadow-surface {
  --tw-shadow: 0 0 2px var(--glow-sun-yellow-subtle);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

& .shadow-resting {
  --tw-shadow: 0 0 6px var(--glow-sun-yellow-subtle);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

& .shadow-raised {
  --tw-shadow: 0 0 10px var(--glow-sun-yellow), 0 0 20px var(--glow-sun-yellow-subtle);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

& .shadow-floating {
  --tw-shadow: 0 0 12px var(--glow-sun-yellow), 0 0 24px var(--glow-sun-yellow-subtle);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

& .shadow-focused {
  --tw-shadow: 0 0 12px var(--glow-sun-yellow), 0 0 24px var(--glow-sun-yellow), 0 0 36px var(--glow-sun-yellow-subtle);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
```

### Step 3: Update @source in globals.css

Add elevation shadow utilities to the `@source inline(...)` directive:

Add: `shadow-{inset,surface,resting,raised,floating,focused} hover:shadow-{resting,raised,floating}`

### Step 4: Commit

```bash
git add packages/radiants/tokens.css packages/radiants/dark.css apps/rad-os/app/globals.css
git commit -m "feat: add shadow elevation tokens (inset→surface→resting→raised→floating→focused)

New 6-level elevation scale per DESIGN.md Section 4.
Sun Mode: sharp pixel-art offsets. Moon Mode: ambient glows.
Old shadow names (btn, card, card-lg, inner) preserved for Phase 2 migration.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: App-level z-index fixes + pointer-events audit

**Why:** Ad-hoc z-index values (z-[9999], z-[150], z-[100]) throughout app components. DESIGN.md Section 15 defines the scale, Section 16 defines the pointer-events rule.

**Files:**
- Modify: `apps/rad-os/components/Rad_os/Desktop.tsx` — widget z-index, pointer-events check
- Modify: `apps/rad-os/components/Rad_os/Taskbar.tsx` — z-[150] → z-[200]
- Modify: `apps/rad-os/components/Rad_os/StartMenu.tsx` — z-[100] → z-[300], style zIndex 9999 → remove
- Modify: `apps/rad-os/components/Rad_os/MobileAppModal.tsx` — z-[200] → z-[500], fix inline style
- Modify: `apps/rad-os/components/Rad_os/InvertOverlay.tsx` — z-[9999] → z-[900]
- Modify: `packages/radiants/components/core/Toast/Toast.tsx:122` — z-[100] → z-[400]

### Step 1: Fix Desktop.tsx

**Widget panel** (line 279):
```tsx
/* FROM */ <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
/* TO   */ <div className="fixed top-4 right-4 z-[900] pointer-events-auto">
```

**Pointer-events check:** The windows container already has `pointer-events-none` with AppWindows getting `pointer-events-auto` via their own styles. The watermark div already has `pointer-events-none`. No changes needed for pointer-events in Desktop.tsx.

### Step 2: Fix Taskbar.tsx

**Taskbar** (line 130):
```tsx
/* FROM */ fixed bottom-0 left-0 right-0 z-[150]
/* TO   */ fixed bottom-0 left-0 right-0 z-[200]
```

### Step 3: Fix StartMenu.tsx

**Mobile overlay** (line 128):
```tsx
/* FROM */ <div className="fixed inset-0 z-[100] bg-page ...">
/* TO   */ <div className="fixed inset-0 z-[300] bg-page ...">
```

**Desktop popup** (line ~229):
Remove the inline `style={{ zIndex: 9999 }}` and add `z-[300]` to the className. The StartMenu is positioned absolutely within the Taskbar's stacking context (z-200), so z-300 relative to that context is sufficient. But the mobile StartMenu uses `fixed` so it's in the global context and needs z-[300] globally.

For the desktop popup specifically: since it's `absolute` within the taskbar's `fixed` stacking context, a `z-10` would suffice (just above sibling content). However, for consistency with the semantic naming convention, use a descriptive value. Change:

```tsx
/* FROM */
style={{ zIndex: 9999 }}

/* TO — remove the style prop entirely and add z-10 to className */
/* The menu is absolutely positioned within the taskbar's stacking context */
/* z-10 puts it above sibling content within that context */
```

Add `z-10` to the className string for the desktop popup.

### Step 4: Fix MobileAppModal.tsx

**Container** (line 35):
```tsx
/* FROM */
<div
  className="fixed inset-0 z-[200] bg-page flex flex-col"
  style={{ zIndex: windowState.zIndex + 100 }}
>

/* TO */
<div
  className="fixed inset-0 bg-page flex flex-col"
  style={{ zIndex: 500 + (windowState.zIndex || 0) }}
>
```

The `z-[200]` class is removed (redundant with inline style). The inline style now places modals in the 500+ band with relative ordering preserved.

### Step 5: Fix InvertOverlay.tsx

**Overlay** (line 17):
```tsx
/* FROM */ fixed inset-0 z-[9999]
/* TO   */ fixed inset-0 z-[900]
```

### Step 6: Fix Toast.tsx (radiants package)

**Toast viewport** (`packages/radiants/components/core/Toast/Toast.tsx:122`):
```tsx
/* FROM */ className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[24rem] pointer-events-none"
/* TO   */ className="fixed top-4 right-4 z-[400] flex flex-col gap-2 w-[24rem] pointer-events-none"
```

> **Note:** ContextMenu (z-[1000]) and Tooltip (z-[1000]) in radiants will be fixed in Phase 2 when those components are individually refactored.

### Step 7: Commit

```bash
git add apps/rad-os/components/Rad_os/Desktop.tsx \
  apps/rad-os/components/Rad_os/Taskbar.tsx \
  apps/rad-os/components/Rad_os/StartMenu.tsx \
  apps/rad-os/components/Rad_os/MobileAppModal.tsx \
  apps/rad-os/components/Rad_os/InvertOverlay.tsx \
  packages/radiants/components/core/Toast/Toast.tsx
git commit -m "fix: align z-indexes to DESIGN.md scale, pointer-events audit

Taskbar: z-150 → z-200 (chrome band)
StartMenu: z-9999/z-100 → z-300/z-10 (menus band)
MobileAppModal: z-200 → z-500+ (modals band)
Toast: z-100 → z-400 (toasts band)
InvertOverlay: z-9999 → z-900 (system band)
Widget: z-9999 → z-900 (system band)

DESIGN.md Sections 15-16.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Build verification

**Why:** Verify all changes compile cleanly before visual review.

### Step 1: TypeScript check

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && npx tsc --noEmit
```

Expected: zero errors. If there are errors from the `colors.ts` rename (`warmCloud` → `cream`), search for consumers and update them.

### Step 2: Build

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && npm run build
```

Expected: successful build. If Tailwind warns about missing utilities (from removed tokens or new z-index names), check @source directive.

### Step 3: Lint

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && npm run lint
```

Expected: no new lint errors from our changes.

### Step 4: Fix any issues

If build/lint fails, fix the issues and commit fixes.

---

## Task 9: Visual review gate

**Why:** Token changes ripple through every component. Must visually verify before Phase 2.

### Step 1: Start dev server

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && npm run dev
```

### Step 2: Visual checklist

Open `localhost:3000` and verify each screen:

**Sun Mode (Light):**
- [ ] Desktop loads with WebGL sun background, no visual glitches
- [ ] Desktop icons visible and clickable (z-index correct)
- [ ] Taskbar visible at bottom, Start button works
- [ ] StartMenu opens above taskbar, all items clickable
- [ ] Open 2-3 windows — verify they stack correctly (click to focus)
- [ ] Window text uses correct font sizes (headings larger than body)
- [ ] `text-sub` is visibly lighter than `text-main` (85% vs 100%)
- [ ] Scrollbar thumb shows cream color (not broken by warm-cloud removal)
- [ ] Toast notifications appear above everything (z-400)
- [ ] Close Start Menu, verify windows still receive clicks

**Moon Mode (Dark):**
- [ ] Toggle dark mode via taskbar RadMark button
- [ ] Surface colors invert correctly (black backgrounds)
- [ ] Content text is cream-colored, secondary text slightly dimmer (85%)
- [ ] Shadows switch to ambient glows (if any components already use elevation tokens)
- [ ] Glow effects on hover/focus work correctly
- [ ] Scrollbar adapts to dark mode
- [ ] Z-index stacking still correct in dark mode

**Mobile (resize to <768px or use devtools):**
- [ ] MobileAppModal opens full-screen (z-500+)
- [ ] Mobile start menu opens full-screen (z-300)
- [ ] Mobile icons grid layout works
- [ ] Close button on modals works

### Step 3: Fix any regressions

If visual issues found, fix them and commit. Common issues:
- Font sizes look wrong → check root clamp value and rem calculations
- Colors broken → check @theme var() chains (chaining rule from MEMORY.md)
- Scrollbar broken → check warm-cloud → cream replacement in base.css
- Z-index wrong → check stacking contexts created by `fixed` + `z-*`

### Step 4: Final commit if needed

If regressions were fixed, commit with descriptive message.

---

## Summary of Changes

| Area | Before | After | DESIGN.md Section |
|------|--------|-------|-------------------|
| `warm-cloud` | Duplicate of `cream` | Removed | Section 2 |
| Dead tokens (3) | Defined, unused | Removed | Section 2 |
| `sub` | = `main` | 85% opacity | Section 2 |
| Type scale | sm=base=14px, no grid | 0.25rem grid, no sm | Section 3 |
| Root clamp | `clamp(1rem, 1vw, 1.125rem)` | `clamp(14px, 1vw+12px, 16px)` | Section 3 |
| `duration-scalar` | In :root, disconnected | In @theme, documented | Section 5 |
| Z-index | Ad-hoc (z-5 to z-9999) | 8-band scale | Section 15 |
| Shadow elevation | Role names (btn, card) | 6-level elevation scale (alongside old) | Section 4 |
| Pointer-events | Inconsistent | Audited, viewport overlays have `none` | Section 16 |

**Phase 2 prerequisite:** All token definitions stable. Components can now be refactored one-at-a-time against the final token layer.
