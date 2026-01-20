# fn-1-z7k.2 Add Dogfood Mode toggle to TitleBar

## Description
Add a toggle switch in the TitleBar (right section) to enable/disable Dogfood Mode.

**Files to modify**:
- `src/components/layout/TitleBar.tsx` - Add toggle in right section

**Design**:
- Position: Right section, before any clipboard indicators
- Style: Small toggle switch or icon button (match existing UI patterns)
- Label: "Dogfood" or dog bone icon with tooltip "Enable commenting on RadFlow UI"
- Visual state: Highlighted/accent when ON

**Behavior**:
- Calls `setDogfoodMode(enabled)` from store
- Hidden when `import.meta.env.PROD` is true (Vite/Tauri standard for production detection)
- Tooltip explains purpose: "When enabled, Comment Mode works on RadFlow's own UI"

**Production detection** (CRITICAL: use Vite's env, not Node):
```typescript
// CORRECT - Vite/Tauri standard
if (import.meta.env.PROD) return null;

// WRONG - not available in browser
// if (process.env.NODE_ENV === 'production') ...
```

**Reference**: Look at existing toggle patterns in ModeToolbar.tsx:143-160 (PanelButton)

## Acceptance
- [ ] Toggle visible in TitleBar right section (dev mode only)
- [ ] Toggle reads/writes `dogfoodMode` from store
- [ ] Visual feedback shows ON/OFF state clearly
- [ ] Tooltip explains the feature purpose
- [ ] Toggle hidden when `import.meta.env.PROD` is true
- [ ] TypeScript compiles without errors
## Done summary
Added DogfoodToggle component to TitleBar with dog bone icon, amber accent when active, production guard via import.meta.env.PROD, and tooltip explaining the feature purpose.
## Evidence
- Commits: 2b4f47664e0edb3b250727237aff63630e4ef666
- Tests: npx tsc --noEmit
- PRs: