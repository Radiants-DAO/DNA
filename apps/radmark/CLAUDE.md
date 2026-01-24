# CLAUDE.md

## Project Overview

RadMark is a Chrome extension (Manifest v3) that saves X/Twitter bookmarks to Obsidian vaults.

**Stack:**
- React 19 + TypeScript
- Tailwind CSS v4
- Vite for building
- Chrome Extension Manifest v3

## Structure

```
radmark/
├── src/
│   ├── background/     # Service worker
│   ├── content/        # Content scripts (injected into Twitter)
│   ├── popup/          # Extension popup UI
│   ├── options/        # Settings page
│   └── shared/         # Shared utilities and storage
├── public/
│   └── manifest.json   # Chrome extension manifest
├── scripts/            # Build scripts
└── vault-template/     # Obsidian vault template
```

## Commands

```bash
pnpm dev      # Development build with watch
pnpm build    # Production build to dist/
pnpm preview  # Preview production build
```

## Key Files

- `src/content/main.tsx` - Tweet capture and RadMark button injection
- `src/popup/Popup.tsx` - Extension popup UI
- `src/options/Options.tsx` - Settings page (vault path, shortcuts)
- `src/shared/storage.ts` - JSON file storage via File System API

## Notes

- This is a standalone Chrome extension, not a web app
- Does not depend on DNA themes (uses its own Tailwind config)
- Build output goes to `dist/` which can be loaded as unpacked extension
