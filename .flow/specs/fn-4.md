# fn-4 Design System Infrastructure: Tooling, Extended Tokens & AI Integration

## Overview

Expand RadFlow's design system beyond core theme tokens to encompass the full infrastructure needed for a production-ready, AI-assisted design system platform. This epic covers tooling decisions, extended token systems, and AI integration patterns.

**Builds on:** fn-3 (Theme Spec Research) — assumes core token architecture is finalized

**Goal:** Define the complete infrastructure for theme-rad-os as a reusable design system for RadTools child projects, with AI-assisted workflows and potential tooling integrations.

## Scope

### In Scope
- Tooling integration decisions (Storybook, RepoPrompt)
- Extended token systems (icons, motion, a11y, sound, density, i18n)
- Prompt library architecture for AI-assisted workflows
- Migration prompt patterns for existing projects
- AI UX patterns specific to RadFlow

### Out of Scope
- Core token architecture (covered in fn-3)
- Actual implementation of tokens (future epic)
- Building RepoPrompt/Storybook from scratch

## Context

### Current State (theme-rad-os)
Located at `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/`:
- Surface/content/edge token naming
- Brand colors → semantic tokens architecture
- DESIGN_SYSTEM.md for AI code generation
- Animation philosophy (lift-and-press, ease-out, max 300ms)
- Dark mode strategy (hard shadows → yellow glows)

### Strategic Questions
1. **Storybook relationship**: Complement, replace, or embed?
2. **RepoPrompt integration**: Use their CLI/MCP for context management?
3. **Framework support**: React-first → multi-framework migration path

### Key Resources
- [Shape of AI](https://www.shapeof.ai/) — AI UX pattern library (wayfinders, tuners, governors, trust builders)
- [RepoPrompt](https://repoprompt.com) — Context management CLI/MCP
- [Storybook](https://storybook.js.org/docs) — Component workshop patterns
- [UserInterface.wiki](https://www.userinterface.wiki) — Animation principles, sound design

## Approach

### Task Categories

**Tooling Research (Priority 1)**
- fn-4.1: Storybook integration feasibility
- fn-4.2: RepoPrompt integration evaluation

**Extended Token Systems (Priority 2)**
- fn-4.3: Icon system architecture
- fn-4.4: Motion token system
- fn-4.5: Accessibility token patterns
- fn-4.7: Density/responsive system

**Extended Research (Priority 3)**
- fn-4.6: Sound design patterns (defer impl)
- fn-4.8: i18n token patterns

**AI Integration (Priority 2)**
- fn-4.9: Prompt library architecture
- fn-4.10: AI UX patterns for RadFlow

**Synthesis (Priority 10)**
- fn-4.11: Compile findings into design-system-infrastructure.md

## Task Details

### fn-4.1: Storybook Integration Feasibility
Evaluate whether RadFlow should:
- **Complement**: RadFlow manages tokens/assets/prompts, Storybook handles component dev
- **Replace**: Build full component workshop into RadFlow
- **Embed**: Run Storybook inside Tauri shell

Research areas:
- CSF (Component Story Format) compatibility
- Addon ecosystem value (a11y, testing, controls, docs)
- Tauri WebView embedding options
- Developer familiarity vs. native advantages

### fn-4.2: RepoPrompt Integration Evaluation
Evaluate RepoPrompt's CLI/MCP as infrastructure:
- Context Builder for selective file/function loading
- `/rp-build` command for automated context assembly
- MCP server for agent workflows
- Token efficiency and effective context window management

### fn-4.3: Icon System Architecture
- Grid standards (16px, 20px, 24px)
- Stroke weight consistency rules
- Naming conventions
- SVG optimization pipeline
- Icon animation states
- Icon + text baseline alignment

Research: Lucide, Heroicons, Phosphor, Radix Icons

### fn-4.4: Motion Token System
Tokenize animation parameters:
- Duration tokens (`--duration-instant`, `--duration-quick`, etc.)
- Easing function tokens
- Spring physics presets
- `prefers-reduced-motion` handling
- Orchestration patterns

Research: Framer Motion, Motion One, View Transitions API

### fn-4.5: Accessibility Token Patterns
- Focus ring tokens (width, offset, color)
- Touch target minimums
- Color contrast validation rules
- Screen reader announcement patterns
- Keyboard navigation conventions

Research: Radix Primitives, ARIA Patterns

### fn-4.6: Sound Design Patterns
Research for future implementation:
- Audio sprite management
- Volume level tokens
- Sound categories
- Preference persistence

### fn-4.7: Density/Responsive System
- Breakpoint tokens
- Component density variants (compact, default, comfortable)
- Container queries vs media queries
- Fluid spacing/typography scales

### fn-4.8: i18n Token Patterns
- RTL/LTR switching
- Text expansion accommodation
- Font stacks for CJK
- Date/number format conventions

### fn-4.9: Prompt Library Architecture
Define structure:
```
prompt-library/
├── migration/           # Migrate existing projects to RadFlow
├── generation/          # Scaffold new components
└── context/             # Reference docs for AI
```

### fn-4.10: AI UX Patterns
Apply Shape of AI patterns:
- Wayfinders (prompt galleries, suggestions)
- Tuners (parameter controls, filters)
- Governors (action plans, verification)
- Trust Builders (disclosure, transparency)

### fn-4.11: Synthesis
Compile all findings into `docs/design-system-infrastructure.md`

### fn-4.12: Review fn-3 Scope
After synthesis, determine fn-3's fate:
- **Update**: Modify fn-3 tasks based on fn-4 learnings
- **Merge**: Fold remaining fn-3 work into fn-4
- **Complete**: Mark fn-3 done if superseded
- **Keep separate**: fn-3 remains valid for core tokens, fn-4 handles infrastructure

Document decision with rationale.

## Quick commands
```bash
.flow/bin/flowctl show fn-4           # View epic
.flow/bin/flowctl tasks --epic fn-4   # List tasks
.flow/bin/flowctl ready --epic fn-4   # What's ready to start
cat /Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/DESIGN_SYSTEM.md
```

## Acceptance
- [ ] Storybook relationship decided with clear rationale
- [ ] RepoPrompt integration decision made
- [ ] Icon system architecture documented
- [ ] Motion tokens specified
- [ ] Accessibility tokens specified
- [ ] Sound patterns researched (defer impl)
- [ ] Density/responsive system documented
- [ ] i18n patterns documented
- [ ] Prompt library structure defined
- [ ] AI UX patterns adapted for RadFlow
- [ ] All findings synthesized into design-system-infrastructure.md
- [ ] fn-3 scope reviewed and fate decided

## Dependencies
- fn-3.6 (theme-spec.md finalized) — core tokens must be decided first

## References
- Current theme: `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/`
- fn-3 spec: `.flow/specs/fn-3.md`
- Shape of AI: https://www.shapeof.ai/
- RepoPrompt: https://repoprompt.com
- Storybook: https://storybook.js.org/docs
- UserInterface.wiki animation: https://www.userinterface.wiki/12-principles-of-animation
- UserInterface.wiki springs: https://www.userinterface.wiki/to-spring-or-not-to-spring
- UserInterface.wiki sound: https://www.userinterface.wiki/sounds-on-the-web
- UserInterface.wiki pseudo-elements: https://www.userinterface.wiki/taking-advantage-of-pseudo-elements
