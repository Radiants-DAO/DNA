# Monolith Hackathon Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overhaul the monolith-hackathon site's content panels with proper typography hierarchy, lavender accent color system, restructured content (HACKATHON.EXE, calendar grid, evaluation criteria cards), custom scrollbar, and mobile nav.

**Architecture:** CSS custom properties scoped to `.door-info-overlay` replace hardcoded orange hex values in panel chrome. Content types in `InfoWindow.tsx` are extended with new `hackathon`, `calendar`, and `rules` variants. Typography uses a 6-level hierarchy (Mondwest display → PP Mori muted). Timeline panel is removed; its data merges into the calendar.

**Tech Stack:** Next.js 16, React 19, CSS (no Tailwind for panel internals), `use-scramble` for header animations, Zustand (existing)

**Brainstorm:** `docs/brainstorms/2026-01-31-monolith-redesign-brainstorm.md`

---

## Research Summary

**Files to modify:**
- `apps/monolith-hackathon/app/globals.css` (1748 lines) — 18 panel-scoped orange refs to replace, 11 orbital/hero refs to keep
- `apps/monolith-hackathon/app/components/InfoWindow.tsx` (553 lines) — content data, renderers, component JSX
- `apps/monolith-hackathon/app/components/OrbitalNav.tsx` — ORBITAL_ITEMS array (8 items, line 13-22)
- `apps/monolith-hackathon/app/page.tsx` (227 lines) — "Begin" button, quickstart reference

**Key conventions:**
- All spacing uses `em` units (not `rem` or `px`)
- CSS uses plain classes (no Tailwind utility classes inside panels)
- Panel chrome colors are hardcoded `rgba(253, 143, 58, *)` — will become `var(--panel-accent-*)`
- CTA buttons use `var(--magma)` / `var(--ultraviolet)` CSS vars — keep unchanged
- Orbital icon `glowColor` is passed as `--icon-glow` CSS var — keep unchanged
- Scrollbar reference: `packages/radiants/base.css` lines 50-145 uses `background-clip: padding-box` with transparent border for inset effect

**No `docs/solutions/` found.** No external research needed — all patterns are internal.

---

### Task 1: Panel Accent Color Token System

**Files:**
- Modify: `apps/monolith-hackathon/app/globals.css:1458-1471` (`.door-info-overlay` base)

**Step 1: Add CSS custom properties to `.door-info-overlay`**

Insert token declarations at the top of the `.door-info-overlay` rule block (line 1458):

```css
.door-info-overlay {
  /* Panel accent tokens — lavender replaces orange in panel chrome only */
  --panel-accent: #b494f7;
  --panel-accent-65: rgba(180, 148, 247, 0.65);
  --panel-accent-40: rgba(180, 148, 247, 0.4);
  --panel-accent-30: rgba(180, 148, 247, 0.3);
  --panel-accent-20: rgba(180, 148, 247, 0.2);
  --panel-accent-15: rgba(180, 148, 247, 0.15);
  --panel-accent-08: rgba(180, 148, 247, 0.08);

  /* existing properties below... */
  position: absolute;
  /* ... */
  border: 1px solid var(--panel-accent-15);                              /* was rgba(253,143,58,0.15) */
  box-shadow: 0 0 2em var(--panel-accent-08), inset 0 0 2em rgba(0, 0, 0, 0.5);  /* was rgba(253,143,58,0.08) */
}
```

**Step 2: Replace all panel-scoped orange values**

Each replacement below is a single find-and-replace in the context of its selector. Replace the exact `rgba(253, 143, 58, *)` or `#fd8f3a` value with the matching token:

| Line | Selector | Old Value | New Value |
|------|----------|-----------|-----------|
| 481 | `.taskbar_wrap` border-bottom | `rgba(253, 143, 58, 0.2)` | `var(--panel-accent-20)` |
| 513 | `.taskbar_line` gradient | `rgba(253, 143, 58, 0.2)` | `var(--panel-accent-20)` |
| 534 | `.close_button` color | `rgba(253, 143, 58, 0.7)` | `var(--panel-accent-65)` |
| 538 | `.close_button:hover` color | `#fd8f3a` | `var(--panel-accent)` |
| 1141 | `.timeline-entry` border-left | `rgba(253, 143, 58, 0.4)` | `var(--panel-accent-40)` |
| 1147 | `.timeline-entry:hover` border-left-color | `#fd8f3a` | `var(--panel-accent)` |
| 1153 | `.timeline-entry-header` color | `#fd8f3a` | `var(--panel-accent)` |
| 1244 | `.crt-tab-trigger--active` background-color | `rgba(253, 143, 58, 0.3)` | `var(--panel-accent-30)` |
| 1245 | `.crt-tab-trigger--active` border-color | `rgba(253, 143, 58, 0.3)` | `var(--panel-accent-30)` |
| 1271 | `.judge-card-v2` border | `rgba(253, 143, 58, 0.15)` | `var(--panel-accent-15)` |
| 1300 | `.judge-name-v2` color | `#fd8f3a` | `var(--panel-accent)` |
| 1343 | `.prize-amount` color | `#fd8f3a` | `var(--panel-accent)` |
| 1344 | `.prize-amount` text-shadow | `rgba(253, 143, 58, 0.3)` | `var(--panel-accent-30)` |
| 1484 | `.door-info-overlay .taskbar_wrap` border-bottom | `rgba(253, 143, 58, 0.2)` | `var(--panel-accent-20)` |
| 1503 | `.modal-cta-footer` border-top | `rgba(253, 143, 58, 0.15)` | `var(--panel-accent-15)` |
| 1649 | `.modal-tab-strip` border-top | `rgba(253, 143, 58, 0.15)` | `var(--panel-accent-15)` |

**DO NOT change** lines 60, 81, 306, 316, 335, 340, 346, 350, 356, 827, 859, 902 — these are orbital/hero/focus elements.

**Step 3: Verify in browser**

Run: `cd apps/monolith-hackathon && pnpm dev`

Check: Open any panel — borders, headers, tab indicators should be lavender. Orbital ring, monolith title glow, focus outlines should remain orange/magma.

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/app/globals.css
git commit -m "style: panel accent token system — lavender replaces orange in panel chrome"
```

---

### Task 2: Typography Hierarchy

**Files:**
- Modify: `apps/monolith-hackathon/app/globals.css`

**Step 1: Add typography classes inside panel scope**

Add after the `.door-info-overlay` base block (after line ~1471):

```css
/* =============================================================================
   Panel Typography Hierarchy
   ============================================================================= */

/* Display stat — primary (money/headline numbers) */
.display-stat-primary {
  font-family: 'Mondwest', serif;
  font-size: 2rem;
  font-weight: 400;
  color: var(--panel-accent);
  font-variant-numeric: tabular-nums;
  text-wrap: balance;
  line-height: 1.2;
}

/* Display stat — secondary (dates/durations) */
.display-stat-secondary {
  font-family: 'Mondwest', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
  text-wrap: balance;
  line-height: 1.2;
}

/* Subsection heading */
.subsection-heading {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  text-rendering: optimizeSpeed;
}

/* Label/caption */
.panel-label {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--panel-accent-65);
  text-transform: uppercase;
  text-rendering: optimizeSpeed;
}

/* Muted/secondary text */
.panel-muted {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
}
```

**Step 2: Update existing panel typography rules**

Update `.timeline-entry-header` (around line 1153):

```css
.timeline-entry-header {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: var(--panel-accent);
  text-transform: uppercase;
  text-rendering: optimizeSpeed;
  text-wrap: balance;
}
```

Update `.timeline-entry-body` to use PP Mori explicitly:

```css
.timeline-entry-body {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.8125rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}
```

**Step 3: Update spacing**

Update `.timeline-content` gap and `.timeline-entry` gap:

```css
.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 1.5em;  /* was likely less — bumped for hierarchy */
}

.timeline-entry {
  display: flex;
  flex-direction: column;
  gap: 0.625em;  /* heading-to-body spacing */
}
```

Update `.door-info-overlay .app_contents` padding (line ~1488):

```css
.door-info-overlay .app_contents {
  flex: 1;
  overflow-y: auto;
  padding: 1em 1.25em;
}
```

**Step 4: Verify in browser**

Check: Panel headers should be 1rem Pixeloid Mono uppercase lavender. Body text should be 0.8125rem PP Mori white-85%. Spacing between sections should be visibly larger than heading-to-body.

**Step 5: Commit**

```bash
git add apps/monolith-hackathon/app/globals.css
git commit -m "style: 6-level typography hierarchy with proper spacing and pixel font rendering"
```

---

### Task 3: HACKATHON.EXE Panel + Rename + Get Started

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx:20-54` (types + quickstart content)
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx:454-463` (renderContent)
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx:469-551` (InfoWindow component)
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx:13` (first ORBITAL_ITEMS entry)
- Modify: `apps/monolith-hackathon/app/page.tsx:191-194` (Begin button)

**Step 1: Add `hackathon` content type**

In InfoWindow.tsx, add to the `WindowContent` union type (line 20-26):

```typescript
type WindowContent =
  | { type: 'entries'; title: string; entries: { date: string; title: string; body: string }[] }
  | { type: 'sections'; title: string; sections: { heading: string; body: string }[] }
  | { type: 'tabs'; title: string; tabs: { id: string; label: string; sections: { heading: string; body: string }[] }[] }
  | { type: 'accordion'; title: string; items: { question: string; answer: string }[] }
  | { type: 'judges'; title: string; judges: { name: string; role: string; org: string; twitter?: string; image?: string }[] }
  | { type: 'prizes'; title: string; tiers: { label: string; amount: string; description?: string }[] }
  | { type: 'hackathon'; title: string; stats: { value: string; label: string; tier: 'primary' | 'secondary' }[]; sections: { heading: string; body: string }[] };
