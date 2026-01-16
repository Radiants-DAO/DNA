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

TBD

## Evidence

- Commits:
- Tests:
- PRs:
