# fn-4.10 Research: AI UX patterns for RadFlow (wayfinders, tuners, governors)

## Description
Research and adapt AI UX patterns from Shape of AI for RadFlow's design system editing context. Document patterns for wayfinders (prompt construction), tuners (output refinement), governors (human oversight), trust builders (confidence indicators), and identifiers (visual language).

## Acceptance
- [x] Research Shape of AI pattern categories
- [x] Adapt Wayfinders patterns (gallery, suggestions, templates, follow-up, nudges)
- [x] Adapt Input patterns (inline action, transform, regenerate)
- [x] Adapt Tuners patterns (parameters, filters, attachments, voice/tone)
- [x] Adapt Governors patterns (action plan, verification, controls, stream of thought, branches)
- [x] Adapt Trust Builders patterns (disclosure, caveat, data ownership)
- [x] Define Identifiers (avatar, color, iconography)
- [x] Integrate patterns with RadFlow features (Variables Editor, Component Browser, Search)
- [x] Provide implementation recommendations with phases
- [x] Output research document to docs/research/ai-ux-patterns.md

## Done summary
Created comprehensive AI UX patterns research document (docs/research/ai-ux-patterns.md). Adapted all six Shape of AI pattern categories to RadFlow's design system context:

1. **Wayfinders** - Prompt gallery, contextual suggestions, templates, follow-up clarifications
2. **Inputs** - Inline actions on tokens, format transforms, regenerate alternatives
3. **Tuners** - Parameters (WCAG level, scaling), filters (scope limits), attachments (DESIGN_SYSTEM.md), voice/tone
4. **Governors** - Action plans before changes, visual previews, pause/stop controls, reasoning transparency, version branches
5. **Trust Builders** - AI-generated disclosure indicators, limitation caveats, data privacy controls
6. **Identifiers** - Diamond avatar (◇), Sky Blue accent, consistent iconography (✨ ◈ ✓ ⚠ ↺)

Key architectural decisions:
- AI operates as assistant, not autonomous agent
- Governors are critical - no silent code changes
- Uses existing RadOS Sky Blue for AI accent (no new brand colors)
- Phased implementation: safety/trust first, then wayfinders, then polish
## Evidence
- Commits:
- Tests:
- PRs: