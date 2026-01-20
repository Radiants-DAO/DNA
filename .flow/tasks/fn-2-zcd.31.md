# fn-2-zcd.31 Move useModalBehavior hook to theme

## Description
Move the useModalBehavior hook from app to theme package. This hook is shared by Dialog, Popover, Sheet, and DropdownMenu components.

## Changes

### 1. Copy hook to theme
Copy `packages/radiants/apps/rad_os/components/ui/hooks/useModalBehavior.ts` to `packages/radiants/hooks/useModalBehavior.ts`

### 2. Update theme exports
Add to `packages/radiants/package.json` exports:
```json
"./hooks": {
  "types": "./hooks/index.ts",
  "import": "./hooks/index.ts"
}
```

### 3. Create hooks index
Create `packages/radiants/hooks/index.ts`:
```typescript
export { useModalBehavior, type ModalBehaviorOptions, type ModalBehaviorReturn } from './useModalBehavior';
```

### 4. Update hook imports
The hook may import from '@/lib/utils' - update to relative path or copy cn utility.

## Why First
Dialog, Popover, Sheet, DropdownMenu all depend on this hook. Moving the hook first prevents reverse dependency (theme → app).
## Acceptance
- [ ] useModalBehavior.ts exists in packages/radiants/hooks/
- [ ] hooks/index.ts exports useModalBehavior
- [ ] package.json has ./hooks export
- [ ] TypeScript compiles without errors
## Done summary
- Task completed
## Evidence
- Commits:
- Tests:
- PRs: