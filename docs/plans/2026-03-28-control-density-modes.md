# Control Density Modes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** First land a frontend-first donor import pass for comment/annotation surfaces and compound designer controls, then add a `"control"` density mode to existing RDNA components so they can replace DialKit, and finally harden the imported shells into functional RDNA controls plus `useControlPanel` / `ControlPanel`.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` → branch `feat/control-density` (create at execution time)

**Architecture:** No new library. Instead:

1. Phase 0 ports the strongest presentational donor UIs into RDNA from `/Users/rivermassey/Desktop/dev/DNA/tools/playground` (annotation/comment shells) and `/Users/rivermassey/Desktop/dev/sandbox/flow` (compound designer controls). Do not import `flow-0` shells unless needed as a visual reference.

2. Existing RDNA primitives remain the basis for DialKit parity: `Slider`, `Switch`, `Select`, `Input`, `NumberField`, `Collapsible`, `Button`, and `ToggleGroup`. Use control-density CSS rather than creating new primitive variants.

3. Imported donor UIs land frontend-first: visual parity, local demo state, and reusable component APIs first. No host overlays, selection engine, comment persistence, or extension plumbing in Phase 0.

4. Keep from Interface Kit only the product model: `Style` / `Typography` / `Layout` grouping, the element-targeted workflow, and future prompt-export / Tailwind modes. Do not port Interface Kit runtime chrome or injected styles.

5. Extend the existing `data-density` CSS attribute system with a `"control"` tier (between compact and comfortable) that gives components the dense, labeled, mono-value look of a parameter GUI.

6. `useControlPanel` + `ControlPanel` are a thin config-to-component orchestration layer in `packages/radiants/components/core/ControlPanel/`.

**Tech Stack:** React 19, TypeScript, Tailwind v4, `@base-ui/react`, `culori` (already a dep), Vitest, `class-variance-authority`

***

## Master Checklist

### Phase 0: Frontend-First Donor Import

* [ ] Task 0A — Import annotation/comment shells from playground into RDNA
* [ ] Task 0B — Import ColorPicker + ShadowEditor shells from sandbox/flow
* [ ] Task 0C — Import BoxSpacing + BorderRadius shells from sandbox/flow
* [ ] Task 0D — Register donor-backed demos in playground and lock replacement targets

### Phase 1: Density Infrastructure

* [ ] Task 1 — Create feature branch
* [ ] Task 2 — Add `"control"` density tier to CSS tokens + base.css
* [ ] Task 3 — Density contract test

### Phase 2: Control Density for Existing Components (one per task)

* [ ] Task 4 — Slider: control density styles
* [ ] Task 5 — Switch: control density styles
* [ ] Task 6 — Select: control density styles
* [ ] Task 7 — Input: control density styles
* [ ] Task 8 — NumberField: control density styles
* [ ] Task 9 — Collapsible: control density (becomes "Folder")
* [ ] Task 10 — Button: control density styles
* [ ] Task 11 — ToggleGroup: control density styles (becomes "SegmentedControl" mode)

### Phase 3: New Compound Controls

* [ ] Task 12 — Harden imported ColorPicker shell into OKLCH picker
* [ ] Task 13 — Harden imported BoxSpacing shell into 4-side spacing editor
* [ ] Task 14 — Harden imported BorderRadiusEditor shell into 4-corner radius editor
* [ ] Task 15 — Harden imported ShadowEditor shell into multi-property shadow editor

### Phase 4: ControlPanel Orchestration

* [ ] Task 16 — `useControlPanel` hook (declarative config → typed reactive values)
* [ ] Task 17 — `ControlPanel` component (config → rendered controls)
* [ ] Task 18 — Replace DialPanel/DialKit usage in PatternPlayground

### Phase 5: Cleanup

* [ ] Task 19 — Remove `dialkit` dependency and `DialPanel` wrapper
* [ ] Task 20 — Update DESIGN.md with control density documentation

***

## Phase 0 Donor Matrix

Use these donor files directly as the Phase 0 source of truth:

* Annotation / comment shells from `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/ComposerShell.tsx`, `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationComposer.tsx`, `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationDetail.tsx`, `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationPin.tsx`, `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationBadge.tsx`, and `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/lib/clampPopoverPosition.ts`. These replace the older flow-0 comment chrome in `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/CommentPopover.tsx`, `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/CommentBadge.tsx`, and `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/CommentMode.tsx`.

* Compound designer controls from `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/ColorPicker.tsx`, `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/ShadowEditor.tsx`, `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/boxShadowParser.ts`, `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/sections/SpacingSection.tsx`, and `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/sections/BordersSection.tsx`. These replace the simplified style-surface implied by `/Users/rivermassey/Desktop/dev/DNA/node_modules/.pnpm/interface-kit@0.1.3_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/interface-kit/README.md` and supersede the older flow-0 copies in `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/designer/ColorPicker.tsx` and `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/designer/ShadowEditor.tsx`.

* Keep `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/scrubLabel.ts` and `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/unitInput.ts` as later behavior references for Phase 3. Do not import them in Phase 0 unless a shell cannot render without them.

* Keep from Interface Kit only the information architecture and workflow concepts documented in `/Users/rivermassey/Desktop/dev/DNA/node_modules/.pnpm/interface-kit@0.1.3_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/interface-kit/README.md`: `Style`, `Typography`, `Layout`, element-targeted editing, prompt export, and Tailwind mode. Do not copy runtime UI from the package.

Do not import these legacy shells into RDNA:

* `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/FloatingModeBar.tsx`
* `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/ModeToolbar.tsx`
* `/Users/rivermassey/Desktop/dev/archive/flow-0/app/components/search/SearchOverlay.tsx`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/overlays/overlayRoot.ts`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/overlays/persistentSelections.ts`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/overlays/spacingHandles.ts`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/layoutTool.ts`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/effectsTool.ts`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/inspectPanel.ts`

***

### Task 0A: Import Annotation / Comment Shells from Playground

**Files:**

* Create: `packages/radiants/components/core/AnnotationSurface/ComposerShell.tsx`
* Create: `packages/radiants/components/core/AnnotationSurface/AnnotationComposer.tsx`
* Create: `packages/radiants/components/core/AnnotationSurface/AnnotationDetail.tsx`
* Create: `packages/radiants/components/core/AnnotationSurface/AnnotationPin.tsx`
* Create: `packages/radiants/components/core/AnnotationSurface/AnnotationBadge.tsx`
* Create: `packages/radiants/components/core/AnnotationSurface/clampPopoverPosition.ts`
* Create: `packages/radiants/components/core/AnnotationSurface/index.ts`
* Create: `packages/radiants/components/core/AnnotationSurface/AnnotationSurface.test.tsx`
* Modify: `packages/radiants/components/core/index.ts`

**Source donors:**

* `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/ComposerShell.tsx`
* `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationComposer.tsx`
* `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationDetail.tsx`
* `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationPin.tsx`
* `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/components/AnnotationBadge.tsx`
* `/Users/rivermassey/Desktop/dev/DNA/tools/playground/app/playground/lib/clampPopoverPosition.ts`

**Step 1: Port the shell markup and styling**

Copy the visual structure into `packages/radiants/components/core/AnnotationSurface/` and replace playground-only hooks, local app types, and registry-only demo state with plain component props.

