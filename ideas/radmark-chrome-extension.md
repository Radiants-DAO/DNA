# RadMark — X/Twitter Bookmarks → Obsidian

Chrome extension (Manifest v3) that injects a save button into X/Twitter, captures tweet data, and writes structured markdown notes directly to an Obsidian vault.

---

## Core flow

1. User sees a tweet → clicks RadMark button (or presses `r`) → optional context popup for notes
2. Tweet captured → stored in `chrome.storage.local` as pending
3. User opens popup → triggers sync → bookmarks written to `{vault}/.pending/bookmarks.json`
4. User pastes the generated processing prompt into Claude → Claude reads the JSON and writes formatted notes into `bookmarks/`, updates MOC files

---

## Architecture

### Entry points

| File | Role |
|------|------|
| `background/index.ts` | Service worker — lifecycle, message passing, `chrome.storage.local` init |
| `content/index.ts` | Injected into x.com — injects RadMark button into tweet action bars, DOM observer, keyboard shortcut |
| `content/tweetExtractor.ts` | Parses tweet DOM → structured bookmark data |
| `content/contextPopup.ts` | In-page popup for adding user notes before saving |
| `popup/Popup.tsx` | Extension popup — browse pending bookmarks, trigger vault sync |
| `options/Options.tsx` | Settings — vault path picker, keyboard shortcut, clipboard fallback |
| `storage/fileStorage.ts` | File System Access API — reads/writes `bookmarks.json` to vault |
| `prompts/process-bookmarks.ts` | Generates the Claude processing prompt (not an API call — prompt text) |

### Key architecture decisions

**Service worker ↔ popup storage split** — File System Access API can't run in a service worker. Pattern: content script saves to `chrome.storage.local` → popup/options page syncs to vault file on open.

**IndexedDB for vault handle persistence** — `FileSystemDirectoryHandle` can't be stored in `chrome.storage`. Must persist via IndexedDB across sessions. User only has to pick the vault once.

**Clipboard fallback** — If no vault is connected, copy markdown to clipboard. Good escape hatch, especially on first run.

**AI processing via prompt, not API** — `process-bookmarks.ts` generates a markdown prompt with vault path + bookmark JSON embedded. User pastes it into Claude. Claude reads `.pending/bookmarks.json`, enriches each bookmark (fetches external links, writes summary, suggests MOC), and writes notes. No API key required.

---

## Data model

```ts
interface RadMarkBookmark {
  id: string
  url: string
  author: { handle: string; name: string; avatar: string }
  content: { text: string; media: string[]; externalLinks: string[] }
  thread: { parent: RadMarkBookmark | null; children: RadMarkBookmark[] }
  quotedTweet: RadMarkBookmark | null
  userContext: string        // from context popup
  suggestedCategory: string  // AI-assigned
  timestamp: string
  tweetEmbed: string
}
```

---

## Tweet DOM parsing (fragile, needs maintenance)

Twitter's DOM uses `data-testid` attributes — more stable than class names but still changes:

- `[data-testid="tweetText"]` — tweet body text
- `[data-testid="User-Name"]` — author block (display name + handle)
- `a[href^="/"]` — profile links (filter out `/i/`, `/hashtag/`, `/status/`)
- `img[draggable="true"]` — avatar fallback

Thread context: walk parent `article` elements up the DOM. Quoted tweets: look for nested `article` within the tweet.

---

## Settings

```ts
interface RadMarkSettings {
  vaultPath: string
  keyboardShortcut: string   // default: 'r'
  clipboardFallback: boolean
}
```

---

## Vault structure

```
vault/
├── .pending/
│   └── bookmarks.json       ← RadMark writes here
├── bookmarks/               ← Claude writes processed notes here
├── MOCs/
│   ├── AI.md
│   ├── Design.md
│   ├── Development.md
│   ├── Business.md
│   ├── Personal.md
│   └── Tools.md
└── templates/
    └── bookmark.md
```

## Note template

```markdown
---
title: "{{title}}"
source: "{{url}}"
author: "@{{handle}}"
date: {{date}}
tags: [{{tags}}]
moc: "[[{{moc}}]]"
tweet_id: "{{id}}"
---

## Summary
## Content
## Thread Context
## Quoted Tweet
## External Links
## Media
## My Notes

---
*Bookmarked via RadMark on {{bookmarkDate}}*
```

---

## Manifest

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://x.com/*", "https://twitter.com/*"],
  "background": { "service_worker": "background.js", "type": "module" },
  "content_scripts": [{
    "matches": ["https://x.com/*", "https://twitter.com/*"],
    "js": ["content.js"],
    "css": ["assets/content.css"],
    "run_at": "document_idle"
  }]
}
```

---

## Stack

- React + TypeScript + Vite + RDNA
- Chrome Extension Manifest v3
- File System Access API + IndexedDB for vault persistence
- No backend, no API keys required
