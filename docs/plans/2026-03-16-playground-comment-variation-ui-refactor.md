# Playground Comment/Variation UI Refactor

**Date:** 2026-03-16
**Status:** Planned
**Scope:** `tools/playground/app/playground/components/` + `nodes/ComponentCard.tsx`
**Gold standard:** `/Users/rivermassey/Downloads/agentation-main` (animation patterns only — colors/tokens stay RDNA)

---

## Problem Statement

All annotation and variation UI in the playground has zero transition animations. Popovers snap in and out, pins appear instantly, loading states show static "...", and input focus states are broken. Additionally, **every annotation component is saturated with hardcoded colors, typography, and shadows** that violate RDNA design system rules. This refactor addresses both: polish the motion layer AND migrate all styling to semantic tokens.

---

## Audit Findings Summary

### Critical Jank (P1)

| Issue | Location |
|---|---|
| All popovers mount/unmount with no transition | `AnnotationComposer`, `VariationComposer`, `AnnotationDetail`, `AnnotationList`, `ViolationBadge`, adopt dropdown — all conditional `{condition && <X />}` |
| AnnotationPin has no enter/exit animation | `AnnotationPin.tsx` — instant appearance, instant disappearance on resolve |
| Static "..." loading state on all submit buttons | `AnnotationComposer:215`, `VariationComposer:186`, `AnnotationDetail:155,184`, `AnnotationList:160` |
| Input focus rings stripped with nothing replacing them | `AnnotationDetail:142`, `AnnotationList:153` — `focus:outline-none` only |
| No visual feedback when card enters A/V mode | `ComponentCard.tsx:837` — only `cursor-crosshair`, no card-level indicator |
| IterationCard adopt dropdown: no outside-click close | `ComponentCard.tsx:106-158` |

### RDNA Token Violations (P1 — must fix alongside animation work)

| Violation | Count | Examples |
|---|---|---|
| Hardcoded colors (`rgba(254,248,226,...)`, `#FEF8E2`, `#0F0E0C`) | ~40+ | Should be `text-main`, `bg-page`, `border-rule`, `text-mute`, `bg-hover`, etc. |
| Hardcoded priority colors (`#ff6b6b`, `#ffd43b`) | 4 | Should be `text-danger`/`bg-danger`, `text-warning`/`bg-warning` |
| Hardcoded typography (`text-[10px]`, `text-[9px]`, `text-[11px]`) | ~20 | `text-[10px]` → `text-xs`, `text-[9px]` → `text-xs`, `text-[11px]` → `text-sm` |
| Non-RDNA shadows (`shadow-lg`) | 5 | Should be `shadow-floating` or `shadow-raised` |
| Raw `<button>` elements in annotation UI | ~15 | Exception needed for compact pill buttons (see Phase 2) |

### Architecture Issues (P2)

| Issue | Location |
|---|---|
| `AnnotationComposer` and `VariationComposer` are ~60% duplicated JSX | Both files |
| Popup positioning has no viewport clamping or flip logic | Both composers use raw click coords with no overflow guard |
| `AnnotationBadge` visually inconsistent with `ViolationBadge` | `AnnotationBadge.tsx` — bespoke hardcoded colors vs `<Badge>` variant |
| No stagger on multi-pin entrance/exit | `ComponentCard.tsx` — all pins mount simultaneously |

---

## RDNA Token Mapping Reference

All annotation components live inside `.dark` context. These are the correct semantic mappings:

