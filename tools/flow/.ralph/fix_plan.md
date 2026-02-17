# Ralph Fix Plan

## High Priority
- [x] Define session ownership and lifecycle: extension-generated `sessionId`, server validation, and message contracts (`tabId`, `sessionId`, `clientType`)
- [ ] Implement stale session cleanup: `lastSeenAt`, heartbeat refresh, TTL eviction, and explicit close-session flow
- [ ] Add persistence architecture with hot cache + write-through storage (memory primary reads, SQLite durability, startup hydration)
- [ ] Implement `flow init` config contract at `./.flow/config.json` and config precedence (file defaults + CLI overrides)
- [ ] Implement `flow doctor` with actionable checks for sidecar health, MCP config generation, and local prerequisites
- [ ] Add bounded watch loop support (`flow_watch_pending_feedback`) with timeout-safe behavior for MCP clients

## Medium Priority
- [ ] Clarify dual WebSocket model (background vs panel responsibilities) and document registration semantics
- [ ] Add integration tests for tab/session routing and feedback thread round trips
- [ ] Expand scanner test coverage for contrast and component scanning edge cases
- [ ] Remove known dead paths and stubs in panel/content routing after replacement paths are proven

## Low Priority
- [ ] Add log rotation and retention defaults for standalone mode
- [ ] Add structured metrics/events for loop throughput and queue health
- [ ] Perform opportunistic cleanup of legacy helper duplication after stabilization

## Completed
- [x] Project enabled for Ralph
- [x] Ralph installed globally and available on PATH
- [x] Initial `.ralph/` task configuration tailored for Flow monorepo
- [x] Session ownership and lifecycle: types in `@flow/shared`; ownership tracking in `ContextStore`; WebSocket handler validation; extension `sidecarSync` generates/sends `sessionId`; added `close-session` message type for explicit session release; peer disconnect now auto-unregisters owned sessions; 25 WebSocket tests + 11 ContextStore tests

## Notes
- Do one high-priority task per loop and keep PR-sized changes.
- Prefer additive changes over risky rewrites (especially around ContextStore).
- Keep tests targeted and fast during loops; run broader checks before completion.
