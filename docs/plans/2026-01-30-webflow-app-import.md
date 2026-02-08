# Webflow Style Import — Layout & Polish Pass

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import the layout quality, typography hierarchy, and visual polish from the old Webflow hackathon site into the current monolith-hackathon. Add judge PFPs, persistent CTA buttons on the modal, and make "Begin" open a Quickstart.exe window.

**Architecture:** All changes are CSS + InfoWindow.tsx content/renderers. No new components. The InfoWindow stays as the single modal overlay on the monolith door. We upgrade renderers to match the old site's visual richness while keeping the current vertical-tab layout.

**Tech Stack:** CSS (globals.css), React (InfoWindow.tsx, page.tsx)

---

## Reference: Old Site Layout Patterns

The old Webflow site had visual polish the current version lacks:

- **Judges:** Cards with PFP images, org nameplate badge at bottom, hover state, flex-wrap grid layout
- **Content sections:** `content_wrap` with radial gradient bg, generous padding (3em top, 4em sides), max-height 50dvh with scrolling
- **Headings:** Section headers with icon + bold label + h2, separated by taskbar line
- **Typography:** Clear hierarchy — h2 (3em, bold, uppercase, text-stroke), h3 (bold), body (PP Mori)
- **Buttons:** "View Winners", "Discord", and "Copy Link" in the taskbar; "Learn More" CTAs in content
- **Spacing:** Em-based throughout, generous gaps (1-2em between sections)

---

### Task 1: "Begin" Opens Quickstart.exe Instead of External Link

**Files:**
- Modify: `apps/monolith-hackathon/app/page.tsx` (~line 190)
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`

**Step 1: Add `quickstart` content to InfoWindow CONTENT**

Add a new `quickstart` entry at the top of the `CONTENT` object. This is the "most necessary information" — a condensed overview:

```typescript
quickstart: {
  type: 'sections',
  title: 'QUICKSTART.exe',
  sections: [
    {
      heading: 'What',
      body: 'A 5-week sprint to build a mobile app for the Solana dApp Store. $175,000 in prizes — 10 winners at $10k each, 5 honorable mentions at $5k, plus a $10k SKR bonus track.',
    },
    {
      heading: 'When',
      body: 'Feb 2 — Mar 9, 2026. Submissions due end of week 5. Results announced week 6.',
    },
    {
      heading: 'Requirements',
      body: 'A functional Android APK, a GitHub repo, a demo video, and a pitch deck. Must integrate Solana Mobile Stack. Publishing on dApp Store required to claim prize (winners given reasonable timeframe).',
    },
    {
      heading: 'Register',
      body: 'Visit Align to create a profile and sign up for the Solana Mobile Hackathon.',
    },
  ],
},
```

**Step 2: Change "Begin" from `<a>` to `<button>` that opens quickstart**

In `page.tsx`, change the Begin link (~line 190-214) from an `<a href="...">` to a `<button>` that calls `handleOrbitalSelect('quickstart')`.

```tsx
<button
  onClick={() => handleOrbitalSelect('quickstart')}
  className={`button_mono hero-bottom${hasExpanded ? ' was-expanded' : ''}`}
>
  Begin
  {/* keep the existing SVG line + arrow */}
</button>
```

**Step 3: Verify Begin opens Quickstart.exe overlay**

Click Begin, confirm the modal opens with Quickstart content on the door.

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/app/page.tsx apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "feat(hackathon): Begin button opens Quickstart.exe modal"
```

---

### Task 2: Add 2 Persistent CTA Buttons to Modal Footer

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx` (~line 492-535)
- Modify: `apps/monolith-hackathon/app/globals.css`

**Step 1: Add footer with 2 CTA buttons to InfoWindow render**

After the `<div className="app_contents">` block and before the `modal-tab-strip`, add a sticky footer:

```tsx
{/* Persistent CTA footer */}
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
```

**Step 2: Add CSS for modal-cta-footer**

```css
/* Modal CTA Footer — persistent at bottom of overlay */
.modal-cta-footer {
  display: flex;
  gap: 0.5em;
  padding: 0.5em 0.75em;
  border-top: 1px solid rgba(253, 143, 58, 0.15);
  background: rgba(1, 1, 1, 0.95);
  flex-shrink: 0;
}

.modal-cta-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5em 0.75em;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 0.25em;
  border: 1px solid var(--black);
  cursor: pointer;
  transition: background-color 0.2s var(--ease-drift), transform 0.2s var(--ease-drift), box-shadow 0.2s var(--ease-drift);
}

.modal-cta-primary {
  background: linear-gradient(270deg, var(--ultraviolet), var(--magma));
  color: var(--white);
  box-shadow: 0 2px 0 0 var(--black);
}

.modal-cta-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 1em var(--magma), 0 3px 0 0 var(--black);
}

.modal-cta-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--white);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 0 0 var(--black);
}

.modal-cta-secondary:hover {
  background: rgba(105, 57, 202, 0.3);
  border-color: var(--ultraviolet);
  transform: translateY(-1px);
}
```

**Step 3: Verify footer renders at bottom of every content view**

Open several windows, confirm the Register + Discord buttons persist at the bottom.

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx apps/monolith-hackathon/app/globals.css
git commit -m "feat(hackathon): add persistent Register + Discord CTAs to modal footer"
```

---

### Task 3: Judge PFPs and Card Layout

**Files:**
- Copy images: from old `images/` to `apps/monolith-hackathon/public/assets/judges/`
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx` — judges type + renderer
- Modify: `apps/monolith-hackathon/app/globals.css`

**Step 1: Copy judge PFP images**

```bash
mkdir -p apps/monolith-hackathon/public/assets/judges
cp "/Users/rivermassey/Desktop/dev/_webflow-archive/Solana Mobile Hackathon 1/images/Toly-Profile-Picture_1Toly Profile Picture.avif" apps/monolith-hackathon/public/assets/judges/toly.avif
cp "/Users/rivermassey/Desktop/dev/_webflow-archive/Solana Mobile Hackathon 1/images/mert_1mert.avif" apps/monolith-hackathon/public/assets/judges/mert.avif
cp "/Users/rivermassey/Desktop/dev/_webflow-archive/Solana Mobile Hackathon 1/images/emmet_1emmet.avif" apps/monolith-hackathon/public/assets/judges/emmett.avif
cp "/Users/rivermassey/Desktop/dev/_webflow-archive/Solana Mobile Hackathon 1/images/ben_1ben.avif" apps/monolith-hackathon/public/assets/judges/ben.avif
cp "/Users/rivermassey/Desktop/dev/_webflow-archive/Solana Mobile Hackathon 1/images/mike_1mike.avif" apps/monolith-hackathon/public/assets/judges/mike.avif
cp "/Users/rivermassey/Desktop/dev/_webflow-archive/Solana Mobile Hackathon 1/images/chase_1chase.avif" apps/monolith-hackathon/public/assets/judges/chase.avif
```

**Step 2: Add `image` field to judges type**

In the `WindowContent` type union, update the judges variant:

```typescript
| { type: 'judges'; title: string; judges: { name: string; role: string; org: string; twitter?: string; image?: string }[] }
```

**Step 3: Add `image` paths to judges data**

```typescript
judges: [
  { name: 'Toly', role: 'Phone Salesman', org: 'Solana Labs', twitter: 'aeyakovenko', image: '/assets/judges/toly.avif' },
  { name: 'Emmett', role: 'General Manager', org: 'Solana Mobile', twitter: 'm_it', image: '/assets/judges/emmett.avif' },
  { name: 'Mert', role: 'Shitposter', org: 'Helius', twitter: '0xMert_', image: '/assets/judges/mert.avif' },
  { name: 'Mike', role: 'Developer Relations', org: 'Solana Mobile', twitter: 'somemobiledev', image: '/assets/judges/mike.avif' },
  { name: 'Chase', role: 'Based Snarker', org: 'Solana Mobile', twitter: 'therealchaseeb', image: '/assets/judges/chase.avif' },
  { name: 'Ben', role: 'Biz Dev', org: 'Solana Mobile', twitter: 'bennybitcoins', image: '/assets/judges/ben.avif' },
],
```

Note: roles updated to match the old site's personality (e.g., "Phone Salesman", "Shitposter", "Based Snarker"). Drop "Akshay" — not in old site. Add "Ben" from old site.

**Step 4: Update `renderJudges` with card layout + PFP**

Replace the current `renderJudges` function:

```tsx
function renderJudges(
  data: Extract<WindowContent, { type: 'judges' }>,
  revealed: number,
) {
  return (
    <div className="judges-grid">
      {data.judges.map((judge, i) => {
        if (revealed < i + 2) return null;
        return (
          <a
            key={i}
            href={judge.twitter ? `https://x.com/${judge.twitter}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="judge-card-v2"
          >
            {judge.image && (
              <img src={judge.image} alt={judge.name} className="judge-pfp" />
            )}
            <div className="judge-name-v2">
              <ScrambleText text={judge.name} speed={0.7} />
            </div>
            <div className="judge-role">
              <ScrambleText text={judge.role} speed={0.5} />
            </div>
            <div className="judge-nameplate">
              {judge.org}
            </div>
          </a>
        );
      })}
    </div>
  );
}
```

**Step 5: Add CSS for new judge cards (matching old site's layout)**

```css
/* Judge Grid — flex wrap, matching old site's card layout */
.judges-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  justify-content: center;
  padding: 0.5em 0;
}

.judge-card-v2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 7em;
  padding: 0.5em 0.5em 1.75em;
  border: 1px solid rgba(253, 143, 58, 0.15);
  border-radius: 0.5em;
  background: rgba(1, 1, 1, 0.4);
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s var(--ease-drift), box-shadow 0.2s var(--ease-drift);
}

.judge-card-v2:hover {
  background: rgba(20, 241, 178, 0.1);
  box-shadow: inset 0 0 2em rgba(20, 241, 178, 0.05);
}

.judge-pfp {
  width: 5em;
  height: 5em;
  object-fit: cover;
  border-radius: 0.375em;
  margin-bottom: 0.4em;
  image-rendering: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.judge-name-v2 {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.875rem;
  color: #fd8f3a;
  text-transform: uppercase;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
}

.judge-role {
  font-family: 'Mondwest', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.15em;
}

.judge-nameplate {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--black);
  color: var(--white);
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 2;
  text-align: center;
}
```

**Step 6: Remove old judge-card CSS**

Delete the old `.judge-card`, `.judge-name`, `.judge-title`, `.judge-link` styles from globals.css (lines ~1249-1283) since we're replacing them.

**Step 7: Verify judges render with PFPs in grid layout**

Open Judges window, confirm 6 cards with images, hover effects, clickable to Twitter.

**Step 8: Commit**

```bash
git add apps/monolith-hackathon/public/assets/judges/ apps/monolith-hackathon/app/components/InfoWindow.tsx apps/monolith-hackathon/app/globals.css
git commit -m "feat(hackathon): judge cards with PFPs, grid layout, org nameplates"
```

---

### Task 4: Typography & Content Layout Polish

**Files:**
- Modify: `apps/monolith-hackathon/app/globals.css`

This task improves the overall text styling to match the old site's polish. The current modal content is fairly flat — everything looks the same weight.

**Step 1: Improve `.timeline-entry-header` — make headings pop more**

```css
.timeline-entry-header {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.875rem;
  color: #fd8f3a;
  margin-bottom: 0.3em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
}
```

**Step 2: Improve `.timeline-entry-body` — use PP Mori for readability**

```css
.timeline-entry-body {
  font-family: 'PP Mori', 'Mondwest', sans-serif;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.55;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);
}
```

**Step 3: Improve `.timeline-entry` — refine border + spacing**

```css
.timeline-entry {
  padding: 0.6em 0.75em;
  border-left: 2px solid rgba(253, 143, 58, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: border-left-color 0.2s var(--ease-drift);
}

.timeline-entry:hover {
  border-left-color: #fd8f3a;
}
```

**Step 4: Improve `.app_contents` padding inside the door overlay**

```css
.door-info-overlay .app_contents {
  flex: 1;
  overflow-y: auto;
  padding: 1em 1.25em;
}
```

**Step 5: Improve prize tier styling**

```css
.prize-amount {
  font-family: 'Mondwest', sans-serif;
  font-size: 1.25rem;
  color: #fd8f3a;
  text-shadow: 0 0 0.5em rgba(253, 143, 58, 0.3);
}

.prize-label {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.15em;
}

.prize-description {
  font-family: 'PP Mori', 'Mondwest', sans-serif;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 0.3em;
  line-height: 1.5;
}
```

**Step 6: Improve accordion trigger styling**

```css
.crt-accordion-trigger {
  /* ... existing ... */
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
}

.crt-accordion-content {
  padding: 0 0.8em 0.8em;
  font-family: 'PP Mori', 'Mondwest', sans-serif;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.85);
}
```

**Step 7: Improve tab trigger styling**

```css
.crt-tab-trigger {
  font-size: 0.75rem;
}
```

**Step 8: Verify all content windows look polished**

Open each window type: entries (timeline/calendar), sections (rules), tabs (toolbox/legal), accordion (faq), judges, prizes. Check typography hierarchy reads well.

**Step 9: Commit**

```bash
git add apps/monolith-hackathon/app/globals.css
git commit -m "style(hackathon): typography and content layout polish pass"
```

---

### Task 5: Taskbar Polish

**Files:**
- Modify: `apps/monolith-hackathon/app/globals.css`

The old site's taskbar had more visual weight. Match it.

**Step 1: Refine taskbar styles**

```css
.door-info-overlay .taskbar_wrap {
  padding: 0.35em 0.75em;
  border-bottom: 1px solid rgba(253, 143, 58, 0.2);
  background: rgba(1, 1, 1, 0.6);
}

.taskbar_text {
  font-size: 0.8125rem;
  line-height: 1;
  white-space: nowrap;
  color: var(--white);
  font-family: 'Pixeloid Mono', monospace;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.taskbar_line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(253, 143, 58, 0.2), transparent);
}
```

**Step 2: Verify taskbar styling**

Open any window, confirm taskbar looks clean with gradient line separator.

**Step 3: Commit**

```bash
git add apps/monolith-hackathon/app/globals.css
git commit -m "style(hackathon): taskbar polish with gradient lines"
```

---

### Task 6: Visual Verification Pass

**Step 1: Desktop verification**

Open all windows at desktop size. Check:
- [ ] Quickstart opens from Begin button
- [ ] CTA footer persists across all tabs
- [ ] Judge cards have PFPs in grid
- [ ] Typography hierarchy is clear (headers amber, body lighter, org badges dark)
- [ ] Taskbar looks polished
- [ ] Tab strip navigation works
- [ ] Accordion + tabs components look correct

**Step 2: Mobile verification**

Resize to mobile. Check:
- [ ] Modal content scrolls
- [ ] CTA footer visible
- [ ] Judge grid wraps appropriately
- [ ] Text sizes reasonable

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix(hackathon): visual polish cleanup"
```

---

## Summary

| Task | What |
|------|------|
| 1 | Begin → Quickstart.exe modal |
| 2 | Persistent Register + Discord CTAs at modal bottom |
| 3 | Judge PFPs, card grid, org nameplates (copy images from old site) |
| 4 | Typography pass — PP Mori body, sizing, spacing, hover states |
| 5 | Taskbar polish — gradient lines, font sizing |
| 6 | Visual verification |

**Key files touched:**
- `InfoWindow.tsx` — quickstart content, CTA footer, judge renderer
- `page.tsx` — Begin button change
- `globals.css` — all style changes
- `public/assets/judges/` — 6 PFP images copied from old site
