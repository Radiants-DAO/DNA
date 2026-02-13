# Feature-by-Feature Comparison Matrix

> Task: fn-3-46x.4 | Epic: Pencil vs RadFlow Architecture Comparison
> Generated: 2026-01-22

Side-by-side comparison of Pencil and RadFlow features, synthesized from tasks 1-3. Neutral tone - differences noted without declaring winners.

---

## Core Rendering Features

| Feature | Pencil | RadFlow | Research Rec | Notes |
|---------|--------|---------|--------------|-------|
| **Canvas rendering** | WASM renderer (pencil.wasm ~7MB) | iframe + localhost preview | CSS scale() for thumbnails | Pencil owns the renderer; RadFlow defers to target project |
| **Component previews** | Native canvas primitives (frame, text, etc.) | Live React components in iframe | CSS scale() at 0.2x | Pencil renders its own primitives; RadFlow renders actual components |
| **Real-time updates** | Partial JSON delta streaming | Vite HMR + INJECT_STYLE | Vite 30-70ms target | Pencil streams design ops; RadFlow streams style injection |
| **Component isolation** | JSON tree isolation (no React context) | iframe boundary | iframe + postMessage | Pencil has complete isolation; RadFlow inherits target's context |
| **Zoom/pan** | WASM-based canvas zoom | Not implemented | CSS transform | Pencil has infinite canvas; RadFlow has scrolling grid (planned) |
| **Performance** | GPU-composited WASM | Browser-native rendering | CSS containment | Different architectures, different tradeoffs |

### Tradeoffs: Canvas Rendering

**Pencil's WASM Approach:**
- Complete control over rendering pipeline
- No dependency on target framework
- Higher initial bundle size (~7MB)
- Custom event handling required

**RadFlow's iframe Approach:**
- Components render exactly as in production
- Leverages existing framework (React, Next.js)
- No renderer maintenance burden
- Requires dev server running

**Research Recommendation:** CSS scale() would give RadFlow thumbnail previews without a dev server, filling the gap between full iframe and WASM canvas.

---

## Integration Features

| Feature | Pencil | RadFlow | Research Rec | Notes |
|---------|--------|---------|--------------|-------|
| **AI tool integration** | MCP tools (direct writes) | Clipboard-first (context bundling) | Both valid | Different philosophies: direct manipulation vs context engineering |
| **Context bundling** | Schema-driven (`.pen` format) | Markdown compilation | Per-tool format | Pencil bundles design JSON; RadFlow bundles code references |
| **Clipboard workflow** | Not primary (MCP preferred) | Primary workflow | Cmd+E → Claude | RadFlow built around clipboard; Pencil built around MCP |
| **MCP server** | Full MCP implementation (14+ tools) | Not implemented | Read-only tools | Pencil ships MCP; RadFlow could add read-only tools |
| **Claude Code skills** | Not used | Not implemented | Alternative to MCP | Skills API could replace MCP for RadFlow's use case |
| **Multi-tool support** | Claude, Codex, Gemini, Cursor, Windsurf | External only (any tool via clipboard) | — | Pencil auto-installs to tools; RadFlow works with any tool |

### Tradeoffs: AI Integration

**Pencil's MCP Approach:**
- Direct AI manipulation of design
- Rich tool catalog (batch_design, batch_get, etc.)
- Requires MCP configuration
- Agent can make mistakes directly in design

**RadFlow's Clipboard Approach:**
- AI works through developer (human review)
- Works with any AI tool
- No configuration needed
- Slower iteration (copy/paste cycle)

**Neutral Assessment:** Pencil optimizes for AI agency; RadFlow optimizes for developer control. Both are valid strategies depending on trust level and use case.

---

## Token & Variable Systems

| Feature | Pencil | RadFlow | Research Rec | Notes |
|---------|--------|---------|--------------|-------|
| **Token format** | JSON variables in `.pen` | CSS custom properties (@theme) | — | Pencil uses proprietary; RadFlow uses standard CSS |
| **Theme axes** | Multi-dimensional (device, mode) | Two-tier (public/inline) | Pencil's axis system | Both support theming, different models |
| **Token extraction** | N/A (owns the format) | lightningcss parsing | — | RadFlow reads existing CSS; Pencil defines its own |
| **Token persistence** | Direct `.pen` writes | Read-only (write planned) | — | Pencil writes; RadFlow reads |
| **Variable scoping** | Design-time resolution | Runtime CSS variables | — | Different mental models |

### Example: Theme Definition

**Pencil:**
```json
{
  "variables": {
    "$primary-color": {
      "type": "color",
      "value": [
        { "value": "#007AFF", "theme": { "mode": "light" } },
        { "value": "#0A84FF", "theme": { "mode": "dark" } }
      ]
    }
  }
}
```

**RadFlow:**
```css
@theme {
  --color-primary: #007AFF;
}
@theme inline {
  --color-primary-dark: #0A84FF;
}
```

### Tradeoffs: Token Systems

**Pencil's JSON Variables:**
- Full control over variable structure
- Type information embedded
- Requires translation to code
- Axis-based variants are expressive

**RadFlow's CSS Custom Properties:**
- Works with existing code
- No translation needed
- Standard browser support
- Less structured (no types)

---

## Component Registration & Discovery

| Feature | Pencil | RadFlow | Research Rec | Notes |
|---------|--------|---------|--------------|-------|
| **Component definition** | `reusable: true` in JSON | TSX file analysis (SWC) | — | Pencil declares; RadFlow discovers |
| **Props extraction** | Schema-defined | Type inference from interfaces | — | Both provide prop metadata |
| **Component instances** | `ref` + `descendants` pattern | Live React instances | — | Different representation models |
| **Slot composition** | `slot` property on frames | `children` prop detection | Plasmic registration | Similar concepts, different implementations |
| **Discovery method** | Manual design creation | Recursive directory scanning | — | Pencil requires design; RadFlow scans code |

### Example: Component Registration

**Pencil (in .pen file):**
```json
{
  "id": "button",
  "type": "frame",
  "reusable": true,
  "children": [
    { "id": "label", "type": "text", "content": "Button" }
  ]
}
```

**RadFlow (discovered from TSX):**
```typescript
// Discovered by SWC parser
interface ButtonProps {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  children: React.ReactNode;
}
// → control types: variant=select, disabled=boolean, children=slot
```

### Tradeoffs: Component Registration

**Pencil's Explicit Registration:**
- Complete control over component structure
- Components exist only in design tool
- Requires design-to-code translation
- Rich semantic information

**RadFlow's Automatic Discovery:**
- Works with existing components
- No duplicate definitions
- Props inferred from types
- May miss some semantics

---

## File Watching & HMR

| Feature | Pencil | RadFlow | Research Rec | Notes |
|---------|--------|---------|--------------|-------|
| **File watching** | Electron FS API | notify v7 (Rust) | — | Both watch files |
| **HMR mechanism** | N/A (owns rendering) | Vite + React Fast Refresh | Vite 30-70ms | RadFlow leverages existing tooling |
| **Change detection** | Internal state | File events → re-parse | — | Different architectures |
| **Style injection** | Direct WASM update | postMessage → INJECT_STYLE | — | Both support live updates |
| **Debouncing** | Unknown | 100ms | — | RadFlow debounces to prevent rapid re-parsing |

### Tradeoffs: File Watching

**Pencil's Internal State:**
- Instant updates (no file I/O)
- Single source of truth
- No external tool integration
- Requires explicit save

**RadFlow's File-Based:**
- Integrates with existing workflows
- IDE edits trigger updates
- File system as source of truth
- Slightly higher latency

---

## Output Formats

| Feature | Pencil | RadFlow | Research Rec | Notes |
|---------|--------|---------|--------------|-------|
| **Design format** | `.pen` (proprietary JSON) | Existing project files | — | Pencil has format; RadFlow uses existing files |
| **Code generation** | Optional export | Not applicable | Skip code gen | RadFlow philosophy: "design IS code" |
| **Export targets** | React, Vue, HTML, Tailwind | Clipboard markdown | — | Different purposes |
| **Round-trip sync** | `.pen` ↔ code via wrappers | N/A (files are source) | — | Pencil needs sync; RadFlow is source |

### Example: AI Context Output

**Pencil (MCP tool result):**
```json
{
  "nodes": [
    { "id": "button-1", "type": "ref", "ref": "ButtonComp" }
  ],
  "selection": ["button-1"]
}
```

**RadFlow (clipboard):**
```markdown
## Selected Elements

### Button @ src/components/Button.tsx:47
- Component: Button
- Props: { variant: 'primary', size: 'md' }

### Question
How can I add a hover effect?
```

### Tradeoffs: Output Formats

**Pencil's Proprietary Format:**
- Rich semantic structure
- Optimized for AI manipulation
- Requires translation to code
- Learning curve for format

**RadFlow's Markdown Output:**
- Human-readable
- Works with any AI tool
- Includes file paths and line numbers
- Less structured for parsing

---

## Architecture Comparison

| Aspect | Pencil | RadFlow |
|--------|--------|---------|
| **Runtime** | Electron + WASM | Tauri + React |
| **Bundle size** | ~7MB WASM + 5.5MB JS | Standard React app |
| **Target project coupling** | None (standalone) | Requires bridge installation |
| **Philosophy** | "Design becomes code" | "Design IS code" |
| **AI relationship** | AI manipulates design directly | AI assists developer via context |

### Architecture Diagram: Communication Patterns

**Pencil:**
```
┌─────────┐    MCP     ┌─────────┐    IPC    ┌─────────┐
│   AI    │◄─────────►│ Desktop │◄────────►│  WASM   │
│  Agent  │   stdio   │   App   │ postMsg  │ Canvas  │
└─────────┘           └─────────┘          └─────────┘
                           │
                           ▼
                      ┌─────────┐
                      │  .pen   │
                      │  file   │
                      └─────────┘
```

**RadFlow:**
```
┌─────────┐  clipboard  ┌─────────┐  postMsg  ┌─────────┐
│   AI    │◄──────────►│  Tauri  │◄────────►│ iframe  │
│  Agent  │   paste    │   App   │  bridge  │ Target  │
└─────────┘            └─────────┘          └─────────┘
                            │
                            ▼
                      ┌──────────┐
                      │ Project  │
                      │  Files   │
                      └──────────┘
```

---

## Summary: Key Differences

| Dimension | Pencil | RadFlow |
|-----------|--------|---------|
| **Rendering** | WASM canvas (owns pixels) | iframe (defers to framework) |
| **AI integration** | MCP (direct manipulation) | Clipboard (context engineering) |
| **File format** | Proprietary `.pen` | Existing project files |
| **Component model** | JSON tree with refs | Live React instances |
| **Target user** | Designers + AI | Developers + AI |
| **Philosophy** | Design as artifact | Design as code |

---

## Research Recommendations by Category

| Category | Recommendation | Applies To |
|----------|---------------|------------|
| Canvas rendering | CSS scale() for thumbnails | RadFlow Component Canvas |
| Component isolation | iframe + postMessage | Both (RadFlow already uses) |
| Fiber walking | Custom implementation | RadFlow (current approach valid) |
| AI integration | Skills or read-only MCP | RadFlow (if adding programmatic access) |
| Virtualization | @tanstack/virtual | RadFlow Component Canvas |
| Theming | Multi-axis variants | Both could adopt |

---

## Appendix: Feature Presence Matrix

Quick reference for feature presence (not quality comparison):

| Feature | Pencil | RadFlow |
|---------|:------:|:-------:|
| Live component preview | Yes | Yes |
| AI integration | Yes | Partial |
| Token management | Yes | Read-only |
| Component discovery | Manual | Automatic |
| File watching | Yes | Yes |
| HMR support | N/A | Yes |
| Code generation | Yes | No |
| MCP server | Yes | No |
| Clipboard workflow | Basic | Primary |
| Multi-select | Yes | Yes |
| Variant comparison | Yes | Planned |
| Real-time streaming | Yes | Partial |
| Session persistence | Yes | No |
| Fullscreen mode | Yes | No |
