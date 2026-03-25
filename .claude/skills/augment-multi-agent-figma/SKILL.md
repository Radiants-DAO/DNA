---
name: figma-augment-parallel
description:
  Guide for developers using Figma MCP with Augment Code agents (Auggie/Intent) to
  implement designs, run parallel workflows, and write back to Figma. Use this skill
  whenever someone asks about Figma + Augment, implementing a Figma design with agents,
  fanning out parallel agents from a Figma file, using Figma as a living spec in
  agents.md, or pushing implemented UI back to Figma.
metadata:
  mcp-server: figma
---

# Figma MCP + Augment: Parallel Agent Workflows

Always use **frame-level links** (copy from Figma address bar), not file-level URLs.
Rate limits apply per tool call — plan parallelism accordingly (Pro: 200/day, Enterprise: 600/day).

## Tools

| Tool | Purpose |
|------|---------|
| `get_design_context` | Frame structure as React + Tailwind |
| `get_variable_defs` | Design tokens (colors, spacing, typography) |
| `get_code_connect_data` | Maps Figma nodes → codebase components |
| `generate_figma_design` | Pushes live web UI → Figma layers (remote server only) |
| `use_figma` | Executes JS in Figma via Plugin API — write operations (alpha) |

## Patterns

### Design → Code (Fan-Out)
Assign one agent per frame link. Each agent: `get_design_context` → `get_variable_defs` → `get_code_connect_data` → implement.

### Figma as Living Spec
Store frame links in `agents.md`. Agents always fetch fresh context — no stale screenshots.

```markdown
## Figma MCP
Always call get_design_context before writing any UI. Treat output as authoritative.
Tokens follow: [your convention]. Use frame-level links only.
Frame links:
- [feature]: [link]
```

### Write-Back (Code → Figma)
After implementing: `generate_figma_design` pushes the running app to Figma for designer review.
Optionally run a verifier agent in parallel using `get_design_context` to diff spec vs. implementation.

### Write to Figma (use_figma — Alpha)
Runs JS against the Plugin API to create/modify variables, components, and variants.
- **Load `figma-use` skill first** (from alpha plugin zip) — contains required API rules
- Writes are **sequential only** — never parallelize `use_figma` calls
- After each step: validate with `get_metadata`, clean up orphans before retrying on error

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Generic HTML output | Set up Code Connect in Figma Dev Mode |
| Wrong node returned | Use `?node-id=` frame links, not file root |
| Duplicate nodes after retry | Run `get_metadata`, remove orphans, then retry |
| Write corruption | `use_figma` must be sequential — one call at a time |
