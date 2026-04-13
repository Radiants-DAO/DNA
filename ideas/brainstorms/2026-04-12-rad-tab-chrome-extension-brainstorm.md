# Rad Tab — Chrome Tab Management Extension Brainstorm

**Date:** 2026-04-12
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

## Reference: Tab Out Architecture

Tab Out uses a three-piece setup:
1. **Chrome extension** — `chrome.tabs` + `chrome_url_overrides.newtab` (MV3)
2. **Local Node server** (localhost:3456) — stores/groups tab data, provides API
3. **Dashboard web page** — display layer that talks to local server

Permissions: `tabs`, `activeTab`, `host_permissions: ["http://localhost:3456/*"]`
