# fn-2.11 Preview Mode and keyboard shortcuts

## Description

Implement Preview Mode and finalize all keyboard shortcuts.

## Technical Details

1. **Preview mode**
   - Toggle hides all DevTools UI
   - Page renders clean (no overlays, no panels)
   - Keyboard shortcut still active for exit

2. **Keyboard shortcuts (summary)**
   | Shortcut | Action |
   |----------|--------|
   | V | Component ID mode |
   | T | Text Edit mode |
   | P | Preview mode |
   | Escape | Exit current mode |
   | Cmd+C | Copy selection |
   | Cmd+Z | Undo |
   | Cmd+Shift+Z | Redo |

3. **Implementation**
   - Use keyboard event listeners
   - Store current mode in Zustand
   - Only one mode active at a time
   - Mode indicator in toolbar

4. **Toolbar**
   - Mode toggle buttons
   - Visual indicator of active mode
   - Preview mode hides toolbar too

## References

- Feature spec: `/docs/features/06-tools-and-modes.md:292-306`
- Shortcuts table: `/docs/features/06-tools-and-modes.md:398-409`
## Acceptance
- [ ] P key toggles Preview mode
- [ ] Preview mode hides all DevTools UI
- [ ] Escape exits Preview mode
- [ ] All keyboard shortcuts documented and working
- [ ] Mode indicator shows current mode
- [ ] Only one mode active at a time
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
