# RadOS Technical Specification v2

This document describes the current RadOS build. For app registration, launcher visibility, start menu grouping, and chrome defaults, `apps/rad-os/lib/apps/catalog.tsx` is the source of truth.

> This document owns RadOS product-specific behavior. `packages/radiants/DESIGN.md` owns portable Radiants design-system behavior.

---

## 1. Architecture Overview

RadOS is a desktop-like web experience built with Next.js 16, React 19, and Tailwind CSS v4. It presents a retro OS aesthetic with draggable windows, a taskbar, and desktop icons.

### Core Technologies
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom theme
- **State Management**: Zustand (unified store for all state)
- **Drag/Resize**: react-draggable

### Key Directories
```
app/                    # Next.js app router pages
components/
  ui/                   # RDNA design system primitives
  Rad_os/               # Window system components
  apps/                 # Individual application components
hooks/                  # Custom React hooks
store/                  # Zustand stores
lib/                    # Constants, utilities, mock data
public/
  assets/               # Brand assets (logos, fonts, audio, video)
reference/              # Reference implementation (Webflow Devlink)
```

---

## 2. State Management

### Decision: Zustand (Unified)
All application state lives in Zustand stores. This includes:
- Window state (open/close, position, size, z-index, minimized)
- App-specific state
- Mock data state
- User preferences

No React Context for state management. Single paradigm for easier debugging.

### Store Structure
```typescript
// store/index.ts
interface RadOSStore {
  windows: WindowState[];
  mockData: MockDataState;
  preferences: PreferencesState;
  // ...app-specific slices
}
```

---

## 3. Window System

### WindowState Interface
```typescript
interface WindowState {
  id: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}
```

### Per-App Window Configuration
Each app declares its own window constraints:
```typescript
interface AppWindowConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}
```

### Window Behaviors
- **Opening**: Window appears at default position, cascaded if multiple windows
- **Focus**: Clicking window brings it to front (highest z-index)
- **Minimize**: Window hides, can be restored from Start Menu
- **Close**: Window closes, state persists for reopening
- **Drag**: Title bar is drag handle
- **Resize**: Per-app configuration (some apps fixed size)

### Window Limit
- **Soft limit of 5 windows**: When attempting to open a 6th window, show a toast warning about performance but allow the action
- No hard blocking of window opens

---

## 4. Hash Routing & Deep Linking

### URL Format
```
https://rados.app/#brand           # Opens Brand Assets window
https://rados.app/#brand,manifesto # Opens multiple windows
```

### Behavior
- **Valid app IDs**: Window opens normally
- **Invalid app IDs**: Silently ignored (no error, other valid IDs still open)
- **Hash updates**: Opening/closing windows updates URL hash
- **Multi-window support**: Comma-separated IDs

---

## 5. Desktop & Taskbar

### Desktop Icons
- **Grid layout**: Left side on desktop, responsive on mobile
- **Double-click to open**: No single-click selection state
- **Position persistence**: Icon positions saved to localStorage
- **Drag to rearrange**: Users can customize icon layout

### Taskbar
- **Location**: Fixed at bottom of viewport
- **Start Button**: Opens Start Menu
- **Window Buttons**: Shown only when >1 window is open (hybrid approach)
- **Social Links**: Twitter, Discord, GitHub (GitHub hidden on mobile)
- **System Tray**: Invert toggle and taskbar-hosted audio controls
- **Clock**: Real time display (HH:MM format), updates every minute

### Start Menu
- **Full-screen overlay on mobile**
- **Popup menu on desktop**
- **App switching**: Primary method for switching/restoring minimized apps on mobile
- **Sections**: Apps, Connect (social links)

---

## 6. Background & Animations

### WebGL Sun Background
- **Animated sun**: Moving across screen with pixel-art dithering
- **Mouse interaction**: Sun repulsion effect, mouse trail
- **4x4 Bayer matrix dithering**: Creates pixel-art aesthetic

### Performance Optimization
- **Intersection Observer**: Pause animation when fully covered by windows
- **No reduced frame rate on mobile**: Full 60fps when visible, paused when not

