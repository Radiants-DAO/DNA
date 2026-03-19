# RadMark — X/Twitter Bookmarks → Obsidian

Chrome extension (Manifest v3) that captures X/Twitter bookmarks and saves them to an Obsidian vault.

## What was built

- Content script injected into Twitter — detects tweets, injects a "RadMark" save button
- Extension popup UI — browse/manage saved bookmarks
- Options page — configure vault path, keyboard shortcuts
- JSON file storage via the File System Access API (no server needed)
- Obsidian vault template with MOC structure (AI, Design, Development, Business, Tools, Personal)
- Bookmark note template

## Stack

- React 19 + TypeScript + Tailwind v4 + Vite
- Chrome Extension Manifest v3 (service worker background)
- Did NOT use RDNA/radiants — had its own Tailwind config

## Rebuild notes

- Start fresh with good RDNA styling (use `tools/flow` as reference for extension architecture)
- The vault template / MOC structure was solid — worth reusing
- Key challenge: Twitter's DOM is dynamic/obfuscated, content script selectors need maintenance
- File System Access API for vault writing was the right call — avoids needing a native app bridge
