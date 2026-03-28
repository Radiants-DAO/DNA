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



### 5. AboutApp has placeholder team names ("Founder", "Lead Developer"). Ship placeholder, fill in real data, or hide?

**Answer:** Need to fill in with real data. Also need to fill in the manifesto with the actual manifesto. 

### 6. RadiantsStudioApp — functional at launch or "preview"?

Pixel canvas is mouse-only (touch broken), NEXT button is a `console.log` stub, colors are hardcoded hex. Yeah we're gonna need to do a full refactor of the pixel art app. It's coming at launch as well. 

**Answer:** we’re going

### 7. Trash app works but is empty (no trashed apps exist). Ship it visible or hide it?

**Answer:**
Delete it
---

## Mobile

### 8. Is mobile a launch blocker or a fast-follow?

You said mobile is "very jank."

**Answer:**
Launch blocker. I need to clear out all of the mobile styles and breakpoints and sort of start from scratch. A lot of overrides that I don't want to mess with so I think clearing all the breakpoints is the best way to go. 
### 9. If mobile matters: Taskbar hidden, Start Menu unreachable on mobile.

Only way to switch apps is close one and tap another icon. Acceptable for v1 mobile or needs a nav solution? Probably come up with a new solution for this. Ideally it is very smooth and nice and tasty.. Probably use some sort of launcher at the bottom, similar to an app drawer. 

Here's an example scree 

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
For launch we'll just do local files but it would be nice to scope out the OAuth flow at some point so we can include that in the checklist. 

### 15. What's the minimum viable music library?

Currently 3 tracks, 1 channel. More local files? Curated playlists?

**Answer:**

A lot more but I have those already. Need some refactoring though because the buttons are wrong, to implement some sort of physical-looking button as if it was a tape deck or cd/record player. Unfortunately the widget mode is using the wrong styling as it gets unreadable widget mode. (It's got black text on a black background.) I would like to support both SoundCloud playlists and local files. 

---

## Motion & Loading

### 16. Is reduced-motion compliance a launch requirement?

Motion tokens exist but only 1 component uses them. Everything else uses hardcoded Tailwind durations — `prefers-reduced-motion` does nothing.

**Answer:**
This likely should come after the skill refactor as there are a lot of useful motion and UI/UX skills. Also my Claude skills are very very bad and organized poorly so there's likely an overarching large skill arc that needs to happen before we worry about motion tokens in the full overall motion refactor.

There's a lot of motion used all over the app that is not caught by the lint config. Some things should not be transitioning as they are in light mode; other ones are transitioning too slow or whatever else and that's a problem. I think it's going to be important to create skills and rules first and then worry about the actual implementation. 

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
We should likely come up with tests for components as well. Very important but there's a lot of component refactoring that still needs to be done. 

### 20. Two deleted components still exported and imported — ticking import bombs.

HelpPanel and MockStatesPopover are deleted but still referenced in core index and WindowTitleBar. Fix priority?

**Answer:**
We should fix this immediately. The help panel should be replaced with the side panel but we need to make sure that the side panel can open up inside of a window. This also needs to be possible with things like dialogs. Things like dialogs should be I have two tiers of priority:
1. App window priority: it opens up and covers up the app window.
2. Full screen priority: covers up the entire screen outside of the app window. This should apply to pretty much any component, like the sheet that also can do both. 

### 21. CountdownTimer type mismatch, Web3ActionBar meta types callbacks as strings. Fix now or defer?

**Answer:**

We can delete the web3 action bar and then we'll need to fix up the countdown timer. 

### 22. Any components you know are visually broken that code analysis wouldn't catch?

**Answer:**
**Button:**
• The button flat mode has no pressed or hover states. 
• Button has two competing disabled functions. There is the disabled state and then also a disabled prop. Prop has the correct styles to stable state; does not. 
• I do not like the focus outline. I would prefer to make a different sort of focus state if possible. At least something along the lines of a very strong drop shadow or something along those lines if that is possible. The current focus state is not my favorite looking thing. It feels like it violates the way the app looks. Ideally we figure out a different way to display focus state that is still good enough for accessibility.
• The active prop of the button has a very strange linear gradient on the border. 
• Pattern mode: currently its default state does not have a pattern; it's acting as if it is in quiet mode. Its rest state should have a pattern. Superstate currently makes the text and icon invisible. Rest state also has invisible text and icons. You'll need to add pattern lint rules and make sure that the patterns switch correctly on dark and light mode. Pattern colors should be inherited from their relative border color, with the exception of the pattern button. Globally patterns should match their parent’s border color. 
• I also don't know what the point of focusablewhendisabled is
• Needs a “transparent” option in tone.

**
ToggleGroup/Toggle**

• There seems to be inconsistent usage of the button patterns. 
• Togglegroup seems to only inherit the flat button style. 
• When it should probably cascade from toggle or from button (and be switchable)

Lightweight fix, just needs exploration

**Alerts**:
Don’t seem to have string/icon/heading/ props, and “closable” boolean may not be working. (Not sure, just need to double check)

**BADGE**
• Seems to be missing a string prop to fill the badge with text and/or icon. 

**TOAST**
• Should probably consume the alert stylings perfectly. Currently it is not. 


**TOOLTIP:**
• Compact variant. (Pixelcode font)
• Needs pixelated borders (if possible)

**Checkbox:**
Will have full visual refactor.

**Field, input, & fieldset**
• depreciated field/fieldset -> merged them into input and input set


**Pattern**
1. Display inside of the UI toolkit not working (squished + too many pattern options for tomglegroup, color should be like button’s color selector, not a string, same with bg (with transparency))
2. Needs better darkmode/lightmode adherence (inheriting/using border semantic variables by default is probably the best bet)

**Scrollarea**
1. Missing the styled scroll bar.
**Separator / Divider**
1. Seems redundant do have both

**Combobox**
1. Missing pixelated borders.
2. 

**Missing Components**
RadOS Components:
1. App window.
2. Toolbar
3. App window layouts: the content inside of each app window. There should be some pre-defined layouts that already exist for people to consume.
4. Start menu component.
5. Perhaps some other patterns as informed by Apple System 7 and other operating systems.
6. Widget component defaults, etc. 

**Tabs refactor plan exists but is not implemented**
/private/tmp/claude/tabs-refactor

Lots of bugs with tabs, and they’re going to be one of the MOST used ui pattens

**Numberfield**
Funky border stuff going on. The +/- buttons should only have borders on their inner edges. + is correct, - has a border on the left, not the right. +/- do not work correctly in dark mode (buttons are white on yellow)

**radio**
Will be refactored w/ checkbox. Both will more-closely match macOS system 7 styling

**select** 

Messy -> dropdown pops over on top, drop down has clipped border. Hover color on items is wrong in dark mode (cream on yellow, not readable)

**slider**
Extra border needs to be removed *is on the filled part)
Will need a few more modes/variants. (Fader, stepped with dots, etc)

