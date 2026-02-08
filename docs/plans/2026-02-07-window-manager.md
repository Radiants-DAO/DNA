# Window Manager & Toolbox Launcher Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the fixed InfoWindow modal with a full draggable/resizable multi-window system. Restyle AppWindow to match InfoWindow's CRT aesthetic, extract InfoWindow content into pure components, and convert the toolbox into a launcher that spawns tool windows.

**Architecture:** AppWindow becomes the universal window container styled with InfoWindow's CRT aesthetic (beveled borders, dark background, panel-accent colors). InfoWindow's content rendering becomes pure content components dispatched by panel ID. page.tsx switches from single-panel `activeWindow` state to `useWindowManager` for multi-window tracking. Door animation triggers on first window open, stays expanded while any window is open, retracts when all close.

**Tech Stack:** React 19, Next.js, Zustand, react-draggable, Tailwind v4, CSS custom properties

**Brainstorm:** `docs/brainstorms/2026-02-07-window-manager-brainstorm.md`

---

## Phase 1: Restyle AppWindow to CRT Aesthetic

### Task 1: Restyle AppWindow container (glassmorphic → CRT dark)

**Files:**
- Modify: `app/components/AppWindow.tsx:343-385` (container div styles)
- Modify: `app/globals.css` (add `.app-window` class for CRT base styles)

**Step 1: Add `.app-window` CSS class to globals.css**

Add after the existing `.taskbar_wrap` section (~line 714). This class applies InfoWindow's CRT aesthetic to AppWindow:

```css
/* =============================================================================
   AppWindow — CRT Container
   ============================================================================= */

.app-window {
  /* Panel accent tokens — same as door-info-overlay */
  --panel-accent: #b494f7;
  --panel-accent-65: rgba(180, 148, 247, 0.65);
  --panel-accent-50: rgba(180, 148, 247, 0.5);
  --panel-accent-40: rgba(180, 148, 247, 0.4);
  --panel-accent-30: rgba(180, 148, 247, 0.3);
  --panel-accent-20: rgba(180, 148, 247, 0.2);
  --panel-accent-15: rgba(180, 148, 247, 0.15);
  --panel-accent-08: rgba(180, 148, 247, 0.08);

  background: rgba(1, 1, 1, 0.85);
  backdrop-filter: blur(1.5em);
  -webkit-backdrop-filter: blur(1.5em);
  border: 1px solid rgba(180, 148, 247, 0.8);
  border-bottom-color: var(--bevel-lo);
  border-right-color: var(--bevel-lo);
  box-shadow: 0 0 2em var(--panel-accent-08), inset 0 0 2em rgba(0, 0, 0, 0.5);
  -webkit-user-select: text;
  user-select: text;
}

@supports (backdrop-filter: blur(1em)) or (-webkit-backdrop-filter: blur(1em)) {
  .app-window {
    background: rgba(1, 1, 1, 0.6);
  }
}

.app-window:hover {
  box-shadow: 0 0 2em var(--panel-accent-20), inset 0 0 2em rgba(0, 0, 0, 0.5);
}
```

**Step 2: Update AppWindow container div**

In `AppWindow.tsx`, replace the inline glassmorphic styles on the container div (lines 343-385):

- Remove `rounded-[0.5em]` (CRT aesthetic has sharp corners)
- Remove inline `style.background`, `style.backdropFilter`, `style.boxShadow`
- Add `app-window` to className
- Remove `onMouseEnter`/`onMouseLeave` hover glow handlers (handled by CSS now)
- Keep: `absolute`, `pointer-events-auto`, `border border-edge-primary` (override with CSS), `overflow-hidden`, `flex flex-col`, min/max constraints, `focus:outline-none`, `transition-shadow duration-500`

The container div becomes:

```tsx
<div
  ref={nodeRef}
  role="dialog"
  aria-labelledby={`window-title-${id}`}
  className={`
    absolute app-window
    pointer-events-auto
    overflow-hidden
    flex flex-col
    min-w-[20em] max-w-[77em]
    min-h-[20em] max-h-[90vh]
    focus:outline-none
    transition-shadow duration-500
    ${className}
  `}
  style={{
    width: windowState?.size?.width ?? defaultSize?.width ?? 'fit-content',
    height: windowState?.size?.height ?? defaultSize?.height ?? 'fit-content',
    minWidth: MIN_SIZE.width,
    minHeight: MIN_SIZE.height,
    maxWidth: maxSize.width,
    maxHeight: maxSize.height,
    zIndex: windowState?.zIndex || 100,
  }}
  onMouseDown={handleFocus}
  tabIndex={-1}
  data-app-window={id}
  data-resizable={resizable}
>
```

**Step 3: Verify in browser**

Navigate to `localhost:3002/components-showcase`.
Expected: AppWindow has dark CRT background with beveled borders, purple accent glow. No teal glassmorphic gradient.

**Step 4: Commit**

```bash
git add app/components/AppWindow.tsx app/globals.css
git commit -m "refactor: restyle AppWindow container to CRT aesthetic"
```

---

### Task 2: Restyle WindowTaskbar to match InfoWindow's title bar

**Files:**
- Modify: `app/components/AppWindow.tsx:66-171` (CloseButton + WindowTaskbar)

**Step 1: Replace CloseButton with InfoWindow-style close button**

Replace the current pixel-X SVG CloseButton with the CRT close button that matches `.close_button` CSS. Use the same `CloseIcon` pattern from InfoWindow:

```tsx
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="close_button"
      aria-label="Close window"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      <span className="close-button-tooltip">Close</span>
    </button>
  );
}
```

**Step 2: Replace WindowTaskbar with CRT-style taskbar**

Replace the current Tailwind-styled taskbar with the CSS class-based InfoWindow taskbar structure. The key classes are `taskbar_wrap`, `taskbar_title`, `taskbar_text`, `taskbar_lines-wrap`, `taskbar_line`, `taskbar_button-wrap`.

```tsx
function WindowTaskbar({
  title,
  icon,
  onClose,
  actionButton,
}: {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  actionButton?: AppWindowProps['actionButton'];
}) {
  return (
    <div className="taskbar_wrap" data-drag-handle>
      <div className="taskbar_title">
        {icon && <span style={{ marginRight: '0.4em', display: 'flex' }}>{icon}</span>}
        <span className="taskbar_text">{title}</span>
      </div>
      <div className="taskbar_lines-wrap">
        <div className="taskbar_line" />
        <div className="taskbar_line" />
      </div>
      <div className="taskbar_button-wrap">
        {actionButton && (
          <a
            href={actionButton.href}
            target={actionButton.target}
            onClick={actionButton.onClick}
            className="modal-cta-button modal-cta-magma"
            style={{ textDecoration: 'none' }}
          >
            {actionButton.text}
          </a>
        )}
        <CloseButton onClick={onClose} />
      </div>
    </div>
  );
}
```

**Step 3: Update content area to use CRT scrollbar**

Replace the content div's className:

```tsx
<div
  ref={contentRef}
  className="app_contents"
>
  {children}
</div>
```

Add CSS for `.app-window .app_contents` in globals.css (copy scrollbar styles from `.door-info-overlay .app_contents`):

```css
.app-window .app_contents {
  flex: 1;
  overflow-y: auto;
  padding: 1.25em 1.25em 1em;
  scrollbar-width: auto;
  scrollbar-color: auto;
}

.app-window .app_contents::-webkit-scrollbar {
  width: 0.625em;
}

.app-window .app_contents::-webkit-scrollbar-track {
  background: rgba(1, 1, 1, 0.4);
  border-left: 1px solid var(--bevel-lo);
}

.app-window .app_contents::-webkit-scrollbar-thumb {
  background: var(--panel-accent-08);
  border: 1px solid rgba(180, 148, 247, 0.8);
  border-bottom-color: var(--bevel-lo);
  border-right-color: var(--bevel-lo);
  border-radius: 0;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.app-window .app_contents::-webkit-scrollbar-thumb:hover {
  background: rgba(105, 57, 202, 0.3);
  border-color: rgba(180, 148, 247, 1);
  border-bottom-color: var(--black);
  border-right-color: var(--black);
  box-shadow: 0 0 0.6em rgba(105, 57, 202, 0.5);
}

.app-window .app_contents::-webkit-scrollbar-thumb:active {
  background: rgba(105, 57, 202, 0.15);
  border-color: var(--bevel-lo);
  border-bottom-color: rgba(180, 148, 247, 0.8);
  border-right-color: rgba(180, 148, 247, 0.8);
  box-shadow: inset 0 0 0.4em rgba(105, 57, 202, 0.3);
}

.app-window .app_contents::-webkit-scrollbar:horizontal {
  display: none;
}
```

**Step 4: Verify in browser**

Navigate to `localhost:3002/components-showcase`.
Expected: Title bar matches InfoWindow — dark background, `Pixeloid Mono` font, decorative gradient lines, purple accent close button with tooltip. Scrollbar has beveled CRT style.

**Step 5: Commit**

```bash
git add app/components/AppWindow.tsx app/globals.css
git commit -m "refactor: restyle WindowTaskbar and scrollbar to CRT aesthetic"
```

---

### Task 3: Add optional bottom CTA bar and left sidebar slots

**Files:**
- Modify: `app/components/AppWindow.tsx` (add new props + slots)

**Step 1: Add new props to AppWindowProps**

```tsx
/** Optional bottom action bar content (replaces single actionButton) */
bottomBar?: React.ReactNode;
/** Optional left sidebar content */
sidebar?: React.ReactNode;
```

Move `actionButton` handling: if `bottomBar` is provided, use it; otherwise if `actionButton` is provided, render the legacy single CTA in a `taskbar_wrap--bottom`.

**Step 2: Add sidebar + bottom bar to the component layout**

```tsx
{/* Content area with optional sidebar */}
<div className="flex flex-1 overflow-hidden">
  {sidebar && (
    <div className="app-window-sidebar">
      {sidebar}
    </div>
  )}
  <div
    ref={contentRef}
    className="app_contents"
  >
    {children}
  </div>
</div>

{/* Bottom CTA bar */}
{(bottomBar || actionButton) && (
  <div className="taskbar_wrap taskbar_wrap--bottom">
    {bottomBar || (
      actionButton && (
        <a
          href={actionButton.href}
          target={actionButton.target}
          onClick={actionButton.onClick}
          className="modal-cta-button modal-cta-magma"
          style={{ textDecoration: 'none' }}
        >
          {actionButton.text}
        </a>
      )
    )}
  </div>
)}
```

**Step 3: Add sidebar CSS**

```css
.app-window-sidebar {
  display: flex;
  flex-direction: column;
  width: auto;
  min-width: 2.5rem;
  border-right: 1px solid var(--bevel-lo);
  background: rgba(1, 1, 1, 0.3);
  overflow-y: auto;
  flex-shrink: 0;
}
```

**Step 4: Remove actionButton from WindowTaskbar**

Since the CTA now lives in the bottom bar, remove it from the title bar. The title bar should only have: icon, title text, decorative lines, close button.

**Step 5: Verify component showcase**

Navigate to `localhost:3002/components-showcase`.
Expected: Windows still render correctly. No visual change unless sidebar/bottomBar props provided.

**Step 6: Commit**

```bash
git add app/components/AppWindow.tsx app/globals.css
git commit -m "feat: add optional bottom CTA bar and sidebar slots to AppWindow"
```

---

## Phase 2: Extract InfoWindow Content into Pure Components

### Task 4: Create PanelContent dispatcher component

**Files:**
- Create: `app/components/panels/PanelContent.tsx`
- Read (reference only): `app/components/InfoWindow.tsx:49-406` (CONTENT data)
- Read (reference only): `app/components/InfoWindow.tsx:1413-1575` (renderContent, render functions)

**Step 1: Create `app/components/panels/PanelContent.tsx`**

This component dispatches to the correct renderer based on panel ID. It imports the `CONTENT` object and render functions from InfoWindow (for now — we'll move them in Task 5).

```tsx
'use client';

import { CONTENT, renderContent, useSequentialReveal } from '../InfoWindow';

interface PanelContentProps {
  panelId: string;
  initialTab?: string | null;
}

export default function PanelContent({ panelId, initialTab }: PanelContentProps) {
  const data = CONTENT[panelId];
  const { revealed, advance } = useSequentialReveal();

  if (!data) return null;

  return (
    <div className="panel-content">
      {renderContent(data, revealed, advance, initialTab)}
    </div>
  );
}
```

**Step 2: Export needed functions from InfoWindow**

In `InfoWindow.tsx`, add `export` to:
- `CONTENT` (already exported — line 49)
- `renderContent` function
- `useSequentialReveal` hook

**Step 3: Verify it compiles**

Run: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3002`
Expected: 200

**Step 4: Commit**

```bash
git add app/components/panels/PanelContent.tsx app/components/InfoWindow.tsx
git commit -m "feat: create PanelContent dispatcher component"
```

---

### Task 5: Extract content rendering functions from InfoWindow

**Files:**
- Create: `app/components/panels/content-renderers.tsx`
- Modify: `app/components/InfoWindow.tsx` (import from new file)
- Modify: `app/components/panels/PanelContent.tsx` (import from new file)

**Step 1: Move render functions to content-renderers.tsx**

Move from InfoWindow.tsx to a new `content-renderers.tsx`:
- Type definitions: `AccordionSection`, `TabContent`, `WindowContent` (lines 21-43)
- `CONTENT` object (lines 49-406)
- All render helper functions: `renderEntries`, `renderSections`, `renderTabs`, `renderAccordion`, `renderJudges`, `renderPrizes`, `renderHackathon`, `renderCalendar`, `renderRules`, `renderContent`
- `useSequentialReveal` hook

Keep in InfoWindow only:
- The component itself and its local state/refs
- `ScrambleText` helper
- Icons (`CloseIcon`, `CopyIcon`, `CopiedIcon`, `DiscordIcon`, `TwitterIcon`)
- Touch handlers, scroll handlers

The new file should export: `CONTENT`, `WindowContent` type, `renderContent`, `useSequentialReveal`.

**Step 2: Update InfoWindow imports**

```tsx
import { CONTENT, renderContent, useSequentialReveal } from './panels/content-renderers';
```

**Step 3: Update PanelContent imports**

```tsx
import { CONTENT, renderContent, useSequentialReveal } from './content-renderers';
```

**Step 4: Verify InfoWindow still works**

Navigate to `localhost:3002/?panel=hackathon`.
Expected: Hackathon panel renders identically. All content types work.

**Step 5: Verify each panel type**

Check: hackathon, rules, prizes, judges, toolbox, faq, calendar, legal.
Expected: All render identically to before extraction.

**Step 6: Commit**

```bash
git add app/components/panels/content-renderers.tsx app/components/InfoWindow.tsx app/components/panels/PanelContent.tsx
git commit -m "refactor: extract content renderers from InfoWindow into panels/"
```

---

## Phase 3: Convert page.tsx to Multi-Window Architecture

### Task 6: Add door-tracking state to useWindowManager

**Files:**
- Modify: `app/hooks/useWindowManager.ts`

**Step 1: Add `anyWindowOpen` derived state**

The hook already exposes `openWindows`. Add a convenience boolean:

```tsx
const anyWindowOpen = openWindows.length > 0;
```

Add to the return type and return object:
```tsx
anyWindowOpen: boolean;
```

**Step 2: Add `closeAllWindows` action to the store**

In `useMonolithStore`:

```tsx
closeAllWindows: () => {
  set((state) => ({
    windows: state.windows.map((w) => ({ ...w, isOpen: false, isFullscreen: false })),
  }));
},
```

Add to the hook wrapper:
```tsx
const storeCloseAllWindows = useMonolithStore((state) => state.closeAllWindows);
const closeAllWindows = useCallback(() => storeCloseAllWindows(), [storeCloseAllWindows]);
```

**Step 3: Verify it compiles**

Run: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3002`
Expected: 200

**Step 4: Commit**

```bash
git add app/hooks/useWindowManager.ts
git commit -m "feat: add anyWindowOpen and closeAllWindows to useWindowManager"
```

---

### Task 7: Rewire page.tsx from single-panel to multi-window

**Files:**
- Modify: `app/page.tsx`

This is the most complex task. page.tsx currently uses `activeWindow` (string|null) for single-panel mode. We switch to `useWindowManager` for multi-window tracking, and derive door state from `anyWindowOpen`.

**Step 1: Replace state management**

Remove:
```tsx
const [activeWindow, setActiveWindow] = useState<string | null>(null);
```

Add:
```tsx
import { useWindowManager } from './hooks/useWindowManager';

// Inside HomePageInner:
const {
  openWindow,
  closeWindow,
  focusWindow,
  anyWindowOpen,
  openWindows,
  isWindowOpen,
} = useWindowManager();
```

**Step 2: Replace door state logic**

Keep `hasExpanded`, `doorSettled`, `settledTimerRef` — these control the CSS animation.

Replace the door trigger logic:

```tsx
// Door is open when ANY window is open
const isDoorOpen = anyWindowOpen;

// When windows go from 0→1, trigger door animation
const prevOpenRef = useRef(false);
useEffect(() => {
  if (isDoorOpen && !prevOpenRef.current) {
    // First window opened — trigger door expansion
    setHasExpanded(true);
    setDoorSettled(false);
    if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
    settledTimerRef.current = setTimeout(() => setDoorSettled(true), 750);
  }
  if (!isDoorOpen && prevOpenRef.current) {
    // All windows closed — retract door
    setDoorSettled(false);
    if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
  }
  prevOpenRef.current = isDoorOpen;
}, [isDoorOpen]);
```

**Step 3: Update handleOrbitalSelect**

Change from toggle to open-or-focus:

```tsx
const handleOrbitalSelect = useCallback((id: string) => {
  if (isWindowOpen(id)) {
    focusWindow(id);
  } else {
    openWindow(id);
  }
  // URL update for primary panel (optional — could track all open windows)
  queueMicrotask(() => updateURL(id));
}, [isWindowOpen, focusWindow, openWindow, updateURL]);
```

**Step 4: Remove handleWindowClose, update handleTabChange**

`handleTabChange` becomes `handleOrbitalSelect` (just open/focus):

```tsx
const handleTabChange = useCallback((id: string) => {
  if (isWindowOpen(id)) {
    focusWindow(id);
  } else {
    openWindow(id);
  }
  updateURL(id);
}, [isWindowOpen, focusWindow, openWindow, updateURL]);
```

Remove `handleWindowClose` — each AppWindow handles its own close via the store.

**Step 5: Update the `<main>` className**

```tsx
<main className={`section${isDoorOpen ? ' door-expanded' : ''}${doorSettled ? ' door-settled' : ''}`}>
```

**Step 6: Replace InfoWindow with AppWindow rendering**

Remove the single InfoWindow render inside `.door-wrapper`. Replace with a rendering container for all open AppWindows:

```tsx
<div className="portal-container door-container">
  <div className="door-wrapper">
    <img src="/assets/monolith_20.avif" alt="" className="portal door" />
    {/* Multi-window render container */}
    {isDoorOpen && (
      <div className="window-container">
        {openWindows.map((win) => (
          <AppWindow
            key={win.id}
            id={win.id}
            title={CONTENT[win.id]?.title || win.id.toUpperCase()}
          >
            <PanelContent panelId={win.id} />
          </AppWindow>
        ))}
      </div>
    )}
  </div>
</div>
```

**Step 7: Add window-container CSS**

```css
.window-container {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  overflow: visible;
}

.window-container > * {
  pointer-events: auto;
}
```

**Step 8: Update backdrop to close all windows**

```tsx
{isDoorOpen && (
  <div className="door-backdrop" onClick={() => {
    // Don't auto-close all — just let users close individually
    // Or: closeAllWindows() if desired
  }} />
)}
```

Decision: The backdrop should NOT close all windows — that would be jarring. Remove the backdrop entirely, or keep it as a non-interactive layer. Keep it for z-index layering but remove the onClick.

```tsx
{isDoorOpen && <div className="door-backdrop" />}
```

**Step 9: Update OrbitalNav props**

```tsx
<OrbitalNav
  items={ORBITAL_ITEMS}
  onSelect={handleOrbitalSelect}
  isWindowOpen={isDoorOpen}
  activeId={openWindows.length > 0 ? openWindows[openWindows.length - 1].id : null}
/>
```

**Step 10: Update URL handling for initial panel load**

```tsx
useEffect(() => {
  const panel = searchParams.get('panel');
  if (panel && VALID_PANELS.has(panel)) {
    openWindow(panel);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 11: Add imports**

```tsx
import { AppWindow } from './components/AppWindow';
import PanelContent from './components/panels/PanelContent';
import { CONTENT } from './components/panels/content-renderers';
```

**Step 12: Verify in browser**

1. Navigate to `localhost:3002`. Click hackathon in orbital nav. Expected: Door expands, AppWindow spawns with hackathon content.
2. Click another orbital item. Expected: Second window spawns (cascaded), door stays expanded.
3. Close one window. Expected: Other stays. Door stays.
4. Close last window. Expected: Door retracts.

**Step 13: Commit**

```bash
git add app/page.tsx
git commit -m "feat: convert page.tsx from single-panel to multi-window architecture"
```

---

### Task 8: Add tab-strip sidebar to panel windows

**Files:**
- Modify: `app/page.tsx` (pass sidebar to AppWindow)
- Create: `app/components/panels/PanelTabStrip.tsx`

**Step 1: Create PanelTabStrip component**

This is the vertical icon bar from InfoWindow's `.modal-tab-strip`, but rendered as AppWindow sidebar content. It lets users open/focus other panels from within any window.

```tsx
'use client';

import { ORBITAL_ITEMS } from '../../data/orbital-items';

interface PanelTabStripProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export default function PanelTabStrip({ activeId, onSelect }: PanelTabStripProps) {
  return (
    <div className="modal-tab-strip modal-tab-strip--sidebar">
      {ORBITAL_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`modal-tab-icon${activeId === item.id ? ' modal-tab-icon--active' : ''}`}
          style={{ '--icon-glow': item.glowColor } as React.CSSProperties}
          onClick={() => onSelect(item.id)}
        >
          <img src={item.icon} alt={item.label} />
          <span className="modal-tab-tooltip">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Add sidebar variant CSS**

```css
.modal-tab-strip--sidebar {
  position: static;
  flex-direction: column;
  width: 2.5rem;
  height: auto;
  right: auto;
  top: auto;
  transform: none;
}
```

**Step 3: Pass sidebar to AppWindow in page.tsx**

```tsx
<AppWindow
  key={win.id}
  id={win.id}
  title={CONTENT[win.id]?.title || win.id.toUpperCase()}
  sidebar={
    <PanelTabStrip
      activeId={win.id}
      onSelect={handleTabChange}
    />
  }
>
  <PanelContent panelId={win.id} />
</AppWindow>
```

**Step 4: Verify in browser**

Open a panel. Expected: Left sidebar shows all 8 orbital icons. Clicking one opens/focuses that panel's window.

**Step 5: Commit**

```bash
git add app/components/panels/PanelTabStrip.tsx app/page.tsx app/globals.css
git commit -m "feat: add panel tab-strip sidebar to AppWindows"
```

---

### Task 9: Add bottom CTA bar to hackathon panel

**Files:**
- Modify: `app/page.tsx`

**Step 1: Create per-panel bottom bar content**

The hackathon panel needs the Register CTA + social icons (same as InfoWindow's `taskbar_wrap--bottom`). Other panels don't need a bottom bar.

Create a helper function in page.tsx:

```tsx
function getPanelBottomBar(panelId: string): React.ReactNode | undefined {
  if (panelId === 'hackathon' || panelId === 'rules' || panelId === 'prizes' || panelId === 'judges') {
    return (
      <>
        <a
          href="https://discord.gg/radiants"
          target="_blank"
          rel="noopener noreferrer"
          className="close_button close_button--amber"
          aria-label="Discord"
          style={{ textDecoration: 'none' }}
        >
          <DiscordIcon size={20} />
          <span className="close-button-tooltip">Discord</span>
        </a>
        <a
          href="https://x.com/RadiantsDAO"
          target="_blank"
          rel="noopener noreferrer"
          className="close_button close_button--amber"
          aria-label="Twitter"
          style={{ textDecoration: 'none' }}
        >
          <TwitterIcon size={20} />
          <span className="close-button-tooltip">Twitter</span>
        </a>
        <a
          href="https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE"
          target="_blank"
          rel="noopener noreferrer"
          className="modal-cta-button modal-cta-magma"
          title="Register"
          style={{ textDecoration: 'none' }}
        >
          Register
        </a>
      </>
    );
  }
  return undefined;
}
```

**Step 2: Pass bottomBar to AppWindow**

```tsx
<AppWindow
  key={win.id}
  id={win.id}
  title={CONTENT[win.id]?.title || win.id.toUpperCase()}
  sidebar={<PanelTabStrip activeId={win.id} onSelect={handleTabChange} />}
  bottomBar={getPanelBottomBar(win.id)}
>
  <PanelContent panelId={win.id} />
</AppWindow>
```

**Step 3: Extract icon components**

Move `DiscordIcon`, `TwitterIcon` from InfoWindow.tsx to a shared location or import them. The simplest approach: export them from InfoWindow or create `app/components/icons.tsx`.

**Step 4: Verify hackathon panel**

Open hackathon panel. Expected: Bottom bar with Discord, Twitter, Register CTA.
Open FAQ panel. Expected: No bottom bar.

**Step 5: Commit**

```bash
git add app/page.tsx app/components/InfoWindow.tsx
git commit -m "feat: add bottom CTA bar to hackathon-related panels"
```

---

## Phase 4: OrbitalNav Behavior Change

### Task 10: Change OrbitalNav from toggle to open/focus

**Files:**
- Modify: `app/components/OrbitalNav.tsx`

**Step 1: Update active icon indication**

Currently OrbitalNav shows active state for a single `activeId`. For multi-window, it should highlight all icons that have open windows.

Change the `activeId` prop to accept a `Set<string>` or keep as `string | null` but add a new `openIds` prop:

```tsx
export interface OrbitalNavProps {
  items: OrbitalItem[];
  onSelect: (id: string) => void;
  isWindowOpen: boolean;
  activeId: string | null;  // Most recently focused window
  openIds?: Set<string>;    // All currently open windows (icons glow)
  className?: string;
}
```

**Step 2: Update icon rendering to show glow for all open windows**

In the icon render loop, add a glow effect for items whose id is in `openIds`:

```tsx
const isOpen = openIds?.has(item.id) ?? false;
const isActive = activeId === item.id;
// Apply glow filter for open windows
style.filter = isOpen
  ? `drop-shadow(0 0 0.4em ${item.glowColor})`
  : '';
```

**Step 3: Pass openIds from page.tsx**

```tsx
<OrbitalNav
  items={ORBITAL_ITEMS}
  onSelect={handleOrbitalSelect}
  isWindowOpen={isDoorOpen}
  activeId={openWindows.length > 0 ? openWindows[openWindows.length - 1].id : null}
  openIds={new Set(openWindows.map(w => w.id))}
/>
```

**Step 4: Verify**

Open hackathon. Expected: Hackathon icon glows.
Open rules. Expected: Both hackathon and rules icons glow.
Click hackathon again. Expected: Focuses hackathon window (does NOT close it).

**Step 5: Commit**

```bash
git add app/components/OrbitalNav.tsx app/page.tsx
git commit -m "feat: OrbitalNav glows for all open windows, click opens/focuses"
```

---

## Phase 5: Toolbox Launcher

### Task 11: Convert toolbox from tabbed panel to launcher window

**Files:**
- Create: `app/components/panels/ToolboxLauncher.tsx`
- Modify: `app/components/panels/content-renderers.tsx` (toolbox content data)

**Step 1: Create ToolboxLauncher component**

A grid of launchable tools. Each item has icon, title, description, and click opens a new window.

```tsx
'use client';

interface ToolItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'tool-component-library',
    icon: '/icons/code.svg',
    title: 'Component Library',
    description: 'Browse the @rdna/monolith design system',
  },
  {
    id: 'tool-dev-docs',
    icon: '/icons/book.svg',
    title: 'Dev Docs',
    description: 'Solana Mobile Stack documentation and guides',
  },
  {
    id: 'tool-assets',
    icon: '/icons/image.svg',
    title: 'Assets',
    description: 'Coming soon — brand assets and design resources',
  },
  {
    id: 'tool-ai',
    icon: '/icons/sparkle.svg',
    title: 'AI Assistant',
    description: 'Coming soon — AI-powered development help',
  },
];

interface ToolboxLauncherProps {
  onLaunchTool: (toolId: string) => void;
}

export default function ToolboxLauncher({ onLaunchTool }: ToolboxLauncherProps) {
  return (
    <div className="toolbox-launcher">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className="toolbox-item"
          onClick={() => onLaunchTool(tool.id)}
        >
          <img src={tool.icon} alt="" className="toolbox-item-icon" />
          <div>
            <div className="toolbox-item-title">{tool.title}</div>
            <div className="toolbox-item-desc">{tool.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Add toolbox launcher CSS**

```css
.toolbox-launcher {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.toolbox-item {
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.75em 1em;
  border: 1px solid var(--bevel-hi);
  border-bottom-color: var(--bevel-lo);
  border-right-color: var(--bevel-lo);
  background: var(--panel-accent-08);
  cursor: pointer;
  text-align: left;
  color: inherit;
  font-family: inherit;
  transition: background 0.2s var(--ease-drift), box-shadow 0.2s var(--ease-drift);
}

.toolbox-item:hover {
  background: var(--panel-accent-15);
  box-shadow: 0 0 1em var(--panel-accent-08);
}

.toolbox-item-icon {
  width: 1.5em;
  height: 1.5em;
  filter: invert(1);
  opacity: 0.7;
  flex-shrink: 0;
}

.toolbox-item-title {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.875em;
  font-weight: 700;
  color: var(--panel-accent);
  text-transform: uppercase;
  margin-bottom: 0.25em;
}

.toolbox-item-desc {
  font-family: 'Geist Pixel', sans-serif;
  font-size: 0.8125em;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}
```

**Step 3: Wire toolbox panel in page.tsx**

When panelId is 'toolbox', render ToolboxLauncher instead of PanelContent:

```tsx
{openWindows.map((win) => (
  <AppWindow key={win.id} id={win.id} title={...} sidebar={...} bottomBar={...}>
    {win.id === 'toolbox' ? (
      <ToolboxLauncher onLaunchTool={(toolId) => openWindow(toolId)} />
    ) : (
      <PanelContent panelId={win.id} />
    )}
  </AppWindow>
))}
```

**Step 4: Handle tool windows**

Tool windows (tool-dev-docs, tool-assets, tool-ai, tool-component-library) need their own content. For now:
- `tool-component-library`: Navigate to `/components-showcase` (or render inline)
- `tool-dev-docs`: Render the existing DEV DOCS tab content from InfoWindow's toolbox
- `tool-assets`, `tool-ai`: Show "Coming Soon" placeholder

Create a simple dispatcher:

```tsx
function getWindowContent(id: string): React.ReactNode {
  if (id === 'toolbox') {
    return <ToolboxLauncher onLaunchTool={(toolId) => openWindow(toolId)} />;
  }
  if (id.startsWith('tool-')) {
    return <ToolContent toolId={id} />;
  }
  return <PanelContent panelId={id} />;
}
```

**Step 5: Create ToolContent component**

```tsx
// app/components/panels/ToolContent.tsx
'use client';

interface ToolContentProps {
  toolId: string;
}

export default function ToolContent({ toolId }: ToolContentProps) {
  switch (toolId) {
    case 'tool-component-library':
      return (
        <div style={{ padding: '1em' }}>
          <a href="/components-showcase" target="_blank" rel="noopener noreferrer" className="modal-cta-button modal-cta-magma" style={{ textDecoration: 'none' }}>
            Open Component Library
          </a>
        </div>
      );
    case 'tool-dev-docs':
      // Re-use the DEV DOCS accordion content from toolbox
      return <div className="panel-content">Dev docs content here</div>;
    default:
      return (
        <div style={{ padding: '2em', textAlign: 'center', color: 'var(--panel-accent-50)' }}>
          <p style={{ fontFamily: "'Pixeloid Sans', sans-serif", fontSize: '0.875em', textTransform: 'uppercase' }}>
            Coming Soon
          </p>
        </div>
      );
  }
}
```

**Step 6: Add tool window titles**

Extend the title resolution to handle tool IDs:

```tsx
function getWindowTitle(id: string): string {
  const toolTitles: Record<string, string> = {
    'tool-component-library': 'COMPONENTS.EXE',
    'tool-dev-docs': 'DEV_DOCS.EXE',
    'tool-assets': 'ASSETS.EXE',
    'tool-ai': 'AI_ASSIST.EXE',
  };
  return toolTitles[id] || CONTENT[id]?.title || id.toUpperCase();
}
```

**Step 7: Verify toolbox launcher**

1. Open toolbox via orbital nav. Expected: Grid of 4 tool items.
2. Click "Component Library". Expected: New window spawns with link to component library.
3. Click "Dev Docs". Expected: New window spawns.
4. Toolbox window remains open.

**Step 8: Commit**

```bash
git add app/components/panels/ToolboxLauncher.tsx app/components/panels/ToolContent.tsx app/page.tsx app/globals.css
git commit -m "feat: convert toolbox to launcher that spawns tool windows"
```

---

## Phase 6: Cleanup & Polish

### Task 12: Remove legacy InfoWindow overlay code from page.tsx

**Files:**
- Modify: `app/page.tsx`

**Step 1: Remove InfoWindow import**

```tsx
// Remove:
const InfoWindow = dynamic(() => import('./components/InfoWindow'), { ssr: false });
```

**Step 2: Remove InfoWindow render**

The single `<InfoWindow>` inside door-wrapper should already be replaced by the window-container in Task 7. Verify it's gone.

**Step 3: Clean up unused state**

Remove any remaining single-panel state that's no longer used.

**Step 4: Verify all panels still work**

Test all 8 panels + toolbox launcher.

**Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "chore: remove legacy InfoWindow import from page.tsx"
```

---

### Task 13: Preserve mobile full-screen modal behavior

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add mobile detection**

```tsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768);
  check();
  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check);
}, []);
```

**Step 2: Conditionally render InfoWindow (mobile) vs AppWindow (desktop)**

On mobile, keep the existing InfoWindow full-screen modal with swipe navigation. On desktop, use the new multi-window system.

```tsx
{isDoorOpen && !isMobile && (
  <div className="window-container">
    {openWindows.map((win) => (
      <AppWindow key={win.id} id={win.id} ...>
        {getWindowContent(win.id)}
      </AppWindow>
    ))}
  </div>
)}

{isDoorOpen && isMobile && (
  <InfoWindow
    activeId={openWindows[openWindows.length - 1]?.id || ''}
    onTabChange={handleTabChange}
    onClose={() => closeWindow(openWindows[openWindows.length - 1]?.id || '')}
    initialTab={initialTab}
  />
)}
```

This means we keep InfoWindow for mobile only, and use AppWindow for desktop.

**Step 3: Re-add InfoWindow import (for mobile only)**

Keep the dynamic import but it only renders on mobile.

**Step 4: Test mobile viewport**

Use browser dev tools to test at 375px width. Expected: InfoWindow full-screen modal renders.
Test at 1024px width. Expected: AppWindow draggable windows render.

**Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: preserve InfoWindow modal on mobile, AppWindow on desktop"
```

---

### Task 14: Full regression test

**Files:** None (testing only)

**Step 1: Desktop tests**

1. Home page loads: shader, orbital nav, hero text, "Get Started" button
2. Click "Get Started": door expands, hackathon panel opens in AppWindow
3. Click another orbital item: second AppWindow spawns, both visible
4. Drag a window: moves freely within viewport
5. Resize a window: handles work on all edges/corners
6. Close one window: other remains, door stays expanded
7. Close last window: door retracts, hero text returns
8. Toolbox: opens as launcher grid, clicking items spawns tool windows
9. Tab strip sidebar: clicking icons opens/focuses other panels
10. Bottom CTA: Register button appears on hackathon panel

**Step 2: Mobile tests**

1. At 375px width: InfoWindow modal renders (full-screen)
2. Swipe navigation works
3. Tab strip on right edge works

**Step 3: Console check**

No errors in browser console.

**Step 4: URL handling**

1. `localhost:3002/?panel=hackathon` — opens hackathon on load
2. Clicking orbital items updates URL
3. Closing all windows clears URL

**Step 5: Report results**

Document any issues found. Fix before proceeding.

---

## Summary

| Phase | Tasks | What it does |
|-------|-------|-------------|
| 1 | 1-3 | Restyle AppWindow to CRT aesthetic (container, titlebar, scrollbar, CTA bar, sidebar) |
| 2 | 4-5 | Extract InfoWindow content into reusable `panels/` components |
| 3 | 6-9 | Rewire page.tsx for multi-window + door handoff + tab strip + CTA bar |
| 4 | 10 | OrbitalNav opens/focuses (no toggle), glows for open windows |
| 5 | 11 | Toolbox becomes launcher that spawns tool windows |
| 6 | 12-14 | Cleanup legacy code, preserve mobile, full regression |
