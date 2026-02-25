# Tabbed Modal & Orbital Rework — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the multi-variant modal system with a single AMB-styled tabbed modal where orbital icons double as tabs, unvisited icons retreat behind the door on open, and visited icons accumulate around the center with permanent ASCII streams.

**Architecture:** Single modal with vertical icon tab strip on right edge. OrbitalNav manages three icon states: orbiting (idle), hidden-behind-door (unvisited while modal open), and docked-with-stream (visited). Visited state persisted to localStorage. All icons orbit at uniform speed. Flow's LeftPanel icon-button pattern adapted for the tab strip (CRT-reskinned, not Tailwind).

---

## Task 1: Strip variant system, lock to AMB

**Files:**
- Modify: `apps/monolith-hackathon/app/page.tsx`
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`
- Modify: `apps/monolith-hackathon/app/globals.css`

**What to do:**

1. In `page.tsx`:
   - Remove `VARIANTS` array and `windowVariant` state
   - Remove the entire `.variant-switcher` div (the GLS/CLR/MGM/ULV/AMB bar)
   - Remove `variant-amber-active` conditional class from `<main>` — the AMB style should be the default/only style
   - Remove `variant` prop from `<InfoWindow>`
   - Remove `key={windowVariant}` from InfoWindow (no longer needed)
   - Apply AMB styling unconditionally when modal is open (just use `door-expanded` class)

2. In `InfoWindow.tsx`:
   - Remove `WindowVariant` type export and `variant` prop
   - Remove all variant-conditional CSS class logic (e.g. `door-info-overlay--${variant}`)
   - Hardcode the AMB aesthetic: black bg `rgba(1,1,1,0.92)`, icon-colored accents
   - Keep all 6 content renderers and CONTENT data intact

3. In `globals.css`:
   - Remove all 5 variant-specific style blocks (`.door-info-overlay--glass`, `--clear`, `--magma`, `--ultraviolet`, `--amber`)
   - Make the AMB styles the default `.door-info-overlay` styles
   - Remove `.variant-switcher` and `.variant-btn` CSS
   - Remove `.variant-amber-active` rules
   - Clean up variant-scoped tab active color rules — replace with single rule using `var(--icon-glow)` from the active tab's icon

**Step: Commit**
```
feat: strip variant system, lock modal to AMB style
```

---

## Task 2: Unify orbital speed + add visited state tracking

**Files:**
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx`

**What to do:**

1. Set all `speed` values to a single uniform speed (e.g. `0.065`):
   ```ts
   const ORBITAL_SPEED = 0.065;
   ```
   Remove per-item `speed` from `OrbitalItem` interface, use `ORBITAL_SPEED` in the animation loop.

2. Add `visitedIds` prop to `OrbitalNavProps`:
   ```ts
   interface OrbitalNavProps {
     onSelect: (id: string) => void;
     isWindowOpen: boolean;
     activeId: string | null;
     visitedIds: Set<string>;
   }
   ```

3. Add localStorage persistence in `page.tsx`:
   ```ts
   const [visitedIds, setVisitedIds] = useState<Set<string>>(() => {
     if (typeof window === 'undefined') return new Set();
     const stored = localStorage.getItem('monolith-visited');
     return stored ? new Set(JSON.parse(stored)) : new Set();
   });
   ```
   Update `handleOrbitalSelect` to add the id to visited:
   ```ts
   const handleOrbitalSelect = useCallback((id: string) => {
     setActiveWindow((prev) => (prev === id ? null : id));
     setVisitedIds((prev) => {
       const next = new Set(prev);
       next.add(id);
       localStorage.setItem('monolith-visited', JSON.stringify([...next]));
       return next;
     });
     // ... rest of handler
   }, []);
   ```
   Pass `visitedIds` to `<OrbitalNav>`.

**Step: Commit**
```
feat: unify orbital speed, add visited state with localStorage
```

---

## Task 3: Three icon states — orbiting, hidden, docked

