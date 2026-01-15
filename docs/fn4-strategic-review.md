# fn-4 Strategic Decisions: Collaborative Review

> **Purpose:** Interactive Q&A for strategic decisions requiring human judgment.
> **Tasks:** fn-4.1 (Storybook), fn-4.2 (RepoPrompt), fn-4.9 (Prompt Library)
> **Status:** In Review

---

## How to Use This Document

1. Read each section's **Context** and **Key Questions**
2. Add your responses in the **Your Input** sections
3. Review linked resources as needed
4. We'll synthesize decisions together

---

## fn-4.1: Storybook Integration Feasibility

### Context

Storybook is the industry standard for component development:
- **Stories**: Render component states in isolation
- **Docs**: Auto-generated documentation
- **Testing**: Visual regression, interaction testing
- **Addons**: a11y, controls, design tokens, Figma integration

RadFlow could relate to Storybook in three ways:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Complement** | RadFlow = tokens/assets/prompts, Storybook = component dev | Best of both, familiar DX | Two tools to maintain |
| **Replace** | Build component workshop into RadFlow | Full control, native feel | Massive scope, reinventing wheel |
| **Embed** | Storybook inside Tauri WebView | Native wrapper, Storybook power | Complex integration, update friction |

### Key Resources
- [Storybook Docs](https://storybook.js.org/docs)
- [Storybook Design Tokens Addon](https://storybook.js.org/addons/storybook-design-token)
- [Storybook Figma Addon](https://storybook.js.org/addons/storybook-addon-designs)
- [Chromatic](https://www.chromatic.com/) (visual testing by Storybook team)

### Key Questions

**Q1: What's the primary use case for RadFlow?**
- [ ] A. Token/theme editing with live preview
- [ ] B. Full component development workflow
- [ ] C. Design-to-code bridge (Figma → code)
- [ ] D. AI-assisted design system management

**Q2: Who's the primary user?**
- [ ] A. Designers editing tokens
- [ ] B. Developers building components
- [ ] C. Both equally
- [ ] D. AI agents generating UI

**Q3: Is Storybook's addon ecosystem valuable to RadFlow?**
- [ ] A. Critical - want a11y, controls, visual testing
- [ ] B. Nice to have - might use some addons
- [ ] C. Not needed - building our own tooling

**Q4: Does "native desktop app" matter more than "industry familiarity"?**
- [ ] A. Native feel is priority (Tauri advantages)
- [ ] B. Developer familiarity is priority (Storybook)
- [ ] C. Both equally important

### Your Input
> *Add your thoughts, preferences, or additional context here:*

```
[Your response]
```

### Decision: CSF Parsing Only

**Approach**: Consume Storybook's Component Story Format without embedding Storybook itself.

**Implementation**:
- Use `@storybook/csf-tools` to parse existing `.stories.tsx` files
- Discover components and their variants programmatically
- Render components directly in Tauri WebView
- Build webflow-like editing panels natively in RadFlow

**Rationale**: RadFlow provides its own editing UI. Storybook's value is the story format (CSF) as a standard for defining component states, not the runtime or addon ecosystem.

**Status**: ✅ DECIDED

---

## fn-4.2: RepoPrompt Integration Evaluation

### Context

[RepoPrompt](https://repoprompt.com) offers context management for AI workflows:
- **Context Builder**: Selects relevant files/functions for prompts
- **CLI/MCP Server**: Enables agent automation (`/rp-build`)
- **Token efficiency**: Fits context within model limits

From [Jakub's AI design engineering article](https://jakub.kr/work/using-ai-as-a-design-engineer):
> "Assume no context" paradoxically leads to better results
> "Codebase rules eliminate repetitive explanations"

RadFlow could:
1. **Integrate RepoPrompt** as infrastructure for context features
2. **Learn from patterns** but build RadFlow-native solution
3. **Defer** until core features are solid

### Key Resources
- [RepoPrompt Blog: Context Over Convenience](https://repoprompt.com/blog/context-over-convenience/)
- [RepoPrompt Product Hunt](https://www.producthunt.com/products/repo-prompt)
- [JetBrains Research: Efficient Context Management](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)

### Key Questions

**Q1: How important is context management to RadFlow's core value?**
- [ ] A. Core feature - RadFlow is an AI-assisted tool
- [ ] B. Important but not central
- [ ] C. Nice to have, can defer

**Q2: Build vs Integrate tradeoff?**
- [ ] A. Integrate RepoPrompt (faster, proven)
- [ ] B. Build custom (full control, tailored to design systems)
- [ ] C. Hybrid (use RepoPrompt CLI, custom UI layer)

**Q3: What context does RadFlow need to manage?**
- [ ] A. Theme tokens + component code
- [ ] B. Design specs + implementation
- [ ] C. Full codebase for AI generation
- [ ] D. All of the above

**Q4: Is MCP server capability important?**
- [ ] A. Yes - want RadFlow to be agent-friendly
- [ ] B. Not initially - focus on human UX first
- [ ] C. Yes - want to integrate with Claude Code, Cursor, etc.

### Your Input
> *Add your thoughts, preferences, or additional context here:*

```
[Your response]
```

### Decision: Companion App Strategy

**Approach**: Manual context management in RadFlow v1, with RepoPrompt as external companion.

**Implementation**:
- RadFlow v1: Manual context via DESIGN_SYSTEM.md and token reference docs
- Future: RepoPrompt MCP/CLI as companion for prompt development
- Theme-specific prompts developed with RepoPrompt, consumed by RadFlow
- Common prompts shared across themes

**Rationale**: RepoPrompt already excels at context management via CLI/MCP. Rather than rebuild, RadFlow focuses on visual editing while RepoPrompt handles context assembly. They complement each other.

**Integration points (future)**:
- RepoPrompt CLI for building theme context
- MCP server for agent workflows
- Export prompts to RadFlow's prompt library format

**Status**: ✅ DECIDED (v1: manual, future: companion integration)

---

## fn-4.9: Prompt Library Architecture

### Context

RadFlow needs prompts for:
1. **Migration**: Convert existing projects to RadFlow (Tailwind, shadcn, Chakra)
2. **Generation**: Scaffold new components from specs
3. **Context**: Reference docs for AI (DESIGN_SYSTEM.md pattern)

From [Shape of AI](https://www.shapeof.ai/):
- **Wayfinders**: Templates, galleries, suggestions to overcome blank canvas
- **Tuners**: Parameters to refine output
- **Governors**: Action plans, verification steps

From Jakub's article:
> "Custom commands like `/deslop` remove AI artifacts"
> "Breaking requests into sequential, smaller prompts yields superior outputs"

### Proposed Structure

```
prompt-library/
├── migration/
│   ├── tailwind-to-radflow.md      # Token mapping, class conversion
│   ├── shadcn-to-radflow.md        # Component adaptation
│   ├── chakra-to-radflow.md        # Semantic token mapping
│   └── audit-existing.md           # Analyze project before migration
│
├── generation/
│   ├── component-scaffold.md       # New component from description
│   ├── variant-expansion.md        # Add variants to existing
│   ├── dark-mode-audit.md          # Check dark mode coverage
│   └── a11y-audit.md               # Accessibility review
│
├── context/
│   ├── design-system.md            # Full DESIGN_SYSTEM.md
│   ├── token-reference.md          # Quick token lookup
│   └── anti-patterns.md            # What NOT to generate
│
└── commands/
    ├── deslop.md                   # Remove AI artifacts
    ├── simplify.md                 # Reduce complexity
    └── review.md                   # Self-review checklist
```

### Key Questions

**Q1: What's the priority order for prompt types?**
Rank 1-4:
- [ ] Migration (convert existing projects)
- [ ] Generation (scaffold new components)
- [ ] Context (reference docs for AI)
- [ ] Commands (utility prompts)

**Q2: Should prompts be versioned with the theme?**
- [ ] A. Yes - prompts coupled to token schema
- [ ] B. No - prompts are independent utilities
- [ ] C. Hybrid - some coupled, some independent

**Q3: How should prompts handle variable interpolation?**
- [ ] A. Simple `{{variable}}` placeholders
- [ ] B. Template engine (Handlebars, Mustache)
- [ ] C. Markdown with frontmatter variables
- [ ] D. Just plain markdown, context in preamble

**Q4: Should RadFlow ship default prompts or start empty?**
- [ ] A. Ship comprehensive defaults (like DESIGN_SYSTEM.md)
- [ ] B. Ship minimal starters, user builds their own
- [ ] C. Empty - users create from scratch
- [ ] D. Template gallery users can import from

### Your Input
> *Add your thoughts, preferences, or additional context here:*

```
[Your response]
```

---

## Additional Context

### From Research

**[Shape of AI](https://www.shapeof.ai/) Categories:**
- Wayfinders, Prompt Actions, Tuners, Governors, Trust Builders, Identifiers

**[UserInterface.wiki](https://www.userinterface.wiki) Insights:**
- Spring animations for user-input-driven interactions
- 12 animation principles from Disney applied to UI
- Sound earns its place through feedback value
- Browser pseudo-elements reduce JS dependencies

**[Jakub's AI Design Engineering](https://jakub.kr/work/using-ai-as-a-design-engineer):**
- Figma MCP speeds up UI scaffolding
- Custom commands (`/deslop`) for domain-specific cleanup
- Codebase rules eliminate repetitive explanations
- AI excels at tedious migrations and deduplication

### Current theme-rad-os State
Located at `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/`:
- Surface/content/edge token naming
- DESIGN_SYSTEM.md for AI code generation (635 lines)
- Lift-and-press interaction philosophy
- Hard pixel shadows (retro-modern aesthetic)

---

## Next Steps

Once you've added your input:
1. We'll discuss and finalize decisions
2. Unblock fn-4.1, fn-4.2, fn-4.9 with decisions documented
3. Complete those tasks with clear direction
4. Proceed to fn-4.11 synthesis

---

*Document created: 2026-01-15*
*Ralph running: fn-4.3-4.8, fn-4.10 (research tasks)*