```

**Step 2: Replace `quickstart` content with `hackathon`**

Delete the `quickstart` key (lines 33-54) and replace with:

```typescript
hackathon: {
  type: 'hackathon',
  title: 'HACKATHON.EXE',
  stats: [
    { value: '$125k+', label: 'IN PRIZES', tier: 'primary' },
    { value: '5 WEEKS', label: 'SPRINT', tier: 'secondary' },
    { value: 'FEB 2 — MAR 9', label: '2026', tier: 'secondary' },
  ],
  sections: [
    {
      heading: 'What',
      body: 'A 5-week sprint to build a mobile app for the Solana dApp Store. 10 winners at $10k each, 5 honorable mentions at $5k, plus a $10k SKR bonus track.',
    },
    {
      heading: 'What to Submit',
      body: 'A functional Android APK, a GitHub repo, a demo video, and a pitch deck. Must integrate Solana Mobile Stack.',
    },
    {
      heading: 'Results',
      body: 'Results announced early April. Winners must publish on dApp Store to claim prize (reasonable timeframe given).',
    },
  ],
},
```

**Step 3: Add `renderHackathon` function**

Add after `renderPrizes` (after line ~448):

```typescript
function renderHackathon(
  data: Extract<WindowContent, { type: 'hackathon' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="hackathon-content">
      <div className="hackathon-stats">
        {data.stats.map((stat, i) => (
          <div key={i} className="hackathon-stat">
            <div className={`display-stat-${stat.tier}`}>
              {revealed >= i + 2 ? <ScrambleText text={stat.value} onDone={i === 0 ? advance : undefined} /> : '\u00A0'}
            </div>
            <div className="panel-label">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="timeline-content">
        {data.sections.map((section, i) => {
          if (revealed < i + data.stats.length + 2) return null;
          return (
            <div key={i} className="timeline-entry">
              <div className="timeline-entry-header">
                <ScrambleText text={section.heading} onDone={advance} />
              </div>
              <div className="timeline-entry-body">
                {section.body}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 4: Register in `renderContent`**

Add the `hackathon` case in the switch (line ~455):

```typescript
function renderContent(data: WindowContent, revealed: number, advance: () => void) {
  switch (data.type) {
    case 'hackathon': return renderHackathon(data, revealed, advance);
    case 'entries': return renderEntries(data, revealed, advance);
    case 'sections': return renderSections(data, revealed, advance);
    case 'tabs': return renderTabs(data);
    case 'accordion': return renderAccordion(data);
    case 'judges': return renderJudges(data, revealed, advance);
    case 'prizes': return renderPrizes(data, revealed, advance);
  }
}
```

**Step 5: Add hackathon stats CSS**

In `globals.css`, add after the typography hierarchy block:

```css
/* =============================================================================
   HACKATHON.EXE Stats Layout
   ============================================================================= */

.hackathon-stats {
  display: flex;
  gap: 1.5em;
  padding-bottom: 1.5em;
  border-bottom: 1px solid var(--panel-accent-15);
  margin-bottom: 1.5em;
}

.hackathon-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}
```

**Step 6: Rename in OrbitalNav.tsx**

Change line 13 in ORBITAL_ITEMS:

```typescript
{ id: 'hackathon', icon: '/icons/clock.svg', label: 'Hackathon', phaseOffset: 0, glowColor: '#ef5c6f' },
```

**Step 7: Update page.tsx — "Get Started" button**

Change line 191:
```typescript
onClick={() => handleOrbitalSelect('hackathon')}
```

Change line 194, replace `Begin` with `Get Started`.

**Step 8: Verify in browser**

Check: Click "Get Started" → HACKATHON.EXE panel opens. Display stats ($125k+, 5 WEEKS, FEB 2 — MAR 9) render with scramble animation. $125k+ is 2rem lavender, dates are 1.5rem white. Sections below with scramble headers and static body.

**Step 9: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx \
       apps/monolith-hackathon/app/components/OrbitalNav.tsx \
       apps/monolith-hackathon/app/page.tsx \
       apps/monolith-hackathon/app/globals.css
git commit -m "feat: HACKATHON.EXE panel with display stats, Get Started button"
```

---

### Task 4: Remove Timeline, Merge into Calendar

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx:56-66` (timeline content)
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx:201-212` (calendar content)
- Modify: `apps/monolith-hackathon/app/components/OrbitalNav.tsx:13` (remove timeline entry)

**Step 1: Remove timeline from ORBITAL_ITEMS**

Delete the `timeline` entry (line 13 in OrbitalNav.tsx — but note: we already changed this to `hackathon` in Task 3, so `timeline` no longer exists there). If `timeline` was a separate entry, remove it. The array should now have 7 items with `hackathon` first.

Wait — currently there are 8 items: timeline, rules, prizes, judges, toolbox, faq, calendar, legal. In Task 3 we renamed `timeline` to `hackathon`. So the 8 items are now: hackathon, rules, prizes, judges, toolbox, faq, calendar, legal. Timeline is already gone as a nav item. Good.

**Step 2: Delete `CONTENT.timeline`**

Remove lines 56-66 from InfoWindow.tsx (the `timeline: { ... }` entry).

**Step 3: Enrich calendar content with merged timeline data**

Replace `CONTENT.calendar` (lines 201-212) with a new `calendar` content type. Add it to the WindowContent union:

```typescript
| { type: 'calendar'; title: string; weeks: { id: string; label: string; theme: string; days: { dayName: string; date: number; month: string; event?: string; time?: string }[] }[] }
```

Replace the calendar content data:

```typescript
calendar: {
  type: 'calendar',
  title: 'CALENDAR.exe',
  weeks: [
    {
      id: 'wk1', label: 'Week 1', theme: 'Kickoff',
      days: [
        { dayName: 'Sun', date: 2, month: 'Feb', event: 'LAUNCH DAY', time: 'All Day' },
        { dayName: 'Mon', date: 3, month: 'Feb' },
        { dayName: 'Tue', date: 4, month: 'Feb' },
        { dayName: 'Wed', date: 5, month: 'Feb', event: 'Twitter Spaces', time: '2 PM EST' },
        { dayName: 'Thu', date: 6, month: 'Feb' },
        { dayName: 'Fri', date: 7, month: 'Feb' },
        { dayName: 'Sat', date: 8, month: 'Feb' },
      ],
    },
    {
      id: 'wk2', label: 'Week 2', theme: 'Build',
      days: [
        { dayName: 'Sun', date: 9, month: 'Feb' },
        { dayName: 'Mon', date: 10, month: 'Feb' },
        { dayName: 'Tue', date: 11, month: 'Feb' },
        { dayName: 'Wed', date: 12, month: 'Feb' },
        { dayName: 'Thu', date: 13, month: 'Feb' },
        { dayName: 'Fri', date: 14, month: 'Feb' },
        { dayName: 'Sat', date: 15, month: 'Feb' },
      ],
    },
    {
      id: 'wk3', label: 'Week 3', theme: 'Build',
      days: [
        { dayName: 'Sun', date: 16, month: 'Feb' },
        { dayName: 'Mon', date: 17, month: 'Feb' },
        { dayName: 'Tue', date: 18, month: 'Feb' },
        { dayName: 'Wed', date: 19, month: 'Feb' },
        { dayName: 'Thu', date: 20, month: 'Feb' },
        { dayName: 'Fri', date: 21, month: 'Feb' },
        { dayName: 'Sat', date: 22, month: 'Feb' },
      ],
    },
    {
      id: 'wk4', label: 'Week 4', theme: 'Polish',
      days: [
        { dayName: 'Sun', date: 23, month: 'Feb' },
        { dayName: 'Mon', date: 24, month: 'Feb' },
        { dayName: 'Tue', date: 25, month: 'Feb' },
        { dayName: 'Wed', date: 26, month: 'Feb' },
        { dayName: 'Thu', date: 27, month: 'Feb' },
        { dayName: 'Fri', date: 28, month: 'Feb' },
        { dayName: 'Sat', date: 1, month: 'Mar' },
      ],
    },
    {
      id: 'wk5', label: 'Week 5', theme: 'Final',
      days: [
        { dayName: 'Sun', date: 2, month: 'Mar' },
        { dayName: 'Mon', date: 3, month: 'Mar' },
        { dayName: 'Tue', date: 4, month: 'Mar' },
        { dayName: 'Wed', date: 5, month: 'Mar' },
        { dayName: 'Thu', date: 6, month: 'Mar' },
        { dayName: 'Fri', date: 7, month: 'Mar' },
        { dayName: 'Sat', date: 8, month: 'Mar' },
      ],
    },
    {
      id: 'wk6', label: 'Week 6', theme: 'Submissions',
      days: [
        { dayName: 'Sun', date: 9, month: 'Mar', event: 'SUBMISSIONS DUE', time: '11:59 PM EST' },
        { dayName: 'Mon', date: 10, month: 'Mar' },
        { dayName: 'Tue', date: 11, month: 'Mar' },
        { dayName: 'Wed', date: 12, month: 'Mar' },
        { dayName: 'Thu', date: 13, month: 'Mar' },
        { dayName: 'Fri', date: 14, month: 'Mar' },
        { dayName: 'Sat', date: 15, month: 'Mar' },
      ],
    },
  ],
},
```

**Step 4: Add `renderCalendar` function**

```typescript
function renderCalendar(
  data: Extract<WindowContent, { type: 'calendar' }>,
) {
  return (
    <CrtTabs defaultValue={data.weeks[0]?.id}>
      <CrtTabs.List>
        {data.weeks.map((week) => (
          <CrtTabs.Trigger key={week.id} value={week.id}>
            {week.label}
          </CrtTabs.Trigger>
        ))}
      </CrtTabs.List>
      {data.weeks.map((week) => (
        <CrtTabs.Content key={week.id} value={week.id}>
          <div className="panel-label" style={{ marginBottom: '0.5em' }}>{week.theme}</div>
          <div className="calendar-week">
            {week.days.map((day, i) => (
              <div key={i} className={`calendar-day${day.event ? ' calendar-day--event' : ''}`}>
                <span className="panel-muted">{day.dayName}</span>
                <span className="calendar-day-date">{day.month} {day.date}</span>
                {day.event && <span className="subsection-heading" style={{ fontSize: '0.75rem' }}>{day.event}</span>}
                {day.time && <span className="panel-muted">{day.time}</span>}
                {!day.event && <span className="panel-muted">No Events</span>}
              </div>
            ))}
          </div>
        </CrtTabs.Content>
      ))}
    </CrtTabs>
  );
}
```

**Step 5: Register in `renderContent`**

```typescript
case 'calendar': return renderCalendar(data);
```

**Step 6: Add calendar CSS**

In `globals.css`:

```css
/* =============================================================================
   Calendar Grid (ported from webflow)
   ============================================================================= */

.calendar-week {
  display: flex;
  gap: 0;
  border: 1px solid var(--panel-accent-15);
}

.calendar-day {
  flex: 1;
  min-width: 0;
  padding: 0.75em 0.5em;
  display: flex;
  flex-direction: column;
  gap: 0.25em;
  border-left: 1px solid var(--panel-accent-15);
  text-align: center;
}

.calendar-day:first-child {
  border-left: none;
}

.calendar-day--event {
  background: var(--panel-accent-08);
}

.calendar-day-date {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-rendering: optimizeSpeed;
}

@media (max-width: 768px) {
  .calendar-week {
    flex-direction: column;
  }
  .calendar-day {
    flex-direction: row;
    align-items: center;
    gap: 0.75em;
    text-align: left;
    border-left: none;
    border-top: 1px solid var(--panel-accent-15);
  }
  .calendar-day:first-child {
    border-top: none;
  }
}
```

**Step 7: Verify in browser**

Check: Calendar tab shows week tabs. Each week renders a flex row of day cards. Event days have lavender tint background. Mobile stacks vertically.

**Step 8: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx \
       apps/monolith-hackathon/app/components/OrbitalNav.tsx \
       apps/monolith-hackathon/app/globals.css
git commit -m "feat: calendar grid with week tabs, remove timeline panel"
```

---

### Task 5: Scramble Headers Only, Static Body

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx` (render functions)

**Step 1: Update `renderSections` — static body text**

Change `renderSections` (line ~308-330). Replace `<ScrambleText text={section.body} onDone={advance} />` with:

```typescript
function renderSections(
  data: Extract<WindowContent, { type: 'sections' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="timeline-content">
      {data.sections.map((section, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className="timeline-entry">
            <div className="timeline-entry-header">
              <ScrambleText text={section.heading} onDone={advance} />
            </div>
            <div className="timeline-entry-body">
              {section.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Update `renderEntries` — static body text**

Same pattern — keep `<ScrambleText>` on header, static `{entry.body}` on body. Move `onDone={advance}` to the header ScrambleText:

```typescript
<div className="timeline-entry-header">
  <ScrambleText text={`${entry.date} — ${entry.title}`} onDone={advance} />
</div>
<div className="timeline-entry-body">
  {entry.body}
</div>
```

**Step 3: Update `renderPrizes` — static description**

Change `prize-description` to render static text:

```typescript
{tier.description && (
  <div className="prize-description">
    {tier.description}
  </div>
)}
```

Move `onDone={advance}` to the `prize-amount` ScrambleText:

```typescript
<div className="prize-amount timeline-entry-header">
  <ScrambleText text={tier.amount} onDone={advance} />
</div>
```

**Step 4: Update `renderAccordion` — static answer**

```typescript
<CrtAccordion.Content>
  <span className="timeline-entry-body" style={{ display: 'block' }}>
    {item.answer}
  </span>
</CrtAccordion.Content>
```

**Step 5: Verify in browser**

Check: Headers animate with scramble effect. Body text appears instantly (no character-by-character reveal). Sequential reveal still works — each section appears after previous header finishes scrambling.

**Step 6: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "feat: scramble headers only, body text renders static for readability"
```

---

### Task 6: Evaluation Criteria Cards in Rules

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx:69-100` (rules content)
- Modify: `apps/monolith-hackathon/app/globals.css`

**Step 1: Add `rules` content type with criteria**

Add to WindowContent union:

```typescript
| { type: 'rules'; title: string; sections: { heading: string; body: string }[]; criteria: { category: string; pct: number; description: string }[]; hideCta?: boolean }
```

**Step 2: Update rules content data**

Replace the rules content. Remove the old "Evaluation Criteria" section from `sections` array. Add `criteria` array and `hideCta: true`:

```typescript
rules: {
  type: 'rules',
  title: 'RULES.exe',
  sections: [
    {
      heading: 'Call to Action',
      body: 'A 5-week sprint to compete and build a mobile app for the Solana dApp Store.',
    },
    {
      heading: 'Eligibility',
      body: 'Your project must have been started within 3 months of the hackathon launch date. Projects that have raised outside capital are not eligible. Pre-existing projects are allowed if they show significant new mobile development. Teams with existing web apps can participate but must build an Android app with significant mobile-specific development.',
    },
    {
      heading: 'Submission Requirements',
      body: 'All submissions must include: A functional Android APK, a GitHub repo, a demo video showcasing functionality, and a pitch deck or brief presentation explaining the app.',
    },
    {
      heading: 'Prize Eligibility',
      body: 'Publishing on the Solana dApp Store is not required by the submission deadline. However, winners must publish their app on the dApp Store to claim their prize. Winners will be given a reasonable timeframe after results are announced.',
    },
    {
      heading: 'Submission Deadline',
      body: 'All materials (GitHub repo, demo video, and pitch deck) must be submitted before the deadline. No late entries.',
    },
    {
      heading: 'Disqualification',
      body: 'Any team that lies on their registration or submission forms, or violates any rule, will forfeit all prizes.',
    },
  ],
  criteria: [
    { category: 'Stickiness & PMF', pct: 25, description: 'How well does your app resonate with the Seeker community? Does it create habits and drive daily engagement?' },
    { category: 'User Experience', pct: 25, description: 'Is the app intuitive, polished, and enjoyable to use?' },
    { category: 'Innovation / X-factor', pct: 25, description: 'How novel and creative is the idea? Does it stand out from existing products?' },
    { category: 'Presentation & Demo Quality', pct: 25, description: 'How clearly did the team communicate their idea? Does the demo effectively showcase the core concept?' },
  ],
  hideCta: true,
},
```

**Step 3: Add `renderRules` function**

```typescript
function renderRules(
  data: Extract<WindowContent, { type: 'rules' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="rules-content">
      <div className="timeline-content">
        {data.sections.map((section, i) => {
          if (revealed < i + 2) return null;
          return (
            <div key={i} className="timeline-entry">
              <div className="timeline-entry-header">
                <ScrambleText text={section.heading} onDone={advance} />
              </div>
              <div className="timeline-entry-body">
                {section.body}
              </div>
            </div>
          );
        })}
      </div>

      {revealed >= data.sections.length + 2 && (
        <>
          <div className="timeline-entry-header" style={{ marginTop: '1.5em' }}>
            <ScrambleText text="EVALUATION CRITERIA" />
          </div>
          <div className="criteria-grid">
            {data.criteria.map((c, i) => (
              <div key={i} className="criteria-card">
                <div className="criteria-header">
                  <span className="subsection-heading">{c.category}</span>
                  <span className="criteria-badge">{c.pct}%</span>
                </div>
                <div className="timeline-entry-body" style={{ marginTop: '0.375em' }}>
                  {c.description}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 4: Register in `renderContent`**

```typescript
case 'rules': return renderRules(data, revealed, advance);
```

**Step 5: Add criteria CSS**

In `globals.css`:

```css
/* =============================================================================
   Evaluation Criteria Cards
   ============================================================================= */

.criteria-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75em;
  margin-top: 0.75em;
}

.criteria-card {
  border: 1px solid var(--panel-accent-15);
  padding: 0.75em 1em;
  background: var(--panel-accent-08);
}

.criteria-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5em;
}

.criteria-badge {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  color: var(--panel-accent);
  background: var(--panel-accent-15);
  padding: 0.15em 0.5em;
  text-rendering: optimizeSpeed;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .criteria-grid {
    grid-template-columns: 1fr;
  }
}
```

**Step 6: Verify in browser**

Check: Rules panel shows sections, then a 2×2 grid of criteria cards. Each card has category name left-aligned, 25% badge right-aligned, description below. Mobile stacks to 1 column.

**Step 7: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx \
       apps/monolith-hackathon/app/globals.css
git commit -m "feat: evaluation criteria cards in rules panel"
```

---

### Task 7: Hide CTAs on Rules Panel

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx:517-534` (CTA footer JSX)

**Step 1: Conditionally render CTA footer**

The `rules` content type has `hideCta: true`. Check for it in the InfoWindow component. Replace the CTA footer block (line ~517):

```typescript
{/* Persistent CTA footer — hidden on rules panel */}
{!(data as any).hideCta && (
  <div className="modal-cta-footer">
    <a
      href="https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE"
      target="_blank"
      rel="noopener noreferrer"
      className="modal-cta-button modal-cta-primary"
    >
      Register
    </a>
    <a
      href="https://discord.gg/radiants"
      target="_blank"
      rel="noopener noreferrer"
      className="modal-cta-button modal-cta-secondary"
    >
      Discord
    </a>
  </div>
)}
```

A cleaner approach — check for `hideCta` via a helper:

```typescript
const showCta = !('hideCta' in data && data.hideCta);
```

Then wrap: `{showCta && (<div className="modal-cta-footer">...</div>)}`.

**Step 2: Verify in browser**

Check: Rules panel has no Register/Discord footer. All other panels still show it.

**Step 3: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "feat: hide CTA footer on rules panel"
```

---

### Task 8: Custom Scrollbar

**Files:**
- Modify: `apps/monolith-hackathon/app/globals.css:1488-1492` (`.door-info-overlay .app_contents`)

**Step 1: Add scrollbar styles**

Update `.door-info-overlay .app_contents` (line ~1488):

```css
.door-info-overlay .app_contents {
  flex: 1;
  overflow-y: auto;
  padding: 1em 1.25em;

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: var(--panel-accent) transparent;
}

/* Webkit scrollbar — radiants-inspired */
.door-info-overlay .app_contents::-webkit-scrollbar {
  width: 1.75rem;
}

.door-info-overlay .app_contents::-webkit-scrollbar-track {
  background: transparent;
}

.door-info-overlay .app_contents::-webkit-scrollbar-thumb {
  background-color: var(--panel-accent);
  background-clip: padding-box;
  border: 0.625rem solid transparent;
  border-radius: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.8);
}

.door-info-overlay .app_contents::-webkit-scrollbar-thumb:hover {
  background-color: #c9b0ff;
}

/* Hide horizontal scrollbar */
.door-info-overlay .app_contents::-webkit-scrollbar:horizontal {
  display: none;
}
```

**Step 2: Verify in browser**

Check: Scrolling in any panel shows a thin lavender thumb with black inset border. Wide invisible track creates padding effect. No horizontal scrollbar. Firefox shows thin lavender scrollbar.

**Step 3: Commit**

```bash
git add apps/monolith-hackathon/app/globals.css
git commit -m "style: custom scrollbar with lavender thumb, radiants-inspired inset effect"
```

---

### Task 9: Mobile Nav Refinement (Variation A)

**Files:**
- Modify: `apps/monolith-hackathon/app/globals.css:1616-1626` (mobile tab strip overrides)

**Step 1: Refine mobile tab strip for icon row**

Update the 768px media query section for `.modal-tab-strip`:

```css
@media screen and (max-width: 768px) {
  /* ... existing rules ... */

  .modal-tab-strip {
    order: 2;
    flex-wrap: nowrap;
    overflow-x: auto;
    justify-content: space-evenly;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;  /* hide scrollbar on mobile */
  }

  .modal-tab-strip::-webkit-scrollbar {
    display: none;
  }

  .modal-tab-icon {
    width: 2.25em;
    height: 2.25em;
    flex-shrink: 0;
  }

  .modal-tab-icon--active {
    border-color: var(--panel-accent-40);
    background: var(--panel-accent-08);
  }

  .modal-cta-footer {
    order: 3;
  }

  .modal-tab-tooltip {
    display: none;
  }
}
```

**Step 2: Verify in browser**

Check: Mobile shows a single horizontal row of 8 icons. Active icon has lavender border/glow. No labels. Row scrolls if needed on very small screens. Tab strip sits above CTA footer.

**Step 3: Commit**

```bash
git add apps/monolith-hackathon/app/globals.css
git commit -m "style: mobile nav icon row with lavender active state"
```

---

## Execution Order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Tasks 1-2 are foundational (all subsequent tasks use the token system and typography classes). Tasks 3-7 are content/feature changes. Tasks 8-9 are polish.
