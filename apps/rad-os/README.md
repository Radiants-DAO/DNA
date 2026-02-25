# RadOS
A desktop-like web experience with retro OS aesthetics — draggable windows, a taskbar, and desktop icons, built for the Radiants community.

## What is RadOS?
RadOS reimagines the web as a nostalgic operating system. Instead of scrolling through pages, users interact with apps in windows — dragging them around, minimizing to a taskbar, and discovering tools through a Start Menu. It's part brand hub, part creative studio, part community interface.

## Built With

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS v4 with custom retro theme |
| State | Zustand for unified state management |
| Design System | RDNA — our pixel-perfect component library |

## Quick Start
```bash
npm install
npm run dev      # → localhost:3000
```

Other commands:
```bash
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture
RadOS follows a window-centric architecture where each app renders inside a managed window with its own state, size constraints, and behavior.
```
┌─────────────────────────────────────────────────────────────┐
│                          RadOS                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Brand  │  │Manifesto│  │ Auction │  │  Radio  │  Apps  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                      Window System                          │
│              (drag, resize, focus, minimize)                │
├─────────────────────────────────────────────────────────────┤
│                    Zustand Store                            │
│              (windows, apps, mock data)                     │
├─────────────────────────────────────────────────────────────┤
│                        RDNA                                  │
│                (UI component library)                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages |
| `components/ui/` | RDNA design system primitives |
| `components/Rad_os/` | Window system (AppWindow, Taskbar) |
| `components/apps/` | Individual application components |
| `store/` | Zustand stores with slice pattern |
| `lib/` | Constants, utilities, mock data |
| `.vault/` | Obsidian knowledge base (documentation) |

## State Management
All state lives in Zustand — no React Context. This includes window positions, app state, mock data, and user preferences. See ADR-001: Zustand Unified State for rationale.

## App Ecosystem
RadOS ships with 10 apps organized by complexity. See Apps Index for full documentation.

### Core Apps

| App | Description |
|-----|-------------|
| Brand Assets | Logo downloads, color palette, fonts, AI generation codes |
| Manifesto | Radiants philosophy with section navigation |
| About | Credits, contributors, licenses |
| Links | Curated external resources |
| Settings | Volume control, reduce motion toggle |

### Complex Apps

| App | Description |
|-----|-------------|
| Calendar | Community events and milestones |
| Rad Radio | Music player with dithered video visualizer |

### Web3-Ready Apps (Mock Data)

| App | Description |
|-----|-------------|
| Auctions | NFT auction interface with vault system |
| Murder Tree | NFT provenance visualization (burn history) |
| Radiants Studio | Pixel art maker, dither tool, commission marketplace |

## Building Apps
Apps are React components that receive a `windowId` prop:
```tsx
interface AppProps {
  windowId: string;
}

function MyApp({ windowId }: AppProps) {
  return (
    <div className="p-4">
      {/* Use RDNA components */}
      <Button>Click me</Button>
    </div>
  );
}
```

Register in `lib/constants.ts`:
```ts
export const APP_REGISTRY = {
  myapp: {
    id: 'myapp',
    title: 'My App',
    icon: <MyIcon />,
    component: MyApp,
    defaultSize: { width: 600, height: 450 },
    resizable: true,
  },
};
```

See the Creating Apps Guide for detailed walkthrough, or review the App Pattern architecture doc.

## Design System
RadOS uses RDNA, a custom component library with pixel-art aesthetics. See `DESIGN.md` for the full token reference.

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-cream` | `#FEF8E2` | Primary background |
| `--color-sun-yellow` | `#FCE184` | Accent, active states |
| `--color-black` | `#0F0E0C` | Text, borders |
| `--color-sky-blue` | `#95BAD2` | Secondary accent |
| `--color-sun-red` | `#FF6B63` | Error, warnings |
| `--color-green` | `#CEF5CA` | Success |

### Typography
- **Joystix** — Pixel font for headings and buttons
- **Mondwest** — Body text and descriptions
- **PixelCode** — Code blocks and monospace

### Components
Import from `@/components/ui`:
```tsx
import { Button, Card, Tabs, Input, Dialog, Badge } from '@/components/ui';
```

**Full component API:** See `DESIGN.md` | **Individual components:** Button, Card, Tabs

## Documentation
This project uses an Obsidian knowledge vault (`.vault/`) as the source of truth for documentation.

### Viewing Docs
- **In Obsidian (recommended):** Open `.vault/` as a vault
- **As files:** Browse markdown files starting at `.vault/index.md`

### Key Documents

| Topic | Document |
|-------|----------|
| Architecture overview | Architecture MOC |
| Window system | Window System |
| State management | State Management |
| Design tokens | `DESIGN.md` |
| Component API | `DESIGN.md` |
| App development | Creating Apps |
| Mock data patterns | Mock Data Patterns |
| Technical spec | SPEC.md |

### For AI Agents
Claude Code and other AI assistants can use the `.claude/skills/` directory for quick context:

| Skill | Use Case |
|-------|----------|
| `rados` | Architecture, window system, app patterns |
| `rdna` | Design system reference (see `DESIGN.md`) |
| `rados-app-scaffold` | Scaffolding new applications |

For deeper context, read the vault at `.vault/`. Agent-specific documentation:

- **RadOS Builder Agent** — End-to-end app building
- **RDNA Reviewer** — Code quality checks
- **Visual Implementer** — Browser-based implementation
- **Doc Writer** — Documentation generation

## Project Links
- **Design Reference:** radiant-nexus.webflow.io
- **Technical Spec:** SPEC.md
- **Knowledge Vault:** .vault/
- **Decisions:** Architecture Decision Records
- **Migration Notes:** Devlink Migration | Retro OS Patterns

## License
[Add license information]