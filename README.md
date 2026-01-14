# RadFlow Tauri

Native desktop application for visual design system editing.

## Status

🔬 **Research & Planning Phase**

Currently documenting features and researching implementation approaches. No code yet.

## What is RadFlow?

RadFlow is a visual design system editor. It lets you:
- Edit design tokens (colors, shadows, typography) visually
- Browse and modify components
- Manage theme assets (icons, logos)
- Ensure design system consistency

This repo is a ground-up rebuild using **Tauri** (Rust + React) for native desktop performance.

## Documentation

All feature specifications are in `/docs/features/`:

| Spec | Description |
|------|-------------|
| [00-overview](docs/features/00-overview.md) | Architecture and principles |
| [01-variables-editor](docs/features/01-variables-editor.md) | Design tokens |
| [02-typography-editor](docs/features/02-typography-editor.md) | Fonts and text styles |
| [03-component-browser](docs/features/03-component-browser.md) | Component discovery |
| [04-theme-system](docs/features/04-theme-system.md) | Theme management |
| [05-assets-manager](docs/features/05-assets-manager.md) | Icons and logos |
| [06-tools-and-modes](docs/features/06-tools-and-modes.md) | Inspection tools |
| [07-search-and-navigation](docs/features/07-search-and-navigation.md) | Search and shortcuts |
| [08-canvas-editor](docs/features/08-canvas-editor.md) | Primary canvas view |
| [09-ai-integration](docs/features/09-ai-integration.md) | Prompt builder |
| [10-tauri-architecture](docs/features/10-tauri-architecture.md) | Rust backend |
| [11-mock-states](docs/features/11-mock-states.md) | Development states |

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Rust + Tauri 2.0
- **CSS Parsing:** lightningcss
- **TSX Parsing:** SWC
- **Git:** git2
- **Search:** tantivy

## Development

```bash
# Coming soon - project not yet scaffolded
```

## License

TBD