### Colors
| Hardcoded | Semantic token | dark.css value |
|---|---|---|
| `bg-[#0F0E0C]` | `bg-page` | `--color-page: var(--color-ink)` |
| `bg-[rgba(254,248,226,0.08)]` | `bg-hover` | `--color-hover: 8% sun-yellow` |
| `bg-[rgba(254,248,226,0.14)]` | `bg-active` | `--color-active: 12% sun-yellow` |
| `bg-[rgba(254,248,226,0.06)]` | `bg-hover` | closest match |
| `text-[#FEF8E2]` | `text-main` | `--color-main: var(--color-cream)` |
| `text-[rgba(254,248,226,0.5)]` | `text-mute` | `--color-mute: cream at 60%` |
| `text-[rgba(254,248,226,0.4)]` | `text-mute` | close to mute |
| `text-[rgba(254,248,226,0.3)]` | `text-mute` | muted variant |
| `hover:text-[rgba(254,248,226,0.6)]` | `hover:text-sub` | `--color-sub: cream at 85%` |
| `border-[rgba(254,248,226,0.1)]` | `border-rule` | `--color-rule: cream at 12%` |
| `border-[rgba(254,248,226,0.12)]` | `border-rule` | same |
| `border-[rgba(254,248,226,0.2)]` | `border-line` | `--color-line: cream at 20%` |
| `border-[rgba(254,248,226,0.05)]` | `border-rule` | closest (subtler divider) |
| `focus:border-[rgba(254,248,226,0.3)]` | `focus:border-line-hover` | `--color-line-hover: cream at 35%` |
| `placeholder:text-[rgba(254,248,226,0.3)]` | `placeholder:text-mute` | |
| `text-[#ff6b6b]` | `text-danger` | `--color-danger: var(--color-sun-red)` |
| `text-[#ffd43b]` | `text-warning` | `--color-warning: var(--color-sun-yellow)` |
| `bg-[#ff6b6b]` | `bg-danger` | |
| `bg-[#ffd43b]` | `bg-warning` | |
| `bg-[rgba(254,248,226,0.15)]` | `bg-active` | |
| `border-[rgba(254,248,226,0.25)]` | `border-line` | |
| `border-[rgba(254,248,226,0.15)]` | `border-line` | |
| `border-[rgba(254,248,226,0.08)]` | `border-rule` | |

### Typography
| Hardcoded | Semantic |
|---|---|
| `text-[9px]` | `text-xs` (10px — 9px is below RDNA scale minimum) |
| `text-[10px]` | `text-xs` (10px = `--font-size-xs`) |
| `text-[11px]` | `text-sm` (12px = `--font-size-sm`) |

### Shadows
| Hardcoded | Semantic |
|---|---|
| `shadow-lg` | `shadow-floating` |

---

## Animation Reference (from Agentation — adapted to RDNA)

Agentation uses spring cubic-beziers (`0.34, 1.56, 0.64, 1`). RDNA spec says **ease-out only, max 300ms**. We add one new easing token (`--easing-spring`) to the RDNA system for popup overshoot, since the standard ease-out feels dead on scale+translate animations. All durations use RDNA tokens.

```
Popup enter:  --duration-moderate (200ms)  --easing-spring     scale(0.95)+Y(4px) → normal
Popup exit:   --duration-base (150ms)      --easing-in         reverse
Shake:        --duration-slow (300ms)      --easing-default    ±3px dampening X oscillation
Marker enter: --duration-slow (300ms)      --easing-out        scale(0.3) → scale(1), stagger 20ms
Marker exit:  --duration-moderate (200ms)  --easing-out        scale(1) → scale(0.3)
Badge enter:  --duration-slow (300ms)      --easing-spring     scale(0) → scale(1) with delay 0.4s
Btn active:   scale(0.92) --duration-fast (100ms) --easing-default on :active
```

---

## Phase 0 — RDNA Motion Token Addition

**File:** `packages/radiants/tokens.css`

Add one new easing token for popup overshoot:

```css
/* MOTION - Easing */
--easing-spring: cubic-bezier(0.22, 1, 0.36, 1);  /* Popup/badge overshoot — settle-in feel */
```

This is the more conservative spring from Agentation's marker animation — enough overshoot to feel alive, not bouncy enough to feel playful. The aggressive `(0.34, 1.56, 0.64, 1)` is too bouncy for RDNA's aesthetic.

Also update `packages/radiants/animations.css` with the new keyframes (shared, not playground-local).

---

## Phase 1 — CSS Animation Primitives

**Files to create/edit:**
- `app/playground/globals.css` — add playground-specific keyframes
- `app/playground/hooks/useAnimatedMount.ts` — new hook

### 1A. Keyframes in globals.css

