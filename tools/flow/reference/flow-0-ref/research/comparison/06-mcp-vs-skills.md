# MCP vs Claude Code Skills: RadFlow Integration Strategy

> Task: fn-3-46x.6 | Epic: Pencil vs RadFlow Architecture Comparison
> Generated: 2026-01-22

Analysis of whether RadFlow needs MCP tools or if Claude Code skills are sufficient for its context-provider use case.

---

## Executive Summary

**Recommendation: Skills-First with Optional MCP**

RadFlow should implement **Claude Code skills** as the primary integration mechanism, with MCP as an optional addition for cross-tool compatibility. Skills are sufficient for RadFlow's context-provider workflow and align better with its philosophy.

| Approach | Recommendation | Priority |
|----------|---------------|----------|
| Claude Code Skills | Primary | High |
| MCP (read-only) | Optional | Low |
| MCP (write) | Not recommended | N/A |

---

## Part 1: Does RadFlow Need MCP?

### RadFlow's Core Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   RadFlow   │────►│  Clipboard  │────►│   Claude    │
│  (Context)  │     │  (Markdown) │     │   (Action)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │◄──────────────────────────────────────┘
       │           User reviews & approves
```

**Key Characteristics:**
1. **Context provider** - Bundles component info, tokens, file paths
2. **Clipboard-first** - Copy/paste workflow, not programmatic
3. **Human in loop** - Developer reviews AI suggestions
4. **Read-only** - Doesn't write to project files directly

### Why MCP is Not Required

| Requirement | MCP | Skills | RadFlow Need |
|-------------|:---:|:------:|:------------:|
| Programmatic context access | ✓ | ✓ | Partial |
| Cross-tool support | ✓ | ✗ | Low |
| Local execution | ✓ | ✓ | Yes |
| Claude Code integration | ✓ | ✓ | Yes |
| Direct file writes | ✓ | ✓ | No |
| Human review before action | ✗ | ✓ | Yes |

**Key Insight:** RadFlow's clipboard workflow inherently includes human review. MCP's strength (direct AI manipulation) is actually misaligned with RadFlow's philosophy.

### When MCP Would Be Valuable

MCP becomes valuable when:
1. Users want RadFlow to work with **Cursor, Windsurf, Codex** (not just Claude Code)
2. Users want **fully automated** AI workflows without copy/paste
3. RadFlow adds **direct write mode** (currently not planned)

**Current Assessment:** These scenarios are edge cases or explicitly out of scope.

---

## Part 2: Skills-Based Approach

### Proposed Skill Set

Based on Pencil's MCP tools mapped to RadFlow's context-provider needs:

#### Core Context Skills

| Skill | Description | Pencil Equivalent |
|-------|-------------|-------------------|
| `/radflow:context` | Bundle current selection as markdown | `batch_get` |
| `/radflow:tokens` | Export design tokens | `get_variables` |
| `/radflow:components` | List discovered components | `get_editor_state` |
| `/radflow:source` | Get source location for element | N/A (RadFlow-specific) |

#### Enhanced Context Skills

| Skill | Description | Pencil Equivalent |
|-------|-------------|-------------------|
| `/radflow:props` | Get component props schema | Part of `batch_get` |
| `/radflow:tree` | Get component hierarchy | `batch_get` with depth |
| `/radflow:styles` | Get computed styles | N/A |
| `/radflow:diff` | Preview pending edits | N/A |

### Skill Implementation Pattern

Skills can call RadFlow's local API via IPC:

```typescript
// Example skill: /radflow:context
// Claude Code plugin manifest
{
  "name": "radflow",
  "skills": [{
    "name": "context",
    "description": "Get context for selected RadFlow elements",
    "handler": "radflow_context"
  }]
}

// Handler implementation
async function radflow_context() {
  // Call RadFlow's local HTTP endpoint
  const response = await fetch('http://localhost:7878/api/context');
  const data = await response.json();

  return {
    type: 'markdown',
    content: formatContextAsMarkdown(data)
  };
}
```

### RadFlow Local API

Skills would communicate with RadFlow via a local HTTP server:

```
RadFlow Tauri App
       │
       │ HTTP (localhost:7878)
       ▼
┌──────────────────────────────────┐
│ /api/context   - Current selection│
│ /api/tokens    - Design tokens    │
│ /api/components - Component list  │
│ /api/source    - Source mapping   │
└──────────────────────────────────┘
       │
       │ Response (JSON)
       ▼
  Claude Code Skill
```

### Benefits of Skills Approach

1. **Simpler Implementation:** No MCP server to maintain
2. **Aligned with Workflow:** Skills fit the "ask Claude, Claude responds" pattern
3. **Human Review:** Output goes through Claude's response, user sees it
4. **Local First:** No external dependencies or protocols
5. **Incremental:** Can add skills one at a time

---

## Part 3: Pencil MCP Tools → RadFlow Skills Mapping

### Pencil's 14 MCP Tools Analyzed

| # | Pencil Tool | Purpose | RadFlow Equivalent | Type |
|---|-------------|---------|-------------------|------|
| 1 | `batch_design` | Insert/update/delete nodes | N/A (no writes) | Skip |
| 2 | `batch_get` | Read nodes by pattern | `/radflow:context` | Skill |
| 3 | `snapshot_layout` | Layout structure | `/radflow:tree` | Skill |
| 4 | `get_editor_state` | Selection, canvas info | `/radflow:context` | Skill |
| 5 | `open_document` | Open .pen file | N/A (file-based) | Skip |
| 6 | `get_variables` | Design tokens | `/radflow:tokens` | Skill |
| 7 | `set_variables` | Update tokens | N/A (no writes) | Skip |
| 8 | `find_empty_space` | Layout helper | N/A | Skip |
| 9 | `get_guidelines` | Design rules | `/radflow:prompts`? | Maybe |
| 10 | `get_style_guide` | Visual inspiration | N/A | Skip |
| 11 | `get_style_guide_tags` | Tag listing | N/A | Skip |
| 12 | `get_screenshot` | Render to image | Defer | Future |
| 13 | `replace_all_matching` | Bulk replace | N/A (no writes) | Skip |
| 14 | `search_unique_props` | Find unique values | `/radflow:search` | Skill |

### Recommended Skill Set (Minimal Viable)

**Phase 1 - Core (4 skills):**

```
/radflow:context  - Primary context bundling
/radflow:tokens   - Design token export
/radflow:source   - Source file mapping
/radflow:components - Component discovery
```

**Phase 2 - Enhanced (3 skills):**

```
/radflow:props    - Component props schema
/radflow:tree     - Component hierarchy
/radflow:styles   - Computed styles
```

**Phase 3 - Future (deferred):**

```
/radflow:screenshot - Render preview to image
/radflow:search     - Find unique property values
```

---

## Part 4: Optional MCP Implementation

If cross-tool support becomes important, RadFlow could add a minimal MCP server.

### Read-Only MCP Tool Set

| Tool | Schema | Purpose |
|------|--------|---------|
| `radflow_get_context` | `{ elements?: string[] }` | Get selection context |
| `radflow_get_tokens` | `{ theme?: string }` | Get design tokens |
| `radflow_get_components` | `{ path?: string }` | List components |
| `radflow_get_source` | `{ radflowId: string }` | Get source location |

### MCP Server Implementation

```typescript
// Minimal MCP server (via @modelcontextprotocol/sdk)
import { Server } from '@modelcontextprotocol/sdk/server';

const server = new Server({
  name: 'radflow',
  version: '1.0.0',
});

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'radflow_get_context',
      description: 'Get context for selected RadFlow elements',
      inputSchema: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    // ... other tools
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'radflow_get_context':
      return { content: [{ type: 'text', text: await getContext(args) }] };
    // ... other handlers
  }
});
```

### MCP vs Skills Trade-offs

| Factor | Skills | MCP |
|--------|--------|-----|
| Implementation effort | Low | Medium |
| Cross-tool support | Claude Code only | Claude, Cursor, Windsurf, etc. |
| User experience | Natural (`/radflow:context`) | Programmatic (tool_use) |
| Human review | Built-in | Optional |
| Maintenance | Low | Medium |
| RadFlow philosophy alignment | High | Medium |

---

## Part 5: Decision Framework

### When to Choose Skills

Choose skills-only when:
- Primary user base is Claude Code users
- Human review is important (clipboard philosophy)
- Simplicity is preferred
- Resources are limited

**This is RadFlow's current situation.**

### When to Add MCP

Add MCP when:
- Users request Cursor/Windsurf/Codex support
- Fully automated workflows are needed
- Team has capacity for maintenance

### Hybrid Approach

The recommended hybrid approach:

```
Phase 1: Skills only
├── /radflow:context
├── /radflow:tokens
├── /radflow:source
└── /radflow:components

Phase 2: Add MCP (if needed)
├── radflow_get_context (maps to skill)
├── radflow_get_tokens (maps to skill)
└── Shared backend (HTTP API)
```

Both skills and MCP call the same local HTTP API, ensuring consistency.

---

## Part 6: Detailed Skill Specifications

### /radflow:context

**Purpose:** Bundle current selection as rich context for AI

**Invocation:**
```
/radflow:context
```

**Output:**
```markdown
## RadFlow Context

### Selected Elements (2)

#### Button @ src/components/Button.tsx:47
- **Component:** Button
- **Props:** { variant: 'primary', size: 'md', disabled: false }
- **Children:** "Submit"

#### Card @ src/components/Card.tsx:23
- **Component:** Card
- **Props:** { elevation: 2 }
- **Children:** [Button, Text]

### Available Tokens
- `--color-primary`: #007AFF
- `--spacing-md`: 16px
```

### /radflow:tokens

**Purpose:** Export design tokens from current theme

**Invocation:**
```
/radflow:tokens [theme-name]
```

**Output:**
```markdown
## Design Tokens

### Colors
| Token | Value |
|-------|-------|
| --color-primary | #007AFF |
| --color-secondary | #5856D6 |

### Spacing
| Token | Value |
|-------|-------|
| --spacing-xs | 4px |
| --spacing-sm | 8px |
| --spacing-md | 16px |
```

### /radflow:source

**Purpose:** Get source file location for selected element

**Invocation:**
```
/radflow:source [radflow-id]
```

**Output:**
```markdown
## Source Location

**Component:** Button
**File:** src/components/Button.tsx
**Line:** 47
**Column:** 12

### Quick Open
```
code -g src/components/Button.tsx:47:12
```
```

### /radflow:components

**Purpose:** List all discovered components in project

**Invocation:**
```
/radflow:components [--path=src/components]
```

**Output:**
```markdown
## Discovered Components (23)

| Component | File | Props |
|-----------|------|-------|
| Button | src/components/Button.tsx | variant, size, disabled, children |
| Card | src/components/Card.tsx | elevation, children |
| Input | src/components/Input.tsx | type, value, onChange |
```

---

## Conclusion

### Recommendation Summary

| Decision | Recommendation |
|----------|---------------|
| Primary integration | Claude Code Skills |
| MCP implementation | Optional, deferred |
| Write operations | Not recommended |
| Scope | Read-only context |

### Implementation Priority

1. **High:** `/radflow:context` - Core workflow enabler
2. **High:** `/radflow:tokens` - Design system context
3. **Medium:** `/radflow:source` - Development workflow
4. **Medium:** `/radflow:components` - Discovery assistance
5. **Low:** MCP server (if cross-tool demand)

### Next Steps

1. Define local HTTP API specification
2. Implement Phase 1 skills (4 skills)
3. Test with real Claude Code workflows
4. Gather user feedback on cross-tool needs
5. Implement MCP only if demand exists

---

## Appendix: Pencil Tool Analysis

### Why Pencil Uses MCP

Pencil's design philosophy is "AI as collaborator":
- AI directly manipulates the design
- No human approval step required
- Changes are immediate and visual
- Multi-tool support is key selling point

This is fundamentally different from RadFlow's "AI as assistant":
- AI suggests, human decides
- Clipboard as deliberate friction
- Changes go through code review
- Claude Code is primary target

### Pencil Tools Not Applicable to RadFlow

| Tool | Why Not Applicable |
|------|-------------------|
| `batch_design` | Write operation |
| `set_variables` | Write operation |
| `replace_all_matching` | Write operation |
| `find_empty_space` | Layout-specific |
| `get_style_guide` | Pencil-specific assets |
| `get_guidelines` | Pencil-specific rules |
| `open_document` | Pencil file format |

These represent ~50% of Pencil's tools, confirming that RadFlow needs a much smaller surface area.
