# Monolith Hackathon Redesign Brainstorm

**Date:** 2026-01-31
**Status:** Decided

## What We're Building

Typography, content, and mobile nav overhaul for the monolith-hackathon site. Replacing orange/amber accent with soft lavender (#b494f7) **inside panels only** (icons/glow/orbital keep existing colors). Establishing proper information hierarchy, restructuring content panels, porting the webflow calendar, adding a custom scrollbar, and designing 5 mobile nav variations.

## Key Decisions

- **Accent color**: `#b494f7` (soft lavender) replaces `#fd8f3a` (orange) **in panels only** — headers, borders, panel chrome. Icons, orbital glow, and external elements keep their existing colors.
- **Scramble text**: Headers animate with scramble, body text renders static for instant readability
- **HACKATHON.EXE**: Renamed from quickstart, absorbs old quickstart content, becomes default panel opened by "Get Started"
- **Prize amount**: $125k+ (not $175k)
- **Results**: Early April (not week 6)
- **"Get Started"**: Replaces "Begin", larger and more prominent
- **Evaluation criteria**: 4 categories at 25% each, displayed as visual cards with percentage badges
- **Hide CTAs**: Rules panel hides Register/Discord footer
- **Calendar**: Port webflow calendar grid layout, merge timeline data into it
- **Timeline panel**: Removed as separate panel, data merged into calendar
- **Custom scrollbar**: Inspired by radiants theme (wide track, thin thumb, background SVG pattern, inset border)
- **Mobile nav**: 5 variations to choose from

## Content Restructuring

### 1. HACKATHON.EXE (primary panel, replaces quickstart + absorbs old quickstart)
- Scramble headers, static body text
- Sections: What / When / What to Submit / Prizes at a Glance
- Feel: program launcher README, scannable at a glance
- Key stats pulled out as display elements (e.g., "$125k+" large, "5 WEEKS" large, "FEB 2 — MAR 9" large)
- Results announced early April

### 2. CALENDAR.exe (port webflow calendar + absorb timeline)
Port the webflow calendar grid layout:
- Tabbed by week (Week 1, Week 2, etc.) with theme labels ("Kickoff", "Flow State", etc.)
- Each week is a grid of day cards (flex row on desktop, stacked on mobile)
- Day cards: day name, date number, event title (bold), time
- Event days get a highlighted background (lavender tint instead of webflow's green)
- Non-event days show "No Events"
- Merge timeline milestone data as events within the appropriate weeks

**Webflow calendar structure (to port):**
- `.calendar-desktop.week` — flex container with border, holds day cards
- `.calendar-icon` — 9em x 9em day card with border-left, flex column
- `.calendar-icon.event` — highlighted background for event days
- Responsive: grid layout on tablet (4-col), stacked on mobile

### 3. RULES.exe — Evaluation Criteria Section
4 categories, 25% each, displayed as cards (inspired by reference image):
- **Stickiness & PMF | 25%** — How well does your app resonate with the Seeker community? Does it create habits and drive daily engagement?
- **User Experience | 25%** — Is the app intuitive, polished, and enjoyable to use?
- **Innovation / X-factor | 25%** — How novel and creative is the idea? Does it stand out from existing products?
- **Presentation & Demo Quality | 25%** — How clearly did the team communicate their idea? Does the demo effectively showcase the core concept?
- Hide CTA footer on this panel

### 4. Remove "timeline" as separate panel
- Timeline orbital icon slot repurposed or removed
- All timeline data merged into calendar weeks

## Custom Scrollbar

Inspired by radiants theme scrollbar (`packages/radiants/base.css`):
- Wide invisible container (1.75rem) for padding effect
- Thin visible thumb with `background-clip: padding-box` for inset look
- Thumb color: lavender (#b494f7) with 1px black inset border
- Thumb hover: brighter lavender
- Track: subtle pattern or transparent
- Hide horizontal scrollbar
- Firefox fallback: `scrollbar-width: thin; scrollbar-color`

## Typography Hierarchy

### Font Assignments (panel content only)
| Level | Font | Size | Weight | Color | Transform | Notes |
|-------|------|------|--------|-------|-----------|-------|
| Display stat (money) | Mondwest | 2rem | 400 | #b494f7 | none | tabular-nums, text-wrap: balance |
| Display stat (date/duration) | Mondwest | 1.5rem | 400 | rgba(255,255,255,0.9) | none | Secondary tier, white not lavender |
| Section heading | Pixeloid Mono | 1rem | 700 | #b494f7 | uppercase | Scramble animated, staggered 80ms |
| Subsection heading | Pixeloid Sans | 0.875rem | 700 | rgba(255,255,255,0.9) | uppercase | |
| Body text | PP Mori | 0.8125rem | 400 | rgba(255,255,255,0.85) | none | Static (no scramble) |
| Label/caption | Pixeloid Mono | 0.75rem | 400 | rgba(180,148,247,0.65) | uppercase | Bumped from 0.6875/0.6 for AA compliance |
| Muted/secondary | PP Mori | 0.75rem | 400 | rgba(255,255,255,0.55) | none | Bumped from 0.5 for readability |

### Contrast Ratios (verified against rgba(1,1,1,0.92) bg)
- Display #b494f7: ~6.8:1 (AAA)
- Body rgba(255,255,255,0.85): ~13:1 (AAA)
- Label rgba(180,148,247,0.65): ~4.6:1 (AA normal text)
- Muted rgba(255,255,255,0.55): ~5.8:1 (AA)

### Pixel Font Rendering
- Pixel fonts (Pixeloid Mono/Sans): `text-rendering: optimizeSpeed` to preserve crispness
- Body font (PP Mori): default rendering

### Spacing Scale
- Between major sections: 1.5em
- Between heading and body: 0.625em (bumped from 0.5em)
- Between body paragraphs: 0.75em
- Panel padding: 1em 1.25em
- Entry padding: 0.75em 1em

### Color Token System (scoped to panels via CSS custom properties)
```css
.door-info-overlay {
  --panel-accent: #b494f7;
  --panel-accent-65: rgba(180, 148, 247, 0.65);
  --panel-accent-40: rgba(180, 148, 247, 0.4);
  --panel-accent-30: rgba(180, 148, 247, 0.3);
  --panel-accent-20: rgba(180, 148, 247, 0.2);
  --panel-accent-15: rgba(180, 148, 247, 0.15);
  --panel-accent-08: rgba(180, 148, 247, 0.08);
}
```

### Color Replacements (panels only, using tokens)
| Element | Old | New |
|---------|-----|-----|
| Entry headers | #fd8f3a | var(--panel-accent) |
| Border-left accent | rgba(253,143,58,0.4) | var(--panel-accent-40) |
| Border hover | #fd8f3a | var(--panel-accent) |
| Panel border | rgba(253,143,58,0.15) | var(--panel-accent-15) |
| Panel glow | rgba(253,143,58,0.08) | var(--panel-accent-08) |
| Taskbar border-bottom | rgba(253,143,58,0.2) | var(--panel-accent-20) |
| Tab active bg | rgba(253,143,58,0.3) | var(--panel-accent-30) |
| Tab active border | rgba(253,143,58,0.3) | var(--panel-accent-30) |
| Prize amount | #fd8f3a | var(--panel-accent) |
| Prize glow | rgba(253,143,58,0.3) | var(--panel-accent-30) |
| CTA primary gradient | ultraviolet->magma | **KEEP magma->ultraviolet** (CTAs are actions, not chrome) |

**Keep unchanged:** orbital icon glows, external link colors, mute button, CTA buttons (keep magma/ultraviolet energy)

## Mobile Nav — 5 Variations

### Variation A: Icon Row (no labels)
Single horizontal row of 8 icons, edge-to-edge. Active icon has lavender glow border. Minimal height (~3em). Scrollable if needed on very small screens.
```
[ clock | rules | prize | judge | tools | faq | cal | docs ]
```
**Pro:** Compact, maximum content space. **Con:** Requires icon recognition.

### Variation B: Icon + Label Grid (2x4)
Two rows of 4, each icon with a tiny label below. Fixed height (~6em). All items visible at once. Active item has filled background.
```
[ 🕐         📜         🏆        👨‍⚖️     ]
[ Hackathon  Rules     Prizes    Judges  ]
[ 🔧         ❓         📅        📄      ]
[ Toolbox    FAQ      Calendar   Legal   ]
```
**Pro:** Clear labels, all visible. **Con:** Takes more vertical space.

### Variation C: Pill Tabs (scrollable)
Horizontal scrollable row of pill-shaped tabs with icon + label. Active pill is filled lavender. Compact single row.
```
[ (🕐) Hackathon | (📜) Rules | (🏆) Prizes | ... → ]
```
**Pro:** Labels + compact. **Con:** Not all visible, requires scrolling.

### Variation D: Collapsed Drawer
Single "menu" button at bottom-right. Tap to expand a vertical drawer/overlay listing all 8 items with icons + labels. Overlay dismisses on selection. Maximum content space when closed.
```
Bottom-right: [ ☰ ] → expands to full list overlay
```
**Pro:** Maximum content space. **Con:** Extra tap to navigate.

### Variation E: Segmented Top Bar
Tab strip moves to top of the modal (below taskbar), horizontal scroll with text labels only (no icons). Active tab underlined with lavender. Similar to browser tabs.
```
| HACKATHON | RULES | PRIZES | JUDGES | TOOLBOX | FAQ | ... → |
```
**Pro:** Familiar pattern, labels clear. **Con:** No icons, needs scroll.

## Skill Review Refinements

### From /web-interface-guidelines:
- Caption text bumped to 0.75rem @ 0.65 opacity (was 0.6875rem @ 0.6) for AA compliance
- Heading-to-body spacing bumped to 0.625em (was 0.5em)
- Add `font-variant-numeric: tabular-nums` on all number displays
- Add `text-wrap: balance` on display stats and section headings
- Pixel fonts need `text-rendering: optimizeSpeed`

### From /attention-management:
- Two-tier display stats: money ($125k+) at 2rem lavender, dates/durations at 1.5rem white
- Evaluation criteria: category name is primary (bold, larger), percentage as secondary badge
- Scramble animation staggered by importance (title first, then sections with 80ms delay)
- **Recommended mobile nav: Variation A (icon row)** — minimal height preserves content focus, subtle lavender dot/underline for active state instead of full glow

### From /design-system-patterns:
- Use scoped CSS custom properties (--panel-accent system) instead of hardcoded hex
- Keep CTA gradient as magma->ultraviolet — CTAs are actions, not panel chrome
- Panel accent tokens scoped to .door-info-overlay for clean separation

## Research Notes

- **Radiants theme**: Joystix (heading) + Mondwest (body), opacity modifiers (70%, 60%), generous spacing (space-y-4). Custom scrollbar: 1.75rem wide track, thin thumb with background-clip padding-box, inset box-shadow, SVG background pattern on track.
- **Old webflow site**: 3em h2 headings, green (#14f1b2) accent labels, uppercase category tags above headings, 4em padding. Calendar uses flex grid of 9em day cards with event highlighting. No custom scrollbar.
- **Both**: Pixel font for UI chrome, different font for body. Size range much wider than current monolith (0.75–3em vs 0.75–0.875rem).
- **Reference images**: RevenueCat uses clean section headers with horizontal rules, bold labels + description. Gemini criteria uses "Category | XX%" bold headers with body description below.
