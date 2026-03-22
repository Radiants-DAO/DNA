# Production Readiness Interview

Answer as tersely as you want — one-word answers are fine. Reference by number like `1: yes, 2: mobile later, 3b` etc.

---

## Ground Truth Summary

| Area | Key Finding |
|------|-------------|
| **Components** | 42 dirs, all have .tsx/.schema/.meta. 23 missing .dna.json. 20 have zero test coverage. |
| **Mobile** | Taskbar hidden w/ no replacement. Start Menu unreachable. Touch broken on canvas + audio seek. |
| **ESLint** | 14 rules, all implemented. token-map.mjs hand-maintained. No auto-gen from CSS. |
| **RadRadio** | 3 local MP3s, 1 channel. Zero SoundCloud code. Would need OAuth/iframe rework. |
| **Motion** | Tokens defined but almost never used. `prefers-reduced-motion` has no effect on most transitions. |
| **Loading** | No splash/boot screen. Only `<Suspense>` fallback with unstyled "Loading..." text. |
| **Apps** | 7 registered (not 9/10). LinksApp is a stub. BrandAssets has broken downloads. |
| **Docs** | rad-os/CLAUDE.md severely outdated. README missing 18 components. 2,631 stale session files. |
| **Skills** | Only 1 exists (rdna-reviewer). Works but prose is slightly misleading. |
| **Store** | 5 clean slices. Dual localStorage bug for favorites. Zero test files in rad-os. |
| **Architecture** | Dead SunBackground, unused useIsMobile, broken data-start-button guard, duplicated mobile detection. |

---

## Launch Definition

### 1. What is this launch?

Public marketing site? Internal demo? Community soft-launch? Full production?

**Answer:**

### 2. Is there a target date or is this "when it's ready"?

**Answer:**

### 3. Who is the primary audience at launch?

Crypto-native community members, general public, or internal stakeholders?

**Answer:**

---

## Scope Boundaries

### 4. LinksApp is a 17-line "Coming soon" stub. Ship it as-is, hide it, or implement it?

**Answer:**

### 5. AboutApp has placeholder team names ("Founder", "Lead Developer"). Ship placeholder, fill in real data, or hide?

**Answer:**

### 6. RadiantsStudioApp — functional at launch or "preview"?

Pixel canvas is mouse-only (touch broken), NEXT button is a `console.log` stub, colors are hardcoded hex.

**Answer:**

### 7. Trash app works but is empty (no trashed apps exist). Ship it visible or hide it?

**Answer:**

---

## Mobile

### 8. Is mobile a launch blocker or a fast-follow?

You said mobile is "very jank."

**Answer:**

### 9. If mobile matters: Taskbar hidden, Start Menu unreachable on mobile.

Only way to switch apps is close one and tap another icon. Acceptable for v1 mobile or needs a nav solution?

**Answer:**

### 10. Touch is broken on: pixel art canvas, audio seek bar, click-outside-to-close.

Fix all, fix critical ones only, or defer?

**Answer:**

---

## Brand Assets

### 11. BrandAssets download paths are broken.

PNG subdirectory doesn't exist, filenames don't match code, both font download URLs point to a "Bonkathon Wordmark" Dropbox ZIP (wrong asset). Are the actual asset files available, or does this need asset production work?

**Answer:**

### 12. Semantic token hex values in Color Palette are hardcoded strings.

If tokens change, the showcase drifts silently. Fix now or accept manual sync?

**Answer:**

### 13. AI Toolkit tab has 2 Midjourney sref codes.

Final content, placeholder for more, or should it become interactive?

**Answer:**

---

## Music Player

### 14. SoundCloud still the direction?

Integration would require OAuth flow + backend proxy or iframe Widget API (loses UI control). Or is a different source (local files + more tracks, different streaming API) more realistic for launch?

**Answer:**

### 15. What's the minimum viable music library?

Currently 3 tracks, 1 channel. More local files? Curated playlists?

**Answer:**

---

## Motion & Loading

### 16. Is reduced-motion compliance a launch requirement?

Motion tokens exist but only 1 component uses them. Everything else uses hardcoded Tailwind durations — `prefers-reduced-motion` does nothing.

**Answer:**

### 17. Do you want an OS-style boot sequence?

No boot/splash screen exists. App loads straight to desktop.

**Answer:**

### 18. Dithered animations/gradients — what's the scope?

Component library feature (patterns any app can use), background effect, or something else?

**Answer:**

---

## Components

### 19. How important is component-level testing for launch?

20 of 42 components have zero test coverage. 23 missing .dna.json.

**Answer:**

### 20. Two deleted components still exported and imported — ticking import bombs.

HelpPanel and MockStatesPopover are deleted but still referenced in core index and WindowTitleBar. Fix priority?

**Answer:**

### 21. CountdownTimer type mismatch, Web3ActionBar meta types callbacks as strings. Fix now or defer?

**Answer:**

### 22. Any components you know are visually broken that code analysis wouldn't catch?

**Answer:**

---

## ESLint + Tooling

### 23. Auto-generation of token-map.mjs from CSS + component data.

"Nice to have" or "need before launch to prevent drift"?

**Answer:**

### 24. No automated test run in CI. Is CI test coverage a launch requirement?

Only the design guard workflow runs.

**Answer:**

### 25. `no-clipped-shadow` and `no-pixel-border` rules have no test files. Concern?

**Answer:**

---

## Documentation

### 26. rad-os/CLAUDE.md references deleted devtools, non-existent skills, wrong paths. Full rewrite or delete?

**Answer:**

### 27. 2,631 stale session files (10MB) in ops/sessions/. Purge all, keep last 7 days, or leave?

**Answer:**

### 28. Docs audit lists 6 brainstorms + 11 plans to delete, 8 to archive, 10 to update. Execute as-is or review first?

**Answer:**

### 29. Root CLAUDE.md says "9 apps" and "42 components" — both wrong. Quick fix or broader rewrite?

**Answer:**

---

## Skills

### 30. What skills do you want to exist?

Only 1 skill exists in-repo (rdna-reviewer). What's the vision — app scaffolding, code review, visual QA, deployment?

**Answer:**

### 31. Many skills are in your user settings (~50+). Move some into repo, or is "skills library" about something else?

**Answer:**

---

## Architecture & Code Quality

### 32. Dual-localStorage bug: radioFavorites written by both persist middleware AND manual localStorage.

Will silently drift. Fix priority?

**Answer:**

### 33. `data-start-button` click guard is broken.

Attribute doesn't exist on any element — clicking Start immediately closes menu via outside-click handler. How has this not been noticed? Is Start Menu used?

**Answer:**

### 34. Dead SunBackground.tsx in Rad_os/ (315 lines), superseded by WebGLSun.tsx. Delete?

**Answer:**

### 35. Zero test files in apps/rad-os/. Is RadOS test coverage a launch goal or post-launch?

**Answer:**

### 36. store/index.ts:32 migrate type error is pre-existing. Fix or ignore?

**Answer:**

---

## Prioritization Framework

### 37. If you had to ship in 1 week, what are the 3 things that absolutely must work?

**Answer:**

### 38. What's the thing that would most embarrass you if a user encountered it?

**Answer:**

### 39. Is there anyone else working on this codebase, or is it just you + Claude Code?

**Answer:**

### 40. Are there any external dependencies blocking you?

Assets from a designer, content from team, API keys, etc.

**Answer:**
