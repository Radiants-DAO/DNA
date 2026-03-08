# RadOS Linux Agent-Native Desktop Architecture

**Date:** 2026-03-07
**Status:** Draft
**Scope:** QEMU prototype for an Arch + Hyprland desktop where a human and Radimus share the same operating environment

---

## Thesis

RadOS is not a Linux rice with an attached assistant. It is a desktop architecture built around shared human-agent operation.

The durable part of the system is not the visual layer. It is the control model:

- chat as intent input
- filesystem as shared memory
- terminal as execution
- browser/MCP as networked perception and action
- visual surface as shared output and status

Hyprland, Waybar, GTK theming, fonts, and wallpaper are implementation choices around that core.

## What Was Directionally Right

- `Linux + Wayland + Hyprland + Arch` is a coherent prototyping stack
- the proposed interaction surfaces are the right primitives
- a repo split by subsystem is sensible
- the V1 milestone is achievable if scoped to one end-to-end loop

## What Needed Correction

### 1. Styling is not architecture

`Hyprland + Waybar + GTK + fonts + wallpaper` defines the shell appearance, not the agent-native system.

### 2. "Filesystem + terminal access" is capability, not system design

Those are only execution capabilities. The architecture also needs:

- intent intake
- authorization
- action dispatch
- state logging
- output publication
- restart and boot orchestration

### 3. "Shared visual surface" must be a concrete contract

For V1, this should be a single dedicated UI surface, not a vague promise that the agent can open windows.

### 4. Linux theming has hard boundaries

Win95-inspired chrome is feasible, but not uniformly across every Wayland app. GTK theming, client-side decorations, and app-specific rendering all limit how much frame-level control you really have. The system should treat the visual identity as "strongly guided" rather than "universally enforced."

## Corrected Architecture

The architecture should be split into five layers.

### Layer 1: Base System

- Arch Linux
- Wayland session
- Hyprland compositor
- `systemd --user` for user-session services
- purpose-built package set only

This layer boots the session and provides process supervision.

### Layer 2: Shell and Visual Identity

- Hyprland config for layout, animation, keybinds, workspace rules
- Waybar for taskbar and system affordances
- GTK theme for compatible apps
- terminal theme for `foot` or `wezterm`
- wallpapers and mode-switch script

This layer is presentational. It should consume tokens from a single theme source rather than becoming the source of truth itself.

### Layer 3: Shared Interaction Surfaces

- chat surface
- shared filesystem
- terminal
- browser automation surface via MCP
- shared visual surface

These are the only first-class human-agent collaboration channels in V1. If a feature does not map to one of these surfaces, it should be questioned.

### Layer 4: Agent Control Plane

- Radimus local daemon
- intent router
- capability registry
- permission policy
- action log
- state store
- renderer bridge

This is the missing architectural center. It is what makes the desktop agent-native instead of merely agent-compatible.

### Layer 5: Apps and Extensions

- purpose-built RadOS utilities
- narrowly chosen third-party apps
- scripts that expose explicit machine-readable interfaces

Apps should plug into the control plane rather than bypassing it whenever shared operation matters.

## Core Runtime Components

### 1. Session Manager

Use `systemd --user` to launch and supervise:

- `radimus.service`
- a surface host service if needed
- theme sync helpers
- optional bridge processes for chat/browser surfaces

This avoids ad hoc shell startup logic and gives restart semantics, logs, and dependency ordering.

### 2. Radimus Daemon

The daemon is the local agent runtime. It should:

- receive intents from the chat UI or other approved sources
- plan and dispatch actions
- call terminal, filesystem, browser, and renderer adapters
- emit structured events
- maintain session state

Suggested V1 model: one daemon process with modular adapters, not multiple cooperating agents.

### 3. Capability Adapters

Adapters convert high-level actions into real operations:

- `fs` adapter for read/write/move/list within allowed roots
- `terminal` adapter for shell commands
- `browser` adapter for MCP-backed web actions
- `renderer` adapter for publishing status/output to the shared visual surface
- `theme` adapter for Sun/Moon mode and token propagation

Each adapter should expose explicit verbs and return structured results.

### 4. Permission Layer

Permissions should be policy-driven, not prompt-driven only.

Minimum V1 policy domains:

- filesystem roots
- allowed command classes
- browser domains or tool scopes
- visual-surface publishing rights
- destructive action confirmation requirements

This can begin as a local config file and graduate later to interactive approvals.

### 5. Event and State Log

Every important action should create an event:

- intent received
- plan accepted
- command run
- file written
- browser action performed
- visual output published
- error raised

This log is required for trust, debugging, replay, and human legibility.

### 6. Shared Visual Surface Host

V1 should use one dedicated surface with a narrow contract. Good candidates:

- a pinned RadOS panel window
- a dedicated Waybar module plus companion window
- a local webview window controlled by the renderer adapter

Recommended V1 choice: a dedicated panel window with a simple JSON-fed UI showing:

- current status
- active task
- recent actions
- result cards
- approval requests or errors

Do not start with overlays, floating widgets, or compositor tricks.

## Process Model

The system should behave like this:

1. Human enters intent through chat.
2. Chat surface sends structured intent to the Radimus daemon.
3. Daemon resolves the request into one or more actions.
4. Permission layer validates each action.
5. Capability adapters execute the allowed actions.
6. Results are written to the shared filesystem and event log.
7. Renderer publishes a concise task/result state to the shared visual surface.
8. Human can inspect, interrupt, approve, or continue.

This is the core cohabitation loop. V1 should prove this loop with as little extra desktop complexity as possible.

## Data Contracts

V1 does not need a heavy protocol, but it does need explicit machine-readable messages.

Suggested primitives:

- `Intent`
- `Action`
- `ActionResult`
- `PermissionDecision`
- `SurfaceUpdate`
- `SessionEvent`

Suggested shape:

```json
{
  "id": "evt_001",
  "type": "action.result",
  "sessionId": "sess_001",
  "timestamp": "2026-03-07T18:00:00Z",
  "payload": {
    "action": "terminal.run",
    "status": "ok"
  }
}
```

The exact schema can stay small, but the system should avoid hidden state stored only in shell history or UI memory.

## Theming Model

The visual identity should flow from a single token source, then be compiled or transformed into target configs.

Recommended source-of-truth shape:

- `tokens/base.json`
- `tokens/sun.json`
- `tokens/moon.json`

Generated targets:

- Hyprland includes
- Waybar CSS
- GTK theme variables where possible
- terminal config
- rofi theme

This is safer than hand-maintaining parallel color definitions across multiple subsystems.

## Repo Structure v2

```text
rados-rice/
├── system/
│   ├── install.sh
│   ├── packages.arch
│   └── services/
│       ├── radimus.service
│       └── rados-surface.service
├── theme/
│   ├── tokens/
│   │   ├── base.json
│   │   ├── sun.json
│   │   └── moon.json
│   └── build/
│       └── generate-theme.sh
├── hypr/
├── waybar/
├── gtk/
├── rofi/
├── terminal/
├── wallpapers/
├── scripts/
│   ├── toggle-mode.sh
│   ├── session-start.sh
│   └── verify-install.sh
├── agent/
│   ├── radimus.conf
│   ├── permissions.json
│   ├── schemas/
│   ├── adapters/
│   └── state/
├── surface/
│   ├── app/
│   └── protocol/
└── README.md
```

Key changes from the rough draft:

- `theme/` becomes the token source of truth
- `system/` holds install and service wiring
- `surface/` is explicit instead of buried under `agent/surfaces`
- `permissions` and `schemas` become first-class agent artifacts

## V1 Scope

V1 should prove one complete closed loop:

1. Boot into Arch + Hyprland inside QEMU.
2. Start Radimus automatically in the user session.
3. Submit one intent through chat.
4. Radimus performs a bounded terminal or filesystem task.
5. Result is logged and displayed on the shared visual surface.
6. Human can inspect the artifact and event trail.

If this works, the project has validated the architecture. If it does not, more theming and ricing work will not save it.

## Suggested V1 Build Sequence

### Phase 0: Session Boot

- get Arch + Hyprland stable in QEMU
- define package manifest
- boot into a reproducible user session

### Phase 1: Theme Pipeline

- define RDNA token source
- generate Waybar, terminal, and Hyprland theme outputs
- implement Sun/Moon switch

### Phase 2: Control Plane Skeleton

- implement Radimus daemon
- define minimal message schemas
- add filesystem and terminal adapters
- add append-only event log

### Phase 3: Shared Surface

- build one dedicated surface host window
- show daemon status, recent events, and task output
- wire renderer adapter to it

### Phase 4: Human Intent Loop

- connect chat UI to daemon
- execute one bounded task end-to-end
- add approval path for destructive actions

### Phase 5: Browser/MCP

- add browser adapter only after the local loop is reliable

## Non-Goals for V1

- universal desktop-wide Win95 chrome fidelity
- multiple autonomous agents
- full app ecosystem replacement
- sophisticated desktop automation
- complex overlay or ambient UI systems
- fully generalized permission brokerage

## Architecture Test

A useful check for every new feature:

1. Can the human understand what the feature is doing?
2. Can the agent discover and operate it through explicit interfaces?
3. Does it publish state somewhere inspectable?
4. Does it degrade cleanly if the visual layer changes?
5. Would the system still feel agent-native without hidden manual glue?

If the answer to any of those is no, the feature probably does not belong in RadOS yet.

## Open Questions

- Should chat be embedded in the desktop shell, or remain a separate app speaking to the daemon?
- Should the shared visual surface be a native app, a local web app, or a Waybar-plus-window hybrid?
- How strict should command permissions be in V1: allowlist by executable, by script path, or by capability class?
- Does the event log live as JSONL on disk, SQLite, or both?
- Which apps are considered acceptable third-party exceptions to the "agent-legible" rule?

## Bottom Line

The rough concept was good, but incomplete. The corrected architecture adds the actual system center:

- a local daemon
- explicit capability adapters
- policy and permissions
- structured event logging
- one concrete shared visual surface
- session supervision through `systemd --user`

That is the difference between a themed Linux setup with an AI on it and a real agent-native desktop environment.
