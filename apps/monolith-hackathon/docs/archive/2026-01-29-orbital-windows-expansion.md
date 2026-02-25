# Orbital Windows Expansion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the single-icon orbital nav into 8 windows (Timeline already done + 7 new) with content from the Solana Mobile Hackathon, copying Accordion/Tabs from radiants and reskinning for the CRT monolith theme.

**Architecture:** Each window gets a content renderer inside InfoWindow.tsx keyed by `id`. Windows that need tabs/accordion get lightweight CRT-styled copies of the radiants Tabs and Accordion components (no Tailwind — plain CSS classes to match globals.css). All 8 icons orbit on a single circular path with unique speeds, phase offsets, and glow colors.

**Tech Stack:** React 19, Next.js 16, `use-scramble`, CSS (globals.css), copied radiants compound components (Accordion, Tabs)

---

## Windows to Build

| # | ID | Icon | Title | Content Type | Glow Color |
|---|-----|------|-------|-------------|------------|
| 1 | `timeline` | clock.svg | TIMELINE.exe | Entry list (done) | `#fd8f3a` (amber) |
| 2 | `rules` | rules.svg | RULES.exe | Sections w/ headers+body | `#14f1b2` (green) |
| 3 | `prizes` | prizes.svg | PRIZES.exe | Prize tiers + SKR track | `#ef5c6f` (magma) |
| 4 | `judges` | judges.svg | JUDGES.exe | Judge cards (name, title, org) | `#6939ca` (ultraviolet) |
| 5 | `toolbox` | tools.svg | TOOLBOX.exe | Tabbed: SMD / GMD / SPD / AI | `#14f1b2` (green) |
| 6 | `faq` | faq.svg | FAQ.exe | Accordion Q&A pairs | `#fd8f3a` (amber) |
| 7 | `calendar` | calendar.svg | CALENDAR.exe | Weekly schedule entries | `#ef5c6f` (magma) |
| 8 | `legal` | docs.svg | LEGAL.exe | Tabbed: T&C / Privacy / KYC | `#6939ca` (ultraviolet) |

---

## Task 1: Copy and CRT-skin the Accordion component

**Files:**
- Create: `apps/monolith-hackathon/app/components/CrtAccordion.tsx`
- Reference: `packages/radiants/components/core/Accordion/Accordion.tsx`

**Step 1: Copy the radiants Accordion**

Copy `/Users/rivermassey/Desktop/dev/DNA/packages/radiants/components/core/Accordion/Accordion.tsx` to `apps/monolith-hackathon/app/components/CrtAccordion.tsx`.

**Step 2: Replace Tailwind classes with CRT CSS classes**

Strip all Tailwind utility classes. Replace with plain CSS classes that will be defined in globals.css:

```tsx
// AccordionItem: className → "crt-accordion-item" + data-state
// AccordionTrigger: className → "crt-accordion-trigger"
// AccordionContent inner div: className → "crt-accordion-content"
// The +/− indicator: keep as-is, style via .crt-accordion-trigger span:last-child
```

The component keeps the same compound pattern API (`CrtAccordion`, `CrtAccordion.Item`, `CrtAccordion.Trigger`, `CrtAccordion.Content`) and the same context/state logic. Only the className strings change.

**Step 3: Add CRT accordion styles to globals.css**

Add after the variant styles block, before the Door Expanded State section:

```css
/* =============================================================================
   CRT Accordion
   ============================================================================= */

.crt-accordion-item {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: none;
}

.crt-accordion-item:first-child {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.crt-accordion-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6em 0.8em;
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.7);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s var(--ease-drift), background-color 0.2s var(--ease-drift);
}

.crt-accordion-trigger:hover {
  color: var(--white);
  background-color: rgba(255, 255, 255, 0.03);
}

.crt-accordion-content {
  padding: 0 0.8em 0.8em;
  font-family: 'PP Mori', sans-serif;
  font-size: 0.7rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}
```

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/app/components/CrtAccordion.tsx apps/monolith-hackathon/app/globals.css
git commit -m "feat(monolith): add CRT-skinned Accordion from radiants"
```

---

## Task 2: Copy and CRT-skin the Tabs component

**Files:**
- Create: `apps/monolith-hackathon/app/components/CrtTabs.tsx`
- Reference: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Copy the radiants Tabs**

Copy `/Users/rivermassey/Desktop/dev/DNA/packages/radiants/components/core/Tabs/Tabs.tsx` to `apps/monolith-hackathon/app/components/CrtTabs.tsx`.

**Step 2: Replace Tailwind classes with CRT CSS classes**

Strip all Tailwind utility classes and variant logic. Replace with plain CSS:

```tsx
// Tabs root: className → passed through
// TabList: className → "crt-tab-list"
// TabTrigger: className → "crt-tab-trigger" + "crt-tab-trigger--active" when selected
// TabContent: className → "crt-tab-content" (+ passed className)
```

Remove the `variant` and `layout` props — only one CRT style needed. Keep controlled/uncontrolled support.

**Step 3: Add CRT tab styles to globals.css**

```css
/* =============================================================================
   CRT Tabs
   ============================================================================= */

