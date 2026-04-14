# Rad Tab — Chrome Tab Management Extension Brainstorm

**Date:** 2026-04-12 (updated 2026-04-13)
**Status:** Early exploration
**Reference:** [zarazhangrui/tab-out](https://github.com/zarazhangrui/tab-out) — prototype for new-tab-page tab manager

## Core Idea

"Rad Tab" — a Chrome extension that replaces the new tab page with a tab management dashboard, plus persistent ambient features (music, timers, etc.) that follow you across all browsing.

## Key Technical Finding: Website Can't Access Tabs

A plain website **cannot** enumerate or manage browser tabs. The `chrome.tabs` API is extension-only — no web standard exposes this (privacy/security). A Chrome extension is always required.

### Distribution Options

| Option | How it works | Tradeoff |
|--------|-------------|----------|
| **Extension-only** | Entire UI lives in `chrome_url_overrides.newtab`. No server. | Simplest. Most tab managers do this (Arc, Toby). |
| **Thin extension + local server** | Extension pushes tab data to localhost. Web dashboard renders UI. (What Tab Out does.) | Richer UI, but requires running a local server. |
| **Thin extension + hosted website** | Extension uses `externally_connectable` messaging to let `radtab.app` request tab data. No server. | Closest to "just a website." Extension install still required but can be < 50 lines. |

## Persistence Architecture (Manifest V3)

The new tab page **dies when you navigate away** — can't hold persistent state like music. MV3 provides three persistence mechanisms:

### 1. Offscreen Document (best for audio)

`chrome.offscreen.createDocument()` with reason `AUDIO_PLAYBACK`. Invisible background document with a real DOM — `<audio>`, Web Audio API, visualizations all work. Persists until closed or extension killed.

```js
// background.js (service worker)
chrome.offscreen.createDocument({
  url: 'offscreen.html',
  reasons: ['AUDIO_PLAYBACK'],
  justification: 'Playing ambient music'
});
```

### 2. Side Panel (best for persistent visible UI)

`chrome.sidePanel` stays open across all tab navigations. Full web page in a Chrome-native panel. Audio persists here too. The "ever-present" surface — a mini app alongside whatever you're browsing.

### 3. Service Worker + Alarms (for state, not audio)

Service worker is ephemeral (~30s idle timeout), can't hold audio. But `chrome.alarms` wakes it periodically, `chrome.storage` persists state across wake cycles. Good for coordination.

## Proposed Architecture

```
┌─────────────────────────────────────────────┐
│  Chrome                                      │
│                                              │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Side Panel   │  │ Active Tab          │  │
│  │              │  │                     │  │
│  │ Now Playing  │  │ (whatever the user  │  │
│  │ Tab Groups   │  │  is browsing)       │  │
│  │ Quick Actions│  │                     │  │
│  │ Saved Sessions│ │                     │  │
│  └──────────────┘  └─────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ Offscreen Document (invisible)       │   │
│  │ - Audio playback engine              │   │
│  │ - Web Audio API / visualizer data    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ Service Worker                        │   │
│  │ - Tab tracking (chrome.tabs)          │   │
│  │ - Message router between all pieces   │   │
│  │ - Storage sync                        │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  New Tab Override (only when open)           │
│  - Full dashboard view                       │
│  - Rich tab management UI                    │
│  - Controlled by same extension              │
└─────────────────────────────────────────────┘
```

- **New tab page** = full-screen dashboard (tab groups, session management, the rich view)
- **Side panel** = persistent mini-player + quick tab actions that follow you everywhere
- **Offscreen doc** = invisible audio engine that never stops
- **Service worker** = the brain that wires everything together

## Feature Ideas

### Tab Management
- Tab grouping by domain / project / topic
- Session snapshots — save/restore entire browser states
- Duplicate detection + one-click cleanup
- Tab decay — visual aging of tabs you haven't visited, nudging cleanup
- Workspace modes — "work mode" hides personal tabs, "research mode" groups by search query
- Tab usage stats over time

### Persistent Ambient Features
- Lo-fi radio / ambient music (offscreen doc audio)
- Ambient soundscapes — rain, coffee shop, etc. via Web Audio API
- Pomodoro / focus timer in the side panel
- "Now playing" across Spotify/YouTube tabs (content script reads media state)
- Notification when a watched tab changes (price drop, build finishes, CI completes)

### AI / Smart Features
- Cluster tabs by topic using embeddings
- Auto-suggest tab groups based on browsing patterns
- Smart bookmarking — summarize a tab before closing

### Team Productivity Surface

The new tab page is arguably the most valuable real estate for a team — guaranteed daily impressions every time someone opens a tab. Instead of a blank page or a search bar, it becomes mission control.

#### Integration APIs

| Service | Auth mechanism | What you get | Friction |
|---------|---------------|-------------|---------|
| **Google Sheets/Docs/Calendar/Tasks** | `chrome.identity.getAuthToken()` — piggybacks on Chrome's existing Google login | Read/write spreadsheets, pull doc contents, calendar events, task lists | **Zero friction** — no separate login, just a permission prompt |
| **Notion** | OAuth2 (REST API) | Read/write pages, databases, blocks. Pull kanban boards, wikis, task databases | One-time auth flow |
| **Linear** | OAuth2 (GraphQL API) | Issues, projects, cycles, team activity | One-time auth flow |
| **GitHub** | OAuth2 or PAT (REST/GraphQL) | Issues, PRs, repo activity, Actions status | One-time auth flow |
| **Jira** | OAuth2 (REST API) | Issues, sprints, boards | One-time auth flow |
| **Slack** | OAuth2 (Web API) | Unread counts, channel mentions, status | One-time auth flow |
| **Figma** | OAuth2 (REST API) | Recent files, comments, project activity | One-time auth flow |

Google is the killer integration — `chrome.identity` makes it frictionless because the user is already logged into Chrome. Every other service requires a standard OAuth flow once, then the token lives in `chrome.storage`.

#### What the new tab page could show

**Personal view:**
- Today's calendar (Google Calendar API)
- Active tasks from wherever they live (Notion, Linear, GitHub Issues)
- Unread mentions (Slack, GitHub notifications)
- Docs you touched recently (Google Drive, Notion)
- PR review requests waiting on you

**Team view:**
- Shared project tracker pulled live from a Google Sheet or Notion database
- Sprint/cycle progress (Linear, Jira)
- Who's online / what people are working on
- Team standup notes or daily log
- Deployment status (GitHub Actions, Vercel)

**The "no new workflow" principle:** teams already track work in Sheets, Notion, Linear, etc. Rad Tab doesn't ask anyone to change tools — it just surfaces what's already there, right where everyone looks.

#### Team sync architecture options

| Approach | How it works | Tradeoff |
|----------|-------------|----------|
| **No backend** | Each person connects their own accounts, sees their own slice of shared resources (e.g., same Notion database, same Google Sheet) | Simplest. No server to maintain. But no "team presence" features. |
| **Lightweight sync server** | Small backend aggregates team state — who's online, what tabs are open, activity feed | Enables team features (presence, shared views). Needs hosting. |
| **Peer-to-peer via shared doc** | Use a shared Google Sheet or Notion database as the "backend" — each extension writes its state there | Creative hack. No custom server. But rate limits and latency. |

#### Widget ideas for the new tab dashboard

- **Pinned Google Sheet** — embed a live view of a specific sheet (standup tracker, OKR scorecard, project roadmap)
- **Notion database view** — kanban or table pulled from a team database, filterable
- **PR queue** — your open PRs + PRs waiting for your review, with CI status
- **Calendar strip** — today's meetings at a glance, next meeting countdown
- **Quick capture** — type a note that goes straight to a Notion inbox or Google Doc
- **Daily focus** — pick 1-3 things for the day, visible every time you open a tab
- **Team pulse** — lightweight async standup: "what I did / what I'm doing / blockers"

### RadOS Integration Potential
- Tabs as windows in the RadOS desktop metaphor
- RDNA-themed UI (pixel corners, design tokens)
- Shared session state between RadOS and browser

## Open Questions

- Ship as Chrome Web Store extension or side-load only?
- How much overlap with existing tab managers (Arc, Toby, OneTab) — what's the unique angle?
- Would cross-browser support (Firefox, Safari) matter? Each has different extension APIs.
- Music source: built-in streams, YouTube integration, Spotify Connect, or local files?
- Does the side panel + new tab page combo feel cohesive or fragmented?
- Which integrations are v1 vs later? Google is frictionless so probably v1. Notion/Linear as fast-follows?
- Team features: does this need a backend, or can shared Google Sheets / Notion databases act as the sync layer?
- Widget layout: fixed grid, draggable/configurable, or role-based presets (engineer, designer, PM)?
- Privacy: tab data + integration tokens are sensitive. How much stays local vs synced?

## Reference: Tab Out Architecture

Tab Out uses a three-piece setup:
1. **Chrome extension** — `chrome.tabs` + `chrome_url_overrides.newtab` (MV3)
2. **Local Node server** (localhost:3456) — stores/groups tab data, provides API
3. **Dashboard web page** — display layer that talks to local server

Permissions: `tabs`, `activeTab`, `host_permissions: ["http://localhost:3456/*"]`
