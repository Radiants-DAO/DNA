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