.crt-tab-list {
  display: flex;
  gap: 2px;
  padding: 0.4em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.crt-tab-trigger {
  padding: 0.35em 0.6em;
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.2em;
  cursor: pointer;
  transition: color 0.2s var(--ease-drift), background-color 0.2s var(--ease-drift),
              border-color 0.2s var(--ease-drift);
}

.crt-tab-trigger:hover {
  color: var(--white);
  border-color: rgba(255, 255, 255, 0.15);
}

.crt-tab-trigger--active {
  color: var(--white);
  background-color: var(--ultraviolet);
  border-color: var(--ultraviolet);
}

.crt-tab-content {
  padding: 0.8em;
}
```

Note: The tab trigger active color will be overridden per-variant by the InfoWindow variant system (e.g. amber variant uses amber accent).

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/app/components/CrtTabs.tsx apps/monolith-hackathon/app/globals.css
git commit -m "feat(monolith): add CRT-skinned Tabs from radiants"
```

---

## Task 3: Refactor InfoWindow to support multiple content types

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`

Currently InfoWindow has a single `CONTENT` record mapping IDs to `{ title, entries }`. We need to support:
- **Entry list** (timeline, rules, calendar) — existing pattern
- **Tabbed content** (toolbox, legal) — uses CrtTabs
- **Accordion** (faq) — uses CrtAccordion
- **Card grid** (judges) — judge profile cards
- **Prize list** (prizes) — tiered prize display

**Step 1: Define a discriminated union for content types**

```tsx
type WindowContent =
  | { type: 'entries'; title: string; entries: { date: string; title: string; body: string }[] }
  | { type: 'sections'; title: string; sections: { heading: string; body: string }[] }
  | { type: 'tabs'; title: string; tabs: { id: string; label: string; content: React.ReactNode }[] }
  | { type: 'accordion'; title: string; items: { question: string; answer: string }[] }
  | { type: 'judges'; title: string; judges: { name: string; title: string; org: string; twitter?: string }[] }
  | { type: 'prizes'; title: string; tiers: { label: string; amount: string; count?: number; description?: string }[] };
```

**Step 2: Extract content renderers**

Each content type gets its own render function inside InfoWindow:

- `renderEntries(data, variant, revealed)` — existing timeline pattern (also used for calendar)
- `renderSections(data, variant, revealed)` — header+body blocks (rules)
- `renderTabs(data, variant)` — CrtTabs wrapper (toolbox, legal)
- `renderAccordion(data, variant)` — CrtAccordion wrapper (faq)
- `renderJudges(data, variant, revealed)` — judge cards
- `renderPrizes(data, variant, revealed)` — prize tier list

**Step 3: Update the `CONTENT` record**

Add all 8 windows to the content map (placeholder data first — we'll fill real content in Tasks 4-7).

**Step 4: Wire up revealed count per content type**

The `useStaggerReveal` hook needs total line count. Each type calculates this differently:
- entries/sections: `entries.length + 1`
- judges: `judges.length + 1`
- prizes: `tiers.length + 1`
- tabs/accordion: `2` (title + content block, since internal staggering happens in the sub-components)

**Step 5: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "refactor(monolith): InfoWindow supports multiple content types"
```

---

## Task 4: Add all content data

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`

Create a separate file or inline all content data for each window.

**Content to add (summarized — full text in user message above + webflow reference):**

### `rules` — RULES.exe
Sections with heading + body:
1. **Call to Action** — "A 5-week sprint to compete and build a mobile app for the Solana dApp Store."
2. **Eligibility** — Who can participate, existing projects note, web app warning
3. **Submission Requirements** — APK, GitHub, demo video, pitch deck
4. **Evaluation Criteria** — Completion, clarity, traction, SMS/MWA, mobile UX, Solana usage
5. **Prize Eligibility** — No dApp Store needed to submit; must publish to claim; technical review
6. **Submission Deadline** — All materials before deadline, no late entries
7. **Disqualification** — Lies = forfeit

### `prizes` — PRIZES.exe
Tiers:
1. 10 Winners — $10,000 USD each
2. 5 Honorable Mentions — $5,000 USD each
3. SKR Bonus Track — $10,000 worth of SKR

### `judges` — JUDGES.exe
Cards:
1. Toly — @aeyakovenko
2. Emmett — @m_it
3. Mert — @0xMert_
4. Mike S — @somemobiledev
5. Chase — (need twitter)
6. Akshay — (need twitter)

### `toolbox` — TOOLBOX.exe
Tabs:
1. **Solana Mobile Dev** — Solana Mobile Stack, MWA docs, React Native quickstart, Seeker resources
2. **General Mobile Dev** — Android dev basics, APK building, testing
3. **Solana Program Dev** — Anchor, program examples, devnet tools
4. **AI** — AI-assisted dev resources, vibecoding tools

### `faq` — FAQ.exe
Q&A pairs (adapted from webflow + updated):
1. How do I sign up?
2. What is SKR?
3. Do I need to publish on dApp Store?
4. What are the submission requirements?
5. How are projects evaluated?
6. Can I use an existing project?

### `calendar` — CALENDAR.exe
Weekly entries (same format as timeline):
1. WK 1 — 2/02: KICKOFF
2. WK 2 — 2/09: BUILD
3. WK 3 — 2/16: BUILD
4. WK 4 — 2/23: BUILD
5. WK 5 — 3/02: FINAL WEEK
6. WK 6 — 3/09: SUBMISSIONS DUE

### `legal` — LEGAL.exe
Tabs:
1. **Terms & Conditions** — Standard hackathon T&C (adapted from webflow disclaimer)
2. **Privacy Policy** — Data collection, retention, rights
3. **KYC Policy** — Verification thresholds, procedure

**Step 1: Add all content objects to the CONTENT record**

**Step 2: Verify each window renders** — switch between them via orbital nav

**Step 3: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "feat(monolith): add content for all 8 orbital windows"
```

---

## Task 5: Add all orbital icons and distribute on the orbit

**Files:**
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx`

**Step 1: Expand ORBITAL_ITEMS array**

```tsx
const ORBITAL_ITEMS: OrbitalItem[] = [
  { id: 'timeline', icon: '/icons/clock.svg',    label: 'Timeline', speed: 0.08,  phaseOffset: 0,              glowColor: '#fd8f3a' },
  { id: 'rules',    icon: '/icons/rules.svg',    label: 'Rules',    speed: 0.065, phaseOffset: Math.PI * 0.25, glowColor: '#14f1b2' },
  { id: 'prizes',   icon: '/icons/prizes.svg',   label: 'Prizes',   speed: 0.075, phaseOffset: Math.PI * 0.5,  glowColor: '#ef5c6f' },
  { id: 'judges',   icon: '/icons/judges.svg',   label: 'Judges',   speed: 0.055, phaseOffset: Math.PI * 0.75, glowColor: '#6939ca' },
  { id: 'toolbox',  icon: '/icons/tools.svg',    label: 'Toolbox',  speed: 0.07,  phaseOffset: Math.PI,        glowColor: '#14f1b2' },
  { id: 'faq',      icon: '/icons/faq.svg',      label: 'FAQ',      speed: 0.06,  phaseOffset: Math.PI * 1.25, glowColor: '#fd8f3a' },
  { id: 'calendar', icon: '/icons/calendar.svg', label: 'Calendar', speed: 0.072, phaseOffset: Math.PI * 1.5,  glowColor: '#ef5c6f' },
  { id: 'legal',    icon: '/icons/docs.svg',     label: 'Legal',    speed: 0.058, phaseOffset: Math.PI * 1.75, glowColor: '#6939ca' },
];
```

Phase offsets are evenly distributed (π/4 apart = 45 degrees). Speeds vary slightly so icons don't clump over time.

**Step 2: Fix the data stream connector**

Currently the connector only tracks `i === 0`. Change it to track the **active** icon (matching `activeId`), or the **hovered** icon. Need to:
- Track `hoveredIndexRef` instead of `isHoveredRef` boolean
- The connector follows whichever icon is active, or hovered if no active
- When multiple icons exist, only one stream line at a time

**Step 3: Update anglesRef initialization**

```tsx
const anglesRef = useRef<number[]>(ORBITAL_ITEMS.map((item) => item.phaseOffset));
```

This is already correct since it maps from the array.

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/app/components/OrbitalNav.tsx
git commit -m "feat(monolith): add 8 orbital icons with distributed phases"
```

---

## Task 6: Add CSS for new content types

**Files:**
- Modify: `apps/monolith-hackathon/app/globals.css`

**Step 1: Add styles for sections content (rules)**

```css
.section-content .section-block {
  margin-bottom: 1em;
}
.section-heading { /* similar to timeline-entry-header */ }
.section-body { /* similar to timeline-entry-body */ }
```

These should follow the same variant pattern as timeline entries — `section-heading--glass`, `section-heading--amber`, etc. Or better: make the existing `timeline-entry-*` classes generic enough to reuse. Consider renaming to `window-entry-*` or using the same classes.

**Decision: Reuse timeline-entry classes for all entry-like content.** Rules sections, calendar entries, and prize tiers all look the same as timeline entries. No new CSS needed for these.

**Step 2: Add judge card styles**

```css
.judge-card {
  display: flex;
  align-items: center;
  gap: 0.8em;
  padding: 0.6em 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.judge-card:last-child { border-bottom: none; }
.judge-name { font-family: 'Pixeloid Mono', monospace; font-size: 0.7rem; }
.judge-title { font-size: 0.6rem; color: rgba(255, 255, 255, 0.5); }
.judge-link { font-size: 0.55rem; opacity: 0.4; transition: opacity 0.2s; }
.judge-link:hover { opacity: 1; }
```

Judge name color inherits from variant header color (same as timeline-entry-header--{variant}).

**Step 3: Add prize tier styles**

```css
.prize-tier {
  padding: 0.8em 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.prize-tier:last-child { border-bottom: none; }
.prize-amount { font-family: 'Pixeloid Mono', monospace; font-size: 0.85rem; }
.prize-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; }
.prize-description { font-size: 0.65rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.3em; }
```

Prize amount color inherits from variant header color.

**Step 4: Variant-aware tab trigger active colors**

The CRT tab trigger active color should match the window's variant accent. Add per-variant overrides:

```css
.door-info-overlay--glass .crt-tab-trigger--active { background-color: rgba(255,255,255,0.15); }
.door-info-overlay--magma .crt-tab-trigger--active { background-color: var(--magma); }
.door-info-overlay--ultraviolet .crt-tab-trigger--active { background-color: var(--ultraviolet); }
.door-info-overlay--amber .crt-tab-trigger--active { background-color: var(--amber); }
.door-info-overlay--clear .crt-tab-trigger--active { background-color: rgba(255,255,255,0.1); }
```

**Step 5: Commit**

```bash
git add apps/monolith-hackathon/app/globals.css
git commit -m "feat(monolith): add CSS for judge cards, prize tiers, variant tab colors"
```

---

## Task 7: Wire up page.tsx — variant-amber-active for all variants

**Files:**
- Modify: `apps/monolith-hackathon/app/page.tsx`

Currently `variant-amber-active` is hardcoded. The amber variant's "blur the door" behavior is specific to amber, so no change needed here. But verify that all 8 window IDs work with the existing `handleOrbitalSelect` / `handleWindowClose` flow — they should, since the logic is ID-agnostic.

**Step 1: Verify no page.tsx changes needed**

The page passes `activeWindow` (string ID) to both `OrbitalNav` and `InfoWindow`. Both components are already ID-agnostic. No changes.

**Step 2: Smoke test all 8 windows**

Open each orbital icon, verify content renders, close with Escape and X button.

**Step 3: Commit (if any fixes needed)**

---

## Task 8: Polish and QA

**Files:**
- Potentially all modified files

**Step 1: Verify all icons load** — check `/icons/*.svg` paths match

**Step 2: Test variant switcher with each window** — all 5 variants (glass, clear, magma, ultraviolet, amber) should apply correctly to all 8 windows

**Step 3: Test mobile** — icons should not orbit on `<=768px` (existing behavior), windows should still open

**Step 4: Test data stream** — connector should track whichever icon is active/hovered, with the correct glow color per icon

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(monolith): complete 8-window orbital navigation system"
```

---

## Execution Order

```
Task 1 ─┐
Task 2 ─┤ (parallel — independent component copies)
        ├→ Task 3 (refactor InfoWindow to use them)
        │    └→ Task 4 (add all content data)
Task 5 ─┘    └→ Task 6 (add CSS)
              └→ Task 7 (wire up page.tsx)
                  └→ Task 8 (QA)
```

Tasks 1, 2, and 5 can run in parallel. Task 3 depends on 1+2. Task 4 depends on 3. Tasks 6+7 can run after 3. Task 8 is final.
