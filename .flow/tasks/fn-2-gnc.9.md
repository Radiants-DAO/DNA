# fn-2-gnc.9 Port Canvas Interaction System from Webstudio

## Description
Port Webstudio's canvas interaction system for selection overlays, hover detection, and event interception.

## Context
Webstudio has a mature canvas interaction system. Port the useful parts for RadFlow's iframe-based preview.

## Source Files to Port

From `/Users/rivermassey/Desktop/dev/webstudio-main/apps/builder/`:

| Source | Purpose | Target |
|--------|---------|--------|
| `canvas/shared/instance-hovering.ts` | Hover detection + debounce | `src/hooks/useInstanceHover.ts` |
| `canvas/shared/instance-selection.ts` | Click → element mapping | `src/hooks/useInstanceSelection.ts` |
| `canvas/shared/interceptor.ts` | Prevent defaults in edit mode | `src/utils/canvas/interceptor.ts` |
| `builder/features/workspace/canvas-tools/outline/` | Selection/hover outlines | `src/components/canvas/Outline.tsx` |

## Implementation

1. **Hover Detection** (`useInstanceHover.ts`):
   - Listen for mouseover events on iframe content
   - Debounce hover state (100ms) to prevent flashing
   - Update `$hoveredInstanceSelector` store
   - Skip updates while scrolling

2. **Selection System** (`useInstanceSelection.ts`):
   - Click handler finds element with `data-radflow-id`
   - Updates `$selectedInstanceSelector` store
   - Handles modifier keys (Shift for multi-select, Alt for parent)

3. **Event Interceptor** (`interceptor.ts`):
   - Prevent form submission in design mode
   - Intercept link clicks
   - Prevent input focus in design mode
   - Allow through in preview mode

4. **Selection Overlay** (`Outline.tsx`):
   - Render colored border around selected element
   - Position using element's bounding rect
   - Handle iframe scaling (overlays at 100%, canvas scaled)
   - Show label with element name/type

5. **Scrub Controls** (for Style Panel - add to existing controls):
   - Port `style-panel/shared/scrub.ts`
   - Drag number inputs to adjust values
   - Modifier keys: Shift = 10x, Alt = 0.1x

## Key Files
- **Create**: `src/hooks/useInstanceHover.ts`
- **Create**: `src/hooks/useInstanceSelection.ts`
- **Create**: `src/utils/canvas/interceptor.ts`
- **Create**: `src/components/canvas/Outline.tsx`
- **Create**: `src/components/canvas/CanvasTools.tsx` (overlay container)
- **Modify**: `src/components/preview/PreviewCanvas.tsx` (integrate)
## Acceptance
- [ ] Hover detection shows outline on mouseover with 100ms debounce
- [ ] Click selection updates selectedInstanceSelector store
- [ ] Alt+click bubbles to parent element
- [ ] Shift+click enables multi-select
- [ ] Event interceptor prevents form submission in design mode
- [ ] Event interceptor prevents link navigation in design mode
- [ ] Selection outline renders at correct position over scaled canvas
- [ ] Outline shows element label (component name or tag)
- [ ] Scrub controls work on number inputs in style panel
- [ ] All interaction disabled in preview mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