**Step 2: Normalize the RDNA-facing API**

Expose reusable props for `open`, `anchorRect` or `position`, `intent`, `priority`, `message`, `resolution`, submit/cancel handlers, and footer actions. Keep these presentational only in Phase 0.

**Step 3: Replace ad hoc HTML where practical**

Use existing RDNA `Button`, `Input`, `TextArea`, `Badge`, `Popover`, `PreviewCard`, and icon components where that does not distort the imported visuals.

**Step 4: Add smoke coverage**

Render the new annotation surface components in `packages/radiants/components/core/AnnotationSurface/AnnotationSurface.test.tsx` and verify they mount without playground-only dependencies.

**Step 5: Export and commit**

```bash
git add packages/radiants/components/core/AnnotationSurface/ packages/radiants/components/core/index.ts
git commit -m "feat(radiants): import frontend-first annotation surface shells"
```

***

### Task 0B: Import ColorPicker + ShadowEditor Shells from Sandbox/Flow

**Files:**

* Create: `packages/radiants/components/core/ColorPicker/ColorPicker.tsx`
* Create: `packages/radiants/components/core/ColorPicker/ColorPicker.meta.ts`
* Create: `packages/radiants/components/core/ColorPicker/colorpicker-control.css`
* Create: `packages/radiants/components/core/ShadowEditor/ShadowEditor.tsx`
* Create: `packages/radiants/components/core/ShadowEditor/ShadowEditor.meta.ts`
* Create: `packages/radiants/components/core/ShadowEditor/shadoweditor-control.css`
* Create: `packages/radiants/components/core/ShadowEditor/boxShadowParser.ts`
* Create: `packages/radiants/components/core/__tests__/designer-control-shells.test.tsx`
* Modify: `packages/radiants/components/core/index.ts`

**Source donors:**

* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/ColorPicker.tsx`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/ShadowEditor.tsx`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/boxShadowParser.ts`

**Step 1: Port the structure, not the platform wiring**

Copy the layout hierarchy, slot structure, and visual affordances into RDNA component folders. Strip extension-only behavior, document APIs, and state coupling that is not required for a standalone shell.

**Step 2: Keep the shells frontend-first**

Preserve the major visual regions, labels, and row layouts, but allow placeholder callbacks or local demo state where deeper behavior will not be implemented until Phase 3.

**Step 3: Match RDNA conventions**

Add `meta.ts` files, RDNA class names or slot markers, and index exports so the imported shells are usable in playgrounds and registry tooling immediately.

**Step 4: Add smoke coverage**

Mount both components in `packages/radiants/components/core/__tests__/designer-control-shells.test.tsx` with minimal props and verify they render without extension imports.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/ColorPicker/ packages/radiants/components/core/ShadowEditor/ packages/radiants/components/core/__tests__/designer-control-shells.test.tsx packages/radiants/components/core/index.ts
git commit -m "feat(radiants): import color and shadow control shells"
```

***

### Task 0C: Import BoxSpacing + BorderRadius Shells from Sandbox/Flow

**Files:**

* Create: `packages/radiants/components/core/BoxSpacing/BoxSpacing.tsx`
* Create: `packages/radiants/components/core/BoxSpacing/BoxSpacing.meta.ts`
* Create: `packages/radiants/components/core/BoxSpacing/boxspacing-control.css`
* Create: `packages/radiants/components/core/BorderRadiusEditor/BorderRadiusEditor.tsx`
* Create: `packages/radiants/components/core/BorderRadiusEditor/BorderRadiusEditor.meta.ts`
* Create: `packages/radiants/components/core/BorderRadiusEditor/borderradius-control.css`
* Modify: `packages/radiants/components/core/index.ts`

**Source donors:**

* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/sections/SpacingSection.tsx`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/sections/BordersSection.tsx`

**Step 1: Port the visible control groups**

Extract the linked / unlinked spacing and corner-radius shells into dedicated RDNA components. Do not bring over the entire section wrappers, only the reusable control surfaces.

**Step 2: Keep the first pass presentational**

Use simple local state or placeholder values where needed to preserve the imported layout. Deeper parsing, linked-value semantics, and interaction polish are Phase 3 work.

**Step 3: Add RDNA metadata and exports**

Register both components in `packages/radiants/components/core/index.ts` and add `meta.ts` files so they appear in internal tooling immediately.

**Step 4: Commit**

```bash
git add packages/radiants/components/core/BoxSpacing/ packages/radiants/components/core/BorderRadiusEditor/ packages/radiants/components/core/index.ts
git commit -m "feat(radiants): import spacing and radius control shells"
```

***

### Task 0D: Register Donor-Backed Demos and Lock Replacement Targets

**Files:**

* Modify: `tools/playground/app/playground/components/playground-ui-demos.tsx`
* Modify: `tools/playground/app/playground/app-registry.ts`
* Reference: `apps/rad-os/components/apps/pattern-playground/PatternPlayground.tsx`

**Step 1: Add demo coverage for imported shells**

Render the new RDNA annotation surface and compound control shells inside `tools/playground/app/playground/components/playground-ui-demos.tsx` so visual review happens in one place.

**Step 2: Register the demos**

Update `tools/playground/app/playground/app-registry.ts` so the imported RDNA shells show up as a dedicated control-surface group.

**Step 3: Lock the replacement targets**

Add comments or plan references where useful to make the intended replacements explicit:

* `packages/radiants/components/core/DialPanel/DialPanel.tsx` is the temporary DialKit shim to be replaced in Phase 4.
* `apps/rad-os/components/apps/pattern-playground/PatternPlayground.tsx` is the first migration target for `ControlPanel`.
* Interface Kit concepts are retained, but its runtime chrome is not.

**Step 4: Verify**

```bash
pnpm dev
```

Open the playground and confirm the imported shells render without reaching into the extension or old app codepaths.

**Step 5: Commit**

```bash
git add tools/playground/app/playground/components/playground-ui-demos.tsx tools/playground/app/playground/app-registry.ts
git commit -m "chore(playground): register control surface donor demos"
```

***

### Task 1: Create Feature Branch

**Step 1: Create branch**

```bash
cd /Users/rivermassey/Desktop/dev/DNA
git checkout -b feat/control-density
```

**Step 2: Verify**

```bash
git branch --show-current
```

Expected: `feat/control-density`

***

### Task 2: Add "control" Density Tier to CSS

**Files:**

* Modify: `packages/radiants/tokens.css` (line ~247, density section)

* Modify: `packages/radiants/base.css` (line ~20, density attribute selectors)

**Step 1: Add the control density token**

In `packages/radiants/tokens.css`, in the DENSITY section after `--density-compact: 0.5;`, add:

```css
  --density-control: 0.75;
```

**Step 2: Add the control density attribute selector**

In `packages/radiants/base.css`, after the `[data-density="compact"]` block, add:

```css
[data-density="control"] {
  --touch-target-default: var(--touch-target-min);
  --density-scale: var(--density-control);
}
```

**Step 3: Add control-density-specific utility tokens**

In `packages/radiants/tokens.css`, after the density section, add a control density section:

```css
  /* ============================================
     CONTROL DENSITY
     Tokens for parameter-GUI control rendering.
     Active under [data-density="control"].
     ============================================ */
  --control-row-height: 1.75rem;       /* 28px — compact row for labeled controls */
  --control-label-size: var(--font-size-xs);  /* 8px Joystix labels */
  --control-value-size: var(--font-size-xs);  /* 8px mono readout */
  --control-gap: 0.25rem;              /* 4px between label and control */
  --control-pad-x: 0.5rem;            /* 8px horizontal padding */
  --control-pad-y: 0.25rem;           /* 4px vertical padding */
```

**Step 4: Commit**

```bash
git add packages/radiants/tokens.css packages/radiants/base.css
git commit -m "feat(radiants): add control density tier to token system"
```

***

### Task 3: Density Contract Test

**Files:**

* Modify: `packages/radiants/test/density-contract.test.ts`

**Step 1: Extend the existing test**

Add assertions for the new `control` tier:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("density contract plumbing", () => {
  it("exposes the density tokens and attribute selectors", () => {
    const packageRoot = resolve(import.meta.dirname, "..");
    const tokensCss = readFileSync(resolve(packageRoot, "tokens.css"), "utf8");
    const baseCss = readFileSync(resolve(packageRoot, "base.css"), "utf8");

    expect(tokensCss).toContain("--touch-target-default");
    expect(tokensCss).toContain("--density-scale");
    expect(tokensCss).toContain("--density-compact");
    expect(tokensCss).toContain("--density-comfortable");
    expect(baseCss).toContain('[data-density="compact"]');
    expect(baseCss).toContain('[data-density="comfortable"]');

    // Control density tier
    expect(tokensCss).toContain("--density-control");
    expect(baseCss).toContain('[data-density="control"]');

    // Control density utility tokens
    expect(tokensCss).toContain("--control-row-height");
    expect(tokensCss).toContain("--control-label-size");
    expect(tokensCss).toContain("--control-value-size");
  });
});
```

**Step 2: Run test**

```bash
cd /Users/rivermassey/Desktop/dev/DNA
pnpm vitest run packages/radiants/test/density-contract.test.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/radiants/test/density-contract.test.ts
git commit -m "test(radiants): add control density tier assertions"
```

***

### Task 4: Slider — Control Density Styles

**Files:**

* Modify: `packages/radiants/components/core/Slider/Slider.tsx`

* Create: `packages/radiants/components/core/Slider/slider-control.css`

The control density Slider is the most important control. In control mode it renders as a single row: `[LABEL] [===TRACK===] [VALUE]` — label on the left (Joystix xs uppercase), track in the middle, numeric readout on the right (mono xs). The whole row is `--control-row-height` tall.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/Slider/slider-control.css`:

```css
/* Slider — control density overrides
   Active when an ancestor has data-density="control" */

[data-density="control"] [data-rdna="slider"] {
  min-width: 0;
  gap: var(--control-gap);
}

/* Single-row layout: label | track | value */
[data-density="control"] [data-rdna="slider"] {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: var(--control-row-height);
  padding: 0 var(--control-pad-x);
}

/* Label — Joystix uppercase, fixed width */
[data-density="control"] [data-rdna="slider"] [data-slot="slider-label"] {
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-mute);
  white-space: nowrap;
  width: 5rem;
  flex-shrink: 0;
}

/* Track — fills remaining space, shorter height */
[data-density="control"] [data-rdna="slider"] .slider-track {
  height: 0.75rem;
  flex: 1;
  min-width: 3rem;
}

/* Thumb — smaller */
[data-density="control"] [data-rdna="slider"] [data-slot="slider-thumb"] {
  width: 0.75rem;
  height: 0.75rem;
}

/* Value readout — mono, right-aligned */
[data-density="control"] [data-rdna="slider"] [data-slot="slider-value"] {
  font-family: var(--font-mono), monospace;
  font-size: var(--control-value-size);
  color: var(--color-main);
  white-space: nowrap;
  min-width: 2.5rem;
  text-align: right;
  flex-shrink: 0;
}
```

**Step 2: Modify Slider.tsx to support inline layout**

The current Slider renders label/value above the track in a separate div. For control density, the CSS overrides the flex direction to row. We need to add `data-slot` attributes so CSS can target sub-elements:

In `Slider.tsx`, add the CSS import at the top:

```tsx
import './slider-control.css';
```

Add `data-slot="slider-label"` to the label span (line ~92):

```tsx
{label && <span data-slot="slider-label" className="font-heading text-sm text-main">{label}</span>}
```

Add `data-slot="slider-value"` to the value span:

```tsx
{showValue && <span data-slot="slider-value" className="font-heading text-xs text-mute tabular-nums">{value}</span>}
```

**Step 3: Verify visually**

To test, wrap any Slider usage in `<div data-density="control">`:

```tsx
<div data-density="control">
  <Slider value={50} onChange={setValue} label="Scale" showValue min={1} max={100} />
</div>
```

Expected: Single compact row with label left, track center, value right. Height ~28px.

**Step 4: Commit**

```bash
git add packages/radiants/components/core/Slider/
git commit -m "feat(slider): add control density mode via CSS"
```

***

### Task 5: Switch — Control Density Styles

**Files:**

* Create: `packages/radiants/components/core/Switch/switch-control.css`

* Modify: `packages/radiants/components/core/Switch/Switch.tsx` (import CSS, add data-slot)

In control density, Switch renders as a single row: `[LABEL] [SWITCH]` with label on the left (Joystix xs uppercase) and the switch scaled down.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/Switch/switch-control.css`:

```css
/* Switch — control density overrides */

[data-density="control"] [data-rdna="switch"] {
  height: var(--control-row-height);
  padding: 0 var(--control-pad-x);
  gap: var(--control-gap);
}

/* Label — Joystix uppercase */
[data-density="control"] [data-rdna="switch"] label {
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-mute);
}

/* Track — force sm size */
[data-density="control"] [data-rdna="switch"] [data-slot="switch-track"] {
  width: 1.75rem;
  height: 0.875rem;
}

/* Thumb — match sm */
[data-density="control"] [data-rdna="switch"] [data-slot="switch-thumb"] {
  width: 0.875rem;
  height: 0.875rem;
}
```

**Step 2: Import CSS in Switch.tsx**

Add at top of `Switch.tsx`:

```tsx
import './switch-control.css';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Switch/
git commit -m "feat(switch): add control density mode via CSS"
```

***

### Task 6: Select — Control Density Styles

**Files:**

* Create: `packages/radiants/components/core/Select/select-control.css`

* Modify: `packages/radiants/components/core/Select/Select.tsx` (import CSS)

In control density, Select renders as: `[LABEL] [─── value ▾]` — label left (Joystix xs), trigger filling remaining space, shorter height.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/Select/select-control.css`:

```css
/* Select — control density overrides */

[data-density="control"] [data-rdna="select"] {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: var(--control-row-height);
  padding: 0 var(--control-pad-x);
  gap: var(--control-gap);
}

/* Trigger — compact */
[data-density="control"] [data-slot="select-trigger"] {
  height: 1.25rem;
  padding: 0 0.375rem;
  font-family: var(--font-mono), monospace;
  font-size: var(--control-value-size);
}

/* Chevron — smaller */
[data-density="control"] [data-slot="select-trigger"] svg {
  width: 10px;
  height: 10px;
}
```

**Step 2: Import CSS in Select.tsx**

```tsx
import './select-control.css';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Select/
git commit -m "feat(select): add control density mode via CSS"
```

***

### Task 7: Input — Control Density Styles

**Files:**

* Create: `packages/radiants/components/core/Input/input-control.css`

* Modify: `packages/radiants/components/core/Input/Input.tsx` (import CSS)

In control density, Input renders as a compact labeled row: `[LABEL] [input field]`.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/Input/input-control.css`:

```css
/* Input — control density overrides */

[data-density="control"] [data-rdna="input-field"] {
  flex-direction: row;
  align-items: center;
  height: var(--control-row-height);
  padding: 0 var(--control-pad-x);
  gap: var(--control-gap);
}

/* Label — Joystix uppercase */
[data-density="control"] [data-rdna="input-field"] label {
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-mute);
  white-space: nowrap;
  width: 5rem;
  flex-shrink: 0;
}

/* Input element — compact */
[data-density="control"] [data-rdna="input"] {
  height: 1.25rem;
  padding: 0 0.375rem;
  font-family: var(--font-mono), monospace;
  font-size: var(--control-value-size);
}

/* Standalone input (no Root wrapper) */
[data-density="control"] [data-rdna="input"]:not([data-rdna="input-field"] *) {
  height: 1.25rem;
  padding: 0 0.375rem;
  font-family: var(--font-mono), monospace;
  font-size: var(--control-value-size);
}
```

**Step 2: Import CSS in Input.tsx**

```tsx
import './input-control.css';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Input/
git commit -m "feat(input): add control density mode via CSS"
```

***

### Task 8: NumberField — Control Density Styles

**Files:**

* Create: `packages/radiants/components/core/NumberField/numberfield-control.css`

* Modify: `packages/radiants/components/core/NumberField/NumberField.tsx` (import CSS)

In control density, NumberField renders as: `[LABEL] [− input +]` — compact group with smaller buttons.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/NumberField/numberfield-control.css`:

```css
/* NumberField — control density overrides */

[data-density="control"] [data-rdna="numberfield"] {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: var(--control-row-height);
  padding: 0 var(--control-pad-x);
  gap: var(--control-gap);
}

/* Step buttons — smaller */
[data-density="control"] [data-rdna="numberfield"] button {
  height: 1.25rem;
  width: 1.25rem;
}

[data-density="control"] [data-rdna="numberfield"] button svg {
  width: 10px;
  height: 10px;
}

/* Input — compact mono */
[data-density="control"] [data-rdna="numberfield"] input {
  height: 1.25rem;
  font-family: var(--font-mono), monospace;
  font-size: var(--control-value-size);
  padding: 0 0.25rem;
}
```

**Step 2: Import CSS**

```tsx
import './numberfield-control.css';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/NumberField/
git commit -m "feat(numberfield): add control density mode via CSS"
```

***

### Task 9: Collapsible — Control Density ("Folder" Mode)

**Files:**

* Create: `packages/radiants/components/core/Collapsible/collapsible-control.css`

* Modify: `packages/radiants/components/core/Collapsible/Collapsible.tsx` (import CSS)

In control density, Collapsible becomes the "Folder" — a thin section header with Joystix label + yellow chevron. Content padding is tighter.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/Collapsible/collapsible-control.css`:

```css
/* Collapsible — control density overrides (becomes "Folder") */

[data-density="control"] [data-rdna="collapsible"] {
  border-bottom: 1px solid oklch(0.3 0.01 85 / 0.25);
}

/* Trigger — compact folder header */
[data-density="control"] [data-rdna="collapsible"] [data-slot="button-face"] {
  height: var(--control-row-height);
  padding: 0 var(--control-pad-x);
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-accent);
}

/* Chevron — accent color */
[data-density="control"] [data-rdna="collapsible"] [data-slot="button-face"] svg {
  color: var(--color-accent);
  opacity: 0.7;
  width: 10px;
  height: 10px;
}

/* Content — tighter padding */
[data-density="control"] [data-rdna="collapsible"] [class*="px-4 py-3"] {
  padding: var(--control-pad-y) var(--control-pad-x);
  background: transparent;
}
```

**Step 2: Import CSS**

```tsx
import './collapsible-control.css';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Collapsible/
git commit -m "feat(collapsible): add control density mode (folder)"
```

***

### Task 10: Button — Control Density Styles

**Files:**

* Create: `packages/radiants/components/core/Button/button-control.css`

* Modify: `packages/radiants/components/core/Button/Button.tsx` (import CSS)

In control density, Button becomes the "Action" — compact, Joystix uppercase label, full-width.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/Button/button-control.css`:

```css
/* Button — control density overrides (becomes "Action") */

[data-density="control"] [data-rdna="button"] {
  height: var(--control-row-height);
  padding: 0 var(--control-pad-x);
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: 100%;
}
```

**Step 2: Import CSS**

```tsx
import './button-control.css';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Button/
git commit -m "feat(button): add control density mode (action)"
```

***

### Task 11: ToggleGroup — Control Density Styles

**Files:**

* Create: `packages/radiants/components/core/ToggleGroup/togglegroup-control.css`

* Modify: `packages/radiants/components/core/ToggleGroup/ToggleGroup.tsx` (import CSS)

In control density, ToggleGroup becomes a compact segmented control — useful for mode switches, alignment pickers, etc.

**Step 1: Create control density CSS**

Create `packages/radiants/components/core/ToggleGroup/togglegroup-control.css`:

```css
/* ToggleGroup — control density overrides (segmented control mode) */

[data-density="control"] [data-rdna="togglegroup"] {
  height: var(--control-row-height);
}

[data-density="control"] [data-rdna="togglegroup"] [data-rdna="toggle"] {
  height: 100%;
  padding: 0 0.5rem;
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Icon-only items — square, tighter */
[data-density="control"] [data-rdna="togglegroup"] [data-rdna="toggle"][data-icon-only] {
  width: var(--control-row-height);
  padding: 0;
}
```

**Step 2: Import CSS**

```tsx
import './togglegroup-control.css';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/ToggleGroup/
git commit -m "feat(togglegroup): add control density mode (segmented)"
```

***

### Task 12: ColorPicker — Harden Imported Shell into OKLCH Picker

**Files:**

* Modify: `packages/radiants/components/core/ColorPicker/ColorPicker.tsx`
* Modify: `packages/radiants/components/core/ColorPicker/ColorPicker.meta.ts`
* Create: `packages/radiants/components/core/ColorPicker/color-math.ts`
* Modify: `packages/radiants/components/core/ColorPicker/colorpicker-control.css`
* Modify: `packages/radiants/components/core/index.ts` (if exports changed after Phase 0)

**Source donor already imported in Phase 0:**

* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/ColorPicker.tsx`

This is the most complex new control. It provides:

* **2D gradient area** (Lightness × Chroma for OKLCH, or Saturation × Brightness for HSL)

* **Hue strip** (horizontal bar)

* **Alpha strip** (optional)

* **Mode toggle**: OKLCH | HSL | Hex (via ToggleGroup in control density)

* **Value readout**: Editable text input showing the color in the active format

* **Swatch**: Preview of the current color

**Color math** uses `culori` (already in radiants devDeps). Reference: `/Users/rivermassey/Downloads/oklch-picker-main/lib/colors.ts` for gamut detection, oklch ↔ hex conversion, and displayable-range clamping.

**Step 1: Create color-math.ts**

```ts
import { oklch, formatHex, formatCss, parse, clampChroma, displayable } from 'culori';

export interface OklchColor {
  l: number;  // 0–1
  c: number;  // 0–0.4
  h: number;  // 0–360
  alpha: number; // 0–1
}

/** Parse any CSS color string into OKLCH */
export function toOklch(input: string): OklchColor | null {
  const parsed = parse(input);
  if (!parsed) return null;
  const o = oklch(parsed);
  if (!o) return null;
  return { l: o.l ?? 0, c: o.c ?? 0, h: o.h ?? 0, alpha: o.alpha ?? 1 };
}

/** Convert OKLCH to hex string */
export function oklchToHex(color: OklchColor): string {
  const clamped = clampChroma({ mode: 'oklch', ...color }, 'oklch');
  return formatHex(clamped) ?? '#000000';
}

/** Convert OKLCH to CSS oklch() string */
export function oklchToCss(color: OklchColor): string {
  return formatCss({ mode: 'oklch', ...color });
}

/** Check if an OKLCH color is within the sRGB gamut */
export function isInGamut(color: OklchColor): boolean {
  return displayable({ mode: 'oklch', ...color });
}

/** Get the maximum chroma for a given lightness and hue that stays in gamut */
export function maxChroma(l: number, h: number): number {
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (displayable({ mode: 'oklch', l, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return lo;
}
```

**Step 2: Create ColorPicker.tsx**

The component has two layouts:

* **Default**: Stacked (area + hue strip + inputs below)

* **Control density**: Compact — swatch trigger that opens a popover with the full picker

```tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toOklch, oklchToHex, oklchToCss, maxChroma, type OklchColor } from './color-math';
import './colorpicker-control.css';

type ColorMode = 'oklch' | 'hex';

interface ColorPickerProps {
  /** Current color value (any CSS color string) */
  value: string;
  /** Callback when color changes */
  onChange: (value: string) => void;
  /** Color format for the onChange output. Default: 'oklch' */
  mode?: ColorMode;
  /** Whether to show the alpha channel. Default: false */
  showAlpha?: boolean;
  /** Label text */
  label?: string;
  /** Additional className */
  className?: string;
}

/** 2D area: X = hue (0–360), Y = lightness (1→0 top to bottom) */
function ColorArea({
  color,
  onColorChange,
}: {
  color: OklchColor;
  onColorChange: (patch: Partial<OklchColor>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);

  // Paint the LxC gradient for the current hue
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      const l = 1 - y / height;
      for (let x = 0; x < width; x++) {
        const mc = maxChroma(l, color.h);
        const c = (x / width) * mc;
        const hex = oklchToHex({ l, c, h: color.h, alpha: 1 });
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const i = (y * width + x) * 4;
        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [color.h]);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const l = 1 - y;
      const mc = maxChroma(l, color.h);
      const c = x * mc;
      onColorChange({ l, c });
    },
    [color.h, onColorChange]
  );

  // Cursor position
  const mc = maxChroma(color.l, color.h);
  const cursorX = mc > 0 ? (color.c / mc) * 100 : 0;
  const cursorY = (1 - color.l) * 100;

  return (
    <div className="relative" data-slot="color-area">
      <canvas
        ref={canvasRef}
        width={128}
        height={128}
        className="w-full aspect-square pixel-rounded-xs cursor-crosshair"
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e);
        }}
        onPointerMove={(e) => dragging && handlePointer(e)}
        onPointerUp={() => setDragging(false)}
      />
      <div
        className="absolute w-3 h-3 border-2 border-flip rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${cursorX}%`, top: `${cursorY}%` }}
      />
    </div>
  );
}

/** Horizontal hue strip */
function HueStrip({
  hue,
  onHueChange,
}: {
  hue: number;
  onHueChange: (h: number) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onHueChange(x * 360);
    },
    [onHueChange]
  );

  return (
    <div
      className="relative h-3 pixel-rounded-xs cursor-pointer"
      style={{
        background: 'linear-gradient(to right, oklch(0.7 0.15 0), oklch(0.7 0.15 60), oklch(0.7 0.15 120), oklch(0.7 0.15 180), oklch(0.7 0.15 240), oklch(0.7 0.15 300), oklch(0.7 0.15 360))',
      }}
      data-slot="hue-strip"
      onPointerDown={(e) => {
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => dragging && handlePointer(e)}
      onPointerUp={() => setDragging(false)}
    >
      <div
        className="absolute top-0 w-1 h-full bg-flip border border-line pixel-rounded-xs -translate-x-1/2 pointer-events-none"
        style={{ left: `${(hue / 360) * 100}%` }}
      />
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
  mode = 'oklch',
  showAlpha = false,
  label,
  className = '',
}: ColorPickerProps) {
  const [color, setColor] = useState<OklchColor>(() => toOklch(value) ?? { l: 0.7, c: 0.15, h: 80, alpha: 1 });
  const [inputMode, setInputMode] = useState<ColorMode>(mode);

  // Sync external value changes
  useEffect(() => {
    const parsed = toOklch(value);
    if (parsed) setColor(parsed);
  }, [value]);

  const emitChange = useCallback(
    (c: OklchColor) => {
      setColor(c);
      onChange(inputMode === 'hex' ? oklchToHex(c) : oklchToCss(c));
    },
    [inputMode, onChange]
  );

  const handlePatch = useCallback(
    (patch: Partial<OklchColor>) => {
      const next = { ...color, ...patch };
      emitChange(next);
    },
    [color, emitChange]
  );

  const hexValue = oklchToHex(color);
  const oklchValue = oklchToCss(color);

  return (
    <div data-rdna="colorpicker" className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <span data-slot="color-label" className="font-heading text-sm text-main">{label}</span>
      )}

      <ColorArea color={color} onColorChange={handlePatch} />
      <HueStrip hue={color.h} onHueChange={(h) => handlePatch({ h })} />

      {/* Value readout + swatch */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 pixel-rounded-xs border border-line shrink-0"
          style={{ background: hexValue }}
          data-slot="color-swatch"
        />
        <input
          type="text"
          value={inputMode === 'hex' ? hexValue : oklchValue}
          onChange={(e) => {
            const parsed = toOklch(e.target.value);
            if (parsed) emitChange(parsed);
          }}
          className="flex-1 h-6 px-2 font-mono text-xs bg-page text-main pixel-rounded-xs"
          data-slot="color-input"
          data-rdna="input"
        />
        <button
          type="button"
          onClick={() => setInputMode((m) => (m === 'oklch' ? 'hex' : 'oklch'))}
          className="h-6 px-2 font-mono text-xs text-mute hover:text-main cursor-pointer"
          data-slot="color-mode-toggle"
        >
          {inputMode === 'oklch' ? 'OKLCH' : 'HEX'}
        </button>
      </div>
    </div>
  );
}

export default ColorPicker;
```

**Step 3: Create control density CSS**

Create `packages/radiants/components/core/ColorPicker/colorpicker-control.css`:

```css
/* ColorPicker — control density overrides
   In control mode, shows swatch + hex value as a compact row.
   Full picker appears on click (handled in component). */

[data-density="control"] [data-rdna="colorpicker"] [data-slot="color-label"] {
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-mute);
}

[data-density="control"] [data-rdna="colorpicker"] [data-slot="color-input"] {
  font-family: var(--font-mono), monospace;
  font-size: var(--control-value-size);
  height: 1.25rem;
}

[data-density="control"] [data-rdna="colorpicker"] [data-slot="color-swatch"] {
  width: 1.25rem;
  height: 1.25rem;
}
```

**Step 4: Create ColorPicker.meta.ts**

```ts
import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  mode?: "oklch" | "hex";
  showAlpha?: boolean;
  label?: string;
}

export const ColorPickerMeta = defineComponentMeta<ColorPickerProps>()({
  name: "ColorPicker",
  description: "OKLCH-native color picker with 2D gradient area, hue strip, and hex/oklch mode toggle.",
  props: {
    value: { type: "string", required: true, description: "Current color value (any CSS color string)" },
    mode: { type: "enum", values: ["oklch", "hex"], default: "oklch", description: "Color format for output" },
    showAlpha: { type: "boolean", default: false, description: "Show alpha channel control" },
    label: { type: "string", description: "Label text" },
  },
  slots: {
    area: { description: "2D lightness × chroma gradient area" },
    hueStrip: { description: "Horizontal hue selection strip" },
    swatch: { description: "Color preview swatch" },
    input: { description: "Editable color value input" },
  },
  tokenBindings: {
    label: { text: "main", font: "heading" },
    swatch: { border: "line" },
    input: { text: "main", background: "page", font: "mono" },
  },
  examples: [
    { name: "OKLCH mode", code: '<ColorPicker value="oklch(0.7 0.15 80)" onChange={setValue} />' },
    { name: "Hex mode", code: '<ColorPicker value="#f5c542" onChange={setValue} mode="hex" />' },
    { name: "With label", code: '<ColorPicker value="#ff5500" onChange={setValue} label="Accent" />' },
  ],
  registry: {
    category: "form",
    tags: ["color", "oklch", "picker"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [{ name: "disabled", driver: "prop", prop: "disabled", value: true }],
  },
});
```

**Step 5: Add export to core index**

In `packages/radiants/components/core/index.ts`, add:

```ts
export { ColorPicker } from './ColorPicker/ColorPicker';
```

**Step 6: Commit**

```bash
git add packages/radiants/components/core/ColorPicker/ packages/radiants/components/core/index.ts
git commit -m "feat(radiants): add ColorPicker component with OKLCH support"
```

***

### Task 13: BoxSpacing — Harden Imported Shell into 4-Side Spacing Editor

**Files:**

* Modify: `packages/radiants/components/core/BoxSpacing/BoxSpacing.tsx`
* Modify: `packages/radiants/components/core/BoxSpacing/BoxSpacing.meta.ts`
* Modify: `packages/radiants/components/core/BoxSpacing/boxspacing-control.css`
* Modify: `packages/radiants/components/core/index.ts` (if exports changed after Phase 0)

**Source donor already imported in Phase 0:**

* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/sections/SpacingSection.tsx`

A visual editor showing a nested box diagram (like browser DevTools box model). Four editable values (top, right, bottom, left) with a toggle for uniform/individual mode. Uses NumberField internally for each side.

**Step 1: Create BoxSpacing.tsx**

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import './boxspacing-control.css';

export interface BoxSpacingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BoxSpacingProps {
  value: BoxSpacingValue;
  onChange: (value: BoxSpacingValue) => void;
  label?: string;
  /** Max value for each side. Default: 100 */
  max?: number;
  /** Step increment. Default: 1 */
  step?: number;
  className?: string;
}

export function BoxSpacing({
  value,
  onChange,
  label,
  max = 100,
  step = 1,
  className = '',
}: BoxSpacingProps) {
  const [uniform, setUniform] = useState(
    value.top === value.right && value.right === value.bottom && value.bottom === value.left
  );

  const handleSideChange = useCallback(
    (side: keyof BoxSpacingValue, v: number) => {
      if (uniform) {
        onChange({ top: v, right: v, bottom: v, left: v });
      } else {
        onChange({ ...value, [side]: v });
      }
    },
    [uniform, value, onChange]
  );

  const sides: (keyof BoxSpacingValue)[] = ['top', 'right', 'bottom', 'left'];

  return (
    <div data-rdna="boxspacing" className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span data-slot="boxspacing-label" className="font-heading text-sm text-main">{label}</span>
          <button
            type="button"
            onClick={() => setUniform(!uniform)}
            className="font-mono text-xs text-mute hover:text-main cursor-pointer"
            data-slot="boxspacing-link-toggle"
          >
            {uniform ? 'linked' : 'individual'}
          </button>
        </div>
      )}

      {/* Visual box diagram */}
      <div className="relative border border-line pixel-rounded-xs p-4 flex items-center justify-center" data-slot="boxspacing-diagram">
        {/* Center box */}
        <div className="w-8 h-8 bg-accent/20 pixel-rounded-xs" />

        {/* Side values */}
        {sides.map((side) => (
          <input
            key={side}
            type="number"
            value={value[side]}
            min={0}
            max={max}
            step={step}
            onChange={(e) => handleSideChange(side, Number(e.target.value))}
            className={`absolute w-8 text-center font-mono text-xs bg-transparent text-main outline-none
              ${side === 'top' ? 'top-1 left-1/2 -translate-x-1/2' : ''}
              ${side === 'bottom' ? 'bottom-1 left-1/2 -translate-x-1/2' : ''}
              ${side === 'left' ? 'left-1 top-1/2 -translate-y-1/2' : ''}
              ${side === 'right' ? 'right-1 top-1/2 -translate-y-1/2' : ''}
            `}
            data-rdna="input"
          />
        ))}
      </div>
    </div>
  );
}

export default BoxSpacing;
```

**Step 2: Create control density CSS**

Create `packages/radiants/components/core/BoxSpacing/boxspacing-control.css`:

```css
/* BoxSpacing — control density overrides */

[data-density="control"] [data-rdna="boxspacing"] [data-slot="boxspacing-label"] {
  font-family: var(--font-joystix), monospace;
  font-size: var(--control-label-size);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-mute);
}

[data-density="control"] [data-rdna="boxspacing"] [data-slot="boxspacing-diagram"] {
  padding: 0.5rem;
}

[data-density="control"] [data-rdna="boxspacing"] input {
  font-size: var(--control-value-size);
  width: 1.5rem;
}
```

**Step 3: Create BoxSpacing.meta.ts** (abbreviated — follow ColorPicker pattern)

**Step 4: Add export, commit**

```bash
git add packages/radiants/components/core/BoxSpacing/ packages/radiants/components/core/index.ts
git commit -m "feat(radiants): add BoxSpacing compound control"
```

***

### Task 14: BorderRadiusEditor — Harden Imported Shell into 4-Corner Radius Editor

**Files:**

* Modify: `packages/radiants/components/core/BorderRadiusEditor/BorderRadiusEditor.tsx`
* Modify: `packages/radiants/components/core/BorderRadiusEditor/BorderRadiusEditor.meta.ts`
* Modify: `packages/radiants/components/core/BorderRadiusEditor/borderradius-control.css`
* Modify: `packages/radiants/components/core/index.ts`

**Source donor already imported in Phase 0:**

* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/sections/BordersSection.tsx`

Similar pattern to BoxSpacing — 4 corner inputs (topLeft, topRight, bottomRight, bottomLeft) with uniform/individual toggle. Shows a visual preview box whose corners update live.

Follow the same structure as Task 13. The visual preview is a `<div>` whose `borderRadius` is set from the 4 values.

**Commit:**

```bash
git add packages/radiants/components/core/BorderRadiusEditor/ packages/radiants/components/core/index.ts
git commit -m "feat(radiants): add BorderRadiusEditor compound control"
```

***

### Task 15: ShadowEditor — Harden Imported Shell into Multi-Property Shadow Editor

**Files:**

* Modify: `packages/radiants/components/core/ShadowEditor/ShadowEditor.tsx`
* Modify: `packages/radiants/components/core/ShadowEditor/ShadowEditor.meta.ts`
* Modify: `packages/radiants/components/core/ShadowEditor/shadoweditor-control.css`
* Modify: `packages/radiants/components/core/ShadowEditor/boxShadowParser.ts`
* Modify: `packages/radiants/components/core/index.ts`

**Source donors already imported in Phase 0:**

* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/ShadowEditor.tsx`
* `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/panel/components/designer/boxShadowParser.ts`

Composes 4 Sliders (X, Y, Blur, Spread), a ColorPicker (shadow color), and a preview box. Value is a `ShadowValue` object.

```ts
export interface ShadowValue {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}
```

Follow the same compound control pattern. Each slider is an RDNA Slider with `label` and `showValue`. In control density mode, the CSS overrides from Task 4 make them compact automatically.

**Commit:**

```bash
git add packages/radiants/components/core/ShadowEditor/ packages/radiants/components/core/index.ts
git commit -m "feat(radiants): add ShadowEditor compound control"
```

***

### Task 16: useControlPanel Hook

**Files:**

* Create: `packages/radiants/components/core/ControlPanel/useControlPanel.ts`

* Create: `packages/radiants/components/core/ControlPanel/types.ts`

* Reference: `packages/radiants/registry/PropControls.tsx`

* Reference: `packages/radiants/registry/useShowcaseProps.ts`

This is the declarative config → typed reactive values hook (inspired by DialKit's `useDialKit`, but seeded from the existing Radiants registry prop-control infrastructure). It takes a name and a config object, infers types, and returns live values.

**Step 1: Define types**

```ts
// types.ts

export type ControlDef =
  | number                                    // → Slider (auto-inferred range)
  | [number, number, number]                 // → Slider [default, min, max]
  | [number, number, number, number]         // → Slider [default, min, max, step]
  | boolean                                   // → Switch
  | string                                    // → Input (auto: starts with # = color)
  | { type: 'slider'; default: number; min: number; max: number; step?: number }
  | { type: 'toggle'; default: boolean }
  | { type: 'select'; options: string[]; default?: string }
  | { type: 'text'; default?: string; placeholder?: string }
  | { type: 'color'; default?: string; mode?: 'oklch' | 'hex' }
  | { type: 'action'; label?: string }
  | { [key: string]: ControlDef }            // → Folder (nested)

export type ControlConfig = Record<string, ControlDef>;

/** Resolved runtime value type for a control definition */
export type ResolvedValue<T extends ControlDef> =
  T extends number ? number :
  T extends [number, number, number] ? number :
  T extends [number, number, number, number] ? number :
  T extends boolean ? boolean :
  T extends string ? string :
  T extends { type: 'slider' } ? number :
  T extends { type: 'toggle' } ? boolean :
  T extends { type: 'select' } ? string :
  T extends { type: 'text' } ? string :
  T extends { type: 'color' } ? string :
  T extends { type: 'action' } ? never :
  T extends Record<string, ControlDef> ? { [K in keyof T]: ResolvedValue<T[K]> } :
  unknown;

export type ResolvedValues<T extends ControlConfig> = {
  [K in keyof T]: ResolvedValue<T[K]>;
};

export interface ControlPanelOptions {
  onAction?: (path: string) => void;
}
```

**Step 2: Create useControlPanel hook**

```ts
// useControlPanel.ts
import { useState, useCallback, useMemo } from 'react';
import type { ControlConfig, ResolvedValues, ControlDef, ControlPanelOptions } from './types';

function resolveDefault(def: ControlDef): unknown {
  if (typeof def === 'number') return def;
  if (typeof def === 'boolean') return def;
  if (typeof def === 'string') return def;
  if (Array.isArray(def)) return def[0];
  if (def.type === 'slider') return def.default;
  if (def.type === 'toggle') return def.default;
  if (def.type === 'select') return def.default ?? def.options[0];
  if (def.type === 'text') return def.default ?? '';
  if (def.type === 'color') return def.default ?? '#000000';
  if (def.type === 'action') return undefined;
  // Nested folder
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(def)) {
    result[k] = resolveDefault(v as ControlDef);
  }
  return result;
}

function resolveDefaults(config: ControlConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(config)) {
    result[key] = resolveDefault(def);
  }
  return result;
}

export function useControlPanel<T extends ControlConfig>(
  _name: string,
  config: T,
  options?: ControlPanelOptions,
): [ResolvedValues<T>, (path: string, value: unknown) => void] {
  const defaults = useMemo(() => resolveDefaults(config), []);
  const [values, setValues] = useState(defaults);

  const setValue = useCallback((path: string, value: unknown) => {
    setValues((prev) => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...prev, [path]: value };
      // Nested path
      const next = { ...prev };
      let cursor: Record<string, unknown> = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cursor[parts[i]] = { ...(cursor[parts[i]] as Record<string, unknown>) };
        cursor = cursor[parts[i]] as Record<string, unknown>;
      }
      cursor[parts[parts.length - 1]] = value;
      return next;
    });
  }, []);

  return [values as ResolvedValues<T>, setValue];
}
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/ControlPanel/
git commit -m "feat(radiants): add useControlPanel hook with typed config"
```

***

### Task 17: ControlPanel Component

**Files:**

* Create: `packages/radiants/components/core/ControlPanel/ControlPanel.tsx`

* Create: `packages/radiants/components/core/ControlPanel/ControlPanel.meta.ts`

* Modify: `packages/radiants/components/core/index.ts`

* Reference: `packages/radiants/components/core/DialPanel/DialPanel.tsx`

* Reference: `packages/radiants/components/core/AnnotationSurface/`

The `ControlPanel` component takes a config object and renders the appropriate RDNA components. It wraps everything in `<div data-density="control">` so all child controls get the compact treatment automatically.

```tsx
'use client';

import React from 'react';
import { Slider } from '../Slider/Slider';
import { Switch } from '../Switch/Switch';
import { Select, useSelectState } from '../Select/Select';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { Collapsible } from '../Collapsible/Collapsible';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import type { ControlConfig, ControlDef } from './types';

interface ControlPanelProps {
  /** The config object defining controls */
  config: ControlConfig;
  /** Current values (from useControlPanel) */
  values: Record<string, unknown>;
  /** Value change handler (from useControlPanel) */
  onChange: (path: string, value: unknown) => void;
  /** Action handler */
  onAction?: (path: string) => void;
  /** Header content above controls */
  header?: React.ReactNode;
  /** Footer content below controls */
  footer?: React.ReactNode;
  /** Additional className */
  className?: string;
}