All durations reference RDNA tokens via `var()`. Easings use token values directly in the `animation` shorthand (CSS keyframes don't accept `var()` for timing functions, so the consuming component sets the easing).

```css
/* Popup enter/exit — used by ComposerShell, AnnotationDetail */
@keyframes popupIn {
  from { opacity: 0; transform: scale(0.95) translateY(4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes popupOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.95) translateY(4px); }
}

/* Panel enter/exit — used by AnnotationList, ViolationBadge, adopt dropdown */
@keyframes panelIn {
  from { opacity: 0; transform: scale(0.95) translateY(4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes panelOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.95) translateY(4px); }
}

/* Pin enter/exit */
@keyframes markerIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes markerOut {
  from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  to   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
}

/* Pin stem scale */
@keyframes stemIn {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}

/* Badge count pop */
@keyframes badgeIn {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}

/* Shake — outside-click with unsaved content */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-3px); }
  40%      { transform: translateX(3px); }
  60%      { transform: translateX(-2px); }
  80%      { transform: translateX(1px); }
}

/* Pending pin pulse — uses glow tokens for cream-based ring */
@keyframes pendingPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--glow-sun-yellow-subtle); }
  50%      { box-shadow: 0 0 0 4px transparent; }
}

/* Loading dots */
@keyframes spinDot {
  0%   { opacity: 1; }
  50%  { opacity: 0.3; }
  100% { opacity: 1; }
}
```

**Key changes from original plan:**
- Removed `translateX(-50%)` from popupIn/popupOut — that's a layout concern, not an animation concern. The containing element handles centering.
- `pendingPulse` uses `var(--glow-sun-yellow-subtle)` instead of `rgba(255,255,255,0.3)` — cream-based, matches RDNA dark mode glow system.
- No hardcoded durations in keyframes — durations set by the consuming `animation` shorthand.

### 1B. `useAnimatedMount` hook

```ts
// State machine: "unmounted" → "entering" → "entered" → "exiting" → "unmounted"
// Returns { mounted, animClass } — mount on "entering"/"entered"/"exiting", unmount on "unmounted"
// Durations default to RDNA tokens: enter = 200ms (--duration-moderate), exit = 150ms (--duration-base)
```

Usage:
```tsx
const { mounted, animClass } = useAnimatedMount(isOpen, { enter: 200, exit: 150 });
return mounted ? <div className={animClass}>...</div> : null;
```

---

## Phase 2 — Shared `ComposerShell` Primitive + Full Token Migration

**File to create:** `app/playground/components/ComposerShell.tsx`

This is the **highest-value phase** — it both eliminates duplication AND converts all hardcoded values to RDNA semantic tokens in one pass.

### 2A. ComposerShell component

`AnnotationComposer` and `VariationComposer` share:
- Dark panel wrapper (`bg-page border-line shadow-floating` — not hardcoded)
- Element path header line
- Textarea with animated focus border
- Mode/States checkbox sections
- Action row: cancel + primary button
- Submit loading state (LoadingDots)

```tsx
interface ComposerShellProps {
  isOpen: boolean;
  position: { left: number; top: number };  // raw, shell handles clamping
  headerLabel: string;                       // "New annotation" or "New variation — {variant}"
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  children?: React.ReactNode;  // slot for mode-specific controls (intent/priority for annotations)
}
```

Both composers become thin wrappers that supply their mode-specific controls via `children`.

### 2B. Token migration during extraction

Every class in `ComposerShell` uses semantic tokens:

```tsx
// Panel wrapper
className="w-64 rounded-sm border border-line bg-page shadow-floating"

// Header
className="border-b border-rule px-3 py-2"
// Header text
className="font-mono text-xs uppercase tracking-widest text-mute"

// Textarea
className="w-full resize-none rounded-xs border border-rule bg-page px-2 py-1.5 font-mono text-xs text-main placeholder:text-mute focus:border-line-hover focus:outline-none"

// Section label
className="font-mono text-xs uppercase tracking-widest text-mute"

// Toggle pill (mode/state buttons) — active
className="rounded-xs px-1.5 py-0.5 font-mono text-xs bg-hover text-main"
// Toggle pill — inactive
className="rounded-xs px-1.5 py-0.5 font-mono text-xs text-mute hover:text-sub"

// Footer hint
className="font-mono text-xs text-mute"

// Cancel button
className="rounded-xs px-2 py-1 font-mono text-xs text-mute hover:bg-hover"

// Submit button
className="rounded-xs border border-line bg-hover px-2 py-1 font-mono text-xs text-main hover:bg-active disabled:opacity-40"
```

### 2C. Raw button exception

The annotation components use raw `<button>` for compact pill-style UI (10px text, minimal padding). RDNA `<Button>` enforces minimum touch targets that would break this density. Add exception to ComposerShell:

```tsx
{/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
<button ...>
```

### 2D. Migrate AnnotationDetail + AnnotationList

Apply the same token mapping to these two files during this phase:

**AnnotationDetail priority colors:**
```tsx
const PRIORITY_COLORS: Record<string, string> = {
  P1: "text-danger",
  P2: "text-warning",
  P3: "text-mute",
  P4: "text-mute",
};
```

**AnnotationList priority dots:**
```tsx
const PRIORITY_DOTS: Record<string, string> = {
  P1: "bg-danger",
  P2: "bg-warning",
  P3: "bg-mute",
  P4: "bg-mute",
};
```

All borders, backgrounds, text colors converted per the Token Mapping Reference above.

---

## Phase 3 — Popup Animations (all popovers)

**Target:** `ComposerShell`, `AnnotationDetail`, `AnnotationList`, `ViolationBadge`, adopt dropdown

Apply `useAnimatedMount` to each. Animation classes use RDNA duration + easing tokens:

- `ComposerShell` (composers):
  - Enter: `animation: popupIn var(--duration-moderate) var(--easing-spring) forwards`
  - Exit: `animation: popupOut var(--duration-base) var(--easing-in) forwards`
  - Shake: `animation: shake var(--duration-slow) var(--easing-default)` on outside-click with content

- `AnnotationList` / `ViolationBadge` / adopt dropdown (anchored panels):
  - Enter: `animation: panelIn var(--duration-moderate) var(--easing-spring) forwards`
  - Exit: `animation: panelOut var(--duration-base) var(--easing-in) forwards`

- `AnnotationDetail` (positioned below a pin):
  - Same as panel, `transform-origin: top`

### Outside-click behavior

Outside-click **shakes** if textarea has content (prevents accidental loss). Empty → dismiss.

Fix `IterationCard` adopt dropdown — add `useEffect` outside-click listener matching the `ViolationBadge` pattern.

---

## Phase 4 — Pin Animations

**File:** `app/playground/components/AnnotationPin.tsx`
**Host:** `ComponentCard.tsx` (manages `exitingPins` state)

### Enter
Staggered entrance: `animationDelay: index * 20ms`
```tsx
style={{
  animation: `markerIn var(--duration-slow) var(--easing-spring) both`,
  animationDelay: `${index * 20}ms`,
}}
```

Stem scales in after pin head:
```tsx
className="... origin-top"
style={{
  animation: `stemIn var(--duration-moderate) var(--easing-out) both`,
  animationDelay: `${(index * 20) + 100}ms`,
}}
```

### Pending pulse
Pins with `status === "pending"` get cream-based glow pulse:
```tsx
className={isPending ? "animate-[pendingPulse_2s_ease-in-out_infinite]" : ""}
```

### Exit
Add `exitingPins: Set<string>` state to `ComponentCard`. On resolve/dismiss:
1. Add pin ID to `exitingPins`
2. After `var(--duration-moderate)` (200ms) → remove from `annotations[]`
3. Pin renders `markerOut` animation while ID is in `exitingPins`

---

## Phase 5 — Smart Popup Positioning

**Used in:** `ComposerShell`, `AnnotationDetail`

Replace raw click coordinates with a clamped positioning utility:

```ts
function clampPopoverPosition(
  anchorX: number,
  anchorY: number,
  popoverW: number,
  popoverH: number,
  cardRect: DOMRect
): { left: number; top: number; flipY?: boolean }
```

Logic:
- **Horizontal:** `Math.max(popoverW/2 + 8, Math.min(cardWidth - popoverW/2 - 8, anchorX))`
- **Vertical flip:** if `anchorY > cardHeight - popoverH - 20` → render above anchor

Apply to both composers via `ComposerShell` and to `AnnotationDetail`.

---

## Phase 6 — Input & Focus Polish

**Files:** `ComposerShell`, `AnnotationDetail`, `AnnotationList`

### Textarea focus ring
Replace bare `focus:outline-none` with semantic tokens:
```tsx
className="... border border-rule focus:border-line-hover focus:outline-none transition-colors duration-base"
```

No need for JS focus state tracking — Tailwind `focus:` pseudo handles it with the right tokens.

### Animated loading state
Replace `{submitting ? "..." : label}` with:
```tsx
{submitting ? <LoadingDots /> : label}
```

`LoadingDots` — three dots with staggered fade using `bg-current` (inherits text color, RDNA-safe):
```tsx
function LoadingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1 w-1 rounded-full bg-current"
          style={{ animation: `spinDot 1s ${delay}ms ease-in-out infinite` }}
        />
      ))}
    </span>
  );
}
```

---

## Phase 7 — Card Mode Visual Feedback

**File:** `ComponentCard.tsx`

When `editorMode === "comment"` or `"variation"`:
- Faint mode-tinted ring on hover using **RDNA brand colors** (not Tailwind defaults)
- Small mode indicator badge at top-right on hover

```tsx
// Annotate mode: sun-yellow accent (matches RDNA focus/accent system)
editorMode === "comment" && isHovering
  ? "ring-1 ring-focus/30"
  : editorMode === "variation" && isHovering
  ? "ring-1 ring-sky-blue/30"
  : ""
```

**Why these colors:**
- Annotate = `ring-focus` (sun-yellow) — matches RDNA's focus ring system, natural for "mark this spot"
- Variation = `ring-sky-blue` — the only cool brand color, creates clear visual distinction from annotate

**Not** `ring-amber-400` or `ring-violet-400` — those are Tailwind defaults, not RDNA brand colors.

---

## Phase 8 — Badge Consistency

**File:** `AnnotationBadge.tsx`

Align with `ViolationBadge` by using the RDNA `<Badge>` component:

```tsx
import { Badge } from "@rdna/radiants/components/core/Badge/Badge";

// Replace custom styled button with:
<button onClick={onClick} className="cursor-pointer">
  <Badge variant="warning" size="sm">
    <CommentsBlank size={10} />
    {count}
  </Badge>
</button>
```

This:
- Uses RDNA `<Badge>` (matches ViolationBadge pattern exactly)
- Uses RDNA icon component instead of inline SVG
- Gets free dark mode styling from the design system
- Badge entrance: key on `count` to replay `badgeIn` animation on change

---

## Execution Order

```
Phase 0 (RDNA token addition)         — 1 line in tokens.css
Phase 1 (CSS primitives + hook)       — unblocks everything else
Phase 2 (ComposerShell + token migration) — biggest value: dedup + RDNA compliance
  ├── Phase 3 (popup animations)      — can parallelize after Phase 2
  ├── Phase 4 (pin animations)        — independent
  ├── Phase 5 (smart positioning)     — independent
  ├── Phase 6 (input + loading)       — independent
  ├── Phase 7 (card mode feedback)    — independent
  └── Phase 8 (badge consistency)     — independent
```

Phases 3–8 have no interdependencies and can run as parallel agents after Phase 0+1+2 land.

---

## RDNA Compliance Checklist

Before marking any phase complete, verify:

- [ ] Zero `rgba(254,248,226,...)` or `#FEF8E2` or `#0F0E0C` in changed files
- [ ] Zero `text-[Npx]` where N is not in the RDNA scale — use `text-xs`, `text-sm`, etc.
- [ ] Zero `shadow-lg` — use `shadow-floating`, `shadow-raised`, etc.
- [ ] Zero non-brand colors (`amber-400`, `violet-400`, `white/...`) — use RDNA semantic tokens
- [ ] All durations use RDNA tokens or their values (100/150/200/300ms)
- [ ] All easings use RDNA tokens (`--easing-default`, `--easing-out`, `--easing-in`, `--easing-spring`)
- [ ] `pnpm lint:design-system` passes on all changed files
- [ ] Raw `<button>` elements have proper exception comments where RDNA `<Button>` is inappropriate

---

## Files Touched

| File | Change |
|---|---|
| `packages/radiants/tokens.css` | Add `--easing-spring` token |
| `app/playground/globals.css` | Add keyframes (RDNA-compliant) |
| `app/playground/hooks/useAnimatedMount.ts` | New hook |
| `app/playground/components/ComposerShell.tsx` | New shared primitive (all semantic tokens) |
| `app/playground/components/LoadingDots.tsx` | New tiny component |
| `app/playground/components/AnnotationComposer.tsx` | Thin wrapper around ComposerShell |
| `app/playground/components/VariationComposer.tsx` | Thin wrapper around ComposerShell |
| `app/playground/components/AnnotationDetail.tsx` | Token migration, animated mount, focus fix |
| `app/playground/components/AnnotationList.tsx` | Token migration, animated mount, focus fix |
| `app/playground/components/AnnotationPin.tsx` | Enter/exit/pulse animations |
| `app/playground/components/AnnotationBadge.tsx` | Replace with RDNA Badge component |
| `app/playground/components/ViolationBadge.tsx` | Animated mount (minor) |
| `app/playground/nodes/ComponentCard.tsx` | exitingPins state, adopt dropdown fix, mode feedback |
| `app/playground/lib/clampPopoverPosition.ts` | New positioning utility |
