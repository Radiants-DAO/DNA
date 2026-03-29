---
name: Font loading strategy - lazy load display fonts
description: Don't consolidate fonts — lazy load display/editorial fonts on app-window open
type: feedback
---

Do NOT consolidate to fewer fonts. Instead, lazy-load display fonts on demand.

**Initial load (3 fonts):** Joystix Monospace, Mondwest, PixelCode — these are the core token system fonts.

**Lazy load on app-window open:** Waves Blackletter CPC, Pixeloid Sans, Waves Tiny CPC — these load when their respective app windows (e.g., GoodNewsApp) open.

**Why:** The user wants the full font palette available but doesn't want 6+ fonts blocking initial page load. The RadOS window system provides a natural lazy-load boundary — each app window can trigger its own font loads.

**How to apply:** When working on font performance, implement lazy loading at the app-window level, not font consolidation/removal.
