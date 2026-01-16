# fn-5.3 postMessage Protocol

## Description

Implement bidirectional messaging between RadFlow host and bridge iframe.

**Message Types:**
```typescript
// Host → Bridge
type HostMessage =
  | { type: 'PING' }
  | { type: 'GET_COMPONENT_MAP' }
  | { type: 'HIGHLIGHT'; radflowId: RadflowId }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'INJECT_STYLE'; css: string }
  | { type: 'CLEAR_STYLES' };

// Bridge → Host
type BridgeMessage =
  | { type: 'PONG'; version: string }
  | { type: 'COMPONENT_MAP'; entries: SerializedComponentEntry[] }
  | { type: 'SELECTION'; radflowId: RadflowId; source: SourceLocation | null }
  | { type: 'HOVER'; radflowId: RadflowId | null }
  | { type: 'ERROR'; message: string };
```

**Handshake Sequence:**
```
Host                          Bridge
  │                              │
  │──── PING ───────────────────►│
  │                              │
  │◄─── PONG { version } ────────│
  │                              │
  │──── GET_COMPONENT_MAP ──────►│
  │                              │
  │◄─── COMPONENT_MAP ───────────│
```

**Auto-push Triggers:**
Bridge sends `COMPONENT_MAP` automatically on:
- Initial handshake complete
- React commit (debounced 100ms)
- HMR module update

**Serialization:**
```typescript
// SerializedComponentEntry omits live DOM refs
interface SerializedComponentEntry {
  radflowId: RadflowId;
  name: string;
  displayName: string | null;
  selector: string;
  source: SourceLocation | null;
  fiberType: string;
  props: Record<string, unknown>;
  parentId: RadflowId | null;
  childIds: RadflowId[];
}
```

## Acceptance

- [ ] Handshake completes within 2s of iframe load
- [ ] Host can request componentMap on demand
- [ ] Bridge pushes componentMap on React commits (debounced)
- [ ] Selection events (click) sent from bridge to host
- [ ] Highlight commands sent from host to bridge
- [ ] Reconnects automatically on iframe navigation/refresh

## Files

- `packages/bridge/src/message-bridge.ts` (bridge side)
- `src/hooks/useBridgeConnection.ts` (RadFlow host side)
- `src/stores/slices/bridgeSlice.ts` (connection state)

## Done summary
- Implemented bridge-side message handler with PING/PONG, GET_COMPONENT_MAP, HIGHLIGHT/CLEAR_HIGHLIGHT, SELECTION, HOVER events
- Added highlight overlay with visual feedback and scroll/resize tracking
- Created useBridgeConnection hook with auto-reconnect and exponential backoff
- Added bridgeSlice to Zustand store for connection state and componentMap management
- Fixed pre-existing missing setDevMode in uiSlice

Why:
- Enables bidirectional communication between RadFlow host and target iframe
- Foundation for selection, highlighting, and style injection features

Verification:
- pnpm --filter bridge build: Success
- pnpm tsc --noEmit: Success (no type errors)
## Evidence
- Commits: 99b5c1ab742b41e5927b5e66a01ced8b9aa8fb6b
- Tests: pnpm --filter bridge build, pnpm tsc --noEmit
- PRs: