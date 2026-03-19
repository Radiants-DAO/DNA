# RadMark — X/Twitter Bookmarks → Obsidian

Chrome extension (Manifest v3) that captures X/Twitter bookmarks and saves them to an Obsidian vault as structured markdown notes.

## What was built

**Entry points (Manifest v3):**
- `background/index.ts` — Service worker. Handles lifecycle, message passing, `chrome.storage.local` for pending bookmarks. File System API ops can't run in service worker — deferred to popup/options pages.
- `content/index.ts` — Content script injected into `x.com` + `twitter.com`. Injects RadMark button into tweet action bars, tracks injected tweets via Set, debounced DOM observer for new tweets, keyboard shortcut (`r` key) on hovered tweet, toast notifications.
- `content/tweetExtractor.ts` — Parses tweet DOM → structured data (author, text, media, thread, quoted tweet, external links).
- `content/contextPopup.ts` — In-page context popup for adding user notes before saving.
- `popup/Popup.tsx` — Extension popup UI. Browse/search saved bookmarks, trigger vault sync.
- `options/Options.tsx` — Settings page. Vault path picker (File System API), keyboard shortcut config, clipboard fallback toggle.
- `storage/fileStorage.ts` — All File System Access API logic: `requestVaultAccess`, `readBookmarksFromFile`, `writeBookmarksToFile`, `syncBookmarks`, clipboard fallback.
- `prompts/process-bookmarks.ts` — AI processing pipeline for bookmark enrichment (summary, category suggestion, link metadata).

## Data model

```ts
interface RadMarkBookmark {
  id: string
  url: string
  author: { handle: string; name: string; avatar: string }
  content: { text: string; media: string[]; externalLinks: string[] }
  thread: { parent: RadMarkBookmark | null; children: RadMarkBookmark[] }
  quotedTweet: RadMarkBookmark | null
  userContext: string
  suggestedCategory: string
  timestamp: string
  tweetEmbed: string
}
```

## Settings

```ts
interface RadMarkSettings {
  vaultPath: string
  keyboardShortcut: string   // default: 'r'
  clipboardFallback: boolean // copy markdown to clipboard if no vault connected
}
```

## Vault template (Obsidian note output)

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
## Thread Context (if applicable)
## Quoted Tweet (if applicable)
## External Links
## Media
## My Notes
```

## MOC structure in vault template

- AI / Design / Development / Business / Personal / Tools

## Manifest permissions

```json
"permissions": ["storage", "activeTab"],
"host_permissions": ["https://x.com/*", "https://twitter.com/*"]
```

## Stack

- React 19 + TypeScript + Tailwind v4 (standalone config, not RDNA)
- Vite + Chrome Extension Manifest v3 (service worker)
- File System Access API — no server, writes directly to local vault

## Rebuild notes

- Port UI to RDNA components
- The vault template + MOC structure is solid — keep it
- `tweetExtractor.ts` will need maintenance — Twitter's DOM changes frequently
- The service worker ↔ popup storage pattern (store to `chrome.storage.local`, sync to file on popup open) is the right architecture for MV3
- `clipboardFallback` was a good escape hatch for users who haven't granted vault access yet
- Consider using `tools/flow` as reference for extension build setup