### Invert Mode (Easter Egg)
- **Trigger**: Konami code (Up Up Down Down Left Right Left Right)
- **Effect**: Full page color inversion
- **Persistence**: Session only (resets on page reload)
- **Toggle**: Also available via taskbar button

---

## 7. App Development Pattern

### Thin Component Interface
Apps are React components with minimal dependencies:

```typescript
interface AppProps {
  windowId: string;
  // Apps import from @/components/ui for RDNA primitives
  // Apps can use @/store for Zustand state
  // Apps can use @/lib/mockData for mock data
}
```

### App Registration
```typescript
// lib/apps/catalog.tsx — single source of truth for app metadata
const BrandApp = lazy(() => import('@/components/apps/BrandApp'));

export const APP_CATALOG: AppCatalogEntry[] = [
  {
    id: 'brand',
    windowTitle: 'Brand',
    windowIcon: <RadMarkIcon size={20} />,
    component: BrandApp,
    defaultSize: 'lg',
    desktopVisible: true,
    category: 'tools',
  },
  // ...
];
```

### Siloed Development (Optional)
For AI workflow optimization:
- Apps can be developed in isolation once a supported RadOS shell workspace API exists
- The scaffold generates a standalone Next.js prototype app and keeps the control-surface seam in `lib/controlSurface.ts`
- Merge workflow: Copy finished app into monorepo, register in `lib/apps/catalog.tsx`

---

## 8. Data & App State

App data should stay local to the app surface until it becomes shared runtime state. Shared runtime state belongs in the Zustand store; app metadata belongs in `apps/rad-os/lib/apps/catalog.tsx`.

Backend-ready services may return local fixtures while preserving future API boundaries, but mock data must not define app inventory. The catalog remains the authority for which surfaces can open as windows.

---

## 9. Current App Inventory

`APP_CATALOG` currently contains 9 entries. 8 are desktop-visible launchers; `preferences` is registered for shell access but hidden from the desktop.

| id | Window title | Category | Desktop visible | Subtabs |
| --- | --- | --- | --- | --- |
| `brand` | Brand | tools | yes | `logos` (Logos), `colors` (Color), `fonts` (Type) |
| `lab` | Dev Tools | tools | yes | `components` (UI Library) |
| `pixel-lab` | Pixel Lab | tools | yes | `radiants` (Radiants), `corners` (Corners), `icons` (Icons), `patterns` (Patterns), `dither` (Dither), `canvas` (Canvas) |
| `preferences` | Preferences | tools | no | `general` (General), `themes` (Themes) |
| `scratchpad` | Scratchpad | tools | yes | - |
| `hackathon-exe` | Hackathon.EXE | media | yes | `winners` (Winners), `submissions` (Submissions), `archive` (Archive) |
| `good-news` | Good News | media | yes | - |
| `about` | About | about | yes | - |
| `manifesto` | Becoming Substance | about | yes | - |

Radio is taskbar-hosted through the transport strip and drop-down widget, not an `APP_CATALOG` window entry.

---

## 10. Design System (RDNA)

### Colors (from globals.css)
```css
--color-cream: #FEF8E2;        /* Primary background */
--color-sun-yellow: #FCE184;   /* Accent, active states */
--color-ink: #0F0E0C;          /* Text, borders */
--color-sky-blue: #95BAD2;     /* Secondary accent */
--color-sunset-fuzz: #FCC383;  /* Warm accent */
--color-sun-red: #FF6B63;      /* Error, warnings */
--color-mint: #CEF5CA;         /* Success */
```

### Typography
- **Joystix**: Pixel font for headings, buttons, labels
- **Mondwest**: Body text, descriptions
- **PixelCode**: Code blocks, monospace

### Components
All UI components from `@/components/ui`:
- Button (primary, secondary, ghost, icon-only)
- Card
- Tabs (TabList, TabTrigger, TabContent)
- Input, Select, Checkbox
- Dialog, Tooltip
- Badge, Progress
- Divider

### Shadows & Effects
```css
--shadow-resting
--shadow-lifted
--shadow-raised
--shadow-floating
```

---

## 11. Asset Locations

### Brand Assets
Destination: `apps/rad-os/public/assets/logos/`
```
SVG/
  wordmark-cream.svg
  wordmark-yellow.svg
  wordmark-black.svg
  rad-mark-cream.svg
  rad-mark-yellow.svg
  rad-mark-black.svg
  radsun-cream.svg
  radsun-yellow.svg
  radsun-black.svg
PNG/
  [same names].png
```

### Reference Implementation
Location: `/reference/rados/`
- Use for understanding existing patterns
- Extract Devlink component designs for restyling

---

## 12. Keyboard & Accessibility

### No Window Keyboard Shortcuts
- Skip Alt+Tab and similar window cycling shortcuts (conflict with OS)
- Focus on click/touch interactions

### Basic Accessibility
- Focus indicators on interactive elements
- Escape key closes modals/menus
- ARIA labels where appropriate

---

## 13. Mobile Responsiveness

### Breakpoints
- Mobile: < 768px
- Desktop: >= 768px

### Mobile Behaviors
- **Taskbar**: Simplified (Start button + essential icons only)
- **Windows**: Fullscreen AppWindow presentation
- **Launchers**: Taskbar/start-menu driven app launching
- **Start Menu**: Full-screen overlay
- **App Switching**: Via Start Menu only

---

## 14. Features Explicitly Out of Scope (v1)

- Screensaver functionality
- Keyboard shortcuts for window management
- Actual Web3 integration (wallet connection, on-chain transactions)
- Real database persistence
- User authentication
- Real-time data sync

---

## 15. Development Notes

### Debug Logging
- Strip all debug endpoints (http://127.0.0.1:7243/ingest/...)
- Use browser devtools and console.log only

### Code Organization
- One component per file
- Co-locate styles with components (Tailwind classes)
- Zustand slices for feature-specific state

### Testing Strategy
- Component tests for UI primitives
- Integration tests for window management
- Visual regression tests for design system

---

## 16. Implementation Phases

### Phase 1: Core Infrastructure
- Zustand store setup
- Window system (open, close, focus, minimize, drag, resize)
- Desktop and Taskbar
- Hash routing
- WebGL background with Intersection Observer optimization

### Phase 2: Catalog Apps
- Brand
- Dev Tools
- Pixel Lab
- Scratchpad
- Hackathon.EXE
- Good News
- About
- Becoming Substance

### Phase 3: Shell Surfaces
- Taskbar-hosted radio transport
- Preferences surface

### Phase 4: Polish
- Mobile optimization
- Performance tuning
- Accessibility audit
- Final styling pass

---

## Appendix A: Reference Files

Current repo-local references:

- Catalog: `apps/rad-os/lib/apps/catalog.tsx`
- Window shell: `apps/rad-os/components/Rad_os/`
- App surfaces: `apps/rad-os/components/apps/`
- Shared design system: `packages/radiants/`

---

## Appendix B: AI Gen Content (To Be Updated)

Current Midjourney codes (placeholder):
```
--sref 2686106303 1335137003 --p 28kclbj
```

*Note: User to provide updated/correct AI generation codes and prompts.*

---

## Appendix C: Catalog Shape

```typescript
interface AppCatalogEntry {
  id: string;
  windowTitle: string;
  launcherTitle?: string;
  component: ComponentType<AppProps> | null;
  defaultSize?: WindowSizeTier | WindowSize;
  minSize?: { width: number; height: number };
  aspectRatio?: number;
  contentPadding?: boolean;
  chromeless?: boolean;
  desktopVisible?: boolean;
  category?: 'tools' | 'media' | 'about' | 'links';
  subtabs?: AppSubtab[];
  ambient?: AmbientCapability;
}
```

### Studio Submission
```typescript
interface StudioSubmission {
  id: string;
  name: string;
  description: string;
  image: string; // Base64 or URL
  creator: string;
  creatorAddress: string;//Solana Network address for royalties
  upvotes: number;
  downvotes: number;
  netVotes: number;
  createdAt: number;
}
```
