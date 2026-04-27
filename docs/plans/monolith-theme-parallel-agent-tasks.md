# MONOLITH Theme Follow-Up Parallel Agent Tasks

Use these after the MVP foundation lands. Each task has a bounded write scope to avoid conflicts.

## Agent A: Monolith Asset + Component Audit

Prompt:

```text
Audit `/Users/rivermassey/Desktop/dev/clients/solana-mobile/apps/monolith-hackathon` and classify useful material for the RadOS MONOLITH migration. Do not edit files. Produce a concise report with three buckets:

1. Theme-only assets for `packages/monolith` (fonts, icons, images, shaders, glows, campaign art).
2. Reusable RDNA/Radiants component candidates that can be tokenized and restyled.
3. Hackathon.EXE app-specific content/code that should stay in the app.

For each candidate, include source file path, why it belongs in that bucket, migration risk, and any dependency/licensing concerns. Pay special attention to CalendarGrid, CountdownTimer, Badge/Card variants, CRT tabs/accordion, ShaderBackground, and CRTShader.
```

## Agent B: Hackathon.EXE Content Port

Prompt:

```text
Implement a richer `Hackathon.EXE` content shell in `/Users/rivermassey/Desktop/dev/DNA-monolith-theme/apps/rad-os/components/apps/HackathonExeApp.tsx` only. Preserve the app's current tab contract (`winners`, `submissions`, `archive`) and RadOS AppWindow integration. Do not modify theme runtime, hash routing, store, or package files.

Use the old Monolith app as content inspiration, but keep copy placeholder-safe where final winners are unknown. Add structured sections for winners, submissions, judging criteria, prize tracks, and archive/timeline. Keep styling token-based and compatible with both Radiants and MONOLITH themes.

Run the relevant RadOS tests/build if possible and report changed files.
```

## Agent C: Theme Visual QA + Token Gap Report

Prompt:

```text
Review the MONOLITH theme MVP in `/Users/rivermassey/Desktop/dev/DNA-monolith-theme`. Focus on token coverage and visual regressions. You may edit only `packages/monolith/*.css` if you find obvious token gaps. Do not touch app logic or component code.

Check that common semantic tokens used by RadOS still resolve under `[data-theme='monolith']`: page/card/depth/inv/tinted/hover/active/main/head/sub/mute/flip/link/line/rule/line-hover/focus/accent/accent-inv/accent-soft/danger/success/warning, glow shadows, elevation shadows, and font variables.

Return a compact before/after summary, any CSS changes made, and remaining visual risks that need browser QA.
```

## Agent D: Shared RDNA Component Promotion Plan

Prompt:

```text
Create a migration plan for promoting reusable Monolith components into RDNA/Radiants. Do not edit files. Work in `/Users/rivermassey/Desktop/dev/DNA-monolith-theme` and inspect both the current Radiants component package and `/Users/rivermassey/Desktop/dev/clients/solana-mobile/apps/monolith-hackathon`.

Rank candidate components by value and migration complexity. For each, define the target package/location, proposed public API, styling/token strategy, tests needed, and whether it should be promoted now, later, or kept app-local.

Focus on CalendarGrid, CountdownTimer, Card, Badge, CRT tabs/accordion, ShaderBackground, and transition/dither effects.
```
