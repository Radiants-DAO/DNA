# RDNA Fix Log

Append-only record of every design system fix processed through the playground annotation pipeline.
Used to identify recurring patterns and iteratively improve the design system.

**Format:** Each entry is a level-2 heading with date, component, priority, and intent.

---

## 2026-03-16 — Toggle — P2 fix — hardcoded radius

- **Component:** Toggle
- **File:** `packages/radiants/components/core/Toggle/Toggle.tsx`
- **Priority:** P2
- **Annotation:** Toggle track uses hardcoded border-radius instead of radius-sm token
- **Fix:** Replaced `rounded-full` with `rounded-sm` in track styles
- **Resolved by:** Claude

---


## 2026-03-16 — toggle [P2/fix]
**Problem:** Toggle track uses hardcoded border-radius instead of radius-sm token
**Resolution:** Replaced rounded-full with rounded-sm in the track styles
**Files:** packages/radiants/components/core/Toggle/Toggle.tsx
