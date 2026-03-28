# Playground UI Visual Refinement — Agentation-Inspired

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Refine all playground annotation/composer UI to feel modern and smooth — Agentation interaction patterns with RDNA colors + glow.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` (main checkout, `feat/playground-phase0` branch)

**Architecture:** Adapt Agentation's micro-interaction patterns (spring animations, scale feedback, collapsible sections, numbered markers) while keeping RDNA semantic tokens for colors, typography, and shadows. Replace all raw `<button>` elements with RDNA `<Button>` component. The dark-mode `shadow-floating` token already produces a warm sun-yellow glow — no custom shadows needed.

**Tech Stack:** React 19, Tailwind v4, CSS keyframes, RDNA design system tokens, `@rdna/radiants` Button component

**Depends on:** Phase 0–3 of `2026-03-16-playground-comment-variation-ui-refactor.md` (complete)

---

## RDNA Token Quick Reference (for implementer)

### Shadow (dark mode values — already warm glow)
| Token | Effect |
|---|---|
| `shadow-floating` | ring 12% + `0 0 10px` 25% + `0 0 24px` 10% sun-yellow glow |
| `shadow-raised` | ring 10% + `0 0 8px` 20% + `0 0 20px` 8% |
| `shadow-glow-md` | ring 10% + `0 0 8px` + `0 0 14px` glow |
| `shadow-glow-sm` | ring 8% + `0 0 6px` subtle glow |

### Easing
| Token | Value | Use |
|---|---|---|
| `--easing-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` | Popup/marker enter, badge bounce |
| `--easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Marker exit, accordion |
| `--easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Popup exit |

### Duration
| Token | Value |
|---|---|
| `--duration-fast` | `100ms` — press feedback |
| `--duration-base` | `150ms` — hover transitions, popup exit |
| `--duration-moderate` | `200ms` — popup enter, marker exit |
| `--duration-slow` | `300ms` — marker enter, accordion, badge |

### RDNA Button (import from `@rdna/radiants/components/core`)
| Variant | Use case |
|---|---|
| `<Button variant="ghost" size="sm">` | Cancel, dismiss, back, inline actions |
| `<Button variant="outline" size="sm">` | Primary actions (Pin, Resolve, Submit) |
| `<Button variant="secondary" size="sm">` | Active/selected toggle state |
| `<Button variant="text" size="sm">` | Inline text links (+ Pin, resolve/dismiss labels) |

---

## Task 1: CSS Keyframes + Animation Utilities

**Files:**
- Modify: `tools/playground/app/globals.css`

Add all keyframes needed by subsequent tasks. Using RDNA duration tokens via `var()` in the `animation` shorthand (keyframes define transforms only, consuming components set timing).

**Step 1: Add keyframes to globals.css**

Add after the existing `@keyframes dotPulse` block:

```css
/* Popup enter/exit — ComposerShell, AnnotationDetail, AnnotationList */
@keyframes popupIn {
  from { opacity: 0; transform: scale(0.95) translateY(4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes popupOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.95) translateY(4px); }
}

/* Marker pin enter/exit */
@keyframes markerIn {
  from { opacity: 0; transform: translate(-50%, -100%) scale(0.3); }
  to   { opacity: 1; transform: translate(-50%, -100%) scale(1); }
}
@keyframes markerOut {
  from { opacity: 1; transform: translate(-50%, -100%) scale(1); }
  to   { opacity: 0; transform: translate(-50%, -100%) scale(0.3); }
}

/* Badge count bounce entrance */
@keyframes badgeIn {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}

/* Shake feedback (click outside open popup) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit` from `tools/playground/`
Expected: Only the pre-existing `code-blocks.ts:5` error.

**Step 3: Commit**

```
feat(playground): add animation keyframes for popups, markers, badges
```

---

## Task 2: Panel Shape Upgrade — ComposerShell

**Files:**
- Modify: `tools/playground/app/playground/components/ComposerShell.tsx`

Upgrade the panel wrapper to Agentation-inspired shape: rounder radius, the existing RDNA `shadow-floating` glow, and migrate all raw `<button>` to RDNA `<Button>`.

**Step 1: Update ComposerShell panel and buttons**

Changes:
- [ ] Panel: `rounded-sm` → `rounded-2xl` (16px), keep `shadow-floating` (already glowy in dark)
- [ ] Header border: keep `border-rule`
- [ ] Textarea: `rounded-xs` → `rounded-lg` (8px), add `transition-colors` for focus border animation
- [ ] Cancel button: replace raw `<button>` with `<Button variant="ghost" size="sm">`
- [ ] Submit button: replace raw `<button>` with `<Button variant="outline" size="sm">`; when submitting, use `<LoadingButton isLoading={submitting}>` or keep `<LoadingDots />` inside `<Button>`
- [ ] Remove all `eslint-disable-next-line rdna/prefer-rdna-components` comments
- [ ] Add popup entrance: wrap outer div in a class that applies `animation: popupIn var(--duration-moderate) var(--easing-spring) both`
- [ ] `ComposerPill`: migrate to `<Button variant="ghost" size="sm">` for inactive, `<Button variant="secondary" size="sm">` for active. Remove eslint exception.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: Clean (pre-existing error only).

**Step 3: Commit**

```
feat(playground): upgrade ComposerShell panel shape + RDNA Button migration
```

---

## Task 3: Panel Shape Upgrade — AnnotationDetail

**Files:**
- Modify: `tools/playground/app/playground/components/AnnotationDetail.tsx`

Same panel shape upgrade + Button migration.

**Step 1: Update AnnotationDetail**

Changes:
- [ ] Panel: `rounded-sm` → `rounded-2xl`, keep `shadow-floating`
- [ ] All raw `<button>` → RDNA `<Button>` (close = `IconButton variant="ghost"`, resolve/dismiss = `Button variant="outline"/"ghost" size="sm"`, back = `Button variant="text" size="sm"`)
- [ ] Remove all eslint exception comments
- [ ] Input fields: `rounded-xs` → `rounded-lg`, add `transition-colors`
- [ ] Add popup entrance animation class

**Step 2: Verify + Commit**

```
feat(playground): upgrade AnnotationDetail panel + Button migration
```

---

## Task 4: Panel Shape Upgrade — AnnotationList

**Files:**
- Modify: `tools/playground/app/playground/components/AnnotationList.tsx`

**Step 1: Update AnnotationList**

Changes:
- [ ] Panel: `rounded-sm` → `rounded-2xl`, keep `shadow-floating`
- [ ] All raw `<button>` → RDNA `<Button>` (close/+ Pin = `Button variant="text" size="sm"`, resolve/dismiss = `Button variant="text" size="sm"`, OK = `Button variant="outline" size="sm"`)
- [ ] Remove all eslint exception comments
- [ ] Inline input: `rounded-xs` → `rounded-lg`, add `transition-colors`
- [ ] Add popup entrance animation class

**Step 2: Verify + Commit**

```
feat(playground): upgrade AnnotationList panel + Button migration
```

---

## Task 5: Collapsible Sections in ComposerShell

**Files:**
- Modify: `tools/playground/app/playground/components/ComposerShell.tsx`
- Modify: `tools/playground/app/playground/components/AnnotationComposer.tsx`
- Modify: `tools/playground/app/playground/components/VariationComposer.tsx`
- Modify: `tools/playground/app/playground/components/AdoptComposer.tsx`

Add CSS grid-row accordion for the `children` controls slot, with a toggle chevron.

**Step 1: Add collapsible wrapper to ComposerShell**

Add a new `ComposerSection` export — a collapsible wrapper using the CSS grid-row trick:

```tsx
export function ComposerSection({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1"
      >
        <ComposerLabel>{label}</ComposerLabel>
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform duration-slow ease-[var(--easing-spring)] ${open ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-slow ease-[var(--easing-spring)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
```

Note: The `<button>` inside `ComposerSection` is a toggle control, not an action button — it's semantically a disclosure widget. Use `<Button variant="text" size="sm">` if RDNA Button supports it well, otherwise keep as raw `<button>` with a single documented exception.

**Step 2: Update three composer wrappers**

Wrap each controls section in `<ComposerSection>`:

- **AnnotationComposer**: Wrap intent picker in `<ComposerSection label="Intent">`, priority in `<ComposerSection label="Priority">`, mode in `<ComposerSection label="Mode" defaultOpen={false}>`, states in `<ComposerSection label="States" defaultOpen={false}>`
- **VariationComposer**: Wrap mode in `<ComposerSection label="Mode">`, states in `<ComposerSection label="States">`
- **AdoptComposer**: Wrap mode in `<ComposerSection label="Mode">`, variant picker in `<ComposerSection label="Replace variant">`

**Step 3: Verify + Commit**

```
feat(playground): add collapsible sections to composer controls
```

---

## Task 6: Numbered Marker Pins — AnnotationPin

**Files:**
- Modify: `tools/playground/app/playground/components/AnnotationPin.tsx`

Redesign the pin to match Agentation's numbered marker pattern: colored circle, scale entrance, hover scale-up, hover tooltip.

**Step 1: Redesign AnnotationPin**

```tsx
"use client";

import { useState } from "react";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationPinProps {
  annotation: ClientAnnotation;
  index: number;
  onClick: (annotation: ClientAnnotation, element: HTMLElement) => void;
}

const INTENT_COLORS: Record<string, string> = {
  fix: "bg-danger text-page",
  change: "bg-warning text-page",
  question: "bg-main text-page",
  adopt: "bg-main text-page",
};

export function AnnotationPin({ annotation, index, onClick }: AnnotationPinProps) {
  if (annotation.x == null || annotation.y == null) return null;

  const [hovered, setHovered] = useState(false);
  const isPending = annotation.status === "pending" || annotation.status === "acknowledged";
  const colorClass = isPending
    ? (INTENT_COLORS[annotation.intent] ?? "bg-main text-page")
    : "bg-mute text-page";

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(annotation, e.currentTarget); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group/pin absolute z-10"
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        animation: `markerIn var(--duration-slow) var(--easing-spring) both`,
        animationDelay: `${index * 20}ms`,
      }}
    >
      {/* Marker circle */}
      <div
        className={`flex h-[22px] w-[22px] -translate-x-1/2 -translate-y-full items-center justify-center rounded-full font-mono text-xs font-semibold shadow-glow-sm transition-transform duration-fast ${colorClass} ${
          hovered ? "scale-110" : ""
        } active:scale-[0.92]`}
      >
        {index + 1}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute left-1/2 top-[6px] z-20 w-[180px] -translate-x-1/2 rounded-xl bg-page px-3 py-2 shadow-raised"
          style={{ animation: `popupIn var(--duration-fast) var(--easing-spring) both` }}
        >
          <p className="line-clamp-2 font-mono text-xs text-main">{annotation.message}</p>
          <span className="font-mono text-xs text-mute">{annotation.intent}</span>
        </div>
      )}
    </button>
  );
}
```

Key changes:
- [ ] 22px colored circle badge instead of outlined pin-with-stem
- [ ] Color by intent (fix=danger/red, change=warning/yellow, question/adopt=main/cream)
- [ ] Staggered `markerIn` entrance animation (20ms per pin)
- [ ] Hover scale 1.1 with `duration-fast` transition
- [ ] Press `scale(0.92)` via `active:scale-[0.92]`
- [ ] Hover tooltip showing message preview + intent
- [ ] `shadow-glow-sm` on the circle for RDNA glow

**Step 2: Verify + Commit**

```
feat(playground): redesign AnnotationPin as numbered marker with animations
```

---

## Task 7: Count Badge — AnnotationBadge

**Files:**
- Modify: `tools/playground/app/playground/components/AnnotationBadge.tsx`

Upgrade to Agentation-style count badge: pill shape, accent background, bounce entrance, RDNA glow.

**Step 1: Redesign AnnotationBadge**

```tsx
"use client";

