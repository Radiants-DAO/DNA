# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DNA (Design Nexus Architecture) is a theme system specification for AI-assisted development workflows. It provides a standardized token system, component schema format, and theme structure for portable design systems.

**Current Status:** Active development. Two theme packages implemented:
- `@rdna/radiants` — Reference implementation with full three-file component pattern
- `@rdna/monolith` — CRT cyberpunk theme (Solana Mobile Hackathon)

## Architecture

### Core Concepts

1. **Two-tier token system:**
   - Tier 1 (Brand): Raw palette values (`--color-sun-yellow`)
   - Tier 2 (Semantic): Purpose-based tokens that flip in color modes (`--color-surface-primary`)

2. **Three-file component pattern:**
   - `Component.tsx` — Implementation
   - `Component.schema.json` — Prop types and AI interface
   - `Component.dna.json` — Token bindings per variant

3. **Integration:** Uses [vercel-labs/json-render](https://github.com/vercel-labs/json-render) as the runtime format for AI-generated UI

### Theme Package Structure (when implemented)

```
theme-{name}/
├── package.json           # Required
├── index.css              # CSS entry point
├── tokens.css             # Design tokens (@theme blocks)
├── typography.css         # Element styles (@layer base)
├── fonts.css              # @font-face declarations
├── dark.css               # Dark mode overrides
├── components/core/       # UI components
└── dna.config.json        # Optional metadata
```

### Required Semantic Tokens

All themes must define these minimum tokens:
- `--color-surface-primary`, `--color-surface-secondary`
- `--color-content-primary`, `--color-content-inverted`
- `--color-edge-primary`

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
className="bg-surface-primary text-content-primary border-edge-primary"

// DON'T: Hardcode colors
className="bg-[#FEF8E2] text-[#0F0E0C]"
```

## Commands (planned CLI)

```bash
dna init my-theme        # Initialize new theme
dna add button card      # Add components from core
dna validate             # Validate theme structure
dna catalog generate     # Generate json-render catalog
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
| `/flow` | `tools/flow/` |