**Files:**
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx`
- Modify: `apps/monolith-hackathon/app/globals.css`

**What to do:**

This is the core animation rework. Each icon has one of three states:

| State | Condition | Behavior |
|-------|-----------|----------|
| **orbiting** | Modal closed | Normal elliptical orbit, uniform speed |
| **hidden** | Modal open + not visited + not active | Scale to 0, move toward viewport center (behind the door) |
| **docked** | Modal open + (visited OR active) | Fixed position around center, ASCII stream to center at full power |

### Animation loop changes in `animate()`:

For each icon `i`:

```ts
const isActive = activeIdRef.current === item.id;
const isVisited = visitedIdsRef.current.has(item.id);
const modalOpen = isWindowOpenRef.current;

if (!modalOpen) {
  // STATE: ORBITING — normal orbit
  anglesRef.current[i] += ORBITAL_SPEED * dt;
  const angle = anglesRef.current[i];
  x = cx + rx * cos(angle);
  y = cy + ry * sin(angle);
  el.style.opacity = '1';
  el.style.transform = `translate(${x - elW/2}px, ${y - elH/2}px) scale(1)`;
} else if (isActive || isVisited) {
  // STATE: DOCKED — fixed position around center, stream active
  // Calculate fixed dock position (evenly distributed among docked icons)
  const dockedItems = ORBITAL_ITEMS.filter(item =>
    item.id === activeIdRef.current || visitedIdsRef.current.has(item.id)
  );
  const dockedIndex = dockedItems.findIndex(d => d.id === item.id);
  const dockedAngle = (dockedIndex / dockedItems.length) * Math.PI * 2 - Math.PI / 2;
  const dockR = h * 0.32; // slightly tighter than orbit
  x = cx + dockR * cos(dockedAngle);
  y = cy + dockR * sin(dockedAngle);
  el.style.opacity = '1';
  el.style.transform = `translate(${x - elW/2}px, ${y - elH/2}px) scale(1)`;
} else {
  // STATE: HIDDEN — scale down toward center (behind door)
  el.style.opacity = '0';
  el.style.transform = `translate(${cx - elW/2}px, ${cy - elH/2}px) scale(0)`;
}
```

### Data stream changes:

When modal is open, draw ASCII streams from ALL docked icons (visited + active) to center, not just the active one. Each stream uses its item's `glowColor`.

This means the connector system changes from a single `connectorRef` div to multiple streams. Options:
- Create a stream element per icon (8 divs, show/hide as needed)
- Or reuse a pool. Simplest: render 8 `.data-stream` divs (one per orbital item), manage them all via refs.

```tsx
const streamRefs = useRef<(HTMLDivElement | null)[]>([]);

// In render:
{ORBITAL_ITEMS.map((item, i) => (
  <div key={`stream-${item.id}`} ref={(el) => { streamRefs.current[i] = el; }} className="data-stream" aria-hidden="true" />
))}
```

In the animation loop, for each icon that is docked (visited or active):
- Calculate line from icon position to center
- Set stream div's position, width, rotation, opacity, color, text-shadow
- Tick stream characters

For non-docked icons: set stream opacity to 0.

### CSS additions:

Add transition to `.orbital-icon` for smooth state changes:
```css
.orbital-icon {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
```

Note: Since we're setting `transform` directly in the rAF loop, the CSS transition on transform will only apply when the modal opens/closes (state change), not during continuous orbit. The rAF loop sets transform every frame during orbit, overriding the transition. The transition kicks in for the hide/dock snap because those are one-time position changes.

**Step: Commit**
```
feat: three icon states — orbiting, hidden, docked with multi-stream
```

---

## Task 4: Tabbed modal with icon tab strip

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`
- Modify: `apps/monolith-hackathon/app/globals.css`
- Modify: `apps/monolith-hackathon/app/page.tsx`

**What to do:**

### InfoWindow becomes tabbed:

The InfoWindow now receives `activeId` and an `onTabChange` callback instead of a single `id`:

```ts
interface InfoWindowProps {
  activeId: string;
  onTabChange: (id: string) => void;
  onClose: () => void;
  visitedIds: Set<string>;
}
```

### Tab strip (right edge of modal):

Render a vertical strip of small icon buttons on the right edge. Inspired by Flow's LeftPanel `IconButton` pattern but CRT-styled (no Tailwind — plain CSS classes).

```tsx
<div className="modal-tab-strip">
  {ORBITAL_ITEMS.map((item) => (
    <button
      key={item.id}
      className={`modal-tab-icon${activeId === item.id ? ' modal-tab-icon--active' : ''}${visitedIds.has(item.id) ? ' modal-tab-icon--visited' : ''}`}
      onClick={() => onTabChange(item.id)}
      style={{ '--icon-glow': item.glowColor } as React.CSSProperties}
    >
      <img src={item.icon} alt={item.label} />
      <span className="modal-tab-tooltip">{item.label}</span>
    </button>
  ))}
</div>
```

### CSS for tab strip:

```css
.modal-tab-strip {
  position: absolute;
  right: -3em;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  z-index: 101;
}

.modal-tab-icon {
  width: 2.5em;
  height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(1, 1, 1, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375em;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.modal-tab-icon img {
  width: 1.5em;
  height: 1.5em;
  image-rendering: pixelated;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.modal-tab-icon--active {
  background: rgba(1, 1, 1, 0.92);
  border-color: var(--icon-glow);
  box-shadow: 0 0 0.5em var(--icon-glow), inset 0 0 0.5em rgba(0, 0, 0, 0.5);
}

.modal-tab-icon--active img {
  opacity: 1;
  filter: drop-shadow(0 0 0.3em var(--icon-glow));
}

.modal-tab-icon--visited img {
  opacity: 0.7;
}

/* Tooltip on hover — appears to the left */
.modal-tab-tooltip {
  position: absolute;
  right: calc(100% + 0.5em);
  top: 50%;
  transform: translateY(-50%);
  background: rgba(1, 1, 1, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.7rem;
  padding: 0.25em 0.5em;
  border-radius: 0.25em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.modal-tab-icon:hover .modal-tab-tooltip {
  opacity: 1;
}
```

### page.tsx changes:

- `handleOrbitalSelect` now only opens the modal (sets `activeWindow`)
- Add `handleTabChange` callback that updates `activeWindow` and marks as visited:
  ```ts
  const handleTabChange = useCallback((id: string) => {
    setActiveWindow(id);
    setVisitedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('monolith-visited', JSON.stringify([...next]));
      return next;
    });
  }, []);
  ```
- Pass to InfoWindow: `activeId={activeWindow}`, `onTabChange={handleTabChange}`, `visitedIds={visitedIds}`

### Content switching:

The InfoWindow body renders `CONTENT[activeId]` — switching tabs just changes which content block is shown. The scramble-text animation re-triggers on tab change since content remounts.

**Step: Commit**
```
feat: tabbed modal with vertical icon strip, tab switching
```

---

## Task 5: Active tab icon emerges + gets ASCII stream

**Files:**
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx`

**What to do:**

When the user switches tabs (changes `activeId`), the newly active icon should:
1. Transition from hidden (behind door) to docked position
2. Get its own ASCII stream to center

This is already handled by Task 3's logic — when `activeId` changes, the icon matching the new active ID moves from "hidden" to "docked" state. The animation loop recalculates docked positions to redistribute evenly.

However, we need smooth transitions. Add interpolation for docked positions:

```ts
// Store target positions and interpolate
const targetPosRef = useRef<{x: number, y: number}[]>(
  ORBITAL_ITEMS.map(() => ({x: 0, y: 0}))
);
const currentPosRef = useRef<{x: number, y: number}[]>(
  ORBITAL_ITEMS.map(() => ({x: 0, y: 0}))
);

// In animation loop, after calculating target x,y for each icon:
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothing = 1 - Math.pow(0.001, dt); // ~0.93 per frame at 60fps

currentPosRef.current[i].x = lerp(currentPosRef.current[i].x, x, smoothing);
currentPosRef.current[i].y = lerp(currentPosRef.current[i].y, y, smoothing);

// Use currentPosRef for actual positioning
el.style.transform = `translate(${currentPosRef.current[i].x - elW/2}px, ${currentPosRef.current[i].y - elH/2}px) scale(${targetScale})`;
```

This gives smooth gliding when icons transition between states.

Also: when a new tab is selected, that icon's stream should initialize with the active glow style (full opacity, fast character rate) immediately.

**Step: Commit**
```
feat: smooth icon transitions between states with lerp
```

---

## Task 6: All-visited completion state

**Files:**
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx`
- Modify: `apps/monolith-hackathon/app/globals.css`

**What to do:**

When `visitedIds.size === ORBITAL_ITEMS.length` (all 8 visited):

1. **Modal open:** All 8 icons are docked around center with all 8 ASCII streams at full power. This already works from Task 3 logic.

2. **Modal closed:** Instead of resuming normal orbit, icons stay in a fixed ring around center with all streams active. This is the "completed" state.

   In the animation loop, add a check:
   ```ts
   const allVisited = visitedIdsRef.current.size >= ORBITAL_ITEMS.length;

   if (!modalOpen && allVisited) {
     // COMPLETION STATE: fixed ring with all streams
     const dockedAngle = (i / ORBITAL_ITEMS.length) * Math.PI * 2 - Math.PI / 2;
     const dockR = h * 0.35;
     x = cx + dockR * cos(dockedAngle);
     y = cy + dockR * sin(dockedAngle);
     // Show stream at full power
   }
   ```

3. **Visual flourish** (optional): Add a subtle pulse/glow to all streams when completion is first achieved. Could add a CSS class `orbital-layer--complete` with a one-time animation.

**Step: Commit**
```
feat: all-visited completion state with persistent streams
```

---

## Task 7: Polish & edge cases

**Files:**
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx`
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`
- Modify: `apps/monolith-hackathon/app/globals.css`

**What to do:**

1. **Mobile layout:** On mobile (`<= 768px`), the tab strip should move to a horizontal row at the top or bottom of the modal instead of the right edge. The orbital icons don't animate on mobile, so they just become a static tab selector.

2. **Escape key:** Should close the entire modal, not just switch tabs.

3. **Click-outside:** Clicking the backdrop closes the modal entirely.

4. **Tab strip scroll:** If the tab strip is taller than the modal, add overflow-y auto.

5. **Initial open:** When user clicks an orbital icon, that icon should be marked as visited AND become the active tab. The modal opens showing that tab's content.

6. **Re-opening modal after close:** If modal was closed and re-opened, restore the last active tab. The visited icons should immediately dock (no orbit-to-dock animation needed since they were already visited).

7. **Stream cleanup:** When modal closes (and not all-visited), reset stream opacities to 0 smoothly.

**Step: Commit**
```
fix: polish edge cases — mobile, escape, re-open, stream cleanup
```

---

## Summary of State Machine

```
                    ┌──────────────────────────────┐
                    │         IDLE (orbit)          │
                    │  All icons orbit uniformly    │
                    │  No streams visible           │
                    └──────────┬───────────────────┘
                               │ click icon
                               ▼
                    ┌──────────────────────────────┐
                    │       MODAL OPEN              │
                    │  Active icon: docked+stream   │
                    │  Visited icons: docked+stream │
                    │  Unvisited: hidden behind door│
                    │  Tab strip on right edge      │
                    └──────────┬───────────────────┘
                               │ switch tab
                               ▼
                    ┌──────────────────────────────┐
                    │  New tab icon emerges from    │
                    │  behind door → docks + stream │
                    │  Content switches with scramble│
                    └──────────┬───────────────────┘
                               │ close modal
                               ▼
                    ┌──────────────────────────────┐
                    │  If all visited:              │
                    │    → COMPLETION (fixed ring)  │
                    │  Else:                        │
                    │    → IDLE (resume orbit)      │
                    └──────────────────────────────┘
```

## Files Changed Summary

| File | Tasks |
|------|-------|
| `page.tsx` | 1, 2, 4 |
| `OrbitalNav.tsx` | 2, 3, 5, 6, 7 |
| `InfoWindow.tsx` | 1, 4, 7 |
| `globals.css` | 1, 3, 4, 6, 7 |
