# RadOS v2 Architecture: Virtual File System Layer

**Status:** Draft / Internal Spec  
**Author:** KEMO (Radiants)  
**Date:** March 2026  
**Depends on:** `@platformatic/vfs` (userland) → `node:vfs` (Node.js core, experimental)

---

## 1. Executive Summary

RadOS is the Radiants website — a retro desktop environment built on Next.js. It hosts applications (video editor, text editor, Rad Radio, DNA playground, etc.) that users interact with through a Win95-style desktop metaphor. Radimus is the DAO's resident AI agent, built on [Hermes Agent](https://github.com/NousResearch/hermes-agent) (Python), running on his own server. He shows up inside RadOS as a cohabitant with chat and terminal access, and also operates independently via Telegram/Discord through Hermes gateway.

**The core product feature of RadOS v2 is a shared filesystem.** Every subscriber gets a personal virtual filesystem — their "save cartridge" — backed by SQLite. Every RadOS application reads and writes to it. There is also a collective filesystem shared across the DAO, gated by git-style pushes for writes. Radimus has full read-write access to both personal and collective spaces. Users can also operate on their filesystem programmatically through the Radiants CLI tool (enabling their own agents to modify files).

Node.js is getting a native Virtual File System (`node:vfs`), proposed by Matteo Collina in [PR #61478](https://github.com/nodejs/node/pull/61478). The userland implementation `@platformatic/vfs` is available now on Node 22+ with a `SqliteProvider` that maps almost perfectly to the save cartridge model: each user's SQLite database *is* their cartridge. Directories, files, stat, readdir — the full filesystem API comes for free. Portable, exportable, self-contained.

---

## 2. The Save Cartridge Model

Every RadOS user gets a personal SQLite-backed VFS — their **save cartridge**. It stores all application state as files within a filesystem hierarchy:

```
/user/{userId}/
├── Desktop/
│   ├── my-video-project.reel      ← OpenReel video editor save
│   └── notes.txt                  ← Text editor document
├── Radio/
│   └── presets.json               ← Rad Radio / binaural beats config
├── Projects/
│   ├── demo-reel/
│   │   ├── project.reel
│   │   ├── assets/
│   │   │   ├── intro-clip.webm
│   │   │   └── voiceover.wav
│   │   └── transcript.json        ← Radimus-generated transcription
│   └── dna-experiment/
│       └── tokens.css              ← DNA playground override
├── .config/
│   ├── display/
│   │   └── crt-shader.json        ← CRT shader preferences
│   └── radimus/
│       └── preferences.json       ← Per-user Radimus interaction prefs
└── .trash/
```

The collective filesystem is a shared cartridge for the entire DAO:

```
/collective/
├── templates/                     ← Shared project templates
│   ├── video-intro.reel
│   └── podcast-template.reel
├── assets/                        ← Community-curated assets
│   ├── branding/
│   └── sound-library/
├── dna/                           ← Canonical DNA design tokens
│   ├── tokens.css
│   └── components/
└── publications/                  ← Published community content
```

**Key properties of the cartridge model:**

| Property | Personal Cartridge | Collective Cartridge |
|---|---|---|
| **Storage** | SQLite per user (`{userId}.db`) | SQLite (single `collective.db`) |
| **Read access** | Owner + Radimus | All subscribers + Radimus |
| **Write access** | Owner + Radimus (with permission) + user's CLI agents | Git-style push (propose → review → merge) |
| **Persistence** | Survives sessions, exportable as `.db` file | Permanent, versioned |
| **Portability** | User can download their entire cartridge | Snapshots via git tags |

---

## 3. System Topology

```
┌──────────────────────────────────────────────────────────────────────┐
│                         RadOS (Browser)                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌─────────────────┐   │
│  │ Desktop  │  │  File    │  │  OpenReel  │  │ Radimus Chat /  │   │
│  │ Manager  │  │ Explorer │  │  Editor    │  │ Terminal Window  │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └───────┬─────────┘   │
│       └──────────────┼──────────────┘                │              │
│                      │ RadOS FS API                  │ WebSocket    │
└──────────────────────┼───────────────────────────────┼──────────────┘
                       │                               │
┌──────────────────────┼───────────────┐  ┌────────────┼──────────────┐
│       RadOS Server (Next.js)         │  │   Radimus Server          │
│                                      │  │   (Hermes Agent / Python) │
│  ┌────────────────────────────┐      │  │                           │
│  │       VFS Router           │      │  │  ┌─────────────────────┐  │
│  │  /user/{id}/* → user VFS   │◄─────┼──┼──┤  Hermes Tools       │  │
│  │  /collective/* → coll VFS  │      │  │  │  - terminal         │  │
│  └──┬──────────────┬─────────┘      │  │  │  - file (via FS API)│  │
│     │              │                 │  │  │  - web, skills      │  │
│  ┌──▼──────┐  ┌────▼──────┐         │  │  │  - code_execution   │  │
│  │ User    │  │Collective │         │  │  │  - delegation       │  │
│  │ SQLite  │  │  SQLite   │         │  │  │  - transcription    │  │
│  │ VFS DBs │  │  VFS DB   │         │  │  └─────────────────────┘  │
│  │         │  │ (git-gated│         │  │                           │
│  │{uid}.db │  │  writes)  │         │  │  ┌─────────────────────┐  │
│  └─────────┘  └───────────┘         │  │  │  Hermes Gateway     │  │
│                                      │  │  │  Telegram / Discord │  │
│  ┌────────────────────────────┐      │  │  └─────────────────────┘  │
│  │     Radiants CLI API       │      │  │                           │
│  │  (same FS API, auth'd)    │      │  │  ┌─────────────────────┐  │
│  └────────────────────────────┘      │  │  │  Persistent Memory  │  │
│                                      │  │  │  MEMORY.md, USER.md │  │
└──────────────────────────────────────┘  │  │  Skills, Sessions   │  │
                                          │  └─────────────────────┘  │
┌──────────────────────────────────────┐  └───────────────────────────┘
│         Radiants CLI                 │             │
│  (user's machine / user's agents)   │             │
│                                      │             │
│  $ rad fs ls /Projects/              │  Radimus also reaches RadOS
│  $ rad fs put ./local.reel /Projects/│  FS API via HTTP, same as
│  $ rad fs get /Projects/demo.reel ./ │  CLI and browser clients
│  $ rad video transcribe /Projects/.. │
│  $ rad ask "edit my intro clip"      │──── (routes to Radimus)
└──────────────────────────────────────┘
```

**Three clients, one API:**

1. **RadOS Browser** — File Explorer, app save/load, drag-and-drop. User interacts visually.
2. **Radiants CLI** — `rad fs`, `rad video`, `rad ask`. User (or user's agents like Claude Code, Cursor, etc.) interacts programmatically.
3. **Radimus** — Calls the same FS API via HTTP from his Hermes Agent server. Full read-write on user (with permission) and collective spaces.

All three go through the same RadOS FS API. No special pathways for Radimus — he's just an authenticated client with elevated permissions.

---

## 4. VFS Implementation

### 4.1 Technology Choice

| Implementation | Status | Notes |
|---|---|---|
| `node:vfs` (core PR) | Open, in review | 14K LOC by Matteo Collina. Approved by Snell/Insogna. Joyeecheung pushing on security model. Not landed yet. |
| `@platformatic/vfs` | Published, experimental | Userland bridge, Node ≥22. Ships `SqliteProvider`, `RealFSProvider`, `MemoryProvider`. API-compatible migration path to core. |
| `node-vfs-polyfill` (Vercel) | Proof of concept | Malte Ubl extraction. 6 commits, validates API design, not production-ready. |

**Decision:** Use `@platformatic/vfs` with `SqliteProvider`. Each user cartridge is a SQLite database. Migration to `node:vfs` is a one-line import swap when core lands.

### 4.2 VFS Initialization

```javascript
import { create, SqliteProvider, MemoryProvider } from '@platformatic/vfs'

// Per-user cartridge — persistent, one SQLite DB per subscriber
function createUserVFS(userId) {
  const provider = new SqliteProvider(`/data/cartridges/${userId}.db`)
  const vfs = create(provider)
  vfs.mount(`/user/${userId}`)
  return vfs
}

// Collective cartridge — shared, single SQLite DB
const collectiveProvider = new SqliteProvider('/data/cartridges/collective.db')
const collectiveVfs = create(collectiveProvider)
collectiveVfs.mount('/collective')

// Guest / anonymous — in-memory, gone on session end
function createGuestVFS(sessionId) {
  const vfs = create() // defaults to MemoryProvider
  vfs.mount(`/guest/${sessionId}`)
  return vfs
}
```

### 4.3 Why VFS and Not Just a Database

The `@platformatic/vfs` SqliteProvider gives us a real filesystem API (directories, files, stat, readdir, streams) backed by SQLite. We could build a custom CRUD API for save states, but VFS gives us:

- **File Explorer for free** — `readdirSync`, `statSync`, `readFileSync` map directly to the desktop File Explorer UI. No custom query layer needed.
- **CLI for free** — `rad fs ls`, `rad fs cp`, `rad fs mv` are thin wrappers around standard filesystem operations. Users and agents can reason about paths.
- **App-agnostic persistence** — Any RadOS app that can read/write files works immediately. No per-app storage adapter.
- **Radimus compatibility** — Hermes Agent's `file` toolset already knows how to operate on filesystems. Point it at the RadOS FS API and it works.
- **Portability** — Export a user's cartridge as a single `.db` file. Import it on another instance. Back it up trivially.
- **Module loading (future)** — If RadOS apps ever need to `import()` user-generated code (plugins, scripts, automations), VFS hooks into the Node.js module resolver natively.

---

## 5. Access Model

### 5.1 Permission Tiers

```
┌─────────────────────────────────────────────────────┐
│                   Radimus (Agent)                    │
│         Full R/W: user spaces + collective           │
├─────────────────────┬───────────────────────────────┤
│   User (Owner)      │   User (Other)                │
│   Full R/W: own     │   Read-only: collective       │
│   space             │   No access: other users      │
│   Read: collective  │                               │
│   Propose: coll.    │                               │
│   writes            │                               │
├─────────────────────┴───────────────────────────────┤
│                   Guest                              │
│            MemoryProvider, session-scoped             │
│            Read-only: collective (subset)             │
└─────────────────────────────────────────────────────┘
```

### 5.2 Collective Write Flow (Git-Gated)

Individual users cannot write directly to `/collective/*`. Instead:

```
1. User (or Radimus on user's behalf) creates a proposal:
   POST /api/fs/collective/propose
   { path: "/collective/templates/new-template.reel", content: <buffer> }

2. Proposal is stored in a staging area (separate SQLite table)

3. Review via DAO governance (or admin approval for now)

4. On approval, proposal is committed to collective VFS
   → Versioned via SQLite row with timestamp + author

5. Rejection deletes the staged proposal
```

Radimus can write directly to collective (no proposal needed) — he's the admin. This lets him curate community assets, update DNA tokens, organize shared resources.

### 5.3 Radimus Access Pattern

Radimus doesn't mount VFS locally on his Python server. He calls the RadOS FS API over HTTP, same as any client:

```python
# Inside Hermes Agent — Radimus uses his file/terminal tools
# pointed at the RadOS FS API endpoint

# Reading a user's video project to run transcription
response = requests.get(
    f"https://rados.radiants.dev/api/fs/read",
    params={"path": f"/user/{user_id}/Projects/demo-reel/project.reel"},
    headers={"Authorization": f"Bearer {radimus_token}"}
)
project_data = response.content

# Writing back transcription results
requests.put(
    f"https://rados.radiants.dev/api/fs/write",
    json={
        "path": f"/user/{user_id}/Projects/demo-reel/transcript.json",
        "content": transcription_result
    },
    headers={"Authorization": f"Bearer {radimus_token}"}
)
```

This could also be wrapped as a custom Hermes Agent tool or skill, so Radimus can use natural language:

> "Transcribe the voiceover in KEMO's demo-reel project and save the transcript"

...and his tool chain handles the API calls.

---

## 6. RadOS FS API

A single REST API that all three clients (browser, CLI, Radimus) use:

### 6.1 Core Endpoints

```
GET    /api/fs/stat?path=...          → { name, size, isDirectory, mtime, ... }
GET    /api/fs/readdir?path=...       → [{ name, isDirectory, size, mtime }, ...]
GET    /api/fs/read?path=...          → file content (binary or text)
PUT    /api/fs/write                  → { path, content } — create or overwrite
POST   /api/fs/mkdir                  → { path } — create directory
DELETE /api/fs/rm                     → { path } — delete file or directory
POST   /api/fs/mv                    → { from, to } — move/rename
POST   /api/fs/cp                    → { from, to } — copy
```

### 6.2 Collective-Specific

```
POST   /api/fs/collective/propose    → { path, content, message } — stage a change
GET    /api/fs/collective/proposals   → list pending proposals
POST   /api/fs/collective/merge      → { proposalId } — admin/governance approval
DELETE /api/fs/collective/reject     → { proposalId } — reject proposal
GET    /api/fs/collective/history    → { path } — version history for a file
```

### 6.3 Auth

```
Authorization: Bearer <token>

Tokens carry:
- userId (for user space routing)
- role: "user" | "admin" | "agent:radimus" | "cli"
- scopes: ["read:own", "write:own", "read:collective", "propose:collective", ...]

Radimus token has: ["read:any", "write:any", "read:collective", "write:collective"]
```

---

## 7. Radiants CLI

The CLI is a first-class client for the RadOS filesystem. Users install it locally, authenticate, and operate on their cartridge from the terminal. This is how user agents (Claude Code, Cursor, custom scripts) interact with RadOS files.

```bash
# Authentication
rad login                          # OAuth flow, stores token locally
rad whoami                         # Show current user

# Filesystem operations
rad fs ls /Projects/               # List directory
rad fs cat /Projects/notes.txt     # Read file
rad fs put ./local-file.reel /Projects/   # Upload to cartridge
rad fs get /Projects/demo.reel ./  # Download from cartridge
rad fs mv /Desktop/old.txt /Projects/    # Move/rename
rad fs rm /Desktop/old.txt         # Delete
rad fs tree /                      # Full tree view

# Collective
rad fs ls /collective/templates/
rad collective propose /collective/templates/my.reel ./my-template.reel "Add new template"
rad collective proposals            # List pending

# App-specific (thin wrappers that call Radimus or dedicated tools)
rad video transcribe /Projects/demo-reel/voiceover.wav
rad radio preset export /Radio/presets.json ./presets-backup.json

# Chat with Radimus about your files
rad ask "clean up my Desktop folder"
rad ask "transcribe all videos in /Projects/demo-reel/"
```

**Agent compatibility:** Because the CLI uses standard filesystem semantics (`ls`, `cat`, `put`, `get`), any agent that can run shell commands can operate on RadOS files. A user running Claude Code can say "upload my local video to my RadOS projects folder" and the agent runs `rad fs put`.

---

## 8. Radimus Integration

### 8.1 Radimus as Hermes Agent

Radimus runs on [Hermes Agent](https://github.com/NousResearch/hermes-agent) with:

- **His own server** — independent Python process, persistent memory, skills, cron
- **Hermes gateway** — Telegram, Discord, Slack presence
- **RadOS presence** — chat window and terminal inside the desktop environment
- **Custom Hermes skills** for RadOS operations (file management, video editing help, DNA guidance)
- **Local models** — transcription (Whisper), potentially local inference for lightweight tasks
- **Sandboxed terminal** — Docker/SSH backend for safe code execution

### 8.2 RadOS as a Hermes Skill

Radimus's knowledge of RadOS is encoded as Hermes skills:

```yaml
# ~/.hermes/skills/rados-filesystem/SKILL.md
---
name: rados-filesystem
description: Manage files in RadOS user and collective filesystems
version: 1.0.0
metadata:
  hermes:
    tags: [rados, filesystem, radiants]
    category: rados
---

# RadOS Filesystem Operations

## When to Use
When a user asks to manage files, projects, or assets in their RadOS desktop.

## API Endpoint
Base URL: https://rados.radiants.dev/api/fs

## Authentication
Use the Radimus service token stored in RADOS_API_TOKEN.

## Operations
- List: GET /stat, /readdir
- Read: GET /read
- Write: PUT /write
- Delete: DELETE /rm
- Move: POST /mv

## User Context
Always scope operations to the requesting user's space (/user/{userId}/)
unless explicitly asked to operate on /collective/.

## Pitfalls
- Never delete user files without explicit confirmation
- Collective writes require the proposal flow for non-Radimus actors
- Binary files (video, audio) should be streamed, not loaded fully into context
```

Additional skills would cover specific app domains:

```
~/.hermes/skills/
├── rados-filesystem/SKILL.md      ← Core file operations
├── rados-video/SKILL.md           ← OpenReel editing, transcription, exports
├── rados-dna/SKILL.md             ← DNA tokens, component guidance, linting
├── rados-radio/SKILL.md           ← Preset management, frequency guidance
└── rados-collective/SKILL.md      ← Governance, proposals, curation
```

### 8.3 Example Interaction

**User in RadOS chat window:**
> "Hey Radimus, I uploaded a video to my Projects folder. Can you transcribe the audio and save the transcript next to it?"

**Radimus (via Hermes Agent):**
1. Calls RadOS FS API: `GET /api/fs/readdir?path=/user/{userId}/Projects/` — finds the video
2. Calls RadOS FS API: `GET /api/fs/read?path=/user/{userId}/Projects/my-video.webm` — downloads video
3. Runs local Whisper transcription (Hermes terminal tool or code_execution)
4. Calls RadOS FS API: `PUT /api/fs/write` — saves `transcript.json` alongside the video
5. Responds: "Done — transcript saved at /Projects/transcript.json. Want me to add chapter markers?"

**User via Radiants CLI (or their agent):**
```bash
$ rad ask "transcribe the video in my Projects folder"
# Same flow, same result — routed to Radimus via CLI
```

**User via Telegram:**
> "Transcribe my latest RadOS video project"

Radimus (via Hermes gateway) does the same thing, responds in Telegram.

---

## 9. DNA Component Loading via VFS

Separate from user/collective save files, VFS has a secondary role: live DNA component and token loading during development.

### 9.1 Overlay Mode for Design System

DNA VFS uses overlay mode — intercepts specific paths while the real monorepo resolves from disk:

```javascript
import { create } from '@platformatic/vfs'

const dnaVfs = create({ overlay: true })

// Override specific tokens without touching the monorepo
dnaVfs.writeFileSync(
  '/packages/rdna-tokens/src/colors.css',
  `:root { --rdna-primary: ${proposedColor}; }`
)

dnaVfs.mount(MONOREPO_ROOT)
// @rdna/tokens now resolves the override
// All other @rdna/* packages resolve from disk
```

### 9.2 Branding Workshop (April 1st)

Community members propose DNA token changes → token overrides written to VFS overlay → preview renders update without server restart → approved changes committed to real monorepo.

### 9.3 Important Caveat: Bundler Boundary

VFS hooks Node.js module resolution, not webpack/turbopack. This means:
- **Server-side imports** (API routes, RSC) → VFS works
- **Client-side imports** (React components bundled for browser) → VFS does NOT work

DNA overlay is useful for server-rendered previews and API-driven component data. Client-side component hot-swap still requires the bundler's HMR pipeline.

---

## 10. Implementation Roadmap

### Phase 0: Spike (Post-April 1st Workshop)

- [ ] Install `@platformatic/vfs` with `SqliteProvider`
- [ ] Create a user cartridge, write files, read them back via HTTP API
- [ ] Validate File Explorer can render `readdirSync` + `statSync` output as desktop icons
- [ ] Test: can Radimus (Hermes Agent) call the FS API over HTTP and operate on files?
- [ ] Benchmark: SQLite write/read latency for video-sized binary blobs (>50MB)

**Key risks to validate:**
- SQLite blob performance for large media files (may need to store media in object storage with VFS holding references/metadata)
- Auth token design for three-client model (browser session, CLI token, Radimus service token)
- WebSocket sync: when Radimus modifies a file, does the browser File Explorer update in real-time?

### Phase 1: Personal Cartridge + File Explorer (v2.0)

- [ ] SQLite-backed user VFS, provisioned on subscriber signup
- [ ] RadOS FS API (core endpoints)
- [ ] File Explorer UI backed by VFS readdir/stat
- [ ] Save/load in at least one RadOS app (text editor or OpenReel)
- [ ] Auth: browser session tokens, scoped to user's own space

### Phase 2: Radimus + CLI (v2.1)

- [ ] Radimus Hermes skill for RadOS filesystem operations
- [ ] Radiants CLI tool (`rad fs`, `rad ask`)
- [ ] Radimus service token with elevated permissions
- [ ] CLI auth flow (OAuth → local token)
- [ ] Real-time sync: Radimus writes → browser updates via WebSocket

### Phase 3: Collective Filesystem (v2.2)

- [ ] Collective SQLite VFS
- [ ] Proposal/merge flow for user writes to collective
- [ ] Radimus direct write access to collective
- [ ] Version history (SQLite row versioning with timestamps)
- [ ] Collective File Explorer view in RadOS

### Phase 4: App Ecosystem + Portability (v2.3)

- [ ] OpenReel video editor save/load through VFS
- [ ] Rad Radio preset persistence
- [ ] Cartridge export (download your `.db`)
- [ ] Cartridge import (upload and restore)
- [ ] Guest mode (MemoryProvider, session-scoped)

### Phase 5: DNA Live Loading (v3.0)

- [ ] VFS overlay mode for DNA monorepo
- [ ] Token override preview system
- [ ] Design playground integration
- [ ] DNA linter validation before commit

### Future: Decentralized Storage

- [ ] Custom `IPFSProvider` — content-addressed storage for collective assets
- [ ] Solana integration — file ownership/access proofs on-chain
- [ ] Seeker app: `RealFSProvider` sandboxed to device storage

---

## 11. Known Limitations & Risks

### Userland VFS Limitations

These apply to `@platformatic/vfs` until `node:vfs` lands in core:

1. **Module resolution re-implemented** — 960+ lines of duplicated resolver logic. Edge cases in `package.json` exports may break.
2. **Private API patching** — Hooks into `Module._resolveFilename`. Node.js minor releases could break it.
3. **Global fs patching is fragile** — Code that captures `fs.readFileSync` before VFS mounts bypasses VFS.
4. **Module cache cleanup incomplete** — Unmounting doesn't clean `require.cache`.

*These mostly matter for DNA component loading (Phase 5). For the save cartridge model (Phases 1-4), VFS is used purely as a storage API — module resolution hooks aren't needed.*

### SQLite Blob Performance

SQLite handles small-to-medium files well (text, JSON, configs, small images). For large media files (video, audio >50MB), we may need a hybrid approach:
- VFS stores metadata + file reference
- Actual media stored in object storage (S3, R2) or local disk
- RadOS FS API transparently resolves references

### Bundler Boundary

VFS does NOT integrate with webpack/turbopack. Client-side React component imports are unaffected by VFS. This limits DNA overlay to server-side rendering contexts.

### Security: Radimus Permissions

Radimus having full R/W on all user spaces is powerful but risky. Mitigations:
- Audit log of all Radimus file operations (who requested, what changed)
- User can revoke Radimus access to their space
- Radimus confirms before destructive operations (delete, overwrite)
- Rate limiting on Radimus write operations

---

## 12. Decision Log

| Decision | Rationale | Date |
|---|---|---|
| Save cartridge model (VFS as app state persistence) | Files aren't pushed to production — they're save states within tools. Filesystem metaphor gives CLI/agent compatibility for free. | Mar 2026 |
| `@platformatic/vfs` with `SqliteProvider` | Per-user SQLite DBs are portable, self-contained, and match the Hermes Agent `state.db` pattern. One-line migration to `node:vfs` when core lands. | Mar 2026 |
| Radimus consumes VFS via HTTP API, not direct mount | Radimus is Python/Hermes Agent on a separate server. He's a client, not a Node.js process. Same API as browser and CLI. | Mar 2026 |
| Three-client model (browser, CLI, Radimus) | One API surface, three access patterns. No special Radimus pathways — he's an authenticated client with elevated perms. | Mar 2026 |
| Collective writes are git-gated | DAO governance for shared resources. Radimus is the exception (admin-level direct write). | Mar 2026 |
| SQLite per user (not shared DB) | Isolation, portability (export your cartridge), no cross-user query leaks, simple backup/restore. | Mar 2026 |
| Defer DNA overlay to Phase 5 | Bundler boundary risk. Save cartridge (Phases 1-4) is the core product — DNA overlay is a dev tool. | Mar 2026 |
| VFS for storage API only (Phases 1-4), module hooks later (Phase 5) | Module resolution hooks are the fragile part of userland VFS. Save cartridge doesn't need them — pure read/write/stat. | Mar 2026 |
| Radimus built on Hermes Agent (Python) | Persistent memory, skills system, cron, multi-platform gateway (Telegram/Discord), sandboxed terminals, subagent delegation — all built-in. Radimus is an independent entity, not a RadOS subprocess. | Mar 2026 |

---

*This is a living document. Updates will track the status of `node:vfs` core PR, findings from the Phase 0 spike, and decisions made as Radimus's Hermes Agent integration takes shape.*
