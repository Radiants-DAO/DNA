# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DNA (Design Nexus Architecture) is a theme system specification for AI-assisted development workflows. It provides a standardized token system, component schema format, and theme structure for portable design systems.

**Current Status:** Active development — Turborepo + pnpm monorepo.

### Monorepo Map

**Packages:**
- `@rdna/radiants` — Reference theme with 25 core components, ESLint plugin, icons, remotion, hooks
- `@rdna/monolith` — CRT cyberpunk theme (Solana Mobile Hackathon)
- `@rdna/preview` — Shared `PreviewPage` component for theme previews

**Apps:**
- `rad-os` — Next.js 16 desktop-OS UI with draggable window system (9 registered apps)
- `radiator` — Next.js 14 Solana NFT burning tool
- `monolith-hackathon` — Next.js 15 Solana Mobile Hackathon showcase
- `radmark` — Vite Chrome extension (X/Twitter bookmarks → Obsidian)

**Tools:**
- `flow` — Browser extension (WXT + pnpm workspace)
- `dithwather` — Vendored dithering library (Turborepo sub-monorepo)

## Architecture

### Core Concepts

1. **Two-tier token system:**
   - Tier 1 (Brand): Raw palette values (`--color-sun-yellow`)
   - Tier 2 (Semantic): Purpose-based tokens that flip in color modes (`--color-page`)

2. **Three-file component pattern:**
   - `Component.tsx` — Implementation
   - `Component.schema.json` — Prop types and AI interface
   - `Component.dna.json` — Token bindings per variant

3. **Integration:** Uses [vercel-labs/json-render](https://github.com/vercel-labs/json-render) as the runtime format for AI-generated UI

### Theme Package Structure

```
theme-{name}/
├── package.json           # Required
├── index.css              # CSS entry point
├── tokens.css             # Design tokens (@theme blocks)
├── typography.css         # Element styles (@layer base)
├── fonts.css              # @font-face declarations
├── dark.css               # Dark mode overrides
├── base.css               # Base reset/element styles
├── animations.css         # Motion tokens/keyframes
├── components/core/       # UI components
└── dna.config.json        # Optional metadata
```

### Required Semantic Tokens

All themes must define these minimum tokens:
- `--color-page`, `--color-inv`
- `--color-main`, `--color-flip`
- `--color-line`

## Key Decisions

| Area | Choice |
|------|--------|
| CSS | Tailwind v4 native (`@theme` blocks) |
| Token naming | Semantic: `surface-*`, `content-*`, `edge-*` |
| Components | Copy-on-import, not installed as dependencies |
| Color modes | Light + Dark only (v1) |
| Motion | CSS-first, ease-out only, max 300ms |
| Icons | Lucide base (24x24 grid, 2px stroke) |

## Styling Rules

```tsx
// DO: Use semantic tokens
className="bg-page text-main border-line"

// DON'T: Hardcode colors
className="bg-[#FEF8E2] text-[#0F0E0C]"
```

## ESLint Plugin (`eslint-plugin-rdna`)

Custom ESLint plugin at `packages/radiants/eslint/`, imported as `@rdna/radiants/eslint`. Plain ESM (`.mjs`), no build step.

### Rules (core shipped)

| Rule | What it catches |
|------|----------------|
| `rdna/no-hardcoded-colors` | non-semantic color usage in classNames or style objects |
| `rdna/no-hardcoded-spacing` | Arbitrary bracket spacing (`p-[12px]`) |
| `rdna/no-hardcoded-typography` | Arbitrary font-size/weight in brackets |
| `rdna/prefer-rdna-components` | Raw `<button>`, `<input>`, `<select>`, `<dialog>`, etc. |
| `rdna/no-removed-aliases` | Banned tokens (`--color-black`, `--color-white`, etc.) |
| `rdna/no-raw-radius` | Arbitrary rounded classes or raw radius styles |
| `rdna/no-raw-shadow` | Arbitrary shadow classes or raw `boxShadow` styles |
| `rdna/no-hardcoded-motion` | Arbitrary duration/easing classes or raw motion styles |

### Configs

| Config | Scope | Notes |
|--------|-------|-------|
| `recommended` | `apps/rad-os/**`, `apps/radiator/**` | 8 shared RDNA rules at `warn` |
| `internals` | `packages/radiants/components/core/**` | `prefer-rdna-components: off` |
| `recommended-strict` | Not yet activated | Shared rules at `error` (migration target) |

### Repo-local RDNA review rules (shipped in `eslint.rdna.config.mjs`)

- `rdna/no-viewport-breakpoints-in-window-layout`
- `rdna/require-exception-metadata`
- `rdna/no-broad-rdna-disables`
- `rdna/no-mixed-style-authority`

**Exception format**:
```tsx
// eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123
```

Only `eslint-disable-next-line` is allowed for `rdna/*` exceptions. `owner` must be a lowercase team slug, `issue` can also be a full `https://...` URL, and new exceptions are reported in CI.

**Governance:** shared rules still follow `warn` → fix baseline → flip to `error` → pre-commit → CI.

## Commands

```bash
pnpm dev                    # Turbo dev (all workspaces)
pnpm build                  # Turbo build
pnpm lint                   # Turbo lint
pnpm lint:design-system     # RDNA ESLint rules only
```

## Playground Work Signals

When the playground is running (`localhost:3004`), **work-start signals fire automatically** via a PreToolUse hook (`.claude/hooks/playground-work-signal.sh`) whenever you edit a file inside a component directory. No manual action needed for work-start.

After you finish modifying a component, signal completion manually:

```bash
node tools/playground/bin/rdna-playground.mjs work-end <component-id>
```

Component IDs are **lowercase** — the registry uses `name.toLowerCase()` (e.g. `toggle`, `dialog`, `dropdownmenu`).

To clear all active signals at once:

```bash
node tools/playground/bin/rdna-playground.mjs work-end
```

The hook fails silently if the playground is not running, so it never blocks editing.

### Annotation Injection

When the playground is running, pending annotations for the component you're editing are **automatically printed** via a PreToolUse hook (`.claude/hooks/playground-annotation-inject.sh`). You'll see output like:

```
[playground] 2 pending annotation(s) on "button":
  [fix/blocking] Border radius should use radius-sm token, not hardcoded 4px
  [change/suggestion] Consider warmer hover state for the brand refresh
```

Address these annotations in your work. When done, resolve them:

```bash
node tools/playground/bin/rdna-playground.mjs resolve <annotation-id> "Fixed with radius-sm"
```

Or dismiss if not applicable:

```bash
node tools/playground/bin/rdna-playground.mjs dismiss <annotation-id> "Not applicable to this variant"
```

## Specification

The complete specification is in `docs/theme-spec.md`. Key sections:
- Section 3: Token structure and naming conventions
- Section 4: Package structure options
- Section 7: Component schema format
- Section 12: Validation rules

## User Communication Style

The user communicates tersely and rapidly. Interpret the following patterns:

### Abbreviations
| Short | Meaning |
|-------|---------|
| `w/` / `w/o` | with / without |
| `rn` | right now |
| `rq` | real quick |
| `wdyt` | what do you think? |
| `lmk` | let me know |
| `prev` | preview (deployment or Vercel preview) |
| `prod` | production |
| `bg` | background |
| `deps` | dependencies |
| `ye` | yeah / yes |
| `gg` | good game / well done |
| `impl` | implementation |
| `CTA` | call to action |
| `RDNA` | @rdna npm scope |

### Terse Commands
| Input | Meaning |
|-------|---------|
| `continue` | Proceed with current task / next step |
| `what's next?` | What should we work on next in the plan? |
| `do it` | Proceed with the proposed approach |
| `start work!` | Begin executing the current plan |
| `undo` | Revert the most recent change |
| `kill it` / `kill the [X]` | Remove / delete it |
| `scrap` | Delete and start over |
| `rebuild` / `rebuid` | Rebuild the extension/project |
| `deploy` / `push to prod` / `push to prev` | Deploy to production or Vercel preview |
| `spawn a team` | Create parallel agents for a task |
| `investigate` / `diagnose` | Debug the issue and report findings |
| `this session` | The changes from this conversation |
| `paralell` | Run tasks concurrently |

### Bare Values = CSS Adjustments
When the user sends just a number or CSS value (e.g., `80%`, `1.25`, `try 1.15`, `0.5 rem`),
apply that value to the property most recently discussed.

### Option Selection
`1a, 2b` or `1a 2d` = selecting choices from a numbered/lettered list.
A standalone letter like `B` = selecting that option.

### Feedback Signals
| Response | Meaning |
|----------|---------|
| `great` / `fantastic` / `wonderful` | Approved, continue |
| `yup` / `ye` / `that's fine` | Yes, proceed |
| `nope` / `nah` | No, that is wrong |
| `not quite` / `close but` | Direction is right, execution is off |
| `hm` | Skeptical, something seems off |
| `oop` | User made a mistake, self-correcting |
| `still [X]` | The fix did not work, problem persists |
| `sweet` / `whew` | Satisfied / that was significant |

### Known Spelling Patterns
These are consistent spellings, not typos to correct:
- `impliment` / `implimentation` / `implimented` = implement
- `posistion` / `posistioned` = position
- `neccisary` = necessary
- `paralell` = parallel
- `seperate` = separate
- `scaffhold` = scaffold
- `calender` = calendar
- `accessability` = accessibility
- `dissapear` = disappear
- `redepploy` = redeploy
- `andriod` = android

### Agent Preference
Prefer `spawn a team` (Task tool) over individual subagents. Use teams for parallel work — the user has tokens to use.

### Project Nicknames
| Shorthand | Refers To |
|-----------|-----------|
| `/radiants` | `packages/radiants/` |
| `/monolith` | `packages/monolith/` or `apps/monolith-hackathon/` |
| `/rad-os` | `apps/rad-os/` |
| `/radiator` | `apps/radiator/` |
| `/radmark` | `apps/radmark/` |
| `/flow` | `tools/flow/` |
| `/dithwather` | `tools/dithwather/` |
