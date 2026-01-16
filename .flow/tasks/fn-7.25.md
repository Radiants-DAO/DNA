# fn-7.25 Window Chrome Fixes - Traffic lights, drag region, rounded corners

## Description
Fix macOS window chrome issues reported during testing:

**Issues:**
1. Traffic lights (close/minimize/fullscreen) not appearing despite `titleBarStyle: Overlay` config
2. Window drag region not working despite `data-tauri-drag-region` attribute
3. Window lacks rounded corners (macOS design convention)

**Investigation needed:**
- Verify `tauri.conf.json` has correct settings for macOS traffic lights
- Check if `data-tauri-drag-region` is on the correct element and not blocked
- Add window corner radius via Tauri config or CSS

## Acceptance
- [ ] Traffic lights (close/minimize/fullscreen) visible in top-left corner
- [ ] Window draggable from title bar area
- [ ] Window has rounded corners matching macOS style (~10px radius)
- [ ] Works on macOS (primary target)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
