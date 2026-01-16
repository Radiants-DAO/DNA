# fn-5.5 Preview Shell + Style Injection

## Description

Build the iframe preview shell that loads the target dev server and supports live style injection.

**Preview Shell Component:**
```typescript
interface PreviewShellProps {
  url: string;              // e.g., "http://localhost:3000"
  onSelection: (entry: SerializedComponentEntry) => void;
  onHover: (radflowId: RadflowId | null) => void;
}

type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';
```

**Status UI:**
- Disconnected: Gray dot + "Not connected"
- Connecting: Yellow dot + "Connecting..."
- Connected: Green dot + "Connected (v1.0.0)"
- Error: Red dot + error message

**Selection Flow:**
1. User clicks element in iframe
2. Bridge captures click, looks up `radflowId` from `data-radflow-id`
3. Bridge sends `SELECTION` message with `radflowId` + `source`
4. Host receives selection, updates Zustand store
5. Right panel shows component properties

**Style Injection:**
```typescript
// Host sends to bridge
{ type: 'INJECT_STYLE', css: '[data-radflow-id="rf_a1b2c3"] { color: red; }' }

// Bridge injects into target DOM
const style = document.createElement('style');
style.id = 'radflow-injected';
style.textContent = css;
document.head.appendChild(style);
```

- Primary selector: `[data-radflow-id]` (always available)
- Fallback selectors available in `SerializedComponentEntry.fallbackSelectors`
  - e.g., `[aria-label="Submit"]`, `.btn-primary`, `[role="button"]`
  - Use for resilience if radflowId regenerates
- `CLEAR_STYLES` removes the injected style tag
- Multiple `INJECT_STYLE` calls replace (not append)

## Acceptance

- [ ] Preview shell loads target dev server URL in iframe
- [ ] Status UI shows: disconnected / connecting / connected / error
- [ ] Click in iframe sends SELECTION to host with radflowId + source + fallbackSelectors
- [ ] Host can inject CSS via INJECT_STYLE message
- [ ] Injected styles scoped via `[data-radflow-id]` selectors (primary)
- [ ] Fallback selectors available for agent/LLM targeting resilience
- [ ] Styles cleared on CLEAR_STYLES message

## Files

- `src/components/PreviewShell.tsx`
- `src/hooks/useStyleInjection.ts`
- `src/stores/slices/selectionSlice.ts`

## Done summary
- Added style injection to bridge's message-bridge.ts (INJECT_STYLE, CLEAR_STYLES handlers)
- Created PreviewShell component with status UI (disconnected/connecting/connected/error)
- Created useStyleInjection hook for CSS injection management
- Added selectionSlice for component selection state

Why:
- Enables live CSS preview in the iframe target
- Provides visual feedback on bridge connection status

Verification:
- pnpm tsc --noEmit passes
- pnpm --filter bridge build passes
- pnpm test passes
## Evidence
- Commits: 56f7a7bfe60e6c51babeb07baf66927fa00930be
- Tests: pnpm tsc --noEmit, pnpm --filter bridge build, pnpm test
- PRs: