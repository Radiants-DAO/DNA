# RadOS Technical Specification v2

This document is the authoritative source of truth for the RadOS build. All implementation decisions and requirements are captured here.

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
  resizable: boolean;
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
- **System Tray**: Invert toggle, volume (if Rad Radio active)
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
// lib/constants.ts
export const APP_REGISTRY: Record<string, AppConfig> = {
  brand: {
    id: 'brand',
    title: 'Brand Assets',
    icon: <RadMarkIcon />,
    component: BrandAssetsApp,
    defaultSize: { width: 800, height: 600 },
    resizable: true,
    minSize: { width: 600, height: 400 },
  },
  // ...
};
```

### Siloed Development (Optional)
For AI workflow optimization:
- Apps can be developed in isolation using an `@radiants/app-template` npm package
- Package includes: design tokens, UI component stubs, TypeScript interfaces, AI prompts
- Merge workflow: Copy finished app into monorepo, register in APP_REGISTRY

---

## 8. Mock Data System

### Centralized Mock Data Store
All mock data lives in a single location for consistency across apps:

```typescript
// lib/mockData/index.ts
export const mockData = {
  auctions: [...],
  radiants: [...],
  studioSubmissions: [...],
  murderTreeData: [...],
  // ...
};
```

### Backend-Ready Stubs
Apps are built with API-ready patterns:
```typescript
// Services return mock data but match future API signatures
async function fetchAuctions(): Promise<Auction[]> {
  // TODO: Replace with actual API call
  return mockData.auctions;
}
```

---

## 9. V1 App Inventory

### Core Apps (7)

#### 1. Brand Assets
- **Tabs**: Logos, Colors, Fonts, AI Gen
- **Logos**: 9 variants (wordmark, rad-mark, radsun × cream/black/yellow)
- **Downloads**: Working PNG/SVG downloads from `/public/assets/logos/`
- **Colors**: Clickable swatches with copy-to-clipboard
- **Fonts**: Joystix, Mondwest with download buttons
- **AI Gen**: Midjourney sref codes and prompts (to be updated)

#### 2. Manifesto
- **Structure**: Sectioned with side navigation
- **Content**: Radiants manifesto/philosophy text
- **Navigation**: Anchor links to jump between sections

#### 3. Calendar
- **Type**: Static events list
- **Content**: Curated community events, drops, milestones
- **No external sync**: Manually updated data

#### 4. Rad Radio
- **Reference**: Poolsuite FM (https://poolsuite.net/)
- **Features**:
  - Auto-play on page load
  - Dithered video visualizer (soundless video background)
  - Volume visualizer
  - Volume slider
  - Channel selection
  - Favoriting tracks
  - Direct linking to tracks
- **Data**: Local audio files (simulated, backend-ready)
- **Opens automatically**: Player window opens on page load

#### 5. Links
- **Type**: Simple categorized link list
- **Behavior**: All links open in new tabs
- **Categories**: Socials, Resources, Tools, etc.

#### 6. Settings
- **Minimal scope**:
  - Volume control (for Rad Radio)
  - Reduce motion toggle (disables WebGL animations)
- **Persistence**: localStorage

#### 7. About
- **Content**: Full credits
  - Project description
  - Team/contributors
  - Acknowledgments
  - Open source licenses
  - Version info

### Additional Apps (3)

#### 8. Radiants Studio
Single window with tabs for three tools:

**A. Pixel Art Maker**
- **Canvas**: 32x32 pixels
- **Colors**: 3 only (cream, black, sun-yellow from design tokens)
- **Tools**: Pencil, eraser, fill bucket, clear canvas (essential tools only)
- **Submit to DB**: Backend-ready stub (mock submission)
- **Voting Interface**: Tinder-style swipe (right=upvote, left=downvote)
- **Leaderboard**: Net votes ranking
- **Wallet gating**: Mock state (no actual web3 integration)
- **Vote weighting**: 1 vote per wallet, 150 votes if holding Radiant NFT (mocked)

**B. Dither Tool**
- **Reference**: Dither Boy (https://studioaaa.com/product/dither-boy/)
- **Implementation**: Build from scratch
- **Input Methods**: Drag & drop images, paste from clipboard, paste image URL
- **Algorithms**: Bayer matrix dithering, Floyd-Steinberg, etc.
- **Controls**: Algorithm selection, threshold, color palette
- **Export**: PNG download

**C. Commission Marketplace**
- **Two-sided**: Browse commissions AND submit art
- **Browse**: List of open commission requests from Radiant owners
- **Submit**: Form to submit art to specific Radiants
- **Integration**: Commission art feeds into Murder Tree branches

#### 9. Murder Tree
- **Visualization**: Graph-theory tree structure (not literal tree art)
- **Scale**: Provenance branch can have thousands of items; art/commission branches smaller
- **Three branches**:
  1. **Creation Branch**: NFTs burned to win the Radiant (immutable)
  2. **Owner Branch**: Owner's personal burns (on-chain scrapbook)
  3. **Commission Branch**: Whitelist-controlled art contributions
- **Exploration UI**: Navigate branches, view NFT details on each node
- **NFT Details**: Name, source collection, burn date, image thumbnail
- **Hover animations**: Visual feedback on nodes

#### 10. Auctions
- **Scope**: Full replication of existing frontend with mock data
- **Styling**: Restyle with RDNA components (preserve layout/UX, swap components)
- **Features**:
  - Current auction display (image, name, countdown)
  - Vault system (deposit/withdraw NFTs as bids)
  - Previous/next auction navigation
  - Bid history
  - Wallet connection (mocked)
  - Admin settings panel (mocked)
  - Toast notifications (win, deposit, withdraw)
- **Reference**: `/tmp/radiants_frontend/` extracted code

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
--shadow-btn: 2px 2px 0px 0px var(--border-primary);
--shadow-btn-hover: 3px 3px 0px 0px var(--border-primary);
--shadow-card: 4px 4px 0px 0px var(--border-primary);
```

---

## 11. Asset Locations

### Brand Assets (to be copied from Dropbox)
Source: `/Users/rivermassey/Dropbox/1_Clients/Current/Radiants/Brand/Logo/`

Destination: `/public/assets/logos/`
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
- **Windows**: Full-screen modal overlays (MobileAppModal)
- **Desktop Icons**: Horizontal row at top instead of vertical column
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

### Phase 2: Core Apps
- Brand Assets (with working downloads)
- Manifesto
- About
- Links
- Settings

### Phase 3: Complex Apps
- Calendar
- Rad Radio

### Phase 4: Web3 Mock Apps
- Radiants Studio (all three tools)
- Murder Tree
- Auctions

### Phase 5: Polish
- Mobile optimization
- Performance tuning
- Accessibility audit
- Final styling pass

---

## Appendix A: Reference Files

- Murder Tree Spec: `/Users/rivermassey/Downloads/Murder Tree v2 Radiants Feature Upgrade.md`
- Radiants Studio Brief: `/Users/rivermassey/Downloads/Radiants Studio Design Brief.md`
- Frontend Reference: `/Users/rivermassey/Downloads/Radiants Frontend Main.zip`
- Program Library: `/Users/rivermassey/Downloads/Radiants Program Library.zip`

---

## Appendix B: AI Gen Content (To Be Updated)

Current Midjourney codes (placeholder):
```
--sref 2686106303 1335137003 --p 28kclbj
```

*Note: User to provide updated/correct AI generation codes and prompts.*

---

## Appendix C: Mock Data Shapes

### Auction
```typescript
interface Auction {
  auctionId: string;
  version: 'v1' | 'v2';
  metadata: {
    name: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  };
  account: {
    startTimestamp: number;
    endTimestamp: number;
    winner: string | null;
    highestBidder: string | null;
    isClaimed: boolean;
  };
}
```

### Radiant (for Murder Tree)
```typescript
interface Radiant {
  id: string;
  name: string;
  image: string;
  owner: string;
  creationBranch: BurnedNFT[];
  ownerBranch: BurnedNFT[];
  commissionBranch: CommissionedNFT[];
}

interface BurnedNFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  burnDate: number;
}

interface CommissionedNFT extends BurnedNFT {
  contributor: string;
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