function inferControlType(def: ControlDef): string {
  if (typeof def === 'number') return 'slider';
  if (typeof def === 'boolean') return 'toggle';
  if (typeof def === 'string') return def.startsWith('#') ? 'color' : 'text';
  if (Array.isArray(def)) return 'slider';
  if ('type' in def) return def.type;
  return 'folder';
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function RenderControl({
  path,
  def,
  value,
  onChange,
  onAction,
}: {
  path: string;
  def: ControlDef;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
  onAction?: (path: string) => void;
}) {
  const type = inferControlType(def);
  const label = formatLabel(path.split('.').pop() ?? path);

  switch (type) {
    case 'slider': {
      const [min, max, step] = Array.isArray(def)
        ? [def[1], def[2], def[3] ?? 1]
        : typeof def === 'number'
          ? [0, def * 3 || 100, 1]
          : [(def as { min: number }).min, (def as { max: number }).max, (def as { step?: number }).step ?? 1];
      return (
        <Slider
          value={value as number}
          onChange={(v) => onChange(path, v)}
          min={min}
          max={max}
          step={step}
          label={label}
          showValue
        />
      );
    }
    case 'toggle':
      return (
        <Switch
          checked={value as boolean}
          onChange={(v) => onChange(path, v)}
          label={label}
        />
      );
    case 'select': {
      const opts = (def as { options: string[] }).options;
      return (
        <SelectControl
          value={value as string}
          options={opts}
          onChange={(v) => onChange(path, v)}
        />
      );
    }
    case 'text':
      return (
        <Input
          value={value as string}
          onChange={(e) => onChange(path, e.target.value)}
          placeholder={(def as { placeholder?: string }).placeholder}
        />
      );
    case 'color':
      return (
        <ColorPicker
          value={value as string}
          onChange={(v) => onChange(path, v)}
          label={label}
          mode={(def as { mode?: 'oklch' | 'hex' }).mode}
        />
      );
    case 'action':
      return (
        <Button
          mode="flat"
          tone="accent"
          size="sm"
          onClick={() => onAction?.(path)}
        >
          {(def as { label?: string }).label ?? label}
        </Button>
      );
    case 'folder': {
      const nested = def as Record<string, ControlDef>;
      const folderValues = value as Record<string, unknown>;
      return (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger>{label}</Collapsible.Trigger>
          <Collapsible.Content>
            <div className="flex flex-col">
              {Object.entries(nested).map(([k, childDef]) => (
                <RenderControl
                  key={k}
                  path={`${path}.${k}`}
                  def={childDef}
                  value={folderValues?.[k]}
                  onChange={onChange}
                  onAction={onAction}
                />
              ))}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      );
    }
    default:
      return null;
  }
}

/** Internal Select wrapper that manages its own open state */
function SelectControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const { state, actions } = useSelectState({ value, onChange });
  return (
    <Select.Provider state={state} actions={actions}>
      <Select.Trigger size="sm" />
      <Select.Content>
        {options.map((opt) => (
          <Select.Option key={opt} value={opt}>
            {opt}
          </Select.Option>
        ))}
      </Select.Content>
    </Select.Provider>
  );
}

export function ControlPanel({
  config,
  values,
  onChange,
  onAction,
  header,
  footer,
  className = '',
}: ControlPanelProps) {
  return (
    <div data-density="control" className={`flex flex-col overflow-hidden ${className}`} data-rdna="controlpanel">
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {Object.entries(config).map(([key, def]) => (
          <RenderControl
            key={key}
            path={key}
            def={def}
            value={values[key]}
            onChange={onChange}
            onAction={onAction}
          />
        ))}
      </div>
      {footer}
    </div>
  );
}

export default ControlPanel;
```

**Step 2: Add export to core index**

```ts
export { ControlPanel } from './ControlPanel/ControlPanel';
export { useControlPanel } from './ControlPanel/useControlPanel';
export type { ControlConfig, ResolvedValues } from './ControlPanel/types';
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/ControlPanel/ packages/radiants/components/core/index.ts
git commit -m "feat(radiants): add ControlPanel declarative control renderer"
```

***

### Task 18: Replace DialPanel in PatternPlayground

**Files:**

* Modify: `apps/rad-os/components/apps/pattern-playground/PatternPlayground.tsx`

* Modify any related files that import `useDialKit` or `DialPanel`

**Step 1: Find all DialKit usage**

```bash
grep -r "useDialKit\|DialPanel\|dialkit" apps/rad-os/ --include="*.tsx" --include="*.ts" -l
```

**Step 2: Replace imports**

Change:

```tsx
import { DialPanel, useDialKit } from '@rdna/radiants/components/core';
```

To:

```tsx
import { ControlPanel, useControlPanel } from '@rdna/radiants/components/core';
```

**Step 3: Migrate the config**

The DialKit config syntax is very similar to ControlPanel's. Map:

* `[default, min, max, step]` → same (ControlPanel supports this)

* `true` / `false` → same

* `{ type: 'select', options, default }` → same

* `{ type: 'action', label }` → same

* `'#rrggbb'` → `{ type: 'color', default: '#rrggbb', mode: 'hex' }`

**Step 4: Replace component usage**

Change:

```tsx
<DialPanel header={...} footer={...}>
  <PlaygroundControls ... />
</DialPanel>
```

To:

```tsx
<ControlPanel
  config={playgroundConfig}
  values={values}
  onChange={setValue}
  onAction={handleAction}
  header={...}
  footer={...}
/>
```

**Step 5: Test the playground**

```bash
pnpm dev
```

Navigate to PatternPlayground in RadOS. Verify controls render correctly and parameter changes update the pattern.

**Step 6: Commit**

```bash
git add apps/rad-os/components/apps/pattern-playground/
git commit -m "refactor(playground): migrate from DialKit to ControlPanel"
```

***

### Task 19: Remove DialKit Dependency

**Files:**

* Remove: `packages/radiants/components/core/DialPanel/` (entire directory)

* Modify: `packages/radiants/components/core/index.ts` (remove DialPanel exports)

* Modify: `packages/radiants/package.json` (remove `dialkit` from dependencies)

* Run: `pnpm install` to update lockfile

**Step 1: Verify no remaining DialKit references**

```bash
grep -r "dialkit\|DialPanel\|useDialKit" packages/ apps/ tools/ --include="*.tsx" --include="*.ts" -l
```

If any remain, migrate them first.

**Step 2: Remove files and references**

```bash
rm -rf packages/radiants/components/core/DialPanel/
```

Remove from `index.ts`:

```ts
// DELETE these lines:
export { DialPanel, useDialKit } from './DialPanel/DialPanel';
export type { DialPanelProps } from './DialPanel/DialPanel';
```

Remove from `packages/radiants/package.json`:

```json
// DELETE from dependencies:
"dialkit": "..."
```

**Step 3: Reinstall and verify**

```bash
pnpm install
pnpm build
pnpm lint
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(radiants): remove dialkit dependency, replaced by ControlPanel"
```

***

### Task 20: Update DESIGN.md

**Files:**

* Modify: `packages/radiants/DESIGN.md`

Add a section documenting:

* The density system: `data-density="comfortable"` (default), `"compact"`, `"control"`

* How to use control density: wrap any subtree in `<div data-density="control">` and all RDNA form components shrink to parameter-GUI size

* The new compound controls (ColorPicker, BoxSpacing, BorderRadiusEditor, ShadowEditor)

* The ControlPanel declarative config API

* Migration guide from DialKit

**Commit:**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs(radiants): document control density mode and ControlPanel API"
```

⠀
