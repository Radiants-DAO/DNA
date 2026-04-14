# Pixel Mask Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace SVG-based pattern rendering with build-time CSS mask tokens, add a static 1-bit pixel icon primitive, and add a canvas-only animated transition primitive while keeping the existing 24px SVG icon pipeline intact.

**Architecture:** `PixelGrid` remains the single data primitive. Static 1-bit assets render as CSS masks on a single host element or pseudo-element; animated morphs render on a single canvas. Pattern CSS tokens are generated from bitstrings at build time with `bitsToPath` + `bitsToMaskURI`, and non-mask consumers are migrated so `--pat-*` can become true mask tokens.

**Tech Stack:** TypeScript, React, Vitest, Testing Library, CSS custom properties, CSS mask-image, requestAnimationFrame.

---

### Task 1: Pixel Engine Mask Helpers

**Files:**
- Create: `packages/pixel/src/mask.ts`
- Create: `packages/pixel/src/__tests__/mask.test.ts`
- Modify: `packages/pixel/src/index.ts`
- Modify: `packages/pixel/package.json`

**Step 1: Write the failing tests**

Add tests for:
- building a mask asset from a `PixelGrid`
- exposing token-ready metadata like `maskImage`, `maskWidth`, `maskHeight`
- emitting host style fragments for static icon masks vs tiled masks

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/pixel test packages/pixel/src/__tests__/mask.test.ts`

**Step 3: Write minimal implementation**

Add small helpers around the existing path/mask functions so radiants can consume a stable API instead of re-deriving mask metadata everywhere.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rdna/pixel test`

**Step 5: Commit**

Ownership ends at `packages/pixel/**`.

### Task 2: Pattern Registry + Build-Time CSS Tokens

**Files:**
- Modify: `packages/radiants/patterns/types.ts`
- Modify: `packages/radiants/patterns/registry.ts`
- Create: `packages/radiants/scripts/generate-pattern-css.ts`
- Create: `packages/radiants/test/generate-pattern-css.test.ts`
- Modify: `packages/radiants/patterns.css`

**Step 1: Write the failing tests**

Add tests for:
- registry entries storing bitstrings as the source of truth
- CSS generation producing `--pat-*` variables from `bitsToMaskURI`
- generated CSS preserving `.rdna-pat` utilities and scale support

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants test packages/radiants/test/generate-pattern-css.test.ts`

**Step 3: Write minimal implementation**

Replace pattern hex storage with bitstrings, generate `patterns.css` from the registry, and keep existing public token names and utility classes stable.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rdna/radiants test packages/radiants/test/generate-pattern-css.test.ts`

**Step 5: Commit**

Ownership is limited to registry/script/CSS files listed above.

### Task 3: Pattern Component Migration

**Files:**
- Modify: `packages/radiants/components/core/Pattern/Pattern.tsx`
- Modify: `packages/radiants/components/core/Pattern/Pattern.test.tsx`
- Modify: `packages/radiants/components/core/Pattern/Pattern.meta.ts`

**Step 1: Write the failing tests**

Update tests to assert:
- no inline SVG is rendered
- the host gets the mask-backed pattern class/variables
- children render without a wrapper node
- `tiled={false}` switches repeat mode without creating extra nodes

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants test packages/radiants/components/core/Pattern/Pattern.test.tsx`

**Step 3: Write minimal implementation**

Render a single host node that drives a `::before` pseudo-element via CSS variables. Keep `pat`, `color`, `bg`, `scale`, and `tiled` props.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rdna/radiants test packages/radiants/components/core/Pattern/Pattern.test.tsx`

**Step 5: Commit**

Ownership is limited to `Pattern` component files.

### Task 4: PixelIcon Primitive

**Files:**
- Create: `packages/radiants/pixel-icons/types.ts`
- Create: `packages/radiants/pixel-icons/registry.ts`
- Create: `packages/radiants/pixel-icons/index.ts`
- Create: `packages/radiants/components/core/PixelIcon/PixelIcon.tsx`
- Create: `packages/radiants/components/core/PixelIcon/PixelIcon.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`

**Step 1: Write the failing tests**

Add tests for:
- rendering a single-host CSS mask icon from a supplied `PixelGrid`
- resolving by name from a small registry seed set
- inheriting color via `currentColor`
- honoring explicit size/scale props

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants test packages/radiants/components/core/PixelIcon/PixelIcon.test.tsx`

**Step 3: Write minimal implementation**

Add a registry-backed static mask renderer for 1-bit icons. Do not modify the existing SVG `Icon` runtime; this is a parallel primitive for migrated pixel icons.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rdna/radiants test packages/radiants/components/core/PixelIcon/PixelIcon.test.tsx`

**Step 5: Commit**

Ownership is limited to `pixel-icons/**`, `components/core/PixelIcon/**`, and the core export barrel.

### Task 5: PixelTransition Primitive

**Files:**
- Create: `packages/radiants/components/core/PixelTransition/PixelTransition.tsx`
- Create: `packages/radiants/components/core/PixelTransition/PixelTransition.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`

**Step 1: Write the failing tests**

Add tests for:
- sizing the canvas from `PixelGrid` dimensions and `pixelSize`
- starting animation on mount when `autoPlay` is true
- using the transition engine to paint intermediate and final frames
- cancelling RAF on unmount

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants test packages/radiants/components/core/PixelTransition/PixelTransition.test.tsx`

**Step 3: Write minimal implementation**

Use `computeFlipOrder`, `animateTransition`, and `paintGrid` from `@rdna/pixel`. This component owns animation only.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @rdna/radiants test packages/radiants/components/core/PixelTransition/PixelTransition.test.tsx`

**Step 5: Commit**

Ownership is limited to `PixelTransition` component files and the shared export barrel.

### Task 6: Compatibility Cleanup

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`
- Modify: `apps/rad-os/components/apps/GoodNewsApp.tsx`
- Modify: `apps/rad-os/components/apps/ScratchpadApp.tsx`

**Step 1: Write the failing tests or targeted assertions where coverage exists**

Where no existing tests exist, verify by targeted grep and manual inspection after code changes.

**Step 2: Migrate `backgroundImage: var(--pat-*)` usages**

Convert remaining direct background-image consumers to mask-image-based decorative elements so `--pat-*` can remain mask-only tokens.

**Step 3: Verify targeted surfaces**

Run the smallest relevant tests and then app-level smoke verification.

### Task 7: Final Verification

**Run:**
- `pnpm --filter @rdna/pixel test`
- `pnpm --filter @rdna/radiants test`

If app-level compatibility changes are touched, also run the narrowest available checks against impacted files or note if no automated coverage exists.
