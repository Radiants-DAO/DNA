# RadMark: X/Twitter Bookmark to Obsidian Extension

## Problem

Twitter/X bookmarks are a black hole - no native way to organize, categorize, search, or extract value from saved content. Users accumulate hundreds of bookmarks with no structure, making them effectively useless. Existing tools either cost money (Dewey, TweetSmash) or require complex API access ($200/month for Twitter's bookmark endpoint).

## Solution

RadMark is a Chrome extension that:
1. Injects a RadMark button next to Twitter's native bookmark icon
2. Captures tweet content, threads, and external links on click
3. Stores pending bookmarks as JSON in an Obsidian vault
4. Provides a robust Claude Code prompt for batch processing into organized Obsidian notes with MOC (Map of Content) structure

## Technical Approach

### Project Location
- **Standalone project**: `/Users/rivermassey/Desktop/dev/radmark`
- **Design reference**: Extract/copy styles from `/Users/rivermassey/Desktop/dev/dna/packages/radiants`
- **Assets**: Copy `rad-mark-yellow.svg` from radiants to this project

### Extension Architecture
- **Stack**: React 19 + Tailwind 4 (matching rad_os patterns)
- **Design System**: Radiants tokens and styling (copied/extracted from monorepo)
- **Manifest**: Chrome Extension Manifest V3

### Radiants Design Tokens (to extract)
```css
/* Core colors */
--color-sun-yellow: #FCE184;
--color-black: #0F0E0C;
--color-warm-cloud: #FEF8E2;

/* Shadows (retro lift effect) */
--shadow-btn: 0 1px 0 0 var(--color-black);
--shadow-btn-hover: 0 3px 0 0 var(--color-black);

/* Button states */
hover:-translate-y-0.5
hover:shadow-btn-hover
active:translate-y-0.5
active:shadow-none
```

### RadMark Button (Content Script)
- **Placement**: Next to Twitter's native bookmark icon in tweet action bar
- **Icon**: rad-mark-yellow.svg (copy from radiants)
- **Size**: Match Twitter's icon size exactly (18.75px)
- **States**:
  - Unbookmarked: Gray outline stroke
  - Bookmarked: Yellow filled (#FCE184)
- **Hover**: Radiants lift effect (box-shadow transformation)
- **Keyboard**: Vim-style 'r' key when tweet is focused
- **Click behavior**:
  - Normal click: Toggle bookmark on/off
  - Alt+click: Open inline floating context popup

### Context Popup (Alt+Click)
- **Position**: Absolute, floating next to RadMark button
- **Content**: 
  - Single text input for user context/notes
  - Tab key reveals category dropdown (populated from existing MOCs in JSON)
- **Save behavior**: Auto-save on blur + Enter to save
- **Cancel**: Escape to close without saving

### Data Capture
On bookmark click, capture:
```json
{
  "id": "tweet_id",
  "url": "https://x.com/user/status/123",
  "author": {
    "handle": "@username",
    "name": "Display Name",
    "avatar": "url"
  },
  "content": {
    "text": "Tweet text content",
    "media": ["url1", "url2"],
    "externalLinks": ["github.com/...", "article.com/..."]
  },
  "thread": {
    "parent": { /* parent tweet if reply to same author */ },
    "children": [ /* immediate replies from same author */ ]
  },
  "quotedTweet": { /* if quote tweet, flatten into this bookmark */ },
  "userContext": "User's note from context popup",
  "suggestedCategory": "AI",
  "timestamp": "ISO8601",
  "tweetEmbed": "<blockquote>...</blockquote>"
}
```

### Thread Capture Rules
- Capture bookmarked tweet + immediate parent (if same author)
- Capture immediate children replies (if same author)
- Ignore comments from other users
- Quote tweets: flatten quoted content into single bookmark

### Extension Popup
- **Trigger**: Click extension icon
- **Content**:
  - Pending bookmark count badge
  - List of pending bookmarks (title/author preview)
  - "Copy Prompt" button (references file path)
  - "Copy Prompt + Data" button (embeds JSON in prompt)
- **Styling**: Radiants design system (extracted)

### Settings Page
Minimal settings:
- Vault path configuration (File System API permission)
- Keyboard shortcut customization
- Clipboard fallback toggle

### Storage & Persistence
- **Primary**: JSON file at `{vault}/.pending/bookmarks.json`
- **Tracking**: Store bookmarked tweet IDs to prevent duplicates
- **Source of truth**: JSON file (extension reads on load)
- **File Access**: Chrome File System Access API with user permission
- **Fallback**: Copy to clipboard if file access fails

### Obsidian Vault Structure
**Path**: `/Users/rivermassey/Desktop/vault/bookmark`
```
/bookmark/
├── .pending/
│   └── bookmarks.json      # Pending bookmarks from extension
├── bookmarks/
│   └── *.md                # Individual bookmark notes
├── MOCs/
│   └── *.md                # Map of Content pages by topic
└── templates/
    └── bookmark.md         # Obsidian template (provided in repo)
```

### Claude Processing Prompt
The extension provides a robust, step-by-step prompt that:

1. **Read pending bookmarks** from `.pending/bookmarks.json`
2. **For each bookmark**:
   - Fetch and summarize external URLs (GitHub, articles, etc.)
   - Generate descriptive auto-title
   - Determine appropriate MOC category (analyze content, check existing MOCs, create new if needed)
   - Create Obsidian note with YAML frontmatter
   - Embed tweet content and media URLs
   - Add wiki links to relevant MOC(s)
3. **Update MOCs**: Add backlinks to new bookmark notes
4. **Summary**: Show what was created, which MOCs updated
5. **Review gate**: Ask user to confirm before cleanup
6. **Cleanup**: Delete processed bookmarks from pending JSON on user approval

### Obsidian Note Format
```markdown
---
title: Auto-generated descriptive title
source: https://x.com/user/status/123
author: "@username"
date: 2024-01-22
tags: [ai, tools, development]
moc: "[[AI]]"
---

## Summary
Claude-generated summary of the tweet content

## Content
Original tweet text with embedded media

## Thread Context
Parent/children tweets if applicable

## External Links
- [GitHub Repo](url) - Summary of what it is
- [Article Title](url) - Key takeaways

## My Notes
User's context note from extension

---
*Bookmarked via RadMark*
```

### Linking Strategy
- **Hub-spoke model**: Bookmarks link to MOCs, MOCs link to bookmarks
- **No direct cross-linking**: Related bookmarks connect via shared MOCs
- **Clean graph view**: Optimized for Obsidian's graph visualization
- **Wiki links**: `[[MOC Name]]` format for all links

## Edge Cases

- **Deleted tweets**: Process with cached data captured at bookmark time, note source as deleted
- **Rate limiting**: Respect Twitter's rate limits when capturing thread context
- **Large threads**: Cap thread capture at immediate parent/children to avoid bloat
- **Duplicate bookmarks**: Check existing tweet IDs before adding, toggle off removes from pending
- **Failed URL fetches**: Note URL without summary, mark as "fetch failed"
- **No MOC match**: Claude creates new MOC when content doesn't fit existing categories

## Quick Commands

```bash
# Development
cd /Users/rivermassey/Desktop/dev/radmark
npm install
npm run dev

# Build extension
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Load unpacked → select /radmark/dist

# Process bookmarks (in vault directory)
cd /Users/rivermassey/Desktop/vault/bookmark
# Paste prompt from extension
```

## Acceptance Criteria

- [ ] RadMark button appears next to Twitter's native bookmark icon on all tweets
- [ ] Button matches Twitter's icon size and has gray→yellow state change
- [ ] Radiants lift effect on hover
- [ ] 'r' key bookmarks focused tweet
- [ ] Alt+click opens inline floating context popup
- [ ] Tab in popup reveals category dropdown from existing MOCs
- [ ] Popup saves on blur or Enter, cancels on Escape
- [ ] Extension popup shows pending count and bookmark list
- [ ] "Copy Prompt" and "Copy Prompt + Data" buttons work correctly
- [ ] Settings page allows vault path and shortcut configuration
- [ ] JSON file written to vault with correct schema
- [ ] Duplicate bookmarks detected and prevented
- [ ] Toggle off removes bookmark from pending
- [ ] Thread context captured (parent/children from same author)
- [ ] Quote tweets flattened into single bookmark
- [ ] Media URLs captured for Obsidian embedding
- [ ] External links extracted from tweet content
- [ ] Claude prompt successfully processes bookmarks into notes
- [ ] Notes have correct YAML frontmatter and structure
- [ ] MOCs created/updated with backlinks
- [ ] Clean graph view visualization in Obsidian