import { useAnnotationContext } from "../annotation-context";

interface AnnotationBadgeProps {
  componentId: string;
  onClick?: () => void;
}

export function AnnotationBadge({ componentId, onClick }: AnnotationBadgeProps) {
  const { countForComponent } = useAnnotationContext();
  const count = countForComponent(componentId);

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning px-1 font-mono text-xs font-semibold text-page shadow-glow-sm transition-transform duration-fast hover:scale-110 active:scale-[0.92]"
      style={{ animation: `badgeIn var(--duration-slow) var(--easing-spring) 0.4s both` }}
      title={`${count} pending annotation${count === 1 ? "" : "s"}`}
    >
      {count}
    </button>
  );
}
```

Changes:
- [ ] Circular pill (18px min, `rounded-full`)
- [ ] `bg-warning` (sun-yellow) background with `text-page` (dark) text
- [ ] `shadow-glow-sm` for RDNA warm glow
- [ ] `badgeIn` bounce entrance with 400ms delay (appears after parent mounts)
- [ ] Hover scale 1.1, press scale 0.92
- [ ] Remove inline SVG icon — just the count number
- [ ] Removed all hardcoded colors

**Step 2: Verify + Commit**

```
feat(playground): redesign AnnotationBadge with bounce entrance + glow
```

---

## Task 8: Update Demo Wrappers

**Files:**
- Modify: `tools/playground/app/playground/components/playground-ui-demos.tsx`

Update demos to reflect the visual changes from Tasks 2–7. The key updates:
- [ ] `ComposerShellDemo`: use `ComposerSection` for controls
- [ ] `AnnotationPinDemo`: verify new marker rendering works with mock data
- [ ] `AnnotationBadgeDemo`: render a standalone badge (may need to mock context or render inline)
- [ ] `AnnotationDetailDemo`: adjust container height if panel is taller with rounder radius
- [ ] Verify all demos render without errors

**Step 1: Update demos + Verify**

Run: `npx tsc --noEmit`
Expected: Clean.

**Step 2: Commit**

```
chore(playground): update playground-ui-demos for visual refinement
```

---

## Task 9: Visual QA + Polish

**Files:** All modified files from Tasks 2–8

Final pass:
- [ ] Start dev server (`pnpm dev` from repo root)
- [ ] Navigate to `localhost:3004/playground`
- [ ] Scroll to "Playground UI" group
- [ ] Verify each demo card renders correctly
- [ ] Check dark mode glow on all panels
- [ ] Check animations play (popup entrance, marker stagger, badge bounce)
- [ ] Check collapsible sections open/close smoothly
- [ ] Check Button sizing looks appropriate (not too tall for compact UI)
- [ ] Test hover/press micro-interactions on pins and badges
- [ ] Test actual annotation flow on a real component card (pin placement → detail popup → resolve)
- [ ] Fix any visual issues found

**Commit:**

```
fix(playground): visual QA polish pass
```

---

## Execution Notes

**Batch strategy:** Tasks 1–4 (keyframes + panel shape) form the first batch. Tasks 5–7 (collapsible + markers + badge) form the second batch. Task 8–9 (demos + QA) form the third batch.

**Button migration caveat:** RDNA `<Button size="sm">` is 24px tall with 12px text. If this feels too large for the ultra-compact annotation UI, fall back to `<Button variant="text" size="sm" className="...">` with custom sizing, or use `<Button variant="ghost" size="sm" className="!h-5 !px-1.5">` for tighter fit. Test visually before committing to one approach.

**Animation accessibility:** All animations use `var(--duration-scalar)` multiplication if the token is wired through. Currently the keyframes use RDNA duration tokens via `var()` in the `animation` shorthand, which respects `prefers-reduced-motion` when `--duration-scalar: 0` is set. Verify this works.