**switch**
Janky in dark mode, competing colors
Background should change from ink off -> yellow on in both light and dark mode, should glow in dark mode when on, no glow when off. Needs cream thumb (white on hover/press) in both modes


Many components also use strings where they should be toggle groups or /booleans.  (e.g. any component’s “orientation” prop)

Finally:

All drop-down should have the same hover/interaction patterns (hover highlight/textcolor -> likely worth making them all consumers of the same “Dropdown” overlay -> menubar, navigation menu, )



---

## ESLint + Tooling

### 23. Auto-generation of token-map.mjs from CSS + component data.

"Nice to have" or "need before launch to prevent drift"?

**Answer:**
Need if feasible. 

### 24. No automated test run in CI. Is CI test coverage a launch requirement?

Only the design guard workflow runs.

**Answer:**
Not sure, need to explore. 

### 25. `no-clipped-shadow` and `no-pixel-border` rules have no test files. Concern?

**Answer:**
Likely important
---

## Documentation

### 26. rad-os/CLAUDE.md references deleted devtools, non-existent skills, wrong paths. Full rewrite or delete?

**Answer:**
Fixed. 

### 27. 2,631 stale session files (10MB) in ops/sessions/. Purge all, keep last 7 days, or leave?

**Answer:**
Probably need to mine them for potential RDNA skills, keep for now. 

### 28. Docs audit lists 6 brainstorms + 11 plans to delete, 8 to archive, 10 to update. Execute as-is or review first?

**Answer:**
Review first. Might be useful content here. 

### 29. Root CLAUDE.md says "9 apps" and "42 components" — both wrong. Quick fix or broader rewrite?

**Answer:**
Fixed already
---

## Skills

### 30. What skills do you want to exist?

Only 1 skill exists in-repo (rdna-reviewer). What's the vision — app scaffolding, code review, visual QA, deployment?

**Answer:**
All of the above, but, part of a global user-scoped skill audit after all of the rest of work is done. 

Will be moving all skill files to a new structure.

### 31. Many skills are in your user settings (~50+). Move some into repo, or is "skills library" about something else?

**Answer:**
They’ll be moved into a skills library first, then abstracted from there to the repo. 

---

## Architecture & Code Quality

### 32. Dual-localStorage bug: radioFavorites written by both persist middleware AND manual localStorage.

Will silently drift. Fix priority?

**Answer:**
Not super important but worth addressing. 

### 33. `data-start-button` click guard is broken.

Attribute doesn't exist on any element — clicking Start immediately closes menu via outside-click handler. How has this not been noticed? Is Start Menu used?

**Answer:**
Had gotten used to the pattern tbh, probably better to have it close if clicked outside/on other app or on the start button rather than inside the menu. 

### 34. Dead SunBackground.tsx in Rad_os/ (315 lines), superseded by WebGLSun.tsx. Delete?

**Answer:**
Probably, not sure which one is better. 

### 35. Zero test files in apps/rad-os/. Is RadOS test coverage a launch goal or post-launch?

**Answer:**
Not sure what tests are neccisary, worth exploring. 

### 36. store/index.ts:32 migrate type error is pre-existing. Fix or ignore?

**Answer:**
Probably fix. 
---

## Prioritization Framework

### 37. If you had to ship in 1 week, what are the 3 things that absolutely must work?

**Answer:**
Hard to say, need a map of the things from the list I provided, need to consolidate TODOs better. 

### 38. What's the thing that would most embarrass you if a user encountered it?

**Answer:**
Probably UI bugs, I’m a UI/UX and frontend guy. I want this to be pretty bulletproof. 

### 39. Is there anyone else working on this codebase, or is it just you + Claude Code?

**Answer:**

There will be 4 devs working on it after me, but just me + codex + claude code right now. I want it to be very clean for a handoff. 

### 40. Are there any external dependencies blocking you?

Assets from a designer, content from team, API keys, etc.

**Answer:**
Nope, just me and the things I want to do. /con
