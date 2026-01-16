# MVP v1 First Experience Feedback

Date: 2026-01-15
Tester: River
Build: fn-2 complete (Ralph run)

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Text Edit Mode | ✅ Works | "appears to work perfectly" |
| Component ID Mode | ⚠️ Partial | Only shows "app/tsx" regardless of hover target |
| Preview Mode | ⚠️ Unstable | Works but sometimes crashes |
| Properties Panel | ✅ Exists | Tab exists, needs integration testing |
| App Launch | ❌ Unreliable | White screen, crashes on dogfood |

## Issues to Fix

### P0 - Critical

**1. Unreliable Launch**
- Symptom: App often opens with white screen
- Frequency: Regular
- Impact: Blocks all testing

**2. Dogfooding Crashes**
- Symptom: Loading radflow-tauri as target project causes crash
- Frequency: "crashed once, worked once, regularly white screen"
- Possible cause: Large codebase, recursive loading, or Rust panic

### P1 - High

**3. Component ID Mode - Wrong Component Detection**
- Symptom: Always shows "app/tsx" no matter where hovered
- Expected: Should show actual component name + file:line
- Likely cause: Component index not being built, or hover detection not mapping to index

**4. Preview Mode Crashes**
- Symptom: Sometimes crashes when entering/using preview mode
- Needs: Error logging, crash report

## What Works

- ✅ Project Picker UI
- ✅ Text Edit Mode (contentEditable, clipboard)
- ✅ Properties Panel exists as tab
- ✅ Keyboard shortcuts (V, T, P, Escape)
- ✅ Mode toolbar visible

## Next Steps

1. Add error boundary + crash logging
2. Debug Component ID mode index building
3. Investigate white screen on launch (check Vite HMR + Tauri webview)
4. Test with smaller projects first (not dogfood)
5. Add Rust-side panic hooks for better error reporting
