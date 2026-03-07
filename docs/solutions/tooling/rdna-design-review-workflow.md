# RDNA Design Review Workflow

Use this workflow after design-system changes, component migrations, or new RDNA lint rules.

## 1. Static lint pass

Run:

```bash
pnpm lint:design-system
```

Use lint to catch token drift and structural mistakes:
- raw colors, spacing, typography, radius, shadow, motion
- raw HTML controls where RDNA primitives should be used
- viewport breakpoints inside RadOS window content

Repo-local review rules stay in the app config, not the shared plugin surface:
- `rdna/require-exception-metadata`
- `rdna/no-mixed-style-authority`

Lint is the fast structural gate. It does not replace visual QA.

## 2. Dual-localhost RadOS compare

Compare:
- baseline: `http://localhost:3000`
- feature branch: `http://localhost:3100`

Primary regression surface:
- `RadOS -> Brand Assets -> Components`

Use the Brand Assets viewer first because it concentrates the highest number of shared primitives in one place.

## 3. BrandAssets component viewer pass

Sanity check component families in the viewer:
- forms
- overlays
- navigation
- feedback
- stateful primitives

For each changed component, compare baseline vs feature for:
- default, hover, focus, disabled, and open states
- overlay stacking and portal placement
- keyboard interaction parity

## 4. Manual QA checklist

Capture screenshots or notes for:
- chrome vs environment hierarchy: window chrome should stay visually distinct from app content
- motion timing and reduced motion: duration/easing should feel consistent, and reduced-motion paths should still behave cleanly
- radius consistency: corners should align to RDNA radius tokens across controls, surfaces, and overlays
- elevation consistency: shadows should preserve the intended hierarchy between resting, raised, floating, and modal layers
- container queries inside windows: app layouts should respond to window width with `@sm:` / `@md:` variants, not viewport breakpoints

## 5. When to use lint vs visual QA

Use lint when the question is:
- "Did we hardcode a value?"
- "Did we use the wrong primitive?"
- "Did we break a known structural rule?"

Use visual QA when the question is:
- "Does this still look like RDNA?"
- "Did the hierarchy, motion, or overlay behavior regress?"
- "Does the windowed layout still respond correctly at real sizes?"

You need both for design-system work.
