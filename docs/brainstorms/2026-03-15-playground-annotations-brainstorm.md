# Playground Annotations Brainstorm

**Date:** 2026-03-15
**Status:** Decided

## What We're Building

A component-level annotation system inside the playground that lets humans leave structured notes on components for agents to read and act on. Annotations are injected into agent context automatically via a PreToolUse hook — agents never need to manually check for pending work. The system is the foundation for a future live token editor that leverages `data-rdna` + `dna.json` + CSS custom property scoping to enable visual design changes with zero component cooperation.

## Why This Approach

The playground already has the infrastructure: SSE for live updates, a CLI for agent interaction, and a PreToolUse hook pattern proven by work signals. Annotations extend this pattern — humans create notes via CLI or badge UI, a PreToolUse hook injects pending annotations into agent context when editing component files, and agents resolve/dismiss when done. The `data-rdna` + `data-variant` attributes already in the DOM, combined with `dna.json` token binding maps, make the leap from "text notes" to "structured token edits" a natural evolution without architectural rework.

## Key Decisions

- **Human → Agent direction.** Humans leave notes, agents read and act. Not bidirectional in MVP.
- **Component-level targeting.** Annotations anchor to a component ID from the registry. No DOM selector plumbing. `data-rdna` attributes enable future embedded app support.
- **Server memory + localStorage persistence.** Ephemeral enough for dev workflow, survives page reloads. Lost on server restart (acceptable — these are working notes, not permanent records).
- **Hook-injected context.** A PreToolUse hook checks for pending annotations on the component being edited and injects them into the agent's context. Zero agent effort — annotations just appear in context.
- **Flat + status, no threading.** One message per annotation. Agents resolve with a summary or dismiss with a reason. No back-and-forth conversation model.
- **Badge on card + popover.** Count badge in ComponentCard header (like ViolationBadge). Click opens a popover with annotation detail. Popover is Phase 2 — Phase 1 ships badge count only.
- **Agentation taxonomy.** intent: fix/change/question/approve. severity: blocking/important/suggestion. status: pending/acknowledged/resolved/dismissed. Proven model, matches existing MCP tool vocabulary.
- **Text annotations with optional token edits.** Every annotation is a text note. Token-edit captures (structured overrides via `dna.json` lookup + CSS custom property scoping) are an optional attachment, deferred to later phases.
- **Port Flow's UI in later phases.** Flow's toolbar, side panel, and on-click overlays are the target UI for the full annotation experience. MVP ships backend + CLI + badge + hook only.

## Phased Build

### Phase 1 (MVP): Data model + API + CLI + hook

- Annotation store (process-local, mirrors signal store pattern)
- API routes: CRUD for annotations (`/api/agent/annotations`)
- CLI commands: `rdna-playground annotate <component> <message>`, `annotations [component]`, `resolve <id>`, `dismiss <id>`
- PreToolUse hook: check for pending annotations when editing component files, inject into agent context via stderr/exit-code messaging
- Badge count on ComponentCard header (reuse ViolationBadge pattern)
- SSE integration: annotation events broadcast through existing signal store

### Phase 2: Popover UI + human creation from browser

- Click badge to open annotation popover on card
- Create/resolve/dismiss annotations from the popover
- Annotation list with status indicators

### Phase 3: Token inspector

- Read `data-rdna` + `data-variant` from rendered components
- Look up token bindings from registry + `dna.json`
- Display current token values in the popover
- Read-only first — just show what tokens are bound

### Phase 4: Live token editor + annotation capture

- Editable token values in the popover
- Apply overrides via scoped `element.style.setProperty('--token', 'value')`
- Capture liked changes as structured annotations: `{ componentId, variant, overrides: { token: value } }`
- Port Flow's toolbar/panel UI adapted for playground context

## Data Model

```typescript
interface PlaygroundAnnotation {
  id: string;
  componentId: string;              // registry component ID
  intent: "fix" | "change" | "question" | "approve";
  severity: "blocking" | "important" | "suggestion";
  status: "pending" | "acknowledged" | "resolved" | "dismissed";
  message: string;                  // human's note
  resolution?: string;              // agent's resolve/dismiss summary
  tokenOverrides?: Record<string, string>;  // future: { "--color-action-primary": "#FF0000" }
  variant?: string;                 // future: which variant the override targets
  createdAt: number;
  resolvedAt?: number;
}
```

## Token Editor Architecture (Phase 3-4)

The DNA architecture already provides the full read/write bridge:

1. **Read**: `data-rdna="button"` + `data-variant="primary"` → registry lookup → `Button.dna.json` → token bindings → `getComputedStyle()` for current resolved values
2. **Write**: `element.style.setProperty('--color-action-primary', '#FF0000')` — CSS custom properties cascade to children, zero component cooperation needed
3. **Capture**: Override becomes a structured annotation with `tokenOverrides` map
4. **Execute**: Agent reads annotation, sees exact token + value, makes the code change. Machine-executable — no NLP interpretation.

## Hook Design (Phase 1)

Extends the existing `.claude/hooks/playground-work-signal.sh` pattern:

```bash
# PreToolUse hook pseudocode:
# 1. Extract file_path from stdin JSON
# 2. Match against component paths → derive componentId
# 3. Check if playground is running
# 4. GET /playground/api/agent/annotations?componentId=X&status=pending
# 5. If pending annotations exist, output them to stderr as context
#    (exit 0 — don't block, just inform)
```

The hook output appears in the agent's context, so the agent sees something like:
```
[playground] 2 pending annotations on "button":
  [fix/blocking] "Border radius should use radius-sm token, not hardcoded 4px"
  [change/suggestion] "Consider warmer hover state for the brand refresh"
```

## Open Questions

- **Hook output format**: Should pending annotations be injected via stderr message, or should the hook use exit code 2 to force-block with instructions? Blocking ensures the agent sees the annotations but adds friction.
- **Annotation ID format**: UUID, nanoid, or sequential per component?
- **SSE event type**: New event type `"annotations-changed"` through the existing signal store, or a separate endpoint?

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA` (main checkout)
- Branch: `main`

## Research Notes

### Agentation (installed in RadOS)
- Data model: `Annotation` with intent/severity/status/thread, `ThreadMessage`, `Session`
- MCP server: 9 tools including `agentation_watch_annotations` (SSE-backed blocking poll)
- SQLite persistence at `~/.agentation/store.db`
- RadOS integration is bare minimum — `<Agentation endpoint />` in dev layout
- Exported React components: toolbar, annotation popup, 30+ icons
- Status lifecycle: pending → acknowledged → resolved/dismissed

### Flow (tools/flow/)
- Three-tier model: `Feedback` (human), `AgentFeedback` (agent), `FeedbackV2` (unified)
- `commentBadges.ts` — standalone vanilla TS badge renderer, DOM-anchored, Shadow DOM, portable
- Zustand `commentSlice` — CRUD actions, grouped/timeline views, markdown export
- `FeedbackPanel.tsx` — React panel with `CommentCard` + `AgentFeedbackItem`
- `ContextStore` — in-memory server store scoped by tabId
- MCP tools: `flow_post_feedback`, `flow_resolve_annotation`, `flow_reply_to_thread`
- WebSocket broadcast for real-time sync

### Key portability insight
Flow's mutation engine (inspect element → read styles → apply overrides → capture changes) maps directly onto the DNA architecture via `data-rdna` + `dna.json` + CSS custom property scoping. No DOM plumbing needed — the registry IS the bridge.
